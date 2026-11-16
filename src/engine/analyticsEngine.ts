import {
  MEXICO_ENTITIES,
  P19_TRUST_INSTITUTIONS,
  P29_CARE_IMPACT_ITEMS,
  P6_CARE_OPTIONS,
} from '../data/orusCatalogs';
import { MexicoEntityMeta, OrusResponse } from '../types/orus';

export interface DashboardKPIs {
  totalCount: number;
  realCount: number;
  syntheticCount: number;
  partyDisaffectionPct: number; // % Ninguna + Poca confianza en Partidos políticos (P19)
  oscTrustPct: number; // % Algo + Mucha confianza en OSC
  somosRecognitionPct: number; // % P34 === 'Sí'
  somosAvgCloseness: number; // Promedio P37 (1..5)
  directCareLoadPct: number; // % con cuidados directos en P6
  topConcerns: Array<{ label: string; count: number; pct: number }>;
}

export interface StateTelemetryRow {
  meta: MexicoEntityMeta;
  count: number;
  somosRecognitionPct: number;
  careLoadPct: number;
  disaffectionPct: number;
  topConcern: string;
}

export interface TrustDistributionRow {
  institution: string;
  shortName: string;
  ninguna: number;
  poca: number;
  algo: number;
  mucha: number;
  noSabe: number;
}

export interface CareImpactRow {
  item: string;
  shortLabel: string;
  highImpactPct: number; // Algunas veces + Frecuentemente + Siempre
  frequentOrAlwaysPct: number; // Frecuentemente + Siempre
}

export interface PartyComparisonRow {
  party: string;
  isSomos: boolean;
  mentions: number;
  positiveOpinionPct: number; // Muy buena + Buena
  avgCloseness: number; // 1..5
  clearProposalsPct: number;
}

export interface SemanticKeyword {
  term: string;
  count: number;
  weight: number; // 0..1
  category: 'SEGURIDAD' | 'CUIDADOS' | 'ECONOMÍA' | 'SALUD' | 'POLÍTICA';
}

export interface NarrativeCluster {
  id: string;
  title: string;
  description: string;
  count: number;
  pct: number;
  accent: 'cyan' | 'magenta' | 'emerald';
  sampleQuotes: Array<{ folio: string; entidad: string; edad: string; text: string; field: string }>;
}

export function computeDashboardKPIs(records: OrusResponse[]): DashboardKPIs {
  const totalCount = records.length;
  if (totalCount === 0) {
    return {
      totalCount: 0,
      realCount: 0,
      syntheticCount: 0,
      partyDisaffectionPct: 0,
      oscTrustPct: 0,
      somosRecognitionPct: 0,
      somosAvgCloseness: 0,
      directCareLoadPct: 0,
      topConcerns: [],
    };
  }

  let realCount = 0;
  let partyLowTrust = 0;
  let oscHighTrust = 0;
  let somosYes = 0;
  let somosClosenessSum = 0;
  let somosClosenessN = 0;
  let careDirect = 0;
  const concernMap = new Map<string, number>();

  const noCareLabel = P6_CARE_OPTIONS[5];

  for (const r of records) {
    if (r.origin === 'REAL') realCount++;

    const partyTrust = r.p19_confianza_institucional['Partidos políticos'];
    if (partyTrust === 'Ninguna confianza' || partyTrust === 'Poca confianza') {
      partyLowTrust++;
    }

    const oscTrust =
      r.p19_confianza_institucional[
        'Organizaciones de la sociedad civil y colectivos ciudadanos'
      ];
    if (oscTrust === 'Algo de confianza' || oscTrust === 'Mucha confianza') {
      oscHighTrust++;
    }

    if (r.p34_conoce_somos === 'Sí') {
      somosYes++;
      if (r.p37_cercania_somos !== null) {
        somosClosenessSum += r.p37_cercania_somos;
        somosClosenessN++;
      }
    }

    if (r.p6_cuidados.length > 0 && !r.p6_cuidados.includes(noCareLabel)) {
      careDirect++;
    }

    for (const c of r.p11_preocupaciones_top3) {
      concernMap.set(c, (concernMap.get(c) ?? 0) + 1);
    }
  }

  const topConcerns = Array.from(concernMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, count]) => ({
      label,
      count,
      pct: Math.round((count / totalCount) * 1000) / 10,
    }));

  return {
    totalCount,
    realCount,
    syntheticCount: totalCount - realCount,
    partyDisaffectionPct: Math.round((partyLowTrust / totalCount) * 1000) / 10,
    oscTrustPct: Math.round((oscHighTrust / totalCount) * 1000) / 10,
    somosRecognitionPct: Math.round((somosYes / totalCount) * 1000) / 10,
    somosAvgCloseness:
      somosClosenessN > 0 ? Math.round((somosClosenessSum / somosClosenessN) * 100) / 100 : 0,
    directCareLoadPct: Math.round((careDirect / totalCount) * 1000) / 10,
    topConcerns,
  };
}

export function computeStateTelemetry(records: OrusResponse[]): StateTelemetryRow[] {
  const noCareLabel = P6_CARE_OPTIONS[5];
  const grouped = new Map<string, OrusResponse[]>();
  for (const r of records) {
    const arr = grouped.get(r.p2_entidad) ?? [];
    arr.push(r);
    grouped.set(r.p2_entidad, arr);
  }

  return MEXICO_ENTITIES.map((meta) => {
    const list = grouped.get(meta.name) ?? [];
    const n = list.length;
    if (n === 0) {
      return {
        meta,
        count: 0,
        somosRecognitionPct: 0,
        careLoadPct: 0,
        disaffectionPct: 0,
        topConcern: 'Sin registros en filtro',
      };
    }

    let somosYes = 0;
    let careN = 0;
    let disaffN = 0;
    const cMap = new Map<string, number>();

    for (const r of list) {
      if (r.p34_conoce_somos === 'Sí') somosYes++;
      if (!r.p6_cuidados.includes(noCareLabel)) careN++;
      const pt = r.p19_confianza_institucional['Partidos políticos'];
      if (pt === 'Ninguna confianza' || pt === 'Poca confianza') disaffN++;
      for (const c of r.p11_preocupaciones_top3) {
        cMap.set(c, (cMap.get(c) ?? 0) + 1);
      }
    }

    let topConcern = 'Seguridad pública y violencia en mi entorno';
    let best = -1;
    for (const [c, cnt] of cMap.entries()) {
      if (cnt > best) {
        best = cnt;
        topConcern = c;
      }
    }

    return {
      meta,
      count: n,
      somosRecognitionPct: Math.round((somosYes / n) * 100),
      careLoadPct: Math.round((careN / n) * 100),
      disaffectionPct: Math.round((disaffN / n) * 100),
      topConcern,
    };
  });
}

export function computeTrustDistribution(records: OrusResponse[]): TrustDistributionRow[] {
  const shortLabels: Record<string, string> = {
    'Gobierno estatal': 'Gobierno Estatal',
    'Gobierno municipal / Alcaldía': 'Gobierno Municipal',
    'Congreso / Diputadas y diputados': 'Congreso Legislativo',
    'Autoridades electorales (INE / Institutos locales)': 'Autoridades Electorales (INE)',
    'Partidos políticos': 'Partidos Políticos',
    'Organizaciones de la sociedad civil y colectivos ciudadanos': 'Sociedad Civil (OSC)',
  };

  const n = records.length || 1;
  return P19_TRUST_INSTITUTIONS.map((inst) => {
    let ninguna = 0;
    let poca = 0;
    let algo = 0;
    let mucha = 0;
    let noSabe = 0;

    for (const r of records) {
      const val = r.p19_confianza_institucional[inst];
      if (val === 'Ninguna confianza') ninguna++;
      else if (val === 'Poca confianza') poca++;
      else if (val === 'Algo de confianza') algo++;
      else if (val === 'Mucha confianza') mucha++;
      else noSabe++;
    }

    return {
      institution: inst,
      shortName: shortLabels[inst] ?? inst,
      ninguna: Math.round((ninguna / n) * 1000) / 10,
      poca: Math.round((poca / n) * 1000) / 10,
      algo: Math.round((algo / n) * 1000) / 10,
      mucha: Math.round((mucha / n) * 1000) / 10,
      noSabe: Math.round((noSabe / n) * 1000) / 10,
    };
  });
}

export function computeCareAnalysis(records: OrusResponse[]): {
  careBreakdown: Array<{ label: string; pct: number; count: number }>;
  impactRows: CareImpactRow[];
} {
  const n = records.length || 1;
  const careBreakdown = P6_CARE_OPTIONS.map((opt) => {
    const count = records.filter((r) => r.p6_cuidados.includes(opt)).length;
    return {
      label: opt,
      count,
      pct: Math.round((count / n) * 1000) / 10,
    };
  });

  const shortMap: Record<string, string> = {
    'Dejar o rechazar un trabajo remunerado o turno laboral': 'Rechazar o dejar empleo remunerado',
    'Posponer o abandonar estudios o capacitación': 'Posponer estudios o capacitación',
    'Descuidar mi propia salud física o acudir tarde al médico': 'Descuidar salud física propia',
    'Sentir agotamiento constante, estrés o sobrecarga emocional': 'Agotamiento y sobrecarga emocional',
    'Dejar de asistir a reuniones sociales, comunitarias o políticas': 'Abandonar participación pública/social',
  };

  const impactRows: CareImpactRow[] = P29_CARE_IMPACT_ITEMS.map((item) => {
    let high = 0;
    let freqAlways = 0;
    for (const r of records) {
      const v = r.p29_impacto_cuidados[item];
      if (v === 'Algunas veces' || v === 'Frecuentemente' || v === 'Siempre') high++;
      if (v === 'Frecuentemente' || v === 'Siempre') freqAlways++;
    }
    return {
      item,
      shortLabel: shortMap[item] ?? item,
      highImpactPct: Math.round((high / n) * 1000) / 10,
      frequentOrAlwaysPct: Math.round((freqAlways / n) * 1000) / 10,
    };
  });

  return { careBreakdown, impactRows };
}

export function computePartyComparison(records: OrusResponse[]): PartyComparisonRow[] {
  // 1. Somos (a partir de P34 === 'Sí', P36, P37, P38)
  const somosKnown = records.filter((r) => r.p34_conoce_somos === 'Sí');
  const somosN = somosKnown.length;
  const somosPos = somosKnown.filter(
    (r) => r.p36_opinion_somos === 'Muy buena' || r.p36_opinion_somos === 'Buena'
  ).length;
  const somosCloseVals = somosKnown
    .map((r) => r.p37_cercania_somos)
    .filter((v): v is 1 | 2 | 3 | 4 | 5 => v !== null);
  const somosAvgClose =
    somosCloseVals.length > 0
      ? Math.round(
          (somosCloseVals.reduce((a, b) => a + b, 0) / somosCloseVals.length) * 100
        ) / 100
      : 0;
  const somosPropYes = somosKnown.filter((r) => r.p38_recuerda_propuesta_somos === 'Sí').length;

  const somosRow: PartyComparisonRow = {
    party: 'Somos',
    isSomos: true,
    mentions: somosN,
    positiveOpinionPct: somosN > 0 ? Math.round((somosPos / somosN) * 1000) / 10 : 0,
    avgCloseness: somosAvgClose,
    clearProposalsPct: somosN > 0 ? Math.round((somosPropYes / somosN) * 1000) / 10 : 0,
  };

  // 2. Otros partidos desde P41
  const otherMap = new Map<
    string,
    { n: number; pos: number; closeSum: number; propClear: number }
  >();

  for (const r of records) {
    for (const ev of r.p41_evaluacion_otros_partidos) {
      const key = ev.partido.trim();
      if (!key) continue;
      const cur = otherMap.get(key) ?? { n: 0, pos: 0, closeSum: 0, propClear: 0 };
      cur.n++;
      if (ev.opinion === 'Muy buena' || ev.opinion === 'Buena') cur.pos++;
      cur.closeSum += ev.cercania;
      if (ev.conocimientoPropuestas === 'Sí conozco propuestas claras') cur.propClear++;
      otherMap.set(key, cur);
    }
  }

  const otherRows: PartyComparisonRow[] = Array.from(otherMap.entries())
    .sort((a, b) => b[1].n - a[1].n)
    .slice(0, 6)
    .map(([party, stats]) => ({
      party,
      isSomos: false,
      mentions: stats.n,
      positiveOpinionPct: Math.round((stats.pos / stats.n) * 1000) / 10,
      avgCloseness: Math.round((stats.closeSum / stats.n) * 100) / 100,
      clearProposalsPct: Math.round((stats.propClear / stats.n) * 1000) / 10,
    }));

  return [somosRow, ...otherRows];
}

const KEYWORD_LEXICON: Array<{
  term: string;
  patterns: string[];
  category: SemanticKeyword['category'];
}> = [
  { term: 'Guarderías y Cuidados', patterns: ['guarder', 'estancia', 'cuidad', 'doble jornada'], category: 'CUIDADOS' },
  { term: 'Transporte Seguro', patterns: ['transporte', 'camión', 'ruta', 'caminar', 'noche'], category: 'SEGURIDAD' },
  { term: 'Violencia y Acoso', patterns: ['violencia', 'acoso', 'miedo', 'inseguridad', 'peligro'], category: 'SEGURIDAD' },
  { term: 'Salario e Ingreso Digno', patterns: ['salario', 'sueldo', 'ingreso', 'empleo', 'pagad'], category: 'ECONOMÍA' },
  { term: 'Salud y Medicamentos', patterns: ['salud', 'medicament', 'medicina', 'clínica', 'médic'], category: 'SALUD' },
  { term: 'Autonomía Económica', patterns: ['autonomía', 'negocio', 'crédito', 'independencia', 'emprend'], category: 'ECONOMÍA' },
  { term: 'Desconfianza Partidista', patterns: ['partido', 'campaña', 'voto', 'promesa', 'clientelar'], category: 'POLÍTICA' },
  { term: 'Escucha Ciudadana', patterns: ['escucha', 'cercanía', 'propuesta', 'comunidad', 'alternativa'], category: 'POLÍTICA' },
  { term: 'Agua y Servicios Básicos', patterns: ['agua', 'alumbrado', 'servicios', 'pipa'], category: 'SALUD' },
  { term: 'Agotamiento Emocional', patterns: ['agotamiento', 'cansancio', 'estrés', 'salud mental'], category: 'CUIDADOS' },
  { term: 'Justicia sin Impunidad', patterns: ['justicia', 'denuncia', 'impunidad', 'castigo'], category: 'SEGURIDAD' },
  { term: 'Redes entre Mujeres', patterns: ['vecinas', 'amigas', 'solidaridad', 'organiza', 'hermanas'], category: 'POLÍTICA' },
];

export function analyzeOpenEndedNarratives(records: OrusResponse[]): {
  keywords: SemanticKeyword[];
  clusters: NarrativeCluster[];
} {
  const n = records.length || 1;

  const kwCounts = KEYWORD_LEXICON.map((entry) => ({ ...entry, count: 0 }));

  const clusterDefs: Array<{
    id: string;
    title: string;
    description: string;
    accent: NarrativeCluster['accent'];
    matchers: string[];
    fieldSelector: (r: OrusResponse) => { text: string; field: string };
    matched: OrusResponse[];
  }> = [
    {
      id: 'care-economy',
      title: 'Sobrecarga de Cuidados y Penalización Laboral',
      description:
        'Mujeres que vinculan la ausencia de guarderías, escuelas de tiempo completo y estancias con abandono laboral y agotamiento crónico.',
      accent: 'magenta',
      matchers: ['guarder', 'estancia', 'cuidad', 'jornada', 'cansancio', 'agotamiento', 'hijos'],
      fieldSelector: (r) => ({ text: r.p33_apoyo_concreto_cambio || r.p9_obstaculo_principal, field: 'P33 / P9' }),
      matched: [],
    },
    {
      id: 'mobility-security',
      title: 'Movilidad Cotidiana bajo Alerta e Impunidad Local',
      description:
        'Relatos sobre temor en traslados nocturnos, transporte público inseguro, acoso callejero y ministerios públicos ineficaces.',
      accent: 'cyan',
      matchers: ['transporte', 'acoso', 'miedo', 'alumbrado', 'noche', 'segur', 'denuncia'],
      fieldSelector: (r) => ({ text: r.p9_obstaculo_principal || r.p10_cambio_futuro_jovenes, field: 'P9 / P10' }),
      matched: [],
    },
    {
      id: 'health-livelihood',
      title: 'Precarización Económica y Desabasto en Salud Pública',
      description:
        'Demandas urgentes de clínicas con medicamentos, agua potable continua, créditos accesibles y salarios sin brecha de género.',
      accent: 'emerald',
      matchers: ['medicament', 'clínica', 'salud', 'crédito', 'salario', 'agua', 'ingreso'],
      fieldSelector: (r) => ({ text: r.p33_apoyo_concreto_cambio || r.p7_significado_mujer, field: 'P33 / P7' }),
      matched: [],
    },
    {
      id: 'political-listening',
      title: 'Hartazgo Partidista y Demanda de Escucha Territorial Real',
      description:
        'Crítica al clientelismo electoral en P39/P43 frente a la expectativa de que proyectos como "Somos" mantengan congruencia local.',
      accent: 'cyan',
      matchers: ['partido', 'campaña', 'voto', 'escucha', 'alternativa', 'congruencia', 'apoyos'],
      fieldSelector: (r) => ({
        text: r.p43_relato || r.p39_positivos_somos || r.p39_criticas_somos || r.p7_significado_mujer,
        field: 'P39 / P43',
      }),
      matched: [],
    },
  ];

  for (const r of records) {
    const corpus = [
      r.p7_significado_mujer,
      r.p8_orgullo_fortaleza,
      r.p9_obstaculo_principal,
      r.p10_cambio_futuro_jovenes,
      r.p33_apoyo_concreto_cambio,
      r.p39_positivos_somos,
      r.p39_criticas_somos,
      r.p43_relato,
    ]
      .join(' ')
      .toLowerCase();

    for (const kw of kwCounts) {
      if (kw.patterns.some((p) => corpus.includes(p))) {
        kw.count++;
      }
    }

    for (const cl of clusterDefs) {
      if (cl.matchers.some((m) => corpus.includes(m))) {
        cl.matched.push(r);
      }
    }
  }

  const maxKw = Math.max(1, ...kwCounts.map((k) => k.count));
  const keywords: SemanticKeyword[] = kwCounts
    .sort((a, b) => b.count - a.count)
    .map((k) => ({
      term: k.term,
      count: k.count,
      weight: Math.round((k.count / maxKw) * 100) / 100,
      category: k.category,
    }));

  const clusters: NarrativeCluster[] = clusterDefs.map((cl) => ({
    id: cl.id,
    title: cl.title,
    description: cl.description,
    count: cl.matched.length,
    pct: Math.round((cl.matched.length / n) * 1000) / 10,
    accent: cl.accent,
    sampleQuotes: cl.matched.slice(0, 3).map((r) => {
      const sel = cl.fieldSelector(r);
      return {
        folio: r.folio,
        entidad: r.p2_entidad,
        edad: r.p1_edad,
        text: sel.text,
        field: sel.field,
      };
    }),
  }));

  return { keywords, clusters };
}

function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = typeof val === 'string' ? val : JSON.stringify(val);
  return `"${str.replace(/"/g, '""')}"`;
}

export function exportDatasetToJSON(records: OrusResponse[], filename = 'ocean_dataset.json') {
  const blob = new Blob([JSON.stringify(records, null, 2)], {
    type: 'application/json;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportDatasetToCSV(records: OrusResponse[], filename = 'ocean_43_items.csv') {
  const headers = [
    'FOLIO',
    'ORIGEN',
    'FECHA_CAPTURA',
    'PARTICIPANTE_ALIAS',
    'MUNICIPIO_COLONIA',
    'MODALIDAD_LEVANTAMIENTO',
    'CLAVE_ENCUESTADORA',
    'ARQUETIPO',
    'P1_EDAD',
    'P2_ENTIDAD',
    'P3_LOCALIDAD',
    'P4_ACTIVIDADES',
    'P5_ACTIVIDAD_PRINCIPAL',
    'P6_CUIDADOS',
    'P7_SIGNIFICADO_MUJER',
    'P8_ORGULLO_FORTALEZA',
    'P9_OBSTACULO_PRINCIPAL',
    'P10_CAMBIO_FUTURO_JOVENES',
    'P11_PREOCUPACIONES_TOP3',
    'P12_MAS_URGENTE',
    'P12_JUSTIFICACION',
    'P13_PROBLEMA_LOCAL',
    'P13_DETALLE',
    'P14_ESPACIOS_CONVERSACION',
    'P15_PREOCUPACION_ENTORNO',
    'P16_CONTEXTOS_DISTINTOS',
    'P16_DETALLE',
    'P17_ATENCION_INSTITUCIONAL',
    'P18_EXPERIENCIA_MATRIZ_JSON',
    'P19_CONFIANZA_PARTIDOS',
    'P19_CONFIANZA_OSC',
    'P19_CONFIANZA_COMPLETA_JSON',
    'P20_ACTIVIDADES_PARTICIPACION',
    'P21_FRECUENCIA_PARTICIPACION',
    'P22_DIFICULTADES_TOP3',
    'P23_CONDICIONES_HABILITADORAS_TOP3',
    'P24_INCIDENCIA_MATRIZ_JSON',
    'P25_VIOLENCIA_POLITICA',
    'P25_DETALLE',
    'P26_ACCESO_DERECHOS_JSON',
    'P27_AMBITOS_DESVENTAJA',
    'P28_SITUACIONES_SEXISMO',
    'P29_IMPACTO_CUIDADOS_JSON',
    'P30_ABANDONO_POR_TEMOR',
    'P31_AUTONOMIA_DECISIONES_JSON',
    'P32_CONOCIMIENTO_RUTAS_APOYO',
    'P33_APOYO_CONCRETO_CAMBIO',
    'P34_CONOCE_SOMOS',
    'P35_NIVEL_CONOCIMIENTO_SOMOS',
    'P36_OPINION_SOMOS',
    'P37_CERCANIA_SOMOS_1_5',
    'P38_RECUERDA_PROPUESTA_SOMOS',
    'P38_DETALLE_PROPUESTA',
    'P39_POSITIVOS_SOMOS',
    'P39_CRITICAS_SOMOS',
    'P40_OTROS_PARTIDOS',
    'P41_EVALUACION_PARTIDOS_JSON',
    'P42_CAMBIO_OPINION_6M',
    'P42_MOTIVO',
    'P43_ESCUCHA_SOCIAL_PARTIDOS',
    'P43_RELATO',
  ];

  const rows = records.map((r) =>
    [
      r.folio,
      r.origin,
      r.createdAt,
      r.registroCampo?.participanteAlias ?? 'Anónima',
      r.registroCampo?.municipioColonia ?? '',
      r.registroCampo?.modalidad ?? (r.origin === 'REAL' ? 'Entrevista presencial en campo' : 'Encuesta analizada'),
      r.registroCampo?.encuestadoraClave ?? '',
      r.archetypeTag ?? 'CAMPO_DIRECTO',
      r.p1_edad,
      r.p2_entidad,
      r.p3_localidad,
      r.p4_actividades.join(' | '),
      r.p5_actividad_principal,
      r.p6_cuidados.join(' | '),
      r.p7_significado_mujer,
      r.p8_orgullo_fortaleza,
      r.p9_obstaculo_principal,
      r.p10_cambio_futuro_jovenes,
      r.p11_preocupaciones_top3.join(' | '),
      r.p12_mas_urgente,
      r.p12_justificacion,
      r.p13_problema_local_desatendido,
      r.p13_detalle,
      r.p14_espacios_conversacion.join(' | '),
      r.p15_preocupacion_entorno_mujeres,
      r.p16_conoce_contextos_distintos,
      r.p16_detalle,
      r.p17_busco_atencion_institucional,
      r.p18_experiencia_institucional,
      r.p19_confianza_institucional['Partidos políticos'],
      r.p19_confianza_institucional['Organizaciones de la sociedad civil y colectivos ciudadanos'],
      r.p19_confianza_institucional,
      r.p20_actividades_participacion.join(' | '),
      r.p21_frecuencia_participacion,
      r.p22_dificultades_participacion.join(' | '),
      r.p23_condiciones_habilitadoras.join(' | '),
      r.p24_percepcion_incidencia,
      r.p25_violencia_politica,
      r.p25_detalle,
      r.p26_acceso_derechos,
      r.p27_ambitos_desventaja.join(' | '),
      r.p28_situaciones_sexismo.join(' | '),
      r.p29_impacto_cuidados,
      r.p30_abandono_por_temor,
      r.p31_autonomia_decisiones,
      r.p32_conocimiento_rutas_apoyo,
      r.p33_apoyo_concreto_cambio,
      r.p34_conoce_somos,
      r.p35_nivel_conocimiento_somos ?? 'SALTO_LOGICO_P34',
      r.p36_opinion_somos ?? 'SALTO_LOGICO_P34',
      r.p37_cercania_somos ?? '',
      r.p38_recuerda_propuesta_somos ?? 'SALTO_LOGICO_P34',
      r.p38_detalle,
      r.p39_positivos_somos,
      r.p39_criticas_somos,
      r.p40_otros_partidos.join(' | '),
      r.p41_evaluacion_otros_partidos,
      r.p42_cambio_opinion_6meses,
      r.p42_motivo,
      r.p43_escucha_social_partidos,
      r.p43_relato,
    ]
      .map(escapeCsvCell)
      .join(',')
  );

  // BOM UTF-8 para lectura directa en Excel, R, SPSS y Python
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
