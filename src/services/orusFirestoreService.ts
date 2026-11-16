import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  Unsubscribe,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  P4_ACTIVITIES,
  P5_FALLBACK_OPTION,
  P6_CARE_OPTIONS,
  P11_CONCERNS_16,
} from '../data/orusCatalogs';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  OrusResponse,
  StateBatchRecord,
  SurveyModality,
  SurveySourceChannel,
} from '../types/orus';

function sanitizeDocId(raw: string, fallbackPrefix = 'ocean'): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
  return cleaned.length >= 1 ? cleaned : `${fallbackPrefix}_${Date.now()}`;
}

function clampStr(val: string | undefined | null, maxLen: number, fallback = ''): string {
  const base = typeof val === 'string' ? val.trim() : fallback;
  const effective = base.length === 0 && fallback ? fallback : base;
  return effective.slice(0, maxLen);
}

function ensureMinStr(val: string | undefined | null, minLen: number, maxLen: number, fallback: string): string {
  const clamped = clampStr(val, maxLen, fallback);
  if (clamped.length >= minLen) return clamped;
  return fallback.slice(0, maxLen);
}

export function buildFirestoreSurveyPayload(
  rec: OrusResponse,
  ownerId: string,
  batchId: string,
  sourceChannel: SurveySourceChannel
) {
  const safeBatchId = sanitizeDocId(batchId || 'MANUAL', 'MANUAL');
  const safeEntidad = ensureMinStr(rec.p2_entidad, 2, 80, 'Ciudad de México');
  const safeEdad = ensureMinStr(rec.p1_edad, 2, 16, '25–34');
  const safeLocalidad = ensureMinStr(rec.p3_localidad, 2, 24, 'Urbana');

  const safeP4 =
    Array.isArray(rec.p4_actividades) && rec.p4_actividades.length > 0
      ? rec.p4_actividades.slice(0, 8).map((s) => clampStr(s, 140, P4_ACTIVITIES[0]))
      : [P4_ACTIVITIES[0]];

  const safeP5 = ensureMinStr(
    rec.p5_actividad_principal,
    1,
    140,
    safeP4[0] || P5_FALLBACK_OPTION
  );

  const safeP6 =
    Array.isArray(rec.p6_cuidados) && rec.p6_cuidados.length > 0
      ? rec.p6_cuidados.slice(0, 6).map((s) => clampStr(s, 140, P6_CARE_OPTIONS[5]))
      : [P6_CARE_OPTIONS[5]];

  const safeP11 =
    Array.isArray(rec.p11_preocupaciones_top3) && rec.p11_preocupaciones_top3.length > 0
      ? rec.p11_preocupaciones_top3.slice(0, 3).map((s) => clampStr(s, 160, P11_CONCERNS_16[0]))
      : [P11_CONCERNS_16[0]];

  const safeP12 = ensureMinStr(rec.p12_mas_urgente, 1, 160, safeP11[0]);

  const conoceSomos = rec.p34_conoce_somos === 'Sí';

  const sanitizedRawExcel: Record<string, string> = {};
  if (rec.datosArchivoOriginal && typeof rec.datosArchivoOriginal === 'object') {
    for (const [k, v] of Object.entries(rec.datosArchivoOriginal)) {
      if (Object.keys(sanitizedRawExcel).length >= 45) break;
      const cleanKey = clampStr(k, 80, '');
      const cleanVal = clampStr(String(v ?? ''), 300, '');
      if (cleanKey && cleanVal) {
        sanitizedRawExcel[cleanKey] = cleanVal;
      }
    }
  }

  return {
    ownerId,
    folio: ensureMinStr(rec.folio, 3, 64, `OCEAN-${Date.now()}`),
    origin: rec.origin === 'SYNTHETIC' ? 'SYNTHETIC' : 'REAL',
    sourceChannel,
    batchId: safeBatchId,
    entidad: safeEntidad,
    edad: safeEdad,
    localidad: safeLocalidad,
    archetypeTag: ensureMinStr(rec.archetypeTag, 1, 80, 'CAPTURA_CAMPO_ESTATAL'),
    clientRecordedAt: ensureMinStr(rec.createdAt, 10, 40, new Date().toISOString()),
    registroCampo: {
      participanteAlias: ensureMinStr(
        rec.registroCampo?.participanteAlias,
        1,
        120,
        'Participante Anónima'
      ),
      municipioColonia: clampStr(rec.registroCampo?.municipioColonia, 160, ''),
      modalidad: ensureMinStr(
        rec.registroCampo?.modalidad,
        1,
        80,
        'Entrevista presencial en campo'
      ),
      encuestadoraClave: clampStr(rec.registroCampo?.encuestadoraClave, 80, ''),
      consentimientoAceptado: rec.registroCampo?.consentimientoAceptado ?? true,
      notasCampo: clampStr(rec.registroCampo?.notasCampo, 500, ''),
    },
    bloqueA: {
      p1_edad: safeEdad,
      p2_entidad: safeEntidad,
      p3_localidad: safeLocalidad,
      p4_actividades: safeP4,
      p5_actividad_principal: safeP5,
      p6_cuidados: safeP6,
    },
    bloqueB: {
      p7_significado_mujer: clampStr(rec.p7_significado_mujer, 1000, ''),
      p8_orgullo_fortaleza: clampStr(rec.p8_orgullo_fortaleza, 1000, ''),
      p9_obstaculo_principal: clampStr(rec.p9_obstaculo_principal, 1000, ''),
      p10_cambio_futuro_jovenes: clampStr(rec.p10_cambio_futuro_jovenes, 1000, ''),
    },
    bloqueC: {
      p11_preocupaciones_top3: safeP11,
      p12_mas_urgente: safeP12,
      p12_justificacion: clampStr(rec.p12_justificacion, 600, ''),
      p13_problema_local_desatendido:
        rec.p13_problema_local_desatendido === 'Sí' ? 'Sí' : 'No',
      p13_detalle: clampStr(rec.p13_detalle, 600, ''),
      p14_espacios_conversacion: (rec.p14_espacios_conversacion || []).slice(0, 7),
      p15_preocupacion_entorno_mujeres: ensureMinStr(
        rec.p15_preocupacion_entorno_mujeres,
        1,
        160,
        safeP11[0]
      ),
      p16_conoce_contextos_distintos:
        rec.p16_conoce_contextos_distintos === 'Sí' ? 'Sí' : 'No',
      p16_detalle: clampStr(rec.p16_detalle, 600, ''),
    },
    bloqueD: {
      p17_busco_atencion_institucional:
        rec.p17_busco_atencion_institucional === 'Sí' ? 'Sí' : 'No',
      p18_experiencia_institucional:
        rec.p17_busco_atencion_institucional === 'Sí' && rec.p18_experiencia_institucional
          ? rec.p18_experiencia_institucional
          : null,
      p19_confianza_institucional: rec.p19_confianza_institucional || {},
      p20_actividades_participacion: (rec.p20_actividades_participacion || []).slice(0, 8),
      p21_frecuencia_participacion: ensureMinStr(
        rec.p21_frecuencia_participacion,
        1,
        40,
        'Ocasionalmente'
      ),
      p22_dificultades_participacion: (rec.p22_dificultades_participacion || []).slice(0, 3),
      p23_condiciones_habilitadoras: (rec.p23_condiciones_habilitadoras || []).slice(0, 3),
      p24_percepcion_incidencia: rec.p24_percepcion_incidencia || {},
      p25_violencia_politica: ensureMinStr(
        rec.p25_violencia_politica,
        1,
        80,
        'No, nunca'
      ),
      p25_detalle: clampStr(rec.p25_detalle, 600, ''),
    },
    bloqueE: {
      p26_acceso_derechos: rec.p26_acceso_derechos || {},
      p27_ambitos_desventaja: (rec.p27_ambitos_desventaja || []).slice(0, 8),
      p28_situaciones_sexismo: (rec.p28_situaciones_sexismo || []).slice(0, 8),
      p29_impacto_cuidados: rec.p29_impacto_cuidados || {},
      p30_abandono_por_temor: ensureMinStr(rec.p30_abandono_por_temor, 1, 40, 'No'),
      p31_autonomia_decisiones: rec.p31_autonomia_decisiones || {},
      p32_conocimiento_rutas_apoyo: ensureMinStr(
        rec.p32_conocimiento_rutas_apoyo,
        1,
        80,
        'No sé con claridad a dónde acudir'
      ),
      p33_apoyo_concreto_cambio: clampStr(rec.p33_apoyo_concreto_cambio, 800, ''),
    },
    bloqueF: {
      p34_conoce_somos: ensureMinStr(rec.p34_conoce_somos, 1, 30, 'No'),
      p35_nivel_conocimiento_somos: conoceSomos
        ? rec.p35_nivel_conocimiento_somos || 'Conozco poco'
        : null,
      p36_opinion_somos: conoceSomos
        ? rec.p36_opinion_somos || 'Regular / Neutral'
        : null,
      p37_cercania_somos:
        conoceSomos && typeof rec.p37_cercania_somos === 'number'
          ? Math.min(5, Math.max(1, Math.round(rec.p37_cercania_somos)))
          : conoceSomos
          ? 3
          : null,
      p38_recuerda_propuesta_somos: conoceSomos
        ? rec.p38_recuerda_propuesta_somos || 'No'
        : null,
      p38_detalle: conoceSomos ? clampStr(rec.p38_detalle, 600, '') : '',
      p39_positivos_somos: conoceSomos ? clampStr(rec.p39_positivos_somos, 600, '') : '',
      p39_criticas_somos: conoceSomos ? clampStr(rec.p39_criticas_somos, 600, '') : '',
      p40_otros_partidos: (rec.p40_otros_partidos || []).slice(0, 3),
      p41_evaluacion_otros_partidos: (rec.p41_evaluacion_otros_partidos || []).slice(0, 3),
      p42_cambio_opinion_6meses: ensureMinStr(
        rec.p42_cambio_opinion_6meses,
        1,
        50,
        'Recién lo escucho aquí'
      ),
      p42_motivo: clampStr(rec.p42_motivo, 600, ''),
      p43_escucha_social_partidos:
        rec.p43_escucha_social_partidos === 'Sí' ? 'Sí' : 'No',
      p43_relato: clampStr(rec.p43_relato, 600, ''),
    },
    ...(Object.keys(sanitizedRawExcel).length > 0
      ? { datosArchivoOriginal: sanitizedRawExcel }
      : {}),
    createdAt: serverTimestamp(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function firestoreDocToOrusResponse(id: string, data: Record<string, any>): OrusResponse {
  const bA = data.bloqueA || {};
  const bB = data.bloqueB || {};
  const bC = data.bloqueC || {};
  const bD = data.bloqueD || {};
  const bE = data.bloqueE || {};
  const bF = data.bloqueF || {};
  const reg = data.registroCampo || {};

  let createdIso = typeof data.clientRecordedAt === 'string' ? data.clientRecordedAt : '';
  if (data.createdAt instanceof Timestamp) {
    createdIso = data.createdAt.toDate().toISOString();
  } else if (!createdIso) {
    createdIso = new Date().toISOString();
  }

  return {
    id,
    folio: data.folio || id,
    origin: data.origin === 'SYNTHETIC' ? 'SYNTHETIC' : 'REAL',
    createdAt: createdIso,
    archetypeTag: data.archetypeTag || undefined,
    batchId: data.batchId || 'MANUAL',
    sourceChannel: data.sourceChannel || 'EXCEL_STATE_BLOCK',
    persistedInDb: true,
    registroCampo: {
      participanteAlias: reg.participanteAlias || 'Participante Anónima',
      municipioColonia: reg.municipioColonia || '',
      modalidad: (reg.modalidad as SurveyModality) || 'Entrevista presencial en campo',
      encuestadoraClave: reg.encuestadoraClave || '',
      consentimientoAceptado: Boolean(reg.consentimientoAceptado ?? true),
      notasCampo: reg.notasCampo || '',
    },
    ...(data.datosArchivoOriginal && typeof data.datosArchivoOriginal === 'object'
      ? { datosArchivoOriginal: data.datosArchivoOriginal as Record<string, string> }
      : {}),
    p1_edad: bA.p1_edad || data.edad || '25–34',
    p2_entidad: bA.p2_entidad || data.entidad || 'Ciudad de México',
    p3_localidad: bA.p3_localidad || data.localidad || 'Urbana',
    p4_actividades: bA.p4_actividades || [],
    p5_actividad_principal: bA.p5_actividad_principal || '',
    p6_cuidados: bA.p6_cuidados || [],
    p7_significado_mujer: bB.p7_significado_mujer || '',
    p8_orgullo_fortaleza: bB.p8_orgullo_fortaleza || '',
    p9_obstaculo_principal: bB.p9_obstaculo_principal || '',
    p10_cambio_futuro_jovenes: bB.p10_cambio_futuro_jovenes || '',
    p11_preocupaciones_top3: bC.p11_preocupaciones_top3 || [],
    p12_mas_urgente: bC.p12_mas_urgente || '',
    p12_justificacion: bC.p12_justificacion || '',
    p13_problema_local_desatendido: bC.p13_problema_local_desatendido === 'Sí' ? 'Sí' : 'No',
    p13_detalle: bC.p13_detalle || '',
    p14_espacios_conversacion: bC.p14_espacios_conversacion || [],
    p15_preocupacion_entorno_mujeres: bC.p15_preocupacion_entorno_mujeres || '',
    p16_conoce_contextos_distintos: bC.p16_conoce_contextos_distintos === 'Sí' ? 'Sí' : 'No',
    p16_detalle: bC.p16_detalle || '',
    p17_busco_atencion_institucional: bD.p17_busco_atencion_institucional === 'Sí' ? 'Sí' : 'No',
    p18_experiencia_institucional: bD.p18_experiencia_institucional ?? null,
    p19_confianza_institucional: bD.p19_confianza_institucional || {},
    p20_actividades_participacion: bD.p20_actividades_participacion || [],
    p21_frecuencia_participacion: bD.p21_frecuencia_participacion || 'Ocasionalmente',
    p22_dificultades_participacion: bD.p22_dificultades_participacion || [],
    p23_condiciones_habilitadoras: bD.p23_condiciones_habilitadoras || [],
    p24_percepcion_incidencia: bD.p24_percepcion_incidencia || {},
    p25_violencia_politica: bD.p25_violencia_politica || 'No, nunca',
    p25_detalle: bD.p25_detalle || '',
    p26_acceso_derechos: bE.p26_acceso_derechos || {},
    p27_ambitos_desventaja: bE.p27_ambitos_desventaja || [],
    p28_situaciones_sexismo: bE.p28_situaciones_sexismo || [],
    p29_impacto_cuidados: bE.p29_impacto_cuidados || {},
    p30_abandono_por_temor: bE.p30_abandono_por_temor || 'No',
    p31_autonomia_decisiones: bE.p31_autonomia_decisiones || {},
    p32_conocimiento_rutas_apoyo:
      bE.p32_conocimiento_rutas_apoyo || 'No sé con claridad a dónde acudir',
    p33_apoyo_concreto_cambio: bE.p33_apoyo_concreto_cambio || '',
    p34_conoce_somos: bF.p34_conoce_somos || 'No',
    p35_nivel_conocimiento_somos: bF.p35_nivel_conocimiento_somos ?? null,
    p36_opinion_somos: bF.p36_opinion_somos ?? null,
    p37_cercania_somos: bF.p37_cercania_somos ?? null,
    p38_recuerda_propuesta_somos: bF.p38_recuerda_propuesta_somos ?? null,
    p38_detalle: bF.p38_detalle || '',
    p39_positivos_somos: bF.p39_positivos_somos || '',
    p39_criticas_somos: bF.p39_criticas_somos || '',
    p40_otros_partidos: bF.p40_otros_partidos || [],
    p41_evaluacion_otros_partidos: bF.p41_evaluacion_otros_partidos || [],
    p42_cambio_opinion_6meses: bF.p42_cambio_opinion_6meses || 'Recién lo escucho aquí',
    p42_motivo: bF.p42_motivo || '',
    p43_escucha_social_partidos: bF.p43_escucha_social_partidos === 'Sí' ? 'Sí' : 'No',
    p43_relato: bF.p43_relato || '',
  };
}

export function subscribeUserSurveys(
  uid: string,
  onData: (records: OrusResponse[]) => void,
  onErrorCallback?: (msg: string) => void
): Unsubscribe {
  const q = query(collection(db, 'surveys'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => firestoreDocToOrusResponse(d.id, d.data()));
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(list);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, 'surveys');
      } catch (structuredErr) {
        onErrorCallback?.(
          structuredErr instanceof Error ? structuredErr.message : String(structuredErr)
        );
      }
    }
  );
}

export function subscribeUserStateBatches(
  uid: string,
  onData: (batches: StateBatchRecord[]) => void,
  onErrorCallback?: (msg: string) => void
): Unsubscribe {
  const q = query(collection(db, 'stateBatches'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const batches: StateBatchRecord[] = snap.docs.map((d) => {
        const raw = d.data();
        const createdIso =
          raw.createdAt instanceof Timestamp
            ? raw.createdAt.toDate().toISOString()
            : new Date().toISOString();
        return {
          id: d.id,
          ownerId: raw.ownerId,
          batchCode: raw.batchCode,
          entidad: raw.entidad,
          fileName: raw.fileName,
          recordsCount: Number(raw.recordsCount || 0),
          targetQuota: Number(raw.targetQuota || 100),
          status: 'completed',
          createdAtIso: createdIso,
        };
      });
      batches.sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
      onData(batches);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, 'stateBatches');
      } catch (structuredErr) {
        onErrorCallback?.(
          structuredErr instanceof Error ? structuredErr.message : String(structuredErr)
        );
      }
    }
  );
}

export async function saveSingleSurveyToFirestore(
  rec: OrusResponse,
  sourceChannel: SurveySourceChannel = 'TERMINAL'
): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('Debes iniciar sesión para almacenar registros en la base de datos.');
  }
  const surveyDocId = sanitizeDocId(rec.id, 'survey');
  const path = `surveys/${surveyDocId}`;
  try {
    const payload = buildFirestoreSurveyPayload(rec, uid, 'MANUAL', sourceChannel);
    await setDoc(doc(db, 'surveys', surveyDocId), payload);
    return surveyDocId;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function saveStateExcelBatchToFirestore(params: {
  entidad: string;
  stateShortCode: string;
  fileName: string;
  records: OrusResponse[];
  targetQuota?: number;
  onProgress?: (savedCount: number, totalCount: number) => void;
}): Promise<{ batchId: string; batchCode: string; savedCount: number }> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('Debes iniciar sesión con tu cuenta Google para guardar el bloque en la base de datos.');
  }
  if (params.records.length === 0) {
    throw new Error('El archivo no contiene registros válidos para almacenar.');
  }

  const stamp = Date.now();
  const cleanShort = params.stateShortCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'EDO';
  const batchId = sanitizeDocId(`batch_${cleanShort}_${stamp}`, 'batch');
  const batchCode = `BLOQUE-${cleanShort}-${String(stamp).slice(-5)}`;

  // 1. Crear primero el documento padre en /stateBatches/{batchId}
  const batchPath = `stateBatches/${batchId}`;
  try {
    await setDoc(doc(db, 'stateBatches', batchId), {
      ownerId: uid,
      batchCode: clampStr(batchCode, 80, batchCode),
      entidad: ensureMinStr(params.entidad, 2, 80, 'Ciudad de México'),
      fileName: ensureMinStr(params.fileName, 1, 180, 'bloque_estatal.xlsx'),
      recordsCount: Math.min(5000, Math.max(1, Math.round(params.records.length))),
      targetQuota: Math.min(5000, Math.max(1, Math.round(params.targetQuota ?? 100))),
      status: 'completed',
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, batchPath);
  }

  // 2. Guardar los N registros (ej. 100 personas) en lotes de 4 documentos por writeBatch
  // para mantener las llamadas exists()/get() de las reglas de seguridad (4 * 2 = 8) por debajo del techo de 10 por lote.
  const CHUNK_SIZE = 4;
  let savedCount = 0;
  const total = params.records.length;

  for (let offset = 0; offset < total; offset += CHUNK_SIZE) {
    const slice = params.records.slice(offset, offset + CHUNK_SIZE);
    const wb = writeBatch(db);

    slice.forEach((rec, idx) => {
      const rowNum = String(offset + idx + 1).padStart(3, '0');
      const docId = sanitizeDocId(`${batchId}_r${rowNum}`, 'survey');
      const payload = buildFirestoreSurveyPayload(
        {
          ...rec,
          p2_entidad: params.entidad || rec.p2_entidad,
        },
        uid,
        batchId,
        'EXCEL_STATE_BLOCK'
      );
      wb.set(doc(db, 'surveys', docId), payload);
    });

    try {
      await wb.commit();
      savedCount += slice.length;
      params.onProgress?.(savedCount, total);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `surveys (lote ${batchCode})`);
    }
  }

  return { batchId, batchCode, savedCount };
}

export async function deleteStateBatchFromFirestore(
  batchId: string,
  batchSurveyIds: string[]
): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('Sesión requerida para eliminar bloques de la base de datos.');
  }

  // Eliminar primero las encuestas vinculadas en chunks de 400
  const CHUNK = 200;
  for (let i = 0; i < batchSurveyIds.length; i += CHUNK) {
    const slice = batchSurveyIds.slice(i, i + CHUNK);
    const wb = writeBatch(db);
    for (const sId of slice) {
      wb.delete(doc(db, 'surveys', sId));
    }
    try {
      await wb.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'surveys');
    }
  }

  try {
    const wbParent = writeBatch(db);
    wbParent.delete(doc(db, 'stateBatches', batchId));
    await wbParent.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `stateBatches/${batchId}`);
  }
}

export async function emptyStateDataFromFirestore(
  stateName: string
): Promise<{ deletedSurveys: number; deletedBatches: number }> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return { deletedSurveys: 0, deletedBatches: 0 };
  }

  let surveyIdsToDelete: string[] = [];
  const deletedSurveyIdSet = new Set<string>();
  const allUserSurveyBatchIds: Array<{ id: string; batchId: string }> = [];

  try {
    const surveysSnap = await getDocs(
      query(collection(db, 'surveys'), where('ownerId', '==', uid))
    );
    surveysSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const docState = data.bloqueA?.p2_entidad || data.entidad || '';
      const batchId = typeof data.batchId === 'string' ? data.batchId : 'MANUAL';
      allUserSurveyBatchIds.push({ id: docSnap.id, batchId });
      if (docState === stateName) {
        surveyIdsToDelete.push(docSnap.id);
        deletedSurveyIdSet.add(docSnap.id);
      }
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'surveys');
  }

  let batchIdsToDelete: string[] = [];
  try {
    const batchesSnap = await getDocs(
      query(collection(db, 'stateBatches'), where('ownerId', '==', uid))
    );
    batchesSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const remainingLinked = allUserSurveyBatchIds.filter(
        (s) => s.batchId === docSnap.id && !deletedSurveyIdSet.has(s.id)
      ).length;
      if (data.entidad === stateName || remainingLinked === 0) {
        batchIdsToDelete.push(docSnap.id);
      }
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'stateBatches');
  }

  const CHUNK = 200;
  for (let i = 0; i < surveyIdsToDelete.length; i += CHUNK) {
    const slice = surveyIdsToDelete.slice(i, i + CHUNK);
    const wb = writeBatch(db);
    for (const sId of slice) {
      wb.delete(doc(db, 'surveys', sId));
    }
    try {
      await wb.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'surveys');
    }
  }

  for (let i = 0; i < batchIdsToDelete.length; i += CHUNK) {
    const slice = batchIdsToDelete.slice(i, i + CHUNK);
    const wb = writeBatch(db);
    for (const bId of slice) {
      wb.delete(doc(db, 'stateBatches', bId));
    }
    try {
      await wb.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'stateBatches');
    }
  }

  return {
    deletedSurveys: surveyIdsToDelete.length,
    deletedBatches: batchIdsToDelete.length,
  };
}

