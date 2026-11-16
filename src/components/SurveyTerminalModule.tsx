import React, { useMemo, useState } from 'react';
import {
  ACCESS_DIFFICULTY_6,
  AGE_RANGES,
  AUTONOMY_LEVEL_7,
  CARE_IMPACT_FREQUENCY_7,
  INSTITUTIONAL_TRUST_5,
  LIKERT_AGREEMENT_6,
  LOCALITY_TYPES,
  MEXICO_ENTITIES,
  ORUS_BLOCKS_META,
  P11_CONCERNS_16,
  P14_CONVERSATION_SPACES,
  P18_INSTITUTIONAL_EXPERIENCE_ITEMS,
  P19_TRUST_INSTITUTIONS,
  P20_PARTICIPATION_ACTIVITIES,
  P21_FREQUENCY_OPTIONS,
  P22_PARTICIPATION_BARRIERS,
  P23_ENABLING_CONDITIONS,
  P24_INCIDENCE_ITEMS,
  P25_POLITICAL_VIOLENCE_OPTIONS,
  P26_RIGHTS_ACCESS_ITEMS,
  P27_DISADVANTAGE_DOMAINS,
  P28_SEXISM_SITUATIONS,
  P29_CARE_IMPACT_ITEMS,
  P30_FEAR_ABANDONMENT_OPTIONS,
  P31_AUTONOMY_ITEMS,
  P32_SUPPORT_ROUTES_OPTIONS,
  P34_SOMOS_AWARENESS_OPTIONS,
  P35_SOMOS_KNOWLEDGE_OPTIONS,
  P36_SOMOS_OPINION_OPTIONS,
  P42_OPINION_CHANGE_OPTIONS,
  P4_ACTIVITIES,
  P5_FALLBACK_OPTION,
  P6_CARE_OPTIONS,
  PARTY_OPINION_5,
  PARTY_PROPOSALS_KNOWLEDGE,
  SUGGESTED_PARTIES_MEXICO,
} from '../data/orusCatalogs';
import { exportDatasetToCSV, exportDatasetToJSON } from '../engine/analyticsEngine';
import {
  generateSingleSyntheticAgent,
  generateSyntheticNarrativesFromBlockA,
} from '../engine/swarmSimulator';
import {
  AccessDifficulty6,
  ActiveModule,
  AgeRange,
  AutonomyLevel7,
  CareImpactFrequency7,
  InstitutionalTrust5,
  LikertAgreement6,
  LocalityType,
  OrusResponse,
  OtherPartyEvaluation,
  PartyOpinion5,
  PartyProposalsKnowledge,
  SurveyModality,
} from '../types/orus';
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  GitBranch,
  Layers,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  UserCheck,
} from 'lucide-react';

interface SurveyTerminalModuleProps {
  totalRecordsCount: number;
  onSubmitSurvey: (response: OrusResponse) => void;
  onNavigateModule: (mod: ActiveModule) => void;
}

const MODALITIES: SurveyModality[] = [
  'Autoadministrada digital',
  'Entrevista presencial en campo',
  'Entrevista telefónica / remota',
];

export const SurveyTerminalModule: React.FC<SurveyTerminalModuleProps> = ({
  totalRecordsCount,
  onSubmitSurvey,
  onNavigateModule,
}) => {
  // Modo de visualización: Paso a paso por bloques (A-F) o Hoja Continua Completa (P1-P43)
  const [viewMode, setViewMode] = useState<'STEPPER' | 'FULL_SHEET'>('STEPPER');
  const [activeBlockIdx, setActiveBlockIdx] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submittedReceipt, setSubmittedReceipt] = useState<OrusResponse | null>(null);
  const [partyDraftInput, setPartyDraftInput] = useState<string>('');

  // ---------------- DATOS DE REGISTRO Y LEVANTAMIENTO REQUERIDOS ----------------
  const [participanteAlias, setParticipanteAlias] = useState<string>('');
  const [municipioColonia, setMunicipioColonia] = useState<string>('');
  const [modalidad, setModalidad] = useState<SurveyModality>('Autoadministrada digital');
  const [encuestadoraClave, setEncuestadoraClave] = useState<string>('');
  const [notasCampo, setNotasCampo] = useState<string>('');
  const [consentimientoAceptado, setConsentimientoAceptado] = useState<boolean>(false);

  // ---------------- BLOQUE A (P1 – P6) - INICIA EN BLANCO ----------------
  const [p1Edad, setP1Edad] = useState<AgeRange | ''>('');
  const [p2Entidad, setP2Entidad] = useState<string>('');
  const [p3Localidad, setP3Localidad] = useState<LocalityType | ''>('');
  const [p4Actividades, setP4Actividades] = useState<string[]>([]);
  const [p5Principal, setP5Principal] = useState<string>('');
  const [p6Cuidados, setP6Cuidados] = useState<string[]>([]);

  // ---------------- BLOQUE B (P7 – P10) ----------------
  const [p7Significado, setP7Significado] = useState<string>('');
  const [p8Orgullo, setP8Orgullo] = useState<string>('');
  const [p9Obstaculo, setP9Obstaculo] = useState<string>('');
  const [p10Futuro, setP10Futuro] = useState<string>('');

  // ---------------- BLOQUE C (P11 – P16) ----------------
  const [p11Top3, setP11Top3] = useState<string[]>([]);
  const [p12MasUrgente, setP12MasUrgente] = useState<string>('');
  const [p12Justificacion, setP12Justificacion] = useState<string>('');
  const [p13ProblemaLocal, setP13ProblemaLocal] = useState<'Sí' | 'No' | ''>('');
  const [p13Detalle, setP13Detalle] = useState<string>('');
  const [p14Espacios, setP14Espacios] = useState<string[]>([]);
  const [p15Entorno, setP15Entorno] = useState<string>('');
  const [p16Contextos, setP16Contextos] = useState<'Sí' | 'No' | ''>('');
  const [p16Detalle, setP16Detalle] = useState<string>('');

  // ---------------- BLOQUE D (P17 – P25) ----------------
  const [p17Atencion, setP17Atencion] = useState<'Sí' | 'No' | ''>('');
  const [p18Experiencia, setP18Experiencia] = useState<Record<string, LikertAgreement6>>({});
  const [p19Confianza, setP19Confianza] = useState<Record<string, InstitutionalTrust5>>({});
  const [p20Participacion, setP20Participacion] = useState<string[]>([]);
  const [p21Frecuencia, setP21Frecuencia] = useState<
    OrusResponse['p21_frecuencia_participacion'] | ''
  >('');
  const [p22Dificultades, setP22Dificultades] = useState<string[]>([]);
  const [p23Condiciones, setP23Condiciones] = useState<string[]>([]);
  const [p24Incidencia, setP24Incidencia] = useState<Record<string, LikertAgreement6>>({});
  const [p25ViolenciaPol, setP25ViolenciaPol] = useState<
    OrusResponse['p25_violencia_politica'] | ''
  >('');
  const [p25Detalle, setP25Detalle] = useState<string>('');

  // ---------------- BLOQUE E (P26 – P33) ----------------
  const [p26Derechos, setP26Derechos] = useState<Record<string, AccessDifficulty6>>({});
  const [p27Desventaja, setP27Desventaja] = useState<string[]>([]);
  const [p28Sexismo, setP28Sexismo] = useState<string[]>([]);
  const [p29ImpactoCuidados, setP29ImpactoCuidados] = useState<
    Record<string, CareImpactFrequency7>
  >({});
  const [p30AbandonoTemor, setP30AbandonoTemor] = useState<
    OrusResponse['p30_abandono_por_temor'] | ''
  >('');
  const [p31Autonomia, setP31Autonomia] = useState<Record<string, AutonomyLevel7>>({});
  const [p32RutasApoyo, setP32RutasApoyo] = useState<
    OrusResponse['p32_conocimiento_rutas_apoyo'] | ''
  >('');
  const [p33ApoyoConcreto, setP33ApoyoConcreto] = useState<string>('');

  // ---------------- BLOQUE F (P34 – P43) ----------------
  const [p34ConoceSomos, setP34ConoceSomos] = useState<
    OrusResponse['p34_conoce_somos'] | ''
  >('');
  const [p35NivelSomos, setP35NivelSomos] = useState<
    NonNullable<OrusResponse['p35_nivel_conocimiento_somos']> | ''
  >('');
  const [p36OpinionSomos, setP36OpinionSomos] = useState<
    NonNullable<OrusResponse['p36_opinion_somos']> | ''
  >('');
  const [p37CercaniaSomos, setP37CercaniaSomos] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [p38RecuerdaPropuesta, setP38RecuerdaPropuesta] = useState<'Sí' | 'No' | ''>('');
  const [p38Detalle, setP38Detalle] = useState<string>('');
  const [p39Positivos, setP39Positivos] = useState<string>('');
  const [p39Criticas, setP39Criticas] = useState<string>('');

  const [p40Partidos, setP40Partidos] = useState<string[]>([]);
  const [p41Evaluaciones, setP41Evaluaciones] = useState<Record<string, OtherPartyEvaluation>>({});
  const [p42Cambio6Meses, setP42Cambio6Meses] = useState<
    OrusResponse['p42_cambio_opinion_6meses'] | ''
  >('');
  const [p42Motivo, setP42Motivo] = useState<string>('');
  const [p43EscuchaSocial, setP43EscuchaSocial] = useState<'Sí' | 'No' | ''>('');
  const [p43Relato, setP43Relato] = useState<string>('');

  // Folio dinámico proyectado
  const previewFolio = useMemo(() => {
    const ent = MEXICO_ENTITIES.find((e) => e.name === p2Entidad);
    const code = ent ? ent.short : 'MX';
    return `CAMPO-${code}-${String(totalRecordsCount + 1).padStart(4, '0')}`;
  }, [p2Entidad, totalRecordsCount]);

  // Opciones dinámicas de P5 basadas estrictamente en P4
  const p5DynamicOptions = useMemo(
    () => (p4Actividades.length > 0 ? [...p4Actividades, P5_FALLBACK_OPTION] : []),
    [p4Actividades]
  );

  // Cálculo en tiempo real del progreso de respuesta por bloque y total
  const progressStats = useMemo(() => {
    const regDone =
      (participanteAlias.trim() ? 1 : 0) +
      (municipioColonia.trim() ? 1 : 0) +
      (consentimientoAceptado ? 1 : 0);

    const bA =
      (p1Edad ? 1 : 0) +
      (p2Entidad ? 1 : 0) +
      (p3Localidad ? 1 : 0) +
      (p4Actividades.length > 0 ? 1 : 0) +
      (p5Principal ? 1 : 0) +
      (p6Cuidados.length > 0 ? 1 : 0);

    const bB =
      (p7Significado.trim() ? 1 : 0) +
      (p8Orgullo.trim() ? 1 : 0) +
      (p9Obstaculo.trim() ? 1 : 0) +
      (p10Futuro.trim() ? 1 : 0);

    const bC =
      (p11Top3.length > 0 ? 1 : 0) +
      (p12MasUrgente && p12Justificacion.trim() ? 1 : 0) +
      (p13ProblemaLocal === 'No' || (p13ProblemaLocal === 'Sí' && p13Detalle.trim()) ? 1 : 0) +
      (p14Espacios.length > 0 ? 1 : 0) +
      (p15Entorno ? 1 : 0) +
      (p16Contextos === 'No' || (p16Contextos === 'Sí' && p16Detalle.trim()) ? 1 : 0);

    const p18Required = p17Atencion === 'Sí' ? 1 : 0;
    const p18Done =
      p17Atencion === 'Sí' &&
      Object.keys(p18Experiencia).length === P18_INSTITUTIONAL_EXPERIENCE_ITEMS.length
        ? 1
        : 0;

    const bD =
      (p17Atencion ? 1 : 0) +
      p18Done +
      (Object.keys(p19Confianza).length === P19_TRUST_INSTITUTIONS.length ? 1 : 0) +
      (p20Participacion.length > 0 ? 1 : 0) +
      (p21Frecuencia ? 1 : 0) +
      (p22Dificultades.length > 0 ? 1 : 0) +
      (p23Condiciones.length > 0 ? 1 : 0) +
      (Object.keys(p24Incidencia).length === P24_INCIDENCE_ITEMS.length ? 1 : 0) +
      (p25ViolenciaPol === 'No, nunca' ||
      (p25ViolenciaPol !== '' && p25Detalle.trim())
        ? 1
        : 0);
    const bDTotal = 8 + p18Required;

    const bE =
      (Object.keys(p26Derechos).length === P26_RIGHTS_ACCESS_ITEMS.length ? 1 : 0) +
      (p27Desventaja.length > 0 ? 1 : 0) +
      (p28Sexismo.length > 0 ? 1 : 0) +
      (Object.keys(p29ImpactoCuidados).length === P29_CARE_IMPACT_ITEMS.length ? 1 : 0) +
      (p30AbandonoTemor ? 1 : 0) +
      (Object.keys(p31Autonomia).length === P31_AUTONOMY_ITEMS.length ? 1 : 0) +
      (p32RutasApoyo ? 1 : 0) +
      (p33ApoyoConcreto.trim() ? 1 : 0);

    const somosBranchTotal = p34ConoceSomos === 'Sí' ? 5 : 0;
    const somosBranchDone =
      p34ConoceSomos === 'Sí'
        ? (p35NivelSomos ? 1 : 0) +
          (p36OpinionSomos ? 1 : 0) +
          (p37CercaniaSomos !== null ? 1 : 0) +
          (p38RecuerdaPropuesta === 'No' ||
          (p38RecuerdaPropuesta === 'Sí' && p38Detalle.trim())
            ? 1
            : 0) +
          (p39Positivos.trim() || p39Criticas.trim() ? 1 : 0)
        : 0;

    const p40And41Done =
      p40Partidos.length > 0 &&
      p40Partidos.every((pt) => Boolean(p41Evaluaciones[pt]))
        ? 2
        : p40Partidos.length > 0
        ? 1
        : 0;

    const bF =
      (p34ConoceSomos ? 1 : 0) +
      somosBranchDone +
      p40And41Done +
      (p42Cambio6Meses === 'Se mantuvo igual' ||
      p42Cambio6Meses === 'Recién lo escucho aquí' ||
      ((p42Cambio6Meses === 'Mejoró' || p42Cambio6Meses === 'Empeoró') && p42Motivo.trim())
        ? 1
        : 0) +
      (p43EscuchaSocial === 'No' || (p43EscuchaSocial === 'Sí' && p43Relato.trim()) ? 1 : 0);
    const bFTotal = 5 + somosBranchTotal;

    const blockProgress = [
      { done: bA, total: 6 },
      { done: bB, total: 4 },
      { done: bC, total: 6 },
      { done: bD, total: bDTotal },
      { done: bE, total: 8 },
      { done: bF, total: bFTotal },
    ];

    const totalDone = regDone + bA + bB + bC + bD + bE + bF;
    const totalRequired = 3 + 6 + 4 + 6 + bDTotal + 8 + bFTotal;
    const pct = Math.min(100, Math.round((totalDone / totalRequired) * 100));

    return { regDone, blockProgress, totalDone, totalRequired, pct };
  }, [
    participanteAlias,
    municipioColonia,
    consentimientoAceptado,
    p1Edad,
    p2Entidad,
    p3Localidad,
    p4Actividades,
    p5Principal,
    p6Cuidados,
    p7Significado,
    p8Orgullo,
    p9Obstaculo,
    p10Futuro,
    p11Top3,
    p12MasUrgente,
    p12Justificacion,
    p13ProblemaLocal,
    p13Detalle,
    p14Espacios,
    p15Entorno,
    p16Contextos,
    p16Detalle,
    p17Atencion,
    p18Experiencia,
    p19Confianza,
    p20Participacion,
    p21Frecuencia,
    p22Dificultades,
    p23Condiciones,
    p24Incidencia,
    p25ViolenciaPol,
    p25Detalle,
    p26Derechos,
    p27Desventaja,
    p28Sexismo,
    p29ImpactoCuidados,
    p30AbandonoTemor,
    p31Autonomia,
    p32RutasApoyo,
    p33ApoyoConcreto,
    p34ConoceSomos,
    p35NivelSomos,
    p36OpinionSomos,
    p37CercaniaSomos,
    p38RecuerdaPropuesta,
    p38Detalle,
    p39Positivos,
    p39Criticas,
    p40Partidos,
    p41Evaluaciones,
    p42Cambio6Meses,
    p42Motivo,
    p43EscuchaSocial,
    p43Relato,
  ]);

  // Reiniciar todo el formulario completamente en blanco
  const handleResetBlankForm = () => {
    setSubmittedReceipt(null);
    setValidationError(null);
    setActiveBlockIdx(0);
    setParticipanteAlias('');
    setMunicipioColonia('');
    setModalidad('Autoadministrada digital');
    setEncuestadoraClave('');
    setNotasCampo('');
    setConsentimientoAceptado(false);

    setP1Edad('');
    setP2Entidad('');
    setP3Localidad('');
    setP4Actividades([]);
    setP5Principal('');
    setP6Cuidados([]);

    setP7Significado('');
    setP8Orgullo('');
    setP9Obstaculo('');
    setP10Futuro('');

    setP11Top3([]);
    setP12MasUrgente('');
    setP12Justificacion('');
    setP13ProblemaLocal('');
    setP13Detalle('');
    setP14Espacios([]);
    setP15Entorno('');
    setP16Contextos('');
    setP16Detalle('');

    setP17Atencion('');
    setP18Experiencia({});
    setP19Confianza({});
    setP20Participacion([]);
    setP21Frecuencia('');
    setP22Dificultades([]);
    setP23Condiciones([]);
    setP24Incidencia({});
    setP25ViolenciaPol('');
    setP25Detalle('');

    setP26Derechos({});
    setP27Desventaja([]);
    setP28Sexismo([]);
    setP29ImpactoCuidados({});
    setP30AbandonoTemor('');
    setP31Autonomia({});
    setP32RutasApoyo('');
    setP33ApoyoConcreto('');

    setP34ConoceSomos('');
    setP35NivelSomos('');
    setP36OpinionSomos('');
    setP37CercaniaSomos(null);
    setP38RecuerdaPropuesta('');
    setP38Detalle('');
    setP39Positivos('');
    setP39Criticas('');

    setP40Partidos([]);
    setP41Evaluaciones({});
    setP42Cambio6Meses('');
    setP42Motivo('');
    setP43EscuchaSocial('');
    setP43Relato('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handlers de selección
  const toggleP4Activity = (act: string) => {
    setP4Actividades((prev) => {
      const exists = prev.includes(act);
      const next = exists ? prev.filter((x) => x !== act) : [...prev, act];
      if (!next.includes(p5Principal) && p5Principal !== P5_FALLBACK_OPTION) {
        setP5Principal(next[0] ?? '');
      }
      return next;
    });
  };

  const toggleP6Care = (opt: string) => {
    const noneOpt = P6_CARE_OPTIONS[5];
    if (opt === noneOpt) {
      setP6Cuidados([noneOpt]);
      return;
    }
    setP6Cuidados((prev) => {
      const cleaned = prev.filter((x) => x !== noneOpt);
      const exists = cleaned.includes(opt);
      return exists ? cleaned.filter((x) => x !== opt) : [...cleaned, opt];
    });
  };

  const toggleStrictMax3 = (
    item: string,
    current: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    onAfterChange?: (next: string[]) => void
  ) => {
    if (current.includes(item)) {
      const next = current.filter((x) => x !== item);
      setter(next);
      onAfterChange?.(next);
      return;
    }
    if (current.length >= 3) {
      setValidationError(
        'Límite del cuestionario OCEAN: Solo puedes elegir hasta un máximo de 3 opciones en esta pregunta.'
      );
      return;
    }
    setValidationError(null);
    const next = [...current, item];
    setter(next);
    onAfterChange?.(next);
  };

  const toggleMultiWithExclusiveLast = (
    item: string,
    exclusiveLabel: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (item === exclusiveLabel) {
      setter([exclusiveLabel]);
      return;
    }
    setter((prev) => {
      const withoutExcl = prev.filter((x) => x !== exclusiveLabel);
      return withoutExcl.includes(item)
        ? withoutExcl.filter((x) => x !== item)
        : [...withoutExcl, item];
    });
  };

  // Autocompletado de Bloque B basado en perfil del Bloque A
  const handleAutocompleteBlockB = () => {
    const synth = generateSyntheticNarrativesFromBlockA({
      edad: (p1Edad || '25–34') as AgeRange,
      entidad: p2Entidad || 'Ciudad de México',
      localidad: (p3Localidad || 'Urbana') as LocalityType,
      cuidados: p6Cuidados,
    });
    setP7Significado(synth.p7);
    setP8Orgullo(synth.p8);
    setP9Obstaculo(synth.p9);
    setP10Futuro(synth.p10);
    setValidationError(null);
  };

  // Prellenar ejemplo de prueba en caso de que el usuario quiera probar el envío rápido
  const handleFullSyntheticPrefill = () => {
    const sample = generateSingleSyntheticAgent(totalRecordsCount + 1, {
      geoBias: 'NACIONAL_PONDERADO',
      socioProfile: 'MIXTO_NACIONAL',
      somosScenario: 'ALTA_70',
    });
    setParticipanteAlias('María Elena G. (Prueba)');
    setMunicipioColonia('León · Col. San Miguel');
    setModalidad('Entrevista presencial en campo');
    setEncuestadoraClave('BRIGADA-OCEAN-04');
    setConsentimientoAceptado(true);

    setP1Edad(sample.p1_edad);
    setP2Entidad(sample.p2_entidad);
    setP3Localidad(sample.p3_localidad);
    setP4Actividades(sample.p4_actividades);
    setP5Principal(sample.p5_actividad_principal);
    setP6Cuidados(sample.p6_cuidados);
    setP7Significado(sample.p7_significado_mujer);
    setP8Orgullo(sample.p8_orgullo_fortaleza);
    setP9Obstaculo(sample.p9_obstaculo_principal);
    setP10Futuro(sample.p10_cambio_futuro_jovenes);
    setP11Top3(sample.p11_preocupaciones_top3);
    setP12MasUrgente(sample.p12_mas_urgente);
    setP12Justificacion(sample.p12_justificacion);
    setP13ProblemaLocal(sample.p13_problema_local_desatendido);
    setP13Detalle(sample.p13_detalle);
    setP14Espacios(sample.p14_espacios_conversacion);
    setP15Entorno(sample.p15_preocupacion_entorno_mujeres);
    setP16Contextos(sample.p16_conoce_contextos_distintos);
    setP16Detalle(sample.p16_detalle);
    setP17Atencion(sample.p17_busco_atencion_institucional);
    if (sample.p18_experiencia_institucional) {
      setP18Experiencia(sample.p18_experiencia_institucional);
    } else {
      setP18Experiencia({});
    }
    setP19Confianza(sample.p19_confianza_institucional);
    setP20Participacion(sample.p20_actividades_participacion);
    setP21Frecuencia(sample.p21_frecuencia_participacion);
    setP22Dificultades(sample.p22_dificultades_participacion);
    setP23Condiciones(sample.p23_condiciones_habilitadoras);
    setP24Incidencia(sample.p24_percepcion_incidencia);
    setP25ViolenciaPol(sample.p25_violencia_politica);
    setP25Detalle(sample.p25_detalle);
    setP26Derechos(sample.p26_acceso_derechos);
    setP27Desventaja(sample.p27_ambitos_desventaja);
    setP28Sexismo(sample.p28_situaciones_sexismo);
    setP29ImpactoCuidados(sample.p29_impacto_cuidados);
    setP30AbandonoTemor(sample.p30_abandono_por_temor);
    setP31Autonomia(sample.p31_autonomia_decisiones);
    setP32RutasApoyo(sample.p32_conocimiento_rutas_apoyo);
    setP33ApoyoConcreto(sample.p33_apoyo_concreto_cambio);
    setP34ConoceSomos(sample.p34_conoce_somos);
    setP35NivelSomos(sample.p35_nivel_conocimiento_somos ?? '');
    setP36OpinionSomos(sample.p36_opinion_somos ?? '');
    setP37CercaniaSomos(sample.p37_cercania_somos);
    setP38RecuerdaPropuesta(sample.p38_recuerda_propuesta_somos ?? '');
    setP38Detalle(sample.p38_detalle);
    setP39Positivos(sample.p39_positivos_somos);
    setP39Criticas(sample.p39_criticas_somos);
    setP40Partidos(sample.p40_otros_partidos);
    const evMap: Record<string, OtherPartyEvaluation> = {};
    for (const ev of sample.p41_evaluacion_otros_partidos) {
      evMap[ev.partido] = ev;
    }
    setP41Evaluaciones(evMap);
    setP42Cambio6Meses(sample.p42_cambio_opinion_6meses);
    setP42Motivo(sample.p42_motivo);
    setP43EscuchaSocial(sample.p43_escucha_social_partidos);
    setP43Relato(sample.p43_relato);
    setValidationError(null);
  };

  // Partidos P40 y P41
  const addPartyToP40 = (rawName: string) => {
    const clean = rawName.trim();
    if (!clean) return;
    if (p40Partidos.some((p) => p.toLowerCase() === clean.toLowerCase())) {
      setPartyDraftInput('');
      return;
    }
    if (p40Partidos.length >= 3) {
      setValidationError('En P40 puedes registrar hasta un máximo de 3 partidos políticos.');
      return;
    }
    setValidationError(null);
    setP40Partidos((prev) => [...prev, clean]);
    setP41Evaluaciones((prev) => ({
      ...prev,
      [clean]: prev[clean] ?? {
        partido: clean,
        opinion: 'Regular',
        cercania: 3,
        conocimientoPropuestas: 'Solo promesas generales',
      },
    }));
    setPartyDraftInput('');
  };

  const removePartyFromP40 = (name: string) => {
    setP40Partidos((prev) => prev.filter((p) => p !== name));
  };

  const updateP41Field = <K extends keyof OtherPartyEvaluation>(
    partyName: string,
    field: K,
    value: OtherPartyEvaluation[K]
  ) => {
    setP41Evaluaciones((prev) => ({
      ...prev,
      [partyName]: {
        ...(prev[partyName] ?? {
          partido: partyName,
          opinion: 'Regular',
          cercania: 3,
          conocimientoPropuestas: 'Solo promesas generales',
        }),
        [field]: value,
      },
    }));
  };

  // Validaciones detalladas por bloque y ficha de registro
  const validateRegistration = (): string | null => {
    if (!participanteAlias.trim()) {
      return 'Ingresa el nombre, iniciales o alias de la participante (o pulsa "Usar Folio Anónimo").';
    }
    if (!municipioColonia.trim()) {
      return 'Ingresa el Municipio / Alcaldía y Colonia o Comunidad del levantamiento.';
    }
    if (!consentimientoAceptado) {
      return 'Debes confirmar el consentimiento informado de participación para continuar.';
    }
    return null;
  };

  const validateBlock = (blockIdx: number): string | null => {
    if (blockIdx === 0) {
      const regErr = validateRegistration();
      if (regErr) return regErr;
      if (!p1Edad) return 'Falta contestar P1: Selecciona tu rango de edad.';
      if (!p2Entidad) return 'Falta contestar P2: Selecciona tu entidad federativa.';
      if (!p3Localidad) return 'Falta contestar P3: Selecciona el tipo de localidad.';
      if (p4Actividades.length === 0)
        return 'Falta contestar P4: Elige al menos una actividad actual.';
      if (!p5Principal)
        return 'Falta contestar P5: Selecciona cuál consideras tu actividad principal.';
      if (p6Cuidados.length === 0)
        return 'Falta contestar P6: Indica tus responsabilidades de cuidado.';
    }
    if (blockIdx === 1) {
      if (!p7Significado.trim()) return 'Falta contestar P7: Escribe qué significa ser mujer hoy en tu entorno.';
      if (!p8Orgullo.trim()) return 'Falta contestar P8: Comparte qué te da mayor orgullo o fortaleza.';
      if (!p9Obstaculo.trim()) return 'Falta contestar P9: Indica el obstáculo principal enfrentado.';
      if (!p10Futuro.trim()) return 'Falta contestar P10: Escribe qué cambio deseas para las jóvenes y niñas.';
    }
    if (blockIdx === 2) {
      if (p11Top3.length === 0 || p11Top3.length > 3) {
        return 'Falta contestar P11: Selecciona de 1 a 3 preocupaciones principales.';
      }
      if (!p12MasUrgente || !p11Top3.includes(p12MasUrgente)) {
        return 'Falta contestar P12: Elige la preocupación más urgente de las marcadas en P11.';
      }
      if (!p12Justificacion.trim()) {
        return 'Falta contestar P12 (justificación): Explica brevemente por qué es la más urgente.';
      }
      if (!p13ProblemaLocal) {
        return 'Falta contestar P13: Indica si existe algún problema local desatendido.';
      }
      if (p13ProblemaLocal === 'Sí' && !p13Detalle.trim()) {
        return 'En P13 indicaste "Sí": describe brevemente el problema local.';
      }
      if (p14Espacios.length === 0) {
        return 'Falta contestar P14: Selecciona al menos un espacio de conversación.';
      }
      if (!p15Entorno) {
        return 'Falta contestar P15: Selecciona la preocupación predominante entre otras mujeres.';
      }
      if (!p16Contextos) {
        return 'Falta contestar P16: Indica si conoces contextos distintos al tuyo.';
      }
      if (p16Contextos === 'Sí' && !p16Detalle.trim()) {
        return 'En P16 indicaste "Sí": describe qué diferencia o necesidad te llama la atención.';
      }
    }
    if (blockIdx === 3) {
      if (!p17Atencion) {
        return 'Falta contestar P17: Indica si has buscado atención institucional.';
      }
      if (
        p17Atencion === 'Sí' &&
        Object.keys(p18Experiencia).length < P18_INSTITUTIONAL_EXPERIENCE_ITEMS.length
      ) {
        return 'Falta contestar P18: Responde las 3 filas sobre tu experiencia institucional.';
      }
      if (Object.keys(p19Confianza).length < P19_TRUST_INSTITUTIONS.length) {
        return `Falta contestar P19: Evalúa la confianza en las 6 instituciones (${Object.keys(p19Confianza).length}/6 completadas).`;
      }
      if (p20Participacion.length === 0) {
        return 'Falta contestar P20: Selecciona tus actividades de participación.';
      }
      if (!p21Frecuencia) {
        return 'Falta contestar P21: Indica tu frecuencia de participación.';
      }
      if (p22Dificultades.length === 0 || p22Dificultades.length > 3) {
        return 'Falta contestar P22: Selecciona de 1 a 3 dificultades.';
      }
      if (p23Condiciones.length === 0 || p23Condiciones.length > 3) {
        return 'Falta contestar P23: Selecciona de 1 a 3 condiciones habilitadoras.';
      }
      if (Object.keys(p24Incidencia).length < P24_INCIDENCE_ITEMS.length) {
        return `Falta contestar P24: Responde las 4 afirmaciones de incidencia (${Object.keys(p24Incidencia).length}/4 completadas).`;
      }
      if (!p25ViolenciaPol) {
        return 'Falta contestar P25: Selecciona una opción sobre violencia política.';
      }
      if (p25ViolenciaPol !== 'No, nunca' && !p25Detalle.trim()) {
        return 'En P25 describe brevemente el tipo de situación presenciada o vivida.';
      }
    }
    if (blockIdx === 4) {
      if (Object.keys(p26Derechos).length < P26_RIGHTS_ACCESS_ITEMS.length) {
        return `Falta contestar P26: Evalúa los 10 derechos y servicios (${Object.keys(p26Derechos).length}/10 completados).`;
      }
      if (p27Desventaja.length === 0) {
        return 'Falta contestar P27: Selecciona al menos una opción sobre ámbitos de desventaja.';
      }
      if (p28Sexismo.length === 0) {
        return 'Falta contestar P28: Selecciona al menos una opción sobre situaciones de trato desigual.';
      }
      if (Object.keys(p29ImpactoCuidados).length < P29_CARE_IMPACT_ITEMS.length) {
        return `Falta contestar P29: Responde los 5 ítems de impacto de cuidados (${Object.keys(p29ImpactoCuidados).length}/5 completados).`;
      }
      if (!p30AbandonoTemor) {
        return 'Falta contestar P30: Indica si has dejado actividades por temor a tu seguridad.';
      }
      if (Object.keys(p31Autonomia).length < P31_AUTONOMY_ITEMS.length) {
        return `Falta contestar P31: Evalúa los 5 ámbitos de autonomía (${Object.keys(p31Autonomia).length}/5 completados).`;
      }
      if (!p32RutasApoyo) {
        return 'Falta contestar P32: Indica tu conocimiento sobre rutas de apoyo.';
      }
      if (!p33ApoyoConcreto.trim()) {
        return 'Falta contestar P33: Escribe qué apoyo o cambio concreto mejoraría tu vida.';
      }
    }
    if (blockIdx === 5) {
      if (!p34ConoceSomos) {
        return 'Falta contestar P34: Indica si habías oído hablar de "Somos".';
      }
      if (p34ConoceSomos === 'Sí') {
        if (!p35NivelSomos) return 'Falta contestar P35: Indica tu nivel de conocimiento sobre Somos.';
        if (!p36OpinionSomos) return 'Falta contestar P36: Indica tu opinión general sobre Somos.';
        if (p37CercaniaSomos === null)
          return 'Falta contestar P37: Califica del 1 al 5 la cercanía de Somos.';
        if (!p38RecuerdaPropuesta)
          return 'Falta contestar P38: Indica si recuerdas alguna propuesta concreta de Somos.';
        if (p38RecuerdaPropuesta === 'Sí' && !p38Detalle.trim()) {
          return 'En P38 escribe la propuesta o causa de Somos que recuerdas.';
        }
        if (!p39Positivos.trim() && !p39Criticas.trim()) {
          return 'Falta contestar P39: Comparte al menos un aspecto positivo o duda sobre Somos.';
        }
      }
      if (p40Partidos.length === 0) {
        return 'Falta contestar P40: Selecciona o escribe al menos 1 partido político adicional que conozcas.';
      }
      if (!p42Cambio6Meses) {
        return 'Falta contestar P42: Indica si cambió tu opinión en los últimos 6 meses.';
      }
      if (
        (p42Cambio6Meses === 'Mejoró' || p42Cambio6Meses === 'Empeoró') &&
        !p42Motivo.trim()
      ) {
        return 'En P42 escribe brevemente el motivo por el cual cambió tu opinión.';
      }
      if (!p43EscuchaSocial) {
        return 'Falta contestar P43: Indica si has escuchado comentarios sobre partidos en tu entorno.';
      }
      if (p43EscuchaSocial === 'Sí' && !p43Relato.trim()) {
        return 'En P43 escribe brevemente el relato escuchado (sin datos personales).';
      }
    }
    return null;
  };

  const handleNextBlock = () => {
    const err = validateBlock(activeBlockIdx);
    if (err) {
      setValidationError(err);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setValidationError(null);
    setActiveBlockIdx((prev) => Math.min(5, prev + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    for (let b = 0; b <= 5; b++) {
      const err = validateBlock(b);
      if (err) {
        setActiveBlockIdx(b);
        setValidationError(err);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    const isSomosKnown = p34ConoceSomos === 'Sí';

    const newRecord: OrusResponse = {
      id: `campo-${Date.now()}`,
      folio: previewFolio,
      origin: 'REAL',
      createdAt: new Date().toISOString(),
      archetypeTag: 'LEVANTAMIENTO_DIRECTO',
      registroCampo: {
        participanteAlias: participanteAlias.trim(),
        municipioColonia: municipioColonia.trim(),
        modalidad,
        encuestadoraClave: encuestadoraClave.trim() || 'AUTOREGISTRO_WEB',
        consentimientoAceptado,
        notasCampo: notasCampo.trim(),
      },
      p1_edad: p1Edad as AgeRange,
      p2_entidad: p2Entidad,
      p3_localidad: p3Localidad as LocalityType,
      p4_actividades: p4Actividades,
      p5_actividad_principal: p5Principal,
      p6_cuidados: p6Cuidados,
      p7_significado_mujer: p7Significado.trim(),
      p8_orgullo_fortaleza: p8Orgullo.trim(),
      p9_obstaculo_principal: p9Obstaculo.trim(),
      p10_cambio_futuro_jovenes: p10Futuro.trim(),
      p11_preocupaciones_top3: p11Top3,
      p12_mas_urgente: p12MasUrgente,
      p12_justificacion: p12Justificacion.trim(),
      p13_problema_local_desatendido: p13ProblemaLocal as 'Sí' | 'No',
      p13_detalle: p13ProblemaLocal === 'Sí' ? p13Detalle.trim() : '',
      p14_espacios_conversacion: p14Espacios,
      p15_preocupacion_entorno_mujeres: p15Entorno,
      p16_conoce_contextos_distintos: p16Contextos as 'Sí' | 'No',
      p16_detalle: p16Contextos === 'Sí' ? p16Detalle.trim() : '',
      p17_busco_atencion_institucional: p17Atencion as 'Sí' | 'No',
      p18_experiencia_institucional: p17Atencion === 'Sí' ? p18Experiencia : null,
      p19_confianza_institucional: p19Confianza,
      p20_actividades_participacion: p20Participacion,
      p21_frecuencia_participacion:
        p21Frecuencia as OrusResponse['p21_frecuencia_participacion'],
      p22_dificultades_participacion: p22Dificultades,
      p23_condiciones_habilitadoras: p23Condiciones,
      p24_percepcion_incidencia: p24Incidencia,
      p25_violencia_politica: p25ViolenciaPol as OrusResponse['p25_violencia_politica'],
      p25_detalle: p25ViolenciaPol !== 'No, nunca' ? p25Detalle.trim() : '',
      p26_acceso_derechos: p26Derechos,
      p27_ambitos_desventaja: p27Desventaja,
      p28_situaciones_sexismo: p28Sexismo,
      p29_impacto_cuidados: p29ImpactoCuidados,
      p30_abandono_por_temor: p30AbandonoTemor as OrusResponse['p30_abandono_por_temor'],
      p31_autonomia_decisiones: p31Autonomia,
      p32_conocimiento_rutas_apoyo:
        p32RutasApoyo as OrusResponse['p32_conocimiento_rutas_apoyo'],
      p33_apoyo_concreto_cambio: p33ApoyoConcreto.trim(),
      p34_conoce_somos: p34ConoceSomos as OrusResponse['p34_conoce_somos'],
      p35_nivel_conocimiento_somos: isSomosKnown
        ? (p35NivelSomos as NonNullable<OrusResponse['p35_nivel_conocimiento_somos']>)
        : null,
      p36_opinion_somos: isSomosKnown
        ? (p36OpinionSomos as NonNullable<OrusResponse['p36_opinion_somos']>)
        : null,
      p37_cercania_somos: isSomosKnown ? p37CercaniaSomos : null,
      p38_recuerda_propuesta_somos: isSomosKnown
        ? (p38RecuerdaPropuesta as 'Sí' | 'No')
        : null,
      p38_detalle:
        isSomosKnown && p38RecuerdaPropuesta === 'Sí' ? p38Detalle.trim() : '',
      p39_positivos_somos: isSomosKnown ? p39Positivos.trim() : '',
      p39_criticas_somos: isSomosKnown ? p39Criticas.trim() : '',
      p40_otros_partidos: p40Partidos,
      p41_evaluacion_otros_partidos: p40Partidos.map(
        (name) =>
          p41Evaluaciones[name] ?? {
            partido: name,
            opinion: 'Regular',
            cercania: 3,
            conocimientoPropuestas: 'Solo promesas generales',
          }
      ),
      p42_cambio_opinion_6meses:
        p42Cambio6Meses as OrusResponse['p42_cambio_opinion_6meses'],
      p42_motivo:
        p42Cambio6Meses === 'Mejoró' || p42Cambio6Meses === 'Empeoró'
          ? p42Motivo.trim()
          : '',
      p43_escucha_social_partidos: p43EscuchaSocial as 'Sí' | 'No',
      p43_relato: p43EscuchaSocial === 'Sí' ? p43Relato.trim() : '',
    };

    setValidationError(null);
    setSubmittedReceipt(newRecord);
    onSubmitSurvey(newRecord);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ---------------- PANTALLA DE ACUSE / COMPROBANTE AL GUARDAR ENCUESTA ----------------
  if (submittedReceipt) {
    return (
      <div className="space-y-6">
        <section className="ocean-surface rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-[#00FF9D]">
                <CheckCircle2 className="w-4 h-4" />
                ENCUESTA REGISTRADA E INTEGRADA EXITOSAMENTE
              </div>
              <h1 className="text-2xl font-bold text-slate-50">
                Acuse de Captura · Folio{' '}
                <span className="font-mono text-[#00F0FF]">{submittedReceipt.folio}</span>
              </h1>
              <p className="text-xs text-slate-400">
                Tus 43 respuestas ya alimentan las métricas en vivo del Dashboard Táctico y el Explorador de Datos.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleResetBlankForm}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#00FF9D] text-slate-950 hover:bg-[#34FFB2] cursor-pointer whitespace-nowrap"
              >
                <ClipboardList className="w-4 h-4" />
                Realizar Otra Encuesta
              </button>
              <button
                type="button"
                onClick={() => onNavigateModule('DASHBOARD')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#00F0FF] text-slate-950 hover:bg-[#38F5FF] cursor-pointer whitespace-nowrap"
              >
                Ver en Dashboard
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Resumen de los datos capturados */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-[#05070A]/85 border border-slate-800 space-y-1.5">
              <div className="font-mono text-[#00F0FF]">FICHA DE LEVANTAMIENTO</div>
              <p className="text-slate-200">
                <strong>Participante:</strong>{' '}
                {submittedReceipt.registroCampo?.participanteAlias}
              </p>
              <p className="text-slate-300">
                <strong>Ubicación:</strong> {submittedReceipt.p2_entidad} ·{' '}
                {submittedReceipt.registroCampo?.municipioColonia} (
                {submittedReceipt.p3_localidad})
              </p>
              <p className="text-slate-400">
                <strong>Modalidad:</strong> {submittedReceipt.registroCampo?.modalidad}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#05070A]/85 border border-slate-800 space-y-1.5">
              <div className="font-mono text-[#E879F9]">PERFIL Y PRIORIDADES</div>
              <p className="text-slate-200">
                <strong>Edad (P1):</strong> {submittedReceipt.p1_edad} años
              </p>
              <p className="text-slate-300">
                <strong>Urgencia #1 (P12):</strong> {submittedReceipt.p12_mas_urgente}
              </p>
              <p className="text-slate-400">
                <strong>Cambio concreto (P33):</strong>{' '}
                {submittedReceipt.p33_apoyo_concreto_cambio}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#05070A]/85 border border-slate-800 space-y-1.5">
              <div className="font-mono text-[#00FF9D]">BLOQUE F · SOMOS Y PARTIDOS</div>
              <p className="text-slate-200">
                <strong>Conoce Somos (P34):</strong> {submittedReceipt.p34_conoce_somos}
              </p>
              <p className="text-slate-300">
                {submittedReceipt.p34_conoce_somos === 'Sí'
                  ? `Opinión: ${submittedReceipt.p36_opinion_somos} · Cercanía: ${submittedReceipt.p37_cercania_somos}/5`
                  : 'Salto lógico automático aplicado hacia P40'}
              </p>
              <p className="text-slate-400">
                <strong>Partidos evaluados (P40):</strong>{' '}
                {submittedReceipt.p40_otros_partidos.join(', ')}
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  exportDatasetToJSON([submittedReceipt], `${submittedReceipt.folio}.json`)
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#00F0FF]" />
                Descargar Comprobante JSON
              </button>
              <button
                type="button"
                onClick={() =>
                  exportDatasetToCSV([submittedReceipt], `${submittedReceipt.folio}.csv`)
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#00FF9D]" />
                Descargar Comprobante CSV
              </button>
            </div>

            <button
              type="button"
              onClick={() => onNavigateModule('EXPLORER')}
              className="text-xs font-mono text-[#00F0FF] hover:underline cursor-pointer"
            >
              Inspeccionar registro completo en el Explorador →
            </button>
          </div>
        </section>
      </div>
    );
  }

  const showBlock = (idx: number) => viewMode === 'FULL_SHEET' || activeBlockIdx === idx;

  return (
    <form onSubmit={handleFinalSubmit} className="space-y-6">
      {/* Cabecera Principal del Módulo de Encuesta + Progreso Real en Vivo */}
      <section className="ocean-surface rounded-xl p-5 space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
              <span className="text-[#00FF9D]">[LEVANTAMIENTO_ACTIVO]</span>
              <span aria-hidden="true">·</span>
              <span>FOLIO ASIGNADO: {previewFolio}</span>
              <span aria-hidden="true">·</span>
              <span>43 REACTIVOS OFICIALES OCEAN</span>
            </div>
            <h1 className="mt-1 text-2xl font-semibold text-slate-50">
              Realizar Encuesta OCEAN · Captura de Datos y Cuestionario Completo
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Ingresa los datos requeridos de levantamiento y contesta los Bloques A al F. Puedes responder paso a paso o en hoja continua.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Conmutador Paso a Paso vs Hoja Completa */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#05070A] border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('STEPPER')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium cursor-pointer whitespace-nowrap ${
                  viewMode === 'STEPPER'
                    ? 'bg-[#00F0FF]/20 text-[#00F0FF] font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Paso a Paso (Bloques A–F)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('FULL_SHEET')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium cursor-pointer whitespace-nowrap ${
                  viewMode === 'FULL_SHEET'
                    ? 'bg-[#00FF9D]/20 text-[#00FF9D] font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                Hoja Completa (P1–P43)
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetBlankForm}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpiar todo
            </button>

            <button
              type="button"
              onClick={handleFullSyntheticPrefill}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#00F0FF] bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 border border-[#00F0FF]/30 cursor-pointer whitespace-nowrap"
              title="Rellenar automáticamente todos los campos para una prueba rápida"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Llenar Ejemplo
            </button>
          </div>
        </div>

        {/* Barra de Avance Global */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono tabular-nums">
            <span className="text-slate-300">
              Avance de contestación: {progressStats.totalDone} de {progressStats.totalRequired}{' '}
              campos requeridos completados
            </span>
            <span className="text-[#00FF9D] font-bold">{progressStats.pct}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#05070A] border border-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00F0FF] to-[#00FF9D] transition-all duration-200"
              style={{ width: `${progressStats.pct}%` }}
            />
          </div>
        </div>

        {/* Selector de Bloques (visible en Modo Paso a Paso) */}
        {viewMode === 'STEPPER' && (
          <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {ORUS_BLOCKS_META.map((blk, idx) => {
              const isCurrent = idx === activeBlockIdx;
              const stat = progressStats.blockProgress[idx];
              const isComplete = stat.done >= stat.total;
              return (
                <button
                  key={blk.id}
                  type="button"
                  onClick={() => {
                    setValidationError(null);
                    setActiveBlockIdx(idx);
                  }}
                  className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-[#00F0FF]/14 border-[#00F0FF] text-slate-50'
                      : isComplete
                      ? 'bg-[#00FF9D]/10 border-[#00FF9D]/40 text-slate-200'
                      : 'bg-[#05070A]/75 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                    <span
                      className={
                        isCurrent ? 'text-[#00F0FF]' : isComplete ? 'text-[#00FF9D]' : ''
                      }
                    >
                      {blk.code}
                    </span>
                    <span>
                      {stat.done}/{stat.total}
                    </span>
                  </div>
                  <div className="text-xs font-medium mt-1 truncate">{blk.title}</div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Alerta de Validación si falta algún dato requerido */}
      {validationError && (
        <div
          role="alert"
          className="rounded-xl p-4 bg-rose-950/70 border border-rose-500/60 flex items-center justify-between gap-3 text-sm text-rose-100"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{validationError}</span>
          </div>
          <button
            type="button"
            onClick={() => setValidationError(null)}
            className="text-xs font-mono text-rose-300 hover:text-white cursor-pointer shrink-0"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* ==================== FICHA DE REGISTRO Y DATOS REQUERIDOS ==================== */}
      {showBlock(0) && (
        <section className="ocean-surface rounded-xl p-6 space-y-5">
          <div className="pb-3 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#00F0FF]" />
              <h2 className="text-base font-semibold text-slate-100">
                Datos Requeridos de Registro y Control de Levantamiento
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Campos obligatorios marcados con <span className="text-[#00F0FF]">*</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="reg-alias"
                  className="text-xs font-medium text-slate-200"
                >
                  Nombre, Iniciales o Alias <span className="text-[#00F0FF]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setParticipanteAlias(
                      `Participante Anónima #${totalRecordsCount + 1}`
                    )
                  }
                  className="text-[11px] font-mono text-[#00F0FF] hover:underline cursor-pointer"
                >
                  Usar Folio Anónimo
                </button>
              </div>
              <input
                id="reg-alias"
                type="text"
                value={participanteAlias}
                onChange={(e) => setParticipanteAlias(e.target.value)}
                placeholder="Ej. Ana L. / Iniciales"
                className="w-full rounded-lg bg-[#05070A] border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 neon-focus"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reg-municipio"
                className="block text-xs font-medium text-slate-200"
              >
                Municipio / Alcaldía y Colonia <span className="text-[#00F0FF]">*</span>
              </label>
              <input
                id="reg-municipio"
                type="text"
                value={municipioColonia}
                onChange={(e) => setMunicipioColonia(e.target.value)}
                placeholder="Ej. Iztapalapa · San Miguel"
                className="w-full rounded-lg bg-[#05070A] border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 neon-focus"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reg-modalidad"
                className="block text-xs font-medium text-slate-200"
              >
                Modalidad de Aplicación <span className="text-[#00F0FF]">*</span>
              </label>
              <select
                id="reg-modalidad"
                value={modalidad}
                onChange={(e) => setModalidad(e.target.value as SurveyModality)}
                className="w-full rounded-lg bg-[#05070A] border border-slate-700 px-3 py-2 text-sm text-slate-100 neon-focus"
              >
                {MODALITIES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reg-encuestadora"
                className="block text-xs font-medium text-slate-200"
              >
                Clave o Nombre de Encuestadora (Opcional)
              </label>
              <input
                id="reg-encuestadora"
                type="text"
                value={encuestadoraClave}
                onChange={(e) => setEncuestadoraClave(e.target.value)}
                placeholder="Ej. Brigada Norte - 02"
                className="w-full rounded-lg bg-[#05070A] border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 neon-focus"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center pt-2">
            <div className="lg:col-span-7">
              <button
                type="button"
                onClick={() => setConsentimientoAceptado((v) => !v)}
                className={`w-full p-3 rounded-lg border text-left text-xs flex items-center gap-3 cursor-pointer transition-colors ${
                  consentimientoAceptado
                    ? 'bg-[#00FF9D]/14 border-[#00FF9D] text-slate-100'
                    : 'bg-[#05070A] border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 ${
                    consentimientoAceptado ? 'text-[#00FF9D]' : 'text-slate-500'
                  }`}
                />
                <span>
                  <strong>Consentimiento informado requerido (*):</strong> Confirmo que la participación es voluntaria y que las respuestas serán tratadas con fines estadísticos y de análisis social.
                </span>
              </button>
            </div>
            <div className="lg:col-span-5">
              <input
                type="text"
                value={notasCampo}
                onChange={(e) => setNotasCampo(e.target.value)}
                placeholder="Observaciones de campo adicionales (opcional)..."
                className="w-full rounded-lg bg-[#05070A] border border-slate-800 px-3 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 neon-focus"
              />
            </div>
          </div>
        </section>
      )}

      {/* ==================== BLOQUE A (P1 - P6) ==================== */}
      {showBlock(0) && (
        <section className="ocean-surface rounded-xl p-6 space-y-8">
          <div className="pb-4 border-b border-slate-800/80">
            <div className="text-xs font-mono text-[#00F0FF]">BLOQUE A · REACTIVOS P1 – P6</div>
            <h2 className="text-xl font-semibold text-slate-100 mt-0.5">
              Sobre ti y el lugar donde vives
            </h2>
          </div>

          {/* P1 */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-100">
              <span className="font-mono text-[#00F0FF] mr-2">P1.</span>
              ¿En qué rango de edad te encuentras? <span className="text-[#00F0FF]">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {AGE_RANGES.map((age) => (
                <button
                  key={age}
                  type="button"
                  onClick={() => setP1Edad(age)}
                  className={`py-2.5 px-3 rounded-lg border font-mono text-sm transition-colors cursor-pointer ${
                    p1Edad === age
                      ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF] font-semibold'
                      : 'bg-[#05070A]/80 border-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {age} años
                </button>
              ))}
            </div>
          </div>

          {/* P2 y P3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800/70">
            <div className="space-y-2.5">
              <label htmlFor="p2-entidad" className="block text-sm font-medium text-slate-100">
                <span className="font-mono text-[#00F0FF] mr-2">P2.</span>
                ¿En qué entidad federativa vives actualmente?{' '}
                <span className="text-[#00F0FF]">*</span>
              </label>
              <select
                id="p2-entidad"
                value={p2Entidad}
                onChange={(e) => setP2Entidad(e.target.value)}
                className="w-full rounded-lg bg-[#05070A] border border-slate-700 px-3.5 py-2.5 text-sm text-slate-100 neon-focus"
              >
                <option value="">— Selecciona una entidad federativa (32 + Exterior) —</option>
                {MEXICO_ENTITIES.map((ent) => (
                  <option key={ent.code} value={ent.name}>
                    {ent.name} ({ent.region})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2.5">
              <span className="block text-sm font-medium text-slate-100">
                <span className="font-mono text-[#00F0FF] mr-2">P3.</span>
                ¿Cómo describirías el tipo de localidad donde vives?{' '}
                <span className="text-[#00F0FF]">*</span>
              </span>
              <div className="grid grid-cols-3 gap-2.5">
                {LOCALITY_TYPES.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setP3Localidad(loc)}
                    className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                      p3Localidad === loc
                        ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]'
                        : 'bg-[#05070A]/80 border-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* P4 */}
          <div className="space-y-3 pt-4 border-t border-slate-800/70">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-100">
                <span className="font-mono text-[#00F0FF] mr-2">P4.</span>
                Actualmente, ¿a qué actividades dedicas tu tiempo? (Puedes elegir varias){' '}
                <span className="text-[#00F0FF]">*</span>
              </span>
              <span className="text-xs font-mono text-[#00FF9D]">
                {p4Actividades.length} marcadas
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {P4_ACTIVITIES.map((act) => {
                const checked = p4Actividades.includes(act);
                return (
                  <button
                    key={act}
                    type="button"
                    onClick={() => toggleP4Activity(act)}
                    className={`p-3 rounded-lg border text-left text-sm transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                      checked
                        ? 'bg-[#00F0FF]/16 border-[#00F0FF] text-slate-50'
                        : 'bg-[#05070A]/75 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>{act}</span>
                    {checked && <CheckCircle2 className="w-4 h-4 text-[#00F0FF] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* P5 Dinámico */}
          <div className="space-y-2.5 pt-4 border-t border-slate-800/70">
            <label htmlFor="p5-principal" className="block text-sm font-medium text-slate-100">
              <span className="font-mono text-[#00F0FF] mr-2">P5.</span>
              De las actividades marcadas en P4, ¿cuál consideras tu actividad principal hoy?{' '}
              <span className="text-[#00F0FF]">*</span>
            </label>
            <select
              id="p5-principal"
              value={p5Principal}
              onChange={(e) => setP5Principal(e.target.value)}
              disabled={p4Actividades.length === 0}
              className="w-full rounded-lg bg-[#05070A] border border-slate-700 px-3.5 py-2.5 text-sm text-slate-100 disabled:opacity-50 neon-focus"
            >
              <option value="">
                {p4Actividades.length === 0
                  ? '— Marca primero tus actividades en P4 —'
                  : '— Selecciona tu actividad principal —'}
              </option>
              {p5DynamicOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* P6 */}
          <div className="space-y-3 pt-4 border-t border-slate-800/70">
            <span className="block text-sm font-medium text-slate-100">
              <span className="font-mono text-[#00F0FF] mr-2">P6.</span>
              ¿Tienes actualmente responsabilidades directas de cuidado no remunerado hacia otras personas?{' '}
              <span className="text-[#00F0FF]">*</span>
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {P6_CARE_OPTIONS.map((opt) => {
                const checked = p6Cuidados.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleP6Care(opt)}
                    className={`p-3 rounded-lg border text-left text-sm transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                      checked
                        ? 'bg-[#BD00FF]/18 border-[#BD00FF] text-slate-50'
                        : 'bg-[#05070A]/75 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>{opt}</span>
                    {checked && <CheckCircle2 className="w-4 h-4 text-[#E879F9] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ==================== BLOQUE B (P7 - P10) ==================== */}
      {showBlock(1) && (
        <section className="ocean-surface rounded-xl p-6 space-y-6">
          <div className="pb-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-mono text-[#00F0FF]">
                BLOQUE B · REACTIVOS P7 – P10
              </div>
              <h2 className="text-xl font-semibold text-slate-100 mt-0.5">
                Identidad y experiencias de ser mujer
              </h2>
            </div>
            <button
              type="button"
              onClick={handleAutocompleteBlockB}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#BD00FF]/20 text-[#F0ABFC] hover:bg-[#BD00FF]/30 border border-[#BD00FF]/45 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Autocompletar con Perfil Analizado
            </button>
          </div>

          {[
            {
              code: 'P7',
              label:
                'Desde tu experiencia cotidiana, ¿qué significa para ti ser mujer hoy en el lugar donde vives?',
              val: p7Significado,
              setter: setP7Significado,
            },
            {
              code: 'P8',
              label:
                '¿Qué es lo que más valoras o te da mayor orgullo y fortaleza en tu vida diaria como mujer?',
              val: p8Orgullo,
              setter: setP8Orgullo,
            },
            {
              code: 'P9',
              label:
                '¿Cuál sientes que ha sido el obstáculo o reto más difícil que has enfrentado en los últimos años por el hecho de ser mujer?',
              val: p9Obstaculo,
              setter: setP9Obstaculo,
            },
            {
              code: 'P10',
              label:
                'Cuando piensas en las mujeres jóvenes o niñas de tu comunidad, ¿qué te gustaría que fuera distinto para ellas en el futuro cercano?',
              val: p10Futuro,
              setter: setP10Futuro,
            },
          ].map((item) => (
            <div key={item.code} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-medium text-slate-100">
                  <span className="font-mono text-[#00F0FF] mr-2">{item.code}.</span>
                  {item.label} <span className="text-[#00F0FF]">*</span>
                </label>
                <span className="text-xs font-mono tabular-nums text-slate-400 shrink-0">
                  {item.val.length} / 500 car.
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={500}
                value={item.val}
                onChange={(e) => item.setter(e.target.value)}
                placeholder="Escribe aquí tu respuesta con tus propias palabras..."
                className="w-full rounded-lg bg-[#05070A] border border-slate-700 p-3 text-sm text-slate-100 placeholder:text-slate-500 neon-focus"
              />
            </div>
          ))}
        </section>
      )}

      {/* ==================== BLOQUE C (P11 - P16) ==================== */}
      {showBlock(2) && (
        <section className="ocean-surface rounded-xl p-6 space-y-8">
          <div className="pb-4 border-b border-slate-800/80">
            <div className="text-xs font-mono text-[#00F0FF]">BLOQUE C · REACTIVOS P11 – P16</div>
            <h2 className="text-xl font-semibold text-slate-100 mt-0.5">
              Preocupaciones y necesidades
            </h2>
          </div>

          {/* P11 */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-100">
                <span className="font-mono text-[#00F0FF] mr-2">P11.</span>
                Elige hasta 3 principales preocupaciones en tu vida diaria y entorno cercano:{' '}
                <span className="text-[#00F0FF]">*</span>
              </span>
              <span
                className={`text-xs font-mono tabular-nums ${
                  p11Top3.length === 3 ? 'text-[#00FF9D]' : 'text-[#00F0FF]'
                }`}
              >
                [{p11Top3.length} / 3 seleccionadas]
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {P11_CONCERNS_16.map((concern) => {
                const selected = p11Top3.includes(concern);
                const disabled = !selected && p11Top3.length >= 3;
                return (
                  <button
                    key={concern}
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      toggleStrictMax3(concern, p11Top3, setP11Top3, (next) => {
                        if (!next.includes(p12MasUrgente)) {
                          setP12MasUrgente(next[0] ?? '');
                        }
                      })
                    }
                    className={`p-3 rounded-lg border text-left text-sm transition-colors flex items-center justify-between gap-2 ${
                      selected
                        ? 'bg-[#00F0FF]/18 border-[#00F0FF] text-slate-50 cursor-pointer'
                        : disabled
                        ? 'bg-[#05070A]/40 border-slate-900 text-slate-600 cursor-not-allowed'
                        : 'bg-[#05070A]/80 border-slate-800 text-slate-300 hover:border-slate-700 cursor-pointer'
                    }`}
                  >
                    <span>{concern}</span>
                    {selected && <CheckCircle2 className="w-4 h-4 text-[#00F0FF] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* P12 */}
          <div className="space-y-3 pt-4 border-t border-slate-800/70">
            <label htmlFor="p12-urgente" className="block text-sm font-medium text-slate-100">
              <span className="font-mono text-[#00F0FF] mr-2">P12.</span>
              De las preocupaciones marcadas en P11, ¿cuál es la más urgente hoy y por qué?{' '}
              <span className="text-[#00F0FF]">*</span>
            </label>
            <select
              id="p12-urgente"
              value={p12MasUrgente}
              disabled={p11Top3.length === 0}
              onChange={(e) => setP12MasUrgente(e.target.value)}
              className="w-full rounded-lg bg-[#05070A] border border-slate-700 px-3.5 py-2.5 text-sm text-slate-100 disabled:opacity-50 neon-focus"
            >
              <option value="">
                {p11Top3.length === 0
                  ? '— Elige primero tus preocupaciones en P11 —'
                  : '— Selecciona la preocupación más urgente —'}
              </option>
              {p11Top3.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={p12Justificacion}
              onChange={(e) => setP12Justificacion(e.target.value)}
              placeholder="Escribe por qué esta preocupación es la más urgente para ti..."
              className="w-full rounded-lg bg-[#05070A] border border-slate-700 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 neon-focus"
            />
          </div>

          {/* P13 */}
          <div className="space-y-3 pt-4 border-t border-slate-800/70">
            <span className="block text-sm font-medium text-slate-100">
              <span className="font-mono text-[#00F0FF] mr-2">P13.</span>
              ¿Existe algún problema en tu colonia, barrio o comunidad que sientas que nadie está atendiendo?{' '}
              <span className="text-[#00F0FF]">*</span>
            </span>
            <div className="flex gap-3">
              {(['Sí', 'No'] as const).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setP13ProblemaLocal(val)}
                  className={`px-5 py-2 rounded-lg border text-sm font-medium cursor-pointer ${
                    p13ProblemaLocal === val
                      ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]'
                      : 'bg-[#05070A] border-slate-800 text-slate-300'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
            {p13ProblemaLocal === 'Sí' && (
              <input
                type="text"
                value={p13Detalle}
                onChange={(e) => setP13Detalle(e.target.value)}
                placeholder="Describe cuál es ese problema local poco atendido..."
                className="w-full rounded-lg bg-[#05070A] border border-[#00F0FF]/45 px-3.5 py-2.5 text-sm text-slate-100 neon-focus"
              />
            )}
          </div>

          {/* P14 */}
          <div className="space-y-3 pt-4 border-t border-slate-800/70">
            <span className="block text-sm font-medium text-slate-100">
              <span className="font-mono text-[#00F0FF] mr-2">P14.</span>
              ¿En qué espacios sueles conversar sobre estos problemas o necesidades?{' '}
              <span className="text-[#00F0FF]">*</span>
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {P14_CONVERSATION_SPACES.map((sp) => {
                const checked = p14Espacios.includes(sp);
                return (
                  <button
                    key={sp}
                    type="button"
                    onClick={() =>
                      toggleMultiWithExclusiveLast(
                        sp,
                        P14_CONVERSATION_SPACES[6],
                        setP14Espacios
                      )
                    }
                    className={`p-3 rounded-lg border text-left text-sm flex items-center justify-between gap-2 cursor-pointer ${
                      checked
                        ? 'bg-[#00F0FF]/16 border-[#00F0FF] text-slate-50'
                        : 'bg-[#05070A]/80 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span>{sp}</span>
                    {checked && <CheckCircle2 className="w-4 h-4 text-[#00F0FF] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* P15 y P16 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800/70">
            <div className="space-y-2.5">
              <label htmlFor="p15-entorno" className="block text-sm font-medium text-slate-100">
                <span className="font-mono text-[#00F0FF] mr-2">P15.</span>
                Entre otras mujeres de tu entorno, ¿cuál percibes que es la preocupación predominante?{' '}
                <span className="text-[#00F0FF]">*</span>
              </label>
              <select
                id="p15-entorno"
                value={p15Entorno}
                onChange={(e) => setP15Entorno(e.target.value)}
                className="w-full rounded-lg bg-[#05070A] border border-slate-700 px-3.5 py-2.5 text-sm text-slate-100 neon-focus"
              >
                <option value="">— Selecciona una categoría —</option>
                {P11_CONCERNS_16.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2.5">
              <span className="block text-sm font-medium text-slate-100">
                <span className="font-mono text-[#00F0FF] mr-2">P16.</span>
                ¿Conoces de cerca la realidad de mujeres en un contexto muy distinto al tuyo?{' '}
                <span className="text-[#00F0FF]">*</span>
              </span>
              <div className="flex gap-3">
                {(['Sí', 'No'] as const).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setP16Contextos(val)}
                    className={`px-5 py-2 rounded-lg border text-sm font-medium cursor-pointer ${
                      p16Contextos === val
                        ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]'
                        : 'bg-[#05070A] border-slate-800 text-slate-300'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              {p16Contextos === 'Sí' && (
                <input
                  type="text"
                  value={p16Detalle}
                  onChange={(e) => setP16Detalle(e.target.value)}
                  placeholder="¿Qué necesidad o diferencia te llama más la atención?"
                  className="w-full rounded-lg bg-[#05070A] border border-[#00F0FF]/45 px-3.5 py-2.5 text-sm text-slate-100 neon-focus"
                />
              )}
            </div>
          </div>
        </section>
      )}

      {/* ==================== BLOQUE D (P17 - P25) ==================== */}
      {showBlock(3) && (
        <section className="ocean-surface rounded-xl p-6 space-y-8">
          <div className="pb-4 border-b border-slate-800/80">
            <div className="text-xs font-mono text-[#00F0FF]">BLOQUE D · REACTIVOS P17 – P25</div>
            <h2 className="text-xl font-semibold text-slate-100 mt-0.5">
              Instituciones y participación pública
            </h2>
          </div>

          {/* P17 */}
          <div className="space-y-3">
            <span className="block text-sm font-medium text-slate-100">
              <span className="font-mono text-[#00F0FF] mr-2">P17.</span>
              En los últimos dos años, ¿has acudido o buscado atención en alguna institución pública o autoridad?{' '}
              <span className="text-[#00F0FF]">*</span>
            </span>
            <div className="flex flex-wrap items-center gap-3">
              {(['Sí', 'No'] as const).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setP17Atencion(val)}
                  className={`px-5 py-2 rounded-lg border text-sm font-medium cursor-pointer ${
                    p17Atencion === val
                      ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]'
                      : 'bg-[#05070A] border-slate-800 text-slate-300'
                  }`}
                >
                  {val}
                </button>
              ))}
              {p17Atencion === 'No' && (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#00FF9D]">
                  <GitBranch className="w-3.5 h-3.5" />
                  Salto condicional aplicado: se omite P18 y pasa directo a P19.
                </span>
              )}
            </div>
          </div>

          {/* P18 Matriz 3x6 */}
          {p17Atencion === 'Sí' && (
            <div className="space-y-3 pt-4 border-t border-slate-800/70">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-100">
                  <span className="font-mono text-[#00F0FF] mr-2">P18.</span>
                  Pensando en esa atención institucional, ¿qué tan de acuerdo estás? (3×6){' '}
                  <span className="text-[#00F0FF]">*</span>
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {Object.keys(p18Experiencia).length}/3 respondidas
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[760px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400">
                      <th className="py-2 pr-3 w-1/3">Afirmación</th>
                      {LIKERT_AGREEMENT_6.map((col) => (
                        <th key={col} className="py-2 px-1.5 text-center">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {P18_INSTITUTIONAL_EXPERIENCE_ITEMS.map((rowItem) => (
                      <tr key={rowItem}>
                        <td className="py-3 pr-3 text-slate-200">{rowItem}</td>
                        {LIKERT_AGREEMENT_6.map((col) => {
                          const active = p18Experiencia[rowItem] === col;
                          return (
                            <td key={col} className="py-2 px-1 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  setP18Experiencia((prev) => ({ ...prev, [rowItem]: col }))
                                }
                                className={`w-full py-2 px-1.5 rounded border text-[11px] cursor-pointer transition-colors ${
                                  active
                                    ? 'bg-[#00F0FF]/22 border-[#00F0FF] text-[#00F0FF] font-semibold'
                                    : 'bg-[#05070A] border-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {active ? '✓ Elegida' : 'Elegir'}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* P19 Matriz 6x5 */}
          <div className="space-y-3 pt-4 border-t border-slate-800/70">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-100">
                <span className="font-mono text-[#00F0FF] mr-2">P19.</span>
                ¿Cuánta confianza tienes actualmente en estas instituciones y actores? (6×5){' '}
                <span className="text-[#00F0FF]">*</span>
              </span>
              <span className="text-xs font-mono text-slate-400">
                {Object.keys(p19Confianza).length}/6 respondidas
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[720px]">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400">
                    <th className="py-2 pr-3 w-1/3">Institución / Actor</th>
                    {INSTITUTIONAL_TRUST_5.map((col) => (
                      <th key={col} className="py-2 px-1.5 text-center">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {P19_TRUST_INSTITUTIONS.map((inst) => (
                    <tr key={inst}>
                      <td className="py-3 pr-3 text-slate-200">{inst}</td>
                      {INSTITUTIONAL_TRUST_5.map((col) => {
                        const active = p19Confianza[inst] === col;
                        return (
                          <td key={col} className="py-2 px-1 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                setP19Confianza((prev) => ({ ...prev, [inst]: col }))
                              }
                              className={`w-full py-2 px-1.5 rounded border text-[11px] cursor-pointer transition-colors ${
                                active
                                  ? 'bg-[#00F0FF]/22 border-[#00F0FF] text-[#00F0FF] font-semibold'
                                  : 'bg-[#05070A] border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {active ? '✓ Elegida' : 'Elegir'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* P20 y P21 */}
          <div className="space-y-4 pt-4 border-t border-slate-800/70">
            <span className="block text-sm font-medium text-slate-100">
              <span className="font-mono text-[#00F0FF] mr-2">P20.</span>
              ¿En cuáles actividades públicas o comunitarias has participado?{' '}
              <span className="text-[#00F0FF]">*</span>
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {P20_PARTICIPATION_ACTIVITIES.map((act) => {
                const checked = p20Participacion.includes(act);
                return (
                  <button
                    key={act}
                    type="button"
                    onClick={() =>
                      toggleMultiWithExclusiveLast(
                        act,
                        P20_PARTICIPATION_ACTIVITIES[7],
                        setP20Participacion
                      )
                    }
                    className={`p-3 rounded-lg border text-left text-sm flex items-center justify-between gap-2 cursor-pointer ${
                      checked
                        ? 'bg-[#00F0FF]/16 border-[#00F0FF] text-slate-50'
                        : 'bg-[#05070A]/80 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span>{act}</span>
                    {checked && <CheckCircle2 className="w-4 h-4 text-[#00F0FF] shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 space-y-2.5">
              <span className="block text-sm font-medium text-slate-100">
                <span className="font-mono text-[#00F0FF] mr-2">P21.</span>
                ¿Con qué frecuencia participas en asuntos públicos o comunitarios más allá de votar?{' '}
                <span className="text-[#00F0FF]">*</span>
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {P21_FREQUENCY_OPTIONS.map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setP21Frecuencia(freq)}
                    className={`py-2.5 px-3 rounded-lg border text-sm font-medium cursor-pointer ${
                      p21Frecuencia === freq
                        ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]'
                        : 'bg-[#05070A] border-slate-800 text-slate-300'
                    }`}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* P22 y P23 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-800/70">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-100">
                  <span className="font-mono text-[#00F0FF] mr-2">P22.</span>
                  Principales dificultades para participar (Máx. 3){' '}
                  <span className="text-[#00F0FF]">*</span>
                </span>
                <span className="text-xs font-mono text-[#00FF9D]">
                  [{p22Dificultades.length}/3]
                </span>
              </div>
              <div className="space-y-2">
                {P22_PARTICIPATION_BARRIERS.map((bar) => {
                  const sel = p22Dificultades.includes(bar);
                  const dis = !sel && p22Dificultades.length >= 3;
                  return (
                    <button
                      key={bar}
                      type="button"
                      disabled={dis}
                      onClick={() => toggleStrictMax3(bar, p22Dificultades, setP22Dificultades)}
                      className={`w-full p-2.5 rounded-lg border text-left text-xs flex items-center justify-between gap-2 ${
                        sel
                          ? 'bg-[#BD00FF]/20 border-[#BD00FF] text-slate-100 cursor-pointer'
                          : dis
                          ? 'bg-[#05070A]/40 border-slate-900 text-slate-600 cursor-not-allowed'
                          : 'bg-[#05070A] border-slate-800 text-slate-300 cursor-pointer'
                      }`}
                    >
                      <span>{bar}</span>
                      {sel && <CheckCircle2 className="w-3.5 h-3.5 text-[#E879F9] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-100">
                  <span className="font-mono text-[#00F0FF] mr-2">P23.</span>
                  Condiciones que facilitarían participar (Máx. 3){' '}
                  <span className="text-[#00F0FF]">*</span>
                </span>
                <span className="text-xs font-mono text-[#00FF9D]">
                  [{p23Condiciones.length}/3]
                </span>
              </div>
              <div className="space-y-2">
                {P23_ENABLING_CONDITIONS.map((cond) => {
                  const sel = p23Condiciones.includes(cond);
                  const dis = !sel && p23Condiciones.length >= 3;
                  return (
                    <button
                      key={cond}
                      type="button"
                      disabled={dis}
                      onClick={() => toggleStrictMax3(cond, p23Condiciones, setP23Condiciones)}
                      className={`w-full p-2.5 rounded-lg border text-left text-xs flex items-center justify-between gap-2 ${
                        sel
                          ? 'bg-[#00FF9D]/18 border-[#00FF9D] text-slate-100 cursor-pointer'
                          : dis
                          ? 'bg-[#05070A]/40 border-slate-900 text-slate-600 cursor-not-allowed'
                          : 'bg-[#05070A] border-slate-800 text-slate-300 cursor-pointer'
                      }`}
                    >
                      <span>{cond}</span>
                      {sel && <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF9D] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* P24 Matriz 4x6 */}
          <div className="space-y-3 pt-4 border-t border-slate-800/70">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-100">
                <span className="font-mono text-[#00F0FF] mr-2">P24.</span>
                Percepción sobre participación de las mujeres en la vida pública (4×6){' '}
                <span className="text-[#00F0FF]">*</span>
              </span>
              <span className="text-xs font-mono text-slate-400">
                {Object.keys(p24Incidencia).length}/4 respondidas
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400">
                    <th className="py-2 pr-3 w-1/3">Afirmación</th>
                    {LIKERT_AGREEMENT_6.map((col) => (
                      <th key={col} className="py-2 px-1.5 text-center">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {P24_INCIDENCE_ITEMS.map((item) => (
                    <tr key={item}>
                      <td className="py-3 pr-3 text-slate-200">{item}</td>
                      {LIKERT_AGREEMENT_6.map((col) => {
                        const active = p24Incidencia[item] === col;
                        return (
                          <td key={col} className="py-2 px-1 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                setP24Incidencia((prev) => ({ ...prev, [item]: col }))
                              }
                              className={`w-full py-2 px-1.5 rounded border text-[11px] cursor-pointer ${
                                active
                                  ? 'bg-[#00F0FF]/22 border-[#00F0FF] text-[#00F0FF] font-semibold'
                                  : 'bg-[#05070A] border-slate-800 text-slate-400'
                              }`}
                            >
                              {active ? '✓ Elegida' : 'Elegir'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* P25 */}
          <div className="space-y-3 pt-4 border-t border-slate-800/70">
            <span className="block text-sm font-medium text-slate-100">
              <span className="font-mono text-[#00F0FF] mr-2">P25.</span>
              ¿Has vivido o presenciado situaciones de burla, exclusión o violencia política contra las mujeres?{' '}
              <span className="text-[#00F0FF]">*</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {P25_POLITICAL_VIOLENCE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setP25ViolenciaPol(opt)}
                  className={`p-3 rounded-lg border text-left text-sm cursor-pointer ${
                    p25ViolenciaPol === opt
                      ? 'bg-[#BD00FF]/20 border-[#BD00FF] text-slate-50 font-medium'
                      : 'bg-[#05070A] border-slate-800 text-slate-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {p25ViolenciaPol !== '' && p25ViolenciaPol !== 'No, nunca' && (
              <input
                type="text"
                value={p25Detalle}
                onChange={(e) => setP25Detalle(e.target.value)}
                placeholder="Describe brevemente el tipo de situación (sin incluir nombres personales)..."
                className="w-full rounded-lg bg-[#05070A] border border-[#BD00FF]/45 px-3.5 py-2.5 text-sm text-slate-100 neon-focus"
              />
            )}
          </div>
        </section>
      )}

      {/* ==================== BLOQUE E (P26 - P33) ==================== */}
      {showBlock(4) && (
        <section className="ocean-surface rounded-xl p-6 space-y-8">
          <div className="pb-4 border-b border-slate-800/80">
            <div className="text-xs font-mono text-[#00F0FF]">BLOQUE E · REACTIVOS P26 – P33</div>
            <h2 className="text-xl font-semibold text-slate-100 mt-0.5">
              Tú como mujer: oportunidades y dificultades
            </h2>
          </div>

          {/* P26 Matriz 10x6 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-100">
                <span className="font-mono text-[#00F0FF] mr-2">P26.</span>
                ¿Qué tan fácil o difícil es acceder a estos derechos y servicios donde vives? (10×6){' '}
                <span className="text-[#00F0FF]">*</span>
              </span>
              <span className="text-xs font-mono text-slate-400">
                {Object.keys(p26Derechos).length}/10 respondidos
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[780px]">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400">
                    <th className="py-2 pr-3 w-1/3">Derecho / Servicio</th>
                    {ACCESS_DIFFICULTY_6.map((col) => (
                      <th key={col} className="py-2 px-1.5 text-center">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {P26_RIGHTS_ACCESS_ITEMS.map((item) => (
                    <tr key={item}>
                      <td className="py-2.5 pr-3 text-slate-200">{item}</td>
                      {ACCESS_DIFFICULTY_6.map((col) => {
                        const active = p26Derechos[item] === col;
                        return (
                          <td key={col} className="py-1.5 px-1 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                setP26Derechos((prev) => ({ ...prev, [item]: col }))
                              }
                              className={`w-full py-1.5 px-1.5 rounded border text-[11px] cursor-pointer ${
                                active
                                  ? 'bg-[#00F0FF]/22 border-[#00F0FF] text-[#00F0FF] font-semibold'
                                  : 'bg-[#05070A] border-slate-800 text-slate-400'
                              }`}
                            >
                              {active ? '✓ Elegida' : 'Elegir'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* P27 y P28 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-800/70">
            <div className="space-y-2.5">
              <span className="block text-sm font-medium text-slate-100">
                <span className="font-mono text-[#00F0FF] mr-2">P27.</span>
                Ámbitos de mayor desventaja frente a los hombres:{' '}
                <span className="text-[#00F0FF]">*</span>
              </span>
              <div className="space-y-2">
                {P27_DISADVANTAGE_DOMAINS.map((dom) => {
                  const checked = p27Desventaja.includes(dom);
                  return (
                    <button
                      key={dom}
                      type="button"
                      onClick={() =>
                        toggleMultiWithExclusiveLast(
                          dom,
                          P27_DISADVANTAGE_DOMAINS[7],
                          setP27Desventaja
                        )
                      }
                      className={`w-full p-2.5 rounded-lg border text-left text-xs flex items-center justify-between gap-2 cursor-pointer ${
                        checked
                          ? 'bg-[#BD00FF]/20 border-[#BD00FF] text-slate-100'
                          : 'bg-[#05070A] border-slate-800 text-slate-300'
                      }`}
                    >
                      <span>{dom}</span>
                      {checked && <CheckCircle2 className="w-3.5 h-3.5 text-[#E879F9] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5">
              <span className="block text-sm font-medium text-slate-100">
                <span className="font-mono text-[#00F0FF] mr-2">P28.</span>
                Situaciones de trato desigual o sexismo en el último año:{' '}
                <span className="text-[#00F0FF]">*</span>
              </span>
              <div className="space-y-2">
                {P28_SEXISM_SITUATIONS.map((sit) => {
                  const checked = p28Sexismo.includes(sit);
                  return (
                    <button
                      key={sit}
                      type="button"
                      onClick={() =>
                        toggleMultiWithExclusiveLast(
                          sit,
                          P28_SEXISM_SITUATIONS[7],
                          setP28Sexismo
                        )
                      }
                      className={`w-full p-2.5 rounded-lg border text-left text-xs flex items-center justify-between gap-2 cursor-pointer ${
                        checked
                          ? 'bg-[#BD00FF]/20 border-[#BD00FF] text-slate-100'
                          : 'bg-[#05070A] border-slate-800 text-slate-300'
                      }`}
                    >
                      <span>{sit}</span>
                      {checked && <CheckCircle2 className="w-3.5 h-3.5 text-[#E879F9] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* P29 Matriz 5x7 */}
          <div className="space-y-3 pt-4 border-t border-slate-800/70">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-100">
                <span className="font-mono text-[#00F0FF] mr-2">P29.</span>
                Impacto de las tareas del hogar y cuidados en tu vida (5×7){' '}
                <span className="text-[#00F0FF]">*</span>
              </span>
              <span className="text-xs font-mono text-slate-400">
                {Object.keys(p29ImpactoCuidados).length}/5 respondidos
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400">
                    <th className="py-2 pr-3 w-1/3">Impacto vital / laboral</th>
                    {CARE_IMPACT_FREQUENCY_7.map((col) => (
                      <th key={col} className="py-2 px-1.5 text-center">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {P29_CARE_IMPACT_ITEMS.map((item) => (
                    <tr key={item}>
                      <td className="py-2.5 pr-3 text-slate-200">{item}</td>
                      {CARE_IMPACT_FREQUENCY_7.map((col) => {
                        const active = p29ImpactoCuidados[item] === col;
                        return (
                          <td key={col} className="py-1.5 px-1 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                setP29ImpactoCuidados((prev) => ({ ...prev, [item]: col }))
                              }
                              className={`w-full py-1.5 px-1.5 rounded border text-[11px] cursor-pointer ${
                                active
                                  ? 'bg-[#BD00FF]/25 border-[#BD00FF] text-[#F0ABFC] font-semibold'
                                  : 'bg-[#05070A] border-slate-800 text-slate-400'
                              }`}
                            >
                              {active ? '✓ Elegida' : 'Elegir'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* P30 y P32 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800/70">
            <div className="space-y-2.5">
              <span className="block text-sm font-medium text-slate-100">
                <span className="font-mono text-[#00F0FF] mr-2">P30.</span>
                ¿Has dejado de hacer alguna actividad cotidiana por temor a tu seguridad?{' '}
                <span className="text-[#00F0FF]">*</span>
              </span>
              <div className="space-y-2">
                {P30_FEAR_ABANDONMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setP30AbandonoTemor(opt)}
                    className={`w-full p-2.5 rounded-lg border text-left text-sm cursor-pointer ${
                      p30AbandonoTemor === opt
                        ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]'
                        : 'bg-[#05070A] border-slate-800 text-slate-300'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <span className="block text-sm font-medium text-slate-100">
                <span className="font-mono text-[#00F0FF] mr-2">P32.</span>
                Ante violencia o abuso, ¿conoces a qué institución o red acudir?{' '}
                <span className="text-[#00F0FF]">*</span>
              </span>
              <div className="space-y-2">
                {P32_SUPPORT_ROUTES_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setP32RutasApoyo(opt)}
                    className={`w-full p-2.5 rounded-lg border text-left text-sm cursor-pointer ${
                      p32RutasApoyo === opt
                        ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]'
                        : 'bg-[#05070A] border-slate-800 text-slate-300'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* P31 Matriz 5x7 */}
          <div className="space-y-3 pt-4 border-t border-slate-800/70">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-100">
                <span className="font-mono text-[#00F0FF] mr-2">P31.</span>
                Autonomía y libertad para tomar decisiones en tu vida (5×7){' '}
                <span className="text-[#00F0FF]">*</span>
              </span>
              <span className="text-xs font-mono text-slate-400">
                {Object.keys(p31Autonomia).length}/5 respondidos
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400">
                    <th className="py-2 pr-3 w-1/3">Ámbito de decisión</th>
                    {AUTONOMY_LEVEL_7.map((col) => (
                      <th key={col} className="py-2 px-1.5 text-center">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {P31_AUTONOMY_ITEMS.map((item) => (
                    <tr key={item}>
                      <td className="py-2.5 pr-3 text-slate-200">{item}</td>
                      {AUTONOMY_LEVEL_7.map((col) => {
                        const active = p31Autonomia[item] === col;
                        return (
                          <td key={col} className="py-1.5 px-1 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                setP31Autonomia((prev) => ({ ...prev, [item]: col }))
                              }
                              className={`w-full py-1.5 px-1.5 rounded border text-[11px] cursor-pointer ${
                                active
                                  ? 'bg-[#00FF9D]/20 border-[#00FF9D] text-[#00FF9D] font-semibold'
                                  : 'bg-[#05070A] border-slate-800 text-slate-400'
                              }`}
                            >
                              {active ? '✓ Elegida' : 'Elegir'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* P33 */}
          <div className="space-y-2 pt-4 border-t border-slate-800/70">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-100">
                <span className="font-mono text-[#00F0FF] mr-2">P33.</span>
                Si hoy pudiera implementarse un apoyo o cambio concreto que mejorara tu vida diaria como mujer, ¿cuál sería?{' '}
                <span className="text-[#00F0FF]">*</span>
              </label>
              <span className="text-xs font-mono text-slate-400">
                {p33ApoyoConcreto.length}/400
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={400}
              value={p33ApoyoConcreto}
              onChange={(e) => setP33ApoyoConcreto(e.target.value)}
              placeholder="Escribe el apoyo o cambio concreto que consideres más valioso..."
              className="w-full rounded-lg bg-[#05070A] border border-slate-700 p-3 text-sm text-slate-100 neon-focus"
            />
          </div>
        </section>
      )}

      {/* ==================== BLOQUE F (P34 - P43) ==================== */}
      {showBlock(5) && (
        <section className="ocean-surface rounded-xl p-6 space-y-8">
          <div className="pb-4 border-b border-slate-800/80">
            <div className="text-xs font-mono text-[#00F0FF]">BLOQUE F · REACTIVOS P34 – P43</div>
            <h2 className="text-xl font-semibold text-slate-100 mt-0.5">
              Percepción de Somos y otros partidos
            </h2>
          </div>

          {/* P34 con Lógica de Salto Crítica */}
          <div className="space-y-3">
            <span className="block text-sm font-medium text-slate-100">
              <span className="font-mono text-[#00F0FF] mr-2">P34.</span>
              ¿Habías oído hablar anteriormente de &ldquo;Somos&rdquo; como organización o proyecto político?{' '}
              <span className="text-[#00F0FF]">*</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {P34_SOMOS_AWARENESS_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setP34ConoceSomos(opt)}
                  className={`py-3 px-4 rounded-lg border text-sm font-semibold transition-colors cursor-pointer ${
                    p34ConoceSomos === opt
                      ? 'bg-[#00FF9D]/20 border-[#00FF9D] text-[#00FF9D]'
                      : 'bg-[#05070A] border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {p34ConoceSomos !== '' && p34ConoceSomos !== 'Sí' && (
              <div className="mt-3 p-4 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/35 flex items-center gap-3 text-xs font-mono text-[#00F0FF]">
                <GitBranch className="w-4 h-4 shrink-0" />
                <span>
                  SALTO LÓGICO AUTOMÁTICO [P34 = &ldquo;{p34ConoceSomos}&rdquo; → P40]: Se omiten P35 a P39 y avanzas directo a P40.
                </span>
              </div>
            )}
          </div>

          {/* P35 a P39 si P34 === 'Sí' */}
          {p34ConoceSomos === 'Sí' && (
            <div className="space-y-6 pt-4 border-t border-slate-800/70">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <span className="block text-sm font-medium text-slate-100">
                    <span className="font-mono text-[#00FF9D] mr-2">P35.</span>
                    ¿Qué tanto conoces sobre quiénes integran &ldquo;Somos&rdquo; y qué propone?{' '}
                    <span className="text-[#00FF9D]">*</span>
                  </span>
                  <div className="space-y-2">
                    {P35_SOMOS_KNOWLEDGE_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setP35NivelSomos(opt)}
                        className={`w-full p-2.5 rounded-lg border text-left text-xs cursor-pointer ${
                          p35NivelSomos === opt
                            ? 'bg-[#00FF9D]/18 border-[#00FF9D] text-[#00FF9D] font-semibold'
                            : 'bg-[#05070A] border-slate-800 text-slate-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <span className="block text-sm font-medium text-slate-100">
                    <span className="font-mono text-[#00FF9D] mr-2">P36.</span>
                    En general, ¿qué opinión tienes hoy sobre &ldquo;Somos&rdquo;?{' '}
                    <span className="text-[#00FF9D]">*</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {P36_SOMOS_OPINION_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setP36OpinionSomos(opt)}
                        className={`p-2.5 rounded-lg border text-left text-xs cursor-pointer ${
                          p36OpinionSomos === opt
                            ? 'bg-[#00FF9D]/18 border-[#00FF9D] text-[#00FF9D] font-semibold'
                            : 'bg-[#05070A] border-slate-800 text-slate-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* P37 */}
              <div className="space-y-2.5">
                <span className="block text-sm font-medium text-slate-100">
                  <span className="font-mono text-[#00FF9D] mr-2">P37.</span>
                  Del 1 al 5 (1 = Nada cercano, 5 = Muy cercano), ¿qué tan cercano sientes a &ldquo;Somos&rdquo; a mujeres como tú?{' '}
                  <span className="text-[#00FF9D]">*</span>
                </span>
                <div className="grid grid-cols-5 gap-3 max-w-lg">
                  {([1, 2, 3, 4, 5] as const).map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setP37CercaniaSomos(score)}
                      className={`py-3 rounded-lg border font-mono text-base font-bold cursor-pointer ${
                        p37CercaniaSomos === score
                          ? 'bg-[#00FF9D]/22 border-[#00FF9D] text-[#00FF9D]'
                          : 'bg-[#05070A] border-slate-800 text-slate-400'
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>

              {/* P38 */}
              <div className="space-y-2.5">
                <span className="block text-sm font-medium text-slate-100">
                  <span className="font-mono text-[#00FF9D] mr-2">P38.</span>
                  ¿Recuerdas o identificas alguna propuesta o postura concreta de &ldquo;Somos&rdquo;?{' '}
                  <span className="text-[#00FF9D]">*</span>
                </span>
                <div className="flex gap-3">
                  {(['Sí', 'No'] as const).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setP38RecuerdaPropuesta(val)}
                      className={`px-5 py-2 rounded-lg border text-sm font-medium cursor-pointer ${
                        p38RecuerdaPropuesta === val
                          ? 'bg-[#00FF9D]/18 border-[#00FF9D] text-[#00FF9D]'
                          : 'bg-[#05070A] border-slate-800 text-slate-300'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                {p38RecuerdaPropuesta === 'Sí' && (
                  <input
                    type="text"
                    value={p38Detalle}
                    onChange={(e) => setP38Detalle(e.target.value)}
                    placeholder="Escribe la propuesta o causa de Somos que recuerdas..."
                    className="w-full rounded-lg bg-[#05070A] border border-[#00FF9D]/45 px-3.5 py-2.5 text-sm text-slate-100 neon-focus"
                  />
                )}
              </div>

              {/* P39 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-100">
                    <span className="font-mono text-[#00FF9D] mr-2">P39a.</span>
                    Aspectos positivos que ves en &ldquo;Somos&rdquo;:{' '}
                    <span className="text-[#00FF9D]">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={p39Positivos}
                    onChange={(e) => setP39Positivos(e.target.value)}
                    placeholder="Escribe qué aspectos positivos identificas..."
                    className="w-full rounded-lg bg-[#05070A] border border-slate-700 p-2.5 text-sm text-slate-100 neon-focus"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-100">
                    <span className="font-mono text-[#00FF9D] mr-2">P39b.</span>
                    Dudas, reservas o críticas sobre &ldquo;Somos&rdquo;:
                  </label>
                  <textarea
                    rows={2}
                    value={p39Criticas}
                    onChange={(e) => setP39Criticas(e.target.value)}
                    placeholder="Escribe qué dudas o críticas te genera..."
                    className="w-full rounded-lg bg-[#05070A] border border-slate-700 p-2.5 text-sm text-slate-100 neon-focus"
                  />
                </div>
              </div>
            </div>
          )}

          {/* P40 */}
          <div className="space-y-3 pt-4 border-t border-slate-800/70">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-100">
                <span className="font-mono text-[#00F0FF] mr-2">P40.</span>
                Selecciona o escribe hasta 3 partidos políticos adicionales que conozcas:{' '}
                <span className="text-[#00F0FF]">*</span>
              </span>
              <span className="text-xs font-mono text-[#00F0FF]">
                [{p40Partidos.length} / 3 partidos]
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {SUGGESTED_PARTIES_MEXICO.map((sug) => {
                const added = p40Partidos.includes(sug);
                return (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => (added ? removePartyFromP40(sug) : addPartyToP40(sug))}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                      added
                        ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]'
                        : 'bg-[#05070A] border-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {added ? `✓ ${sug}` : `+ ${sug}`}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                value={partyDraftInput}
                onChange={(e) => setPartyDraftInput(e.target.value)}
                placeholder="O escribe otro partido político..."
                className="flex-1 rounded-lg bg-[#05070A] border border-slate-700 px-3 py-2 text-sm text-slate-100 neon-focus"
              />
              <button
                type="button"
                onClick={() => addPartyToP40(partyDraftInput)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-100 hover:bg-slate-700 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar
              </button>
            </div>
          </div>

          {/* P41 */}
          <div className="space-y-3 pt-4 border-t border-slate-800/70">
            <span className="block text-sm font-medium text-slate-100">
              <span className="font-mono text-[#00F0FF] mr-2">P41.</span>
              Evalúa cada partido seleccionado en P40:
            </span>
            {p40Partidos.length === 0 ? (
              <p className="text-xs font-mono text-slate-400 py-2">
                Selecciona al menos un partido en P40 para activar esta tabla de evaluación.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[680px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-mono text-slate-400">
                      <th className="py-2 pr-3">Partido</th>
                      <th className="py-2 px-2">Opinión general</th>
                      <th className="py-2 px-2">Cercanía (1–5)</th>
                      <th className="py-2 px-2">Conocimiento de propuestas</th>
                      <th className="py-2 pl-2 text-right">Quitar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm">
                    {p40Partidos.map((partyName) => {
                      const row = p41Evaluaciones[partyName] ?? {
                        partido: partyName,
                        opinion: 'Regular' as PartyOpinion5,
                        cercania: 3 as const,
                        conocimientoPropuestas: 'Solo promesas generales' as PartyProposalsKnowledge,
                      };
                      return (
                        <tr key={partyName}>
                          <td className="py-3 pr-3 font-semibold text-slate-100">{partyName}</td>
                          <td className="py-2 px-2">
                            <select
                              value={row.opinion}
                              onChange={(e) =>
                                updateP41Field(
                                  partyName,
                                  'opinion',
                                  e.target.value as PartyOpinion5
                                )
                              }
                              className="rounded bg-[#05070A] border border-slate-700 px-2.5 py-1.5 text-xs text-slate-100"
                            >
                              {PARTY_OPINION_5.map((op) => (
                                <option key={op} value={op}>
                                  {op}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-2">
                            <div className="flex gap-1">
                              {([1, 2, 3, 4, 5] as const).map((n) => (
                                <button
                                  key={n}
                                  type="button"
                                  onClick={() => updateP41Field(partyName, 'cercania', n)}
                                  className={`w-7 h-7 rounded border font-mono text-xs cursor-pointer ${
                                    row.cercania === n
                                      ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF] font-bold'
                                      : 'bg-[#05070A] border-slate-800 text-slate-400'
                                  }`}
                                >
                                  {n}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="py-2 px-2">
                            <select
                              value={row.conocimientoPropuestas}
                              onChange={(e) =>
                                updateP41Field(
                                  partyName,
                                  'conocimientoPropuestas',
                                  e.target.value as PartyProposalsKnowledge
                                )
                              }
                              className="rounded bg-[#05070A] border border-slate-700 px-2.5 py-1.5 text-xs text-slate-100"
                            >
                              {PARTY_PROPOSALS_KNOWLEDGE.map((pk) => (
                                <option key={pk} value={pk}>
                                  {pk}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 pl-2 text-right">
                            <button
                              type="button"
                              onClick={() => removePartyFromP40(partyName)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* P42 y P43 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800/70">
            <div className="space-y-2.5">
              <span className="block text-sm font-medium text-slate-100">
                <span className="font-mono text-[#00F0FF] mr-2">P42.</span>
                En los últimos 6 meses, ¿ha cambiado tu opinión sobre &ldquo;Somos&rdquo;?{' '}
                <span className="text-[#00F0FF]">*</span>
              </span>
              <div className="grid grid-cols-2 gap-2">
                {P42_OPINION_CHANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setP42Cambio6Meses(opt)}
                    className={`p-2.5 rounded-lg border text-xs font-medium cursor-pointer ${
                      p42Cambio6Meses === opt
                        ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]'
                        : 'bg-[#05070A] border-slate-800 text-slate-300'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {(p42Cambio6Meses === 'Mejoró' || p42Cambio6Meses === 'Empeoró') && (
                <input
                  type="text"
                  value={p42Motivo}
                  onChange={(e) => setP42Motivo(e.target.value)}
                  placeholder="¿A qué se debió ese cambio de opinión?"
                  className="w-full rounded-lg bg-[#05070A] border border-[#00F0FF]/45 px-3 py-2 text-sm text-slate-100 neon-focus"
                />
              )}
            </div>

            <div className="space-y-2.5">
              <span className="block text-sm font-medium text-slate-100">
                <span className="font-mono text-[#00F0FF] mr-2">P43.</span>
                ¿Has escuchado comentarios recientes en tu entorno sobre partidos y las mujeres?{' '}
                <span className="text-[#00F0FF]">*</span>
              </span>
              <div className="flex gap-3">
                {(['Sí', 'No'] as const).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setP43EscuchaSocial(val)}
                    className={`px-5 py-2 rounded-lg border text-sm font-medium cursor-pointer ${
                      p43EscuchaSocial === val
                        ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]'
                        : 'bg-[#05070A] border-slate-800 text-slate-300'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              {p43EscuchaSocial === 'Sí' && (
                <textarea
                  rows={2}
                  value={p43Relato}
                  onChange={(e) => setP43Relato(e.target.value)}
                  placeholder="Escribe el relato escuchado (sin nombres ni datos personales)..."
                  className="w-full rounded-lg bg-[#05070A] border border-[#00F0FF]/45 p-2.5 text-sm text-slate-100 neon-focus"
                />
              )}
            </div>
          </div>
        </section>
      )}

      {/* Barra Inferior de Navegación y Envío */}
      <section className="ocean-surface rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        {viewMode === 'STEPPER' ? (
          <>
            <button
              type="button"
              disabled={activeBlockIdx === 0}
              onClick={() => {
                setValidationError(null);
                setActiveBlockIdx((prev) => Math.max(0, prev - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap shrink-0 ${
                activeBlockIdx === 0
                  ? 'border-slate-900 text-slate-600 cursor-not-allowed'
                  : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Bloque Anterior
            </button>

            <div className="text-xs font-mono text-slate-400">
              Bloque {activeBlockIdx + 1} de 6 · Avance global {progressStats.pct}%
            </div>

            {activeBlockIdx < 5 ? (
              <button
                type="button"
                onClick={handleNextBlock}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#00F0FF] text-slate-950 hover:bg-[#38F5FF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Guardar y Continuar ({ORUS_BLOCKS_META[activeBlockIdx + 1].code})
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-[#00FF9D] text-slate-950 hover:bg-[#34FFB2] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Finalizar y Registrar Encuesta ({previewFolio})
              </button>
            )}
          </>
        ) : (
          <>
            <div className="text-xs font-mono text-slate-300">
              Modo Hoja Completa · {progressStats.totalDone}/{progressStats.totalRequired}{' '}
              campos requeridos listos ({progressStats.pct}%)
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-[#00FF9D] text-slate-950 hover:bg-[#34FFB2] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Finalizar y Registrar Encuesta Completa ({previewFolio})
            </button>
          </>
        )}
      </section>
    </form>
  );
};
