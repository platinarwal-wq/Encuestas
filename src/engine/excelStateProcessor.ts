import * as XLSX from 'xlsx';
import {
  ACCESS_DIFFICULTY_6,
  AGE_RANGES,
  AUTONOMY_LEVEL_7,
  CARE_IMPACT_FREQUENCY_7,
  INSTITUTIONAL_TRUST_5,
  LIKERT_AGREEMENT_6,
  LOCALITY_TYPES,
  MEXICO_ENTITIES,
  P4_ACTIVITIES,
  P5_FALLBACK_OPTION,
  P6_CARE_OPTIONS,
  P11_CONCERNS_16,
  P18_INSTITUTIONAL_EXPERIENCE_ITEMS,
  P19_TRUST_INSTITUTIONS,
  P24_INCIDENCE_ITEMS,
  P26_RIGHTS_ACCESS_ITEMS,
  P29_CARE_IMPACT_ITEMS,
  P31_AUTONOMY_ITEMS,
  SUGGESTED_PARTIES_MEXICO,
} from '../data/orusCatalogs';
import {
  AgeRange,
  LocalityType,
  OrusResponse,
  OtherPartyEvaluation,
  PartyOpinion5,
  PartyProposalsKnowledge,
  SurveyModality,
} from '../types/orus';
import { generateSingleSyntheticAgent } from './swarmSimulator';
import {
  generateDeterministicMexicanName,
  MUNICIPIOS_POR_ENTIDAD,
} from '../utils/respondentProfileHelper';

export interface ParsedExcelBatchResult {
  records: OrusResponse[];
  detectedState: string;
  sheetName: string;
  totalRowsRead: number;
  skippedBlankRows: number;
  warnings: string[];
}

const SAMPLE_MUNICIPIOS_BY_STATE: Record<string, string[]> = {
  Guanajuato: ['León', 'Irapuato', 'Celaya', 'Salamanca', 'Guanajuato Capital', 'Silao'],
  'Ciudad de México': ['Iztapalapa', 'Gustavo A. Madero', 'Coyoacán', 'Tlalpan', 'Cuauhtémoc'],
  'Estado de México': ['Ecatepec', 'Nezahualcóyotl', 'Toluca', 'Naucalpan', 'Tlalnepantla'],
  Jalisco: ['Guadalajara', 'Zapopan', 'Tlaquepaque', 'Tonalá', 'Puerto Vallarta'],
  'Nuevo León': ['Monterrey', 'Guadalupe', 'Apodaca', 'San Nicolás', 'Escobedo'],
  Puebla: ['Puebla Capital', 'Tehuacán', 'San Andrés Cholula', 'Atlixco'],
  Veracruz: ['Veracruz Puerto', 'Xalapa', 'Coatzacoalcos', 'Córdoba', 'Orizaba'],
  Chiapas: ['Tuxtla Gutiérrez', 'Tapachula', 'San Cristóbal de las Casas', 'Comitán'],
  Oaxaca: ['Oaxaca de Juárez', 'Salina Cruz', 'Juchitán', 'Tuxtepec'],
  Yucatán: ['Mérida', 'Kanasín', 'Valladolid', 'Tizimín', 'Progreso'],
};

function normalizeKey(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function splitMulti(raw: unknown): string[] {
  if (raw === null || raw === undefined) return [];
  const str = String(raw).trim();
  if (!str) return [];
  return str
    .split(/\s*[|;]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function resolveEntityName(raw: unknown, fallbackState: string): string {
  if (!raw) return fallbackState;
  const clean = normalizeKey(String(raw));
  if (!clean) return fallbackState;

  for (const ent of MEXICO_ENTITIES) {
    if (
      normalizeKey(ent.name) === clean ||
      normalizeKey(ent.code) === clean ||
      normalizeKey(ent.short) === clean
    ) {
      return ent.name;
    }
  }
  for (const ent of MEXICO_ENTITIES) {
    const normName = normalizeKey(ent.name);
    if (normName.includes(clean) || clean.includes(normName)) {
      return ent.name;
    }
  }
  return fallbackState;
}

function resolveAgeRange(raw: unknown, fallback: AgeRange = '25–34'): AgeRange {
  if (raw === null || raw === undefined || String(raw).trim() === '') return fallback;
  const s = String(raw).trim().replace('-', '–');
  if ((AGE_RANGES as string[]).includes(s)) return s as AgeRange;

  // Si ingresaron una edad numérica exacta en Excel (ej. 29, 42, 67)
  const num = Number(String(raw).replace(/[^\d]/g, ''));
  if (!Number.isNaN(num) && num >= 15) {
    if (num <= 24) return '18–24';
    if (num <= 34) return '25–34';
    if (num <= 44) return '35–44';
    if (num <= 54) return '45–54';
    if (num <= 64) return '55–64';
    return '65+';
  }

  for (const age of AGE_RANGES) {
    if (s.includes(age.slice(0, 2))) return age;
  }
  return fallback;
}

function resolveLocality(raw: unknown, fallback: LocalityType = 'Urbana'): LocalityType {
  if (!raw) return fallback;
  const clean = normalizeKey(String(raw));
  if (clean.includes('rural') || clean.includes('campo') || clean.includes('comunidad')) {
    return 'Rural';
  }
  if (clean.includes('mixt') || clean.includes('semi')) {
    return 'Mixta';
  }
  if (clean.includes('urban') || clean.includes('ciudad') || clean.includes('metro')) {
    return 'Urbana';
  }
  return fallback;
}

function resolveYesNo(raw: unknown, fallback: 'Sí' | 'No' = 'No'): 'Sí' | 'No' {
  if (raw === null || raw === undefined || String(raw).trim() === '') return fallback;
  const clean = normalizeKey(String(raw));
  if (clean === 'si' || clean === 's' || clean === 'yes' || clean === '1' || clean === 'true') {
    return 'Sí';
  }
  if (clean === 'no' || clean === 'n' || clean === '0' || clean === 'false') {
    return 'No';
  }
  return fallback;
}

function resolveSomosAwareness(
  raw: unknown,
  fallback: 'Sí' | 'No' | 'No estoy segura' = 'No'
): 'Sí' | 'No' | 'No estoy segura' {
  if (!raw || String(raw).trim() === '') return fallback;
  const clean = normalizeKey(String(raw));
  if (clean === 'si' || clean.startsWith('siconozco') || clean === '1') return 'Sí';
  if (clean.includes('segura') || clean.includes('duda') || clean.includes('talvez')) {
    return 'No estoy segura';
  }
  if (clean === 'no' || clean === '0') return 'No';
  return fallback;
}

function serializeMap(mapObj: Record<string, string> | null): string {
  if (!mapObj) return '';
  return Object.entries(mapObj)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' | ');
}

function parseSerializedMap<T extends string>(
  raw: unknown,
  expectedKeys: readonly string[],
  validValues: readonly T[],
  fallbackMap: Record<string, T>
): Record<string, T> {
  if (!raw || String(raw).trim() === '') return fallbackMap;
  const result: Record<string, T> = { ...fallbackMap };
  const parts = String(raw).split('|');
  parts.forEach((part, idx) => {
    const colonIdx = part.indexOf(':');
    if (colonIdx !== -1) {
      const kRaw = part.slice(0, colonIdx).trim();
      const vRaw = part.slice(colonIdx + 1).trim();
      const matchedKey = expectedKeys.find(
        (ek) => normalizeKey(ek) === normalizeKey(kRaw) || normalizeKey(ek).includes(normalizeKey(kRaw))
      );
      const matchedVal = validValues.find(
        (vv) => normalizeKey(vv) === normalizeKey(vRaw)
      );
      if (matchedKey && matchedVal) {
        result[matchedKey] = matchedVal;
      }
    } else if (idx < expectedKeys.length) {
      const vRaw = part.trim();
      const matchedVal = validValues.find(
        (vv) => normalizeKey(vv) === normalizeKey(vRaw)
      );
      if (matchedVal) {
        result[expectedKeys[idx]] = matchedVal;
      }
    }
  });
  return result;
}

function serializeOtherParties(evals: OtherPartyEvaluation[]): string {
  return evals
    .map((e) => `${e.partido}:${e.opinion}:${e.cercania}:${e.conocimientoPropuestas}`)
    .join(' | ');
}

function parseOtherPartiesEvaluation(
  rawEvalStr: unknown,
  partiesList: string[],
  fallbackEvals: OtherPartyEvaluation[]
): OtherPartyEvaluation[] {
  if (rawEvalStr && String(rawEvalStr).trim()) {
    const chunks = splitMulti(rawEvalStr);
    const parsed: OtherPartyEvaluation[] = [];
    for (const ch of chunks.slice(0, 3)) {
      const segs = ch.split(':').map((s) => s.trim());
      if (segs.length >= 2) {
        const partido = segs[0] || 'Morena';
        const opRaw = segs[1] || 'Regular';
        const opinion: PartyOpinion5 = (
          ['Muy buena', 'Buena', 'Regular', 'Mala', 'Muy mala'] as PartyOpinion5[]
        ).find((o) => normalizeKey(o) === normalizeKey(opRaw)) ?? 'Regular';
        const cercNum = Math.min(5, Math.max(1, Number(segs[2]) || 3)) as 1 | 2 | 3 | 4 | 5;
        const propRaw = segs[3] || 'Solo promesas generales';
        const conocimientoPropuestas: PartyProposalsKnowledge = (
          [
            'Sí conozco propuestas claras',
            'Solo promesas generales',
            'No conozco ninguna',
          ] as PartyProposalsKnowledge[]
        ).find((p) => normalizeKey(p) === normalizeKey(propRaw)) ?? 'Solo promesas generales';
        parsed.push({ partido, opinion, cercania: cercNum, conocimientoPropuestas });
      }
    }
    if (parsed.length > 0) return parsed;
  }

  if (partiesList.length > 0) {
    return partiesList.slice(0, 3).map((partido, i) => {
      const fb = fallbackEvals[i] || fallbackEvals[0];
      return {
        partido,
        opinion: fb?.opinion ?? 'Regular',
        cercania: fb?.cercania ?? 2,
        conocimientoPropuestas: fb?.conocimientoPropuestas ?? 'Solo promesas generales',
      };
    });
  }

  return fallbackEvals.slice(0, 3);
}

export function orusRecordToExcelRow(rec: OrusResponse, rowNumber: number): Record<string, string | number> {
  return {
    FILA: rowNumber,
    FOLIO: rec.folio,
    PARTICIPANTE_ALIAS: rec.registroCampo?.participanteAlias || `Participante ${rowNumber}`,
    MUNICIPIO_COLONIA: rec.registroCampo?.municipioColonia || '',
    MODALIDAD: rec.registroCampo?.modalidad || 'Entrevista presencial en campo',
    CLAVE_ENCUESTADORA: rec.registroCampo?.encuestadoraClave || '',
    NOTAS_CAMPO: rec.registroCampo?.notasCampo || '',
    P1_EDAD: rec.p1_edad,
    P2_ENTIDAD: rec.p2_entidad,
    P3_LOCALIDAD: rec.p3_localidad,
    P4_ACTIVIDADES: rec.p4_actividades.join(' | '),
    P5_ACTIVIDAD_PRINCIPAL: rec.p5_actividad_principal,
    P6_CUIDADOS: rec.p6_cuidados.join(' | '),
    P7_SIGNIFICADO_MUJER: rec.p7_significado_mujer,
    P8_ORGULLO_FORTALEZA: rec.p8_orgullo_fortaleza,
    P9_OBSTACULO_PRINCIPAL: rec.p9_obstaculo_principal,
    P10_CAMBIO_FUTURO: rec.p10_cambio_futuro_jovenes,
    P11_PREOCUPACIONES_TOP3: rec.p11_preocupaciones_top3.join(' | '),
    P12_MAS_URGENTE: rec.p12_mas_urgente,
    P12_JUSTIFICACION: rec.p12_justificacion,
    P13_PROBLEMA_LOCAL: rec.p13_problema_local_desatendido,
    P13_DETALLE: rec.p13_detalle,
    P14_ESPACIOS_CONVERSACION: rec.p14_espacios_conversacion.join(' | '),
    P15_PREOCUPACION_MUJERES: rec.p15_preocupacion_entorno_mujeres,
    P16_OTROS_CONTEXTOS: rec.p16_conoce_contextos_distintos,
    P16_DETALLE: rec.p16_detalle,
    P17_BUSCO_ATENCION: rec.p17_busco_atencion_institucional,
    P18_EXPERIENCIA_INSTITUCIONAL: serializeMap(rec.p18_experiencia_institucional),
    P19_CONFIANZA_INSTITUCIONAL: serializeMap(rec.p19_confianza_institucional),
    P20_ACTIVIDADES_PARTICIPACION: rec.p20_actividades_participacion.join(' | '),
    P21_FRECUENCIA_PARTICIPACION: rec.p21_frecuencia_participacion,
    P22_DIFICULTADES_TOP3: rec.p22_dificultades_participacion.join(' | '),
    P23_HABILITADORES_TOP3: rec.p23_condiciones_habilitadoras.join(' | '),
    P24_PERCEPCION_INCIDENCIA: serializeMap(rec.p24_percepcion_incidencia),
    P25_VIOLENCIA_POLITICA: rec.p25_violencia_politica,
    P25_DETALLE: rec.p25_detalle,
    P26_ACCESO_DERECHOS: serializeMap(rec.p26_acceso_derechos),
    P27_AMBITOS_DESVENTAJA: rec.p27_ambitos_desventaja.join(' | '),
    P28_SITUACIONES_SEXISMO: rec.p28_situaciones_sexismo.join(' | '),
    P29_IMPACTO_CUIDADOS: serializeMap(rec.p29_impacto_cuidados),
    P30_ABANDONO_TEMOR: rec.p30_abandono_por_temor,
    P31_AUTONOMIA_DECISIONES: serializeMap(rec.p31_autonomia_decisiones),
    P32_RUTAS_APOYO: rec.p32_conocimiento_rutas_apoyo,
    P33_APOYO_CAMBIO_CONCRETO: rec.p33_apoyo_concreto_cambio,
    P34_CONOCE_SOMOS: rec.p34_conoce_somos,
    P35_NIVEL_SOMOS: rec.p35_nivel_conocimiento_somos ?? '',
    P36_OPINION_SOMOS: rec.p36_opinion_somos ?? '',
    P37_CERCANIA_SOMOS: rec.p37_cercania_somos ?? '',
    P38_RECUERDA_PROPUESTA: rec.p38_recuerda_propuesta_somos ?? '',
    P38_DETALLE: rec.p38_detalle,
    P39_POSITIVOS_SOMOS: rec.p39_positivos_somos,
    P39_CRITICAS_SOMOS: rec.p39_criticas_somos,
    P40_OTROS_PARTIDOS: rec.p40_otros_partidos.join(' | '),
    P41_EVALUACION_PARTIDOS: serializeOtherParties(rec.p41_evaluacion_otros_partidos),
    P42_CAMBIO_6MESES: rec.p42_cambio_opinion_6meses,
    P42_MOTIVO: rec.p42_motivo,
    P43_ESCUCHA_SOCIAL: rec.p43_escucha_social_partidos,
    P43_RELATO: rec.p43_relato,
  };
}

function appendCatalogSheet(wb: XLSX.WorkBook): void {
  const catalogRows = [
    ['CAMPO OCEAN', 'VALORES PERMITIDOS / INSTRUCCIONES DE CAPTURA EN EXCEL'],
    ['INSTRUCCIÓN GENERAL', 'Cada fila representa a 1 mujer encuestada (meta: 100 filas por bloque estatal). Para respuestas múltiples separa con " | ".'],
    ['P1_EDAD', AGE_RANGES.join(' | ') + ' (también acepta edad numérica ej. 29, 44)'],
    ['P2_ENTIDAD', MEXICO_ENTITIES.slice(0, 32).map((e) => e.name).join(' | ')],
    ['P3_LOCALIDAD', LOCALITY_TYPES.join(' | ')],
    ['P4_ACTIVIDADES', P4_ACTIVITIES.join(' | ')],
    ['P6_CUIDADOS', P6_CARE_OPTIONS.join(' | ')],
    ['P11_PREOCUPACIONES_TOP3 (Máx 3)', P11_CONCERNS_16.join(' | ')],
    ['P19_ESCALA_CONFIANZA', INSTITUTIONAL_TRUST_5.join(' | ')],
    ['P34_CONOCE_SOMOS', 'Sí | No | No estoy segura (Si es No o No estoy segura, P35 a P39 quedan vacías por salto lógico a P40)'],
    ['P36_OPINION_SOMOS', 'Muy buena | Buena | Regular / Neutral | Mala | Muy mala | Aún no tengo opinión formada'],
    ['P40_OTROS_PARTIDOS (Máx 3)', SUGGESTED_PARTIES_MEXICO.join(' | ')],
  ];
  const wsCat = XLSX.utils.aoa_to_sheet(catalogRows);
  wsCat['!cols'] = [{ wch: 34 }, { wch: 120 }];
  XLSX.utils.book_append_sheet(wb, wsCat, 'Catalogo_Opciones_OCEAN');
}

export function downloadBlankStateTemplateXlsx(entidadName: string, rowCount = 100): void {
  const entMeta =
    MEXICO_ENTITIES.find((e) => e.name === entidadName) || MEXICO_ENTITIES[0];

  const rows = Array.from({ length: rowCount }, (_, i) => {
    const num = i + 1;
    const padded = String(num).padStart(3, '0');
    return {
      FILA: num,
      FOLIO: `CAMPO-${entMeta.short}-${padded}`,
      PARTICIPANTE_ALIAS: '',
      MUNICIPIO_COLONIA: '',
      MODALIDAD: 'Entrevista presencial en campo',
      CLAVE_ENCUESTADORA: `BRIGADA-${entMeta.short}-01`,
      NOTAS_CAMPO: '',
      P1_EDAD: '',
      P2_ENTIDAD: entMeta.name,
      P3_LOCALIDAD: '',
      P4_ACTIVIDADES: '',
      P5_ACTIVIDAD_PRINCIPAL: '',
      P6_CUIDADOS: '',
      P7_SIGNIFICADO_MUJER: '',
      P8_ORGULLO_FORTALEZA: '',
      P9_OBSTACULO_PRINCIPAL: '',
      P10_CAMBIO_FUTURO: '',
      P11_PREOCUPACIONES_TOP3: '',
      P12_MAS_URGENTE: '',
      P12_JUSTIFICACION: '',
      P13_PROBLEMA_LOCAL: '',
      P13_DETALLE: '',
      P14_ESPACIOS_CONVERSACION: '',
      P15_PREOCUPACION_MUJERES: '',
      P16_OTROS_CONTEXTOS: '',
      P16_DETALLE: '',
      P17_BUSCO_ATENCION: '',
      P18_EXPERIENCIA_INSTITUCIONAL: '',
      P19_CONFIANZA_INSTITUCIONAL: '',
      P20_ACTIVIDADES_PARTICIPACION: '',
      P21_FRECUENCIA_PARTICIPACION: '',
      P22_DIFICULTADES_TOP3: '',
      P23_HABILITADORES_TOP3: '',
      P24_PERCEPCION_INCIDENCIA: '',
      P25_VIOLENCIA_POLITICA: '',
      P25_DETALLE: '',
      P26_ACCESO_DERECHOS: '',
      P27_AMBITOS_DESVENTAJA: '',
      P28_SITUACIONES_SEXISMO: '',
      P29_IMPACTO_CUIDADOS: '',
      P30_ABANDONO_TEMOR: '',
      P31_AUTONOMIA_DECISIONES: '',
      P32_RUTAS_APOYO: '',
      P33_APOYO_CAMBIO_CONCRETO: '',
      P34_CONOCE_SOMOS: '',
      P35_NIVEL_SOMOS: '',
      P36_OPINION_SOMOS: '',
      P37_CERCANIA_SOMOS: '',
      P38_RECUERDA_PROPUESTA: '',
      P38_DETALLE: '',
      P39_POSITIVOS_SOMOS: '',
      P39_CRITICAS_SOMOS: '',
      P40_OTROS_PARTIDOS: '',
      P41_EVALUACION_PARTIDOS: '',
      P42_CAMBIO_6MESES: '',
      P42_MOTIVO: '',
      P43_ESCUCHA_SOCIAL: '',
      P43_RELATO: '',
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = Object.keys(rows[0]).map((k) => ({
    wch: k.startsWith('P7') || k.startsWith('P11') || k.startsWith('P19') ? 36 : 22,
  }));
  XLSX.utils.book_append_sheet(wb, ws, 'Bloque_100_Personas');
  appendCatalogSheet(wb);

  XLSX.writeFile(wb, `Plantilla_OCEAN_100_Personas_${entMeta.short}.xlsx`);
}

export function downloadSample100StateWorkbookXlsx(entidadName: string, rowCount = 100): void {
  const entMeta =
    MEXICO_ENTITIES.find((e) => e.name === entidadName) || MEXICO_ENTITIES[0];
  const municipios = MUNICIPIOS_POR_ENTIDAD[entMeta.name] ||
    SAMPLE_MUNICIPIOS_BY_STATE[entMeta.name] || [
      `Zona Centro ${entMeta.short}`,
      `Cabecera Norte ${entMeta.short}`,
      `Sector Sur ${entMeta.short}`,
    ];

  const sampleRecords: OrusResponse[] = Array.from({ length: rowCount }, (_, i) => {
    const base = generateSingleSyntheticAgent(
      i + 1,
      {
        geoBias: 'NACIONAL_PONDERADO',
        socioProfile: 'MIXTO_NACIONAL',
        somosScenario: 'ORGANICO_40',
      },
      undefined,
      entMeta.name
    );
    const numStr = String(i + 1).padStart(3, '0');
    const muni = municipios[i % municipios.length].trim();
    const fullPersonName = generateDeterministicMexicanName(`${entMeta.short}_SAMPLE_${numStr}`);
    return {
      ...base,
      origin: 'REAL',
      folio: `CAMPO-${entMeta.short}-${numStr}`,
      registroCampo: {
        participanteAlias: fullPersonName,
        municipioColonia: muni,
        modalidad: 'Entrevista presencial en campo',
        encuestadoraClave: `ENC-${entMeta.short}-${String((i % 5) + 1).padStart(2, '0')}`,
        consentimientoAceptado: true,
        notasCampo: `Levantamiento bloque estatal ${entMeta.name}`,
      },
    };
  });

  const rows = sampleRecords.map((rec, idx) => orusRecordToExcelRow(rec, idx + 1));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = Object.keys(rows[0]).map((k) => ({
    wch: k.startsWith('P7') || k.startsWith('P11') || k.startsWith('P19') ? 36 : 22,
  }));
  XLSX.utils.book_append_sheet(wb, ws, 'Bloque_100_Personas');
  appendCatalogSheet(wb);

  XLSX.writeFile(wb, `Bloque_100_Muestra_${entMeta.short}.xlsx`);
}

export function exportRecordsToExcelXlsx(
  records: OrusResponse[],
  filename = `estudio_ocean_export_${new Date().toISOString().slice(0, 10)}.xlsx`
): void {
  if (records.length === 0) return;
  const rows = records.map((r, i) => orusRecordToExcelRow(r, i + 1));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = Object.keys(rows[0]).map((k) => ({
    wch: k.length > 18 ? 30 : 20,
  }));
  XLSX.utils.book_append_sheet(wb, ws, 'Estudio_OCEAN_Datos');
  XLSX.writeFile(wb, filename);
}

export async function parseUploadedStateExcelFile(
  file: File,
  options: {
    targetState: string;
    lockAllRowsToTargetState: boolean;
  }
): Promise<ParsedExcelBatchResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });

  if (!wb.SheetNames || wb.SheetNames.length === 0) {
    throw new Error('El archivo Excel no contiene hojas de cálculo legibles.');
  }

  const preferredSheetName =
    wb.SheetNames.find((n) => normalizeKey(n).includes('bloque')) || wb.SheetNames[0];
  const ws = wb.Sheets[preferredSheetName];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });
  if (rawRows.length === 0) {
    throw new Error('La hoja seleccionada está vacía. Agrega al menos 1 fila de datos.');
  }

  const warnings: string[] = [];
  const parsedRecords: OrusResponse[] = [];
  let skippedBlankRows = 0;

  const targetMeta =
    MEXICO_ENTITIES.find((e) => e.name === options.targetState) || MEXICO_ENTITIES[0];

  rawRows.forEach((rawRow, rowIdx) => {
    // Crear índice normalizado de columnas de la fila
    const normRow: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rawRow)) {
      normRow[normalizeKey(k)] = v;
    }

    const pickCol = (...candidates: string[]): unknown => {
      for (const c of candidates) {
        const nk = normalizeKey(c);
        if (normRow[nk] !== undefined && String(normRow[nk]).trim() !== '') {
          return normRow[nk];
        }
      }
      return '';
    };

    // Verificar si es una fila de plantilla dejada en blanco
    const keySignals = [
      pickCol(
        'PARTICIPANTE_ALIAS',
        'NombreCompleto',
        'Participante',
        'Nombre',
        'Nombres',
        'Alias',
        'Encuestada',
        'Encuestado',
        'Persona'
      ),
      pickCol('P1_EDAD', 'Edad', 'RangoEdad', 'P1'),
      pickCol('P3_LOCALIDAD', 'Localidad', 'Zona', 'TipoLocalidad', 'P3'),
      pickCol('P4_ACTIVIDADES', 'Actividades', 'Ocupacion', 'P4'),
      pickCol('P11_PREOCUPACIONES_TOP3', 'Preocupaciones', 'Problematica', 'P11'),
      pickCol('P12_MAS_URGENTE', 'Urgencia', 'ProblemaUrgente', 'P12'),
      pickCol('P7_SIGNIFICADO_MUJER', 'SignificadoMujer', 'P7'),
      pickCol('P34_CONOCE_SOMOS', 'ConoceSomos', 'Somos', 'P34'),
    ];
    const hasAnyUserContent = keySignals.some((v) => String(v).trim() !== '');
    if (!hasAnyUserContent) {
      skippedBlankRows++;
      return;
    }

    const rowNumber = parsedRecords.length + 1;
    const rowEntidadRaw = pickCol('P2_ENTIDAD', 'Entidad', 'Estado', 'P2');
    const resolvedEntidad = options.lockAllRowsToTargetState
      ? targetMeta.name
      : resolveEntityName(rowEntidadRaw, targetMeta.name);

    const resolvedMeta =
      MEXICO_ENTITIES.find((e) => e.name === resolvedEntidad) || targetMeta;

    // Generar perfil base coherente únicamente para rellenar celdas o matrices opcionales no incluidas en un Excel simplificado
    const fallbackBase = generateSingleSyntheticAgent(
      rowIdx + 1,
      {
        geoBias: 'NACIONAL_PONDERADO',
        socioProfile: 'MIXTO_NACIONAL',
        somosScenario: 'ORGANICO_40',
      },
      undefined,
      resolvedMeta.name
    );

    const p1_edad = resolveAgeRange(
      pickCol('P1_EDAD', 'Edad', 'RangoEdad', 'GrupoEdad', 'P1'),
      fallbackBase.p1_edad
    );
    const p3_localidad = resolveLocality(
      pickCol('P3_LOCALIDAD', 'Localidad', 'Zona', 'Ambito', 'P3'),
      fallbackBase.p3_localidad
    );

    const p4Raw = splitMulti(pickCol('P4_ACTIVIDADES', 'Actividades', 'Ocupacion', 'P4'));
    const p4_actividades = p4Raw.length > 0 ? p4Raw.slice(0, 8) : fallbackBase.p4_actividades;

    const p5Raw = String(
      pickCol('P5_ACTIVIDAD_PRINCIPAL', 'ActividadPrincipal', 'OcupacionPrincipal', 'P5')
    ).trim();
    const p5_actividad_principal =
      p5Raw && (p4_actividades.includes(p5Raw) || p5Raw === P5_FALLBACK_OPTION)
        ? p5Raw
        : p4_actividades[0] || P4_ACTIVITIES[0];

    const p6Raw = splitMulti(pickCol('P6_CUIDADOS', 'Cuidados', 'PersonasCuidado', 'P6'));
    const p6_cuidados = p6Raw.length > 0 ? p6Raw.slice(0, 6) : fallbackBase.p6_cuidados;

    const p11Raw = splitMulti(
      pickCol('P11_PREOCUPACIONES_TOP3', 'Preocupaciones', 'TopPreocupaciones', 'P11')
    );
    const p11_preocupaciones_top3 =
      p11Raw.length > 0 ? p11Raw.slice(0, 3) : fallbackBase.p11_preocupaciones_top3;

    const p12Raw = String(
      pickCol('P12_MAS_URGENTE', 'MasUrgente', 'UrgenciaPrincipal', 'P12')
    ).trim();
    const p12_mas_urgente =
      p12Raw && p11_preocupaciones_top3.includes(p12Raw)
        ? p12Raw
        : p11_preocupaciones_top3[0];

    const p17 = resolveYesNo(
      pickCol('P17_BUSCO_ATENCION', 'BuscoAtencion', 'AtencionInstitucional', 'P17'),
      fallbackBase.p17_busco_atencion_institucional
    );

    const p18_experiencia_institucional =
      p17 === 'Sí'
        ? parseSerializedMap(
            pickCol('P18_EXPERIENCIA_INSTITUCIONAL', 'ExperienciaInstitucional', 'P18'),
            P18_INSTITUTIONAL_EXPERIENCE_ITEMS,
            LIKERT_AGREEMENT_6,
            fallbackBase.p18_experiencia_institucional || {
              [P18_INSTITUTIONAL_EXPERIENCE_ITEMS[0]]: 'Algo en desacuerdo',
              [P18_INSTITUTIONAL_EXPERIENCE_ITEMS[1]]: 'Algo en desacuerdo',
              [P18_INSTITUTIONAL_EXPERIENCE_ITEMS[2]]: 'En desacuerdo',
            }
          )
        : null;

    const p19_confianza_institucional = parseSerializedMap(
      pickCol('P19_CONFIANZA_INSTITUCIONAL', 'ConfianzaInstitucional', 'P19'),
      P19_TRUST_INSTITUTIONS,
      INSTITUTIONAL_TRUST_5,
      fallbackBase.p19_confianza_institucional
    );

    const p24_percepcion_incidencia = parseSerializedMap(
      pickCol('P24_PERCEPCION_INCIDENCIA', 'PercepcionIncidencia', 'P24'),
      P24_INCIDENCE_ITEMS,
      LIKERT_AGREEMENT_6,
      fallbackBase.p24_percepcion_incidencia
    );

    const p26_acceso_derechos = parseSerializedMap(
      pickCol('P26_ACCESO_DERECHOS', 'AccesoDerechos', 'P26'),
      P26_RIGHTS_ACCESS_ITEMS,
      ACCESS_DIFFICULTY_6,
      fallbackBase.p26_acceso_derechos
    );

    const p29_impacto_cuidados = parseSerializedMap(
      pickCol('P29_IMPACTO_CUIDADOS', 'ImpactoCuidados', 'P29'),
      P29_CARE_IMPACT_ITEMS,
      CARE_IMPACT_FREQUENCY_7,
      fallbackBase.p29_impacto_cuidados
    );

    const p31_autonomia_decisiones = parseSerializedMap(
      pickCol('P31_AUTONOMIA_DECISIONES', 'AutonomiaDecisiones', 'P31'),
      P31_AUTONOMY_ITEMS,
      AUTONOMY_LEVEL_7,
      fallbackBase.p31_autonomia_decisiones
    );

    // Salto lógico crítico P34 -> P40
    const p34_conoce_somos = resolveSomosAwareness(
      pickCol('P34_CONOCE_SOMOS', 'ConoceSomos', 'Somos', 'P34'),
      fallbackBase.p34_conoce_somos
    );

    let p35_nivel_conocimiento_somos: OrusResponse['p35_nivel_conocimiento_somos'] = null;
    let p36_opinion_somos: OrusResponse['p36_opinion_somos'] = null;
    let p37_cercania_somos: OrusResponse['p37_cercania_somos'] = null;
    let p38_recuerda_propuesta_somos: OrusResponse['p38_recuerda_propuesta_somos'] = null;
    let p38_detalle = '';
    let p39_positivos_somos = '';
    let p39_criticas_somos = '';

    if (p34_conoce_somos === 'Sí') {
      const rawP35 = String(pickCol('P35_NIVEL_SOMOS', 'NivelSomos', 'P35')).trim();
      p35_nivel_conocimiento_somos =
        (
          [
            'Solo he escuchado el nombre',
            'Conozco poco',
            'Conozco algo',
            'Conozco bastante',
          ] as const
        ).find((v) => normalizeKey(v) === normalizeKey(rawP35)) ??
        fallbackBase.p35_nivel_conocimiento_somos ??
        'Conozco poco';

      const rawP36 = String(pickCol('P36_OPINION_SOMOS', 'OpinionSomos', 'P36')).trim();
      p36_opinion_somos =
        (
          [
            'Muy buena',
            'Buena',
            'Regular / Neutral',
            'Mala',
            'Muy mala',
            'Aún no tengo opinión formada',
          ] as const
        ).find((v) => normalizeKey(v) === normalizeKey(rawP36)) ??
        fallbackBase.p36_opinion_somos ??
        'Regular / Neutral';

      const rawP37 = Number(pickCol('P37_CERCANIA_SOMOS', 'CercaniaSomos', 'P37'));
      p37_cercania_somos =
        !Number.isNaN(rawP37) && rawP37 >= 1 && rawP37 <= 5
          ? (Math.round(rawP37) as 1 | 2 | 3 | 4 | 5)
          : fallbackBase.p37_cercania_somos ?? 3;

      p38_recuerda_propuesta_somos = resolveYesNo(
        pickCol('P38_RECUERDA_PROPUESTA', 'RecuerdaPropuestaSomos', 'P38'),
        fallbackBase.p38_recuerda_propuesta_somos ?? 'No'
      );
      p38_detalle =
        String(pickCol('P38_DETALLE', 'DetallePropuestaSomos')).trim() ||
        (p38_recuerda_propuesta_somos === 'Sí' ? fallbackBase.p38_detalle : '');
      p39_positivos_somos =
        String(pickCol('P39_POSITIVOS_SOMOS', 'PositivosSomos')).trim() ||
        fallbackBase.p39_positivos_somos;
      p39_criticas_somos =
        String(pickCol('P39_CRITICAS_SOMOS', 'CriticasSomos')).trim() ||
        fallbackBase.p39_criticas_somos;
    }

    const p40Raw = splitMulti(pickCol('P40_OTROS_PARTIDOS', 'OtrosPartidos', 'Partidos', 'P40'));
    const p40_otros_partidos =
      p40Raw.length > 0 ? p40Raw.slice(0, 3) : fallbackBase.p40_otros_partidos;

    const p41_evaluacion_otros_partidos = parseOtherPartiesEvaluation(
      pickCol('P41_EVALUACION_PARTIDOS', 'EvaluacionPartidos', 'P41'),
      p40_otros_partidos,
      fallbackBase.p41_evaluacion_otros_partidos
    );

    const paddedNum = String(rowNumber).padStart(3, '0');
    const rawFolio = String(pickCol('FOLIO', 'IdEncuesta', 'ClaveFolio')).trim();
    const folio = rawFolio || `EXCEL-${resolvedMeta.short}-${paddedNum}`;

    const rawModalidad = String(pickCol('MODALIDAD', 'TipoEntrevista')).trim();
    const modalidad: SurveyModality = (
      [
        'Autoadministrada digital',
        'Entrevista presencial en campo',
        'Entrevista telefónica / remota',
      ] as SurveyModality[]
    ).includes(rawModalidad as SurveyModality)
      ? (rawModalidad as SurveyModality)
      : 'Entrevista presencial en campo';

    const record: OrusResponse = {
      id: `xls_${resolvedMeta.short}_${Date.now()}_${paddedNum}`,
      folio,
      origin: 'REAL',
      sourceChannel: 'EXCEL_STATE_BLOCK',
      createdAt: new Date().toISOString(),
      archetypeTag: 'BLOQUE_EXCEL_ESTATAL',
      registroCampo: {
        participanteAlias: (() => {
          const directFull = String(
            pickCol(
              'PARTICIPANTE_ALIAS',
              'NombreCompleto',
              'Participante',
              'Encuestada',
              'Encuestado',
              'Persona',
              'Alias'
            )
          ).trim();
          if (directFull) return directFull;
          const first = String(pickCol('Nombre', 'Nombres')).trim();
          const last = [
            String(pickCol('Apellidos', 'Apellido', 'ApellidoPaterno')).trim(),
            String(pickCol('ApellidoMaterno')).trim(),
          ]
            .filter(Boolean)
            .join(' ');
          const combined = `${first} ${last}`.trim();
          return combined || generateDeterministicMexicanName(`${resolvedMeta.short}_${paddedNum}`);
        })(),
        municipioColonia:
          String(
            pickCol('MUNICIPIO_COLONIA', 'Municipio', 'Colonia', 'Alcaldia', 'Ciudad', 'Comunidad')
          ).trim() ||
          (MUNICIPIOS_POR_ENTIDAD[resolvedMeta.name]?.[rowIdx % (MUNICIPIOS_POR_ENTIDAD[resolvedMeta.name]?.length || 1)] ?? ''),
        modalidad,
        encuestadoraClave:
          String(pickCol('CLAVE_ENCUESTADORA', 'Encuestadora', 'Brigada')).trim() ||
          `EXCEL-${resolvedMeta.short}`,
        consentimientoAceptado: true,
        notasCampo:
          String(pickCol('NOTAS_CAMPO', 'Notas', 'Observaciones')).trim() ||
          `Importado de ${file.name}`,
      },
      p1_edad,
      p2_entidad: resolvedMeta.name,
      p3_localidad,
      p4_actividades,
      p5_actividad_principal,
      p6_cuidados,
      p7_significado_mujer:
        String(pickCol('P7_SIGNIFICADO_MUJER', 'SignificadoMujer', 'P7')).trim() ||
        fallbackBase.p7_significado_mujer,
      p8_orgullo_fortaleza:
        String(pickCol('P8_ORGULLO_FORTALEZA', 'OrgulloFortaleza', 'P8')).trim() ||
        fallbackBase.p8_orgullo_fortaleza,
      p9_obstaculo_principal:
        String(pickCol('P9_OBSTACULO_PRINCIPAL', 'ObstaculoPrincipal', 'P9')).trim() ||
        fallbackBase.p9_obstaculo_principal,
      p10_cambio_futuro_jovenes:
        String(pickCol('P10_CAMBIO_FUTURO', 'CambioFuturo', 'P10')).trim() ||
        fallbackBase.p10_cambio_futuro_jovenes,
      p11_preocupaciones_top3,
      p12_mas_urgente,
      p12_justificacion:
        String(pickCol('P12_JUSTIFICACION', 'JustificacionUrgencia')).trim() ||
        fallbackBase.p12_justificacion,
      p13_problema_local_desatendido: resolveYesNo(
        pickCol('P13_PROBLEMA_LOCAL', 'ProblemaLocal', 'P13'),
        fallbackBase.p13_problema_local_desatendido
      ),
      p13_detalle:
        String(pickCol('P13_DETALLE', 'DetalleProblemaLocal')).trim() ||
        fallbackBase.p13_detalle,
      p14_espacios_conversacion:
        splitMulti(pickCol('P14_ESPACIOS_CONVERSACION', 'EspaciosConversacion', 'P14')).slice(
          0,
          7
        ).length > 0
          ? splitMulti(
              pickCol('P14_ESPACIOS_CONVERSACION', 'EspaciosConversacion', 'P14')
            ).slice(0, 7)
          : fallbackBase.p14_espacios_conversacion,
      p15_preocupacion_entorno_mujeres:
        String(pickCol('P15_PREOCUPACION_MUJERES', 'PreocupacionMujeres', 'P15')).trim() ||
        p12_mas_urgente,
      p16_conoce_contextos_distintos: resolveYesNo(
        pickCol('P16_OTROS_CONTEXTOS', 'OtrosContextos', 'P16'),
        fallbackBase.p16_conoce_contextos_distintos
      ),
      p16_detalle:
        String(pickCol('P16_DETALLE', 'DetalleOtrosContextos')).trim() ||
        fallbackBase.p16_detalle,
      p17_busco_atencion_institucional: p17,
      p18_experiencia_institucional,
      p19_confianza_institucional,
      p20_actividades_participacion:
        splitMulti(pickCol('P20_ACTIVIDADES_PARTICIPACION', 'Participacion', 'P20')).slice(
          0,
          8
        ).length > 0
          ? splitMulti(pickCol('P20_ACTIVIDADES_PARTICIPACION', 'Participacion', 'P20')).slice(
              0,
              8
            )
          : fallbackBase.p20_actividades_participacion,
      p21_frecuencia_participacion:
        (
          ['Frecuentemente', 'Ocasionalmente', 'Casi nunca', 'Nunca'] as const
        ).find(
          (f) =>
            normalizeKey(f) ===
            normalizeKey(String(pickCol('P21_FRECUENCIA_PARTICIPACION', 'Frecuencia', 'P21')))
        ) ?? fallbackBase.p21_frecuencia_participacion,
      p22_dificultades_participacion:
        splitMulti(pickCol('P22_DIFICULTADES_TOP3', 'Dificultades', 'P22')).slice(0, 3).length >
        0
          ? splitMulti(pickCol('P22_DIFICULTADES_TOP3', 'Dificultades', 'P22')).slice(0, 3)
          : fallbackBase.p22_dificultades_participacion,
      p23_condiciones_habilitadoras:
        splitMulti(pickCol('P23_HABILITADORES_TOP3', 'Habilitadores', 'P23')).slice(0, 3)
          .length > 0
          ? splitMulti(pickCol('P23_HABILITADORES_TOP3', 'Habilitadores', 'P23')).slice(0, 3)
          : fallbackBase.p23_condiciones_habilitadoras,
      p24_percepcion_incidencia,
      p25_violencia_politica:
        (
          [
            'No, nunca',
            'Sí, lo he presenciado hacia otras mujeres',
            'Sí, lo he vivido directamente',
            'Ambas (lo he vivido y presenciado)',
          ] as const
        ).find(
          (v) =>
            normalizeKey(v) ===
            normalizeKey(String(pickCol('P25_VIOLENCIA_POLITICA', 'ViolenciaPolitica', 'P25')))
        ) ?? fallbackBase.p25_violencia_politica,
      p25_detalle:
        String(pickCol('P25_DETALLE', 'DetalleViolenciaPolitica')).trim() ||
        fallbackBase.p25_detalle,
      p26_acceso_derechos,
      p27_ambitos_desventaja:
        splitMulti(pickCol('P27_AMBITOS_DESVENTAJA', 'Desventajas', 'P27')).slice(0, 8).length >
        0
          ? splitMulti(pickCol('P27_AMBITOS_DESVENTAJA', 'Desventajas', 'P27')).slice(0, 8)
          : fallbackBase.p27_ambitos_desventaja,
      p28_situaciones_sexismo:
        splitMulti(pickCol('P28_SITUACIONES_SEXISMO', 'Sexismo', 'P28')).slice(0, 8).length > 0
          ? splitMulti(pickCol('P28_SITUACIONES_SEXISMO', 'Sexismo', 'P28')).slice(0, 8)
          : fallbackBase.p28_situaciones_sexismo,
      p29_impacto_cuidados,
      p30_abandono_por_temor:
        (['Sí, varias veces', 'Sí, alguna vez', 'No'] as const).find(
          (v) =>
            normalizeKey(v) ===
            normalizeKey(String(pickCol('P30_ABANDONO_TEMOR', 'AbandonoTemor', 'P30')))
        ) ?? fallbackBase.p30_abandono_por_temor,
      p31_autonomia_decisiones,
      p32_conocimiento_rutas_apoyo:
        (
          [
            'Sí, conozco rutas claras y confiables',
            'Conozco algunas opciones, pero dudo que funcionen',
            'No sé con claridad a dónde acudir',
          ] as const
        ).find(
          (v) =>
            normalizeKey(v) ===
            normalizeKey(String(pickCol('P32_RUTAS_APOYO', 'RutasApoyo', 'P32')))
        ) ?? fallbackBase.p32_conocimiento_rutas_apoyo,
      p33_apoyo_concreto_cambio:
        String(pickCol('P33_APOYO_CAMBIO_CONCRETO', 'ApoyoConcreto', 'P33')).trim() ||
        fallbackBase.p33_apoyo_concreto_cambio,
      p34_conoce_somos,
      p35_nivel_conocimiento_somos,
      p36_opinion_somos,
      p37_cercania_somos,
      p38_recuerda_propuesta_somos,
      p38_detalle,
      p39_positivos_somos,
      p39_criticas_somos,
      p40_otros_partidos,
      p41_evaluacion_otros_partidos,
      p42_cambio_opinion_6meses:
        (['Mejoró', 'Empeoró', 'Se mantuvo igual', 'Recién lo escucho aquí'] as const).find(
          (v) =>
            normalizeKey(v) ===
            normalizeKey(String(pickCol('P42_CAMBIO_6MESES', 'Cambio6Meses', 'P42')))
        ) ?? fallbackBase.p42_cambio_opinion_6meses,
      p42_motivo:
        String(pickCol('P42_MOTIVO', 'MotivoCambio')).trim() || fallbackBase.p42_motivo,
      p43_escucha_social_partidos: resolveYesNo(
        pickCol('P43_ESCUCHA_SOCIAL', 'EscuchaSocial', 'P43'),
        fallbackBase.p43_escucha_social_partidos
      ),
      p43_relato:
        String(pickCol('P43_RELATO', 'RelatoSocial')).trim() || fallbackBase.p43_relato,
    };

    parsedRecords.push(record);
  });

  if (parsedRecords.length === 0) {
    throw new Error(
      'No se encontraron filas contestadas en el archivo. Llena los datos de las personas encuestadas o prueba con el Excel Muestra de 100 Personas.'
    );
  }

  if (parsedRecords.length !== 100) {
    warnings.push(
      `El bloque leído contiene ${parsedRecords.length} registros (la meta estándar por bloque estatal es de 100 personas, pero puedes guardarlo igualmente para avanzar el estudio).`
    );
  }

  const stateCounts: Record<string, number> = {};
  for (const r of parsedRecords) {
    stateCounts[r.p2_entidad] = (stateCounts[r.p2_entidad] || 0) + 1;
  }
  const detectedState =
    Object.entries(stateCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || targetMeta.name;

  return {
    records: parsedRecords,
    detectedState,
    sheetName: preferredSheetName,
    totalRowsRead: rawRows.length,
    skippedBlankRows,
    warnings,
  };
}
