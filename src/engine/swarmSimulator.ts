import {
  ACCESS_DIFFICULTY_6,
  AGE_RANGES,
  AUTONOMY_LEVEL_7,
  CARE_IMPACT_FREQUENCY_7,
  INSTITUTIONAL_TRUST_5,
  LIKERT_AGREEMENT_6,
  MEXICO_ENTITIES,
  P11_CONCERNS_16,
  P14_CONVERSATION_SPACES,
  P18_INSTITUTIONAL_EXPERIENCE_ITEMS,
  P19_TRUST_INSTITUTIONS,
  P20_PARTICIPATION_ACTIVITIES,
  P22_PARTICIPATION_BARRIERS,
  P23_ENABLING_CONDITIONS,
  P24_INCIDENCE_ITEMS,
  P26_RIGHTS_ACCESS_ITEMS,
  P27_DISADVANTAGE_DOMAINS,
  P28_SEXISM_SITUATIONS,
  P29_CARE_IMPACT_ITEMS,
  P31_AUTONOMY_ITEMS,
  P4_ACTIVITIES,
  P5_FALLBACK_OPTION,
  P6_CARE_OPTIONS,
  SUGGESTED_PARTIES_MEXICO,
} from '../data/orusCatalogs';
import {
  AccessDifficulty6,
  AgeRange,
  AutonomyLevel7,
  CareImpactFrequency7,
  GeoBiasOption,
  InstitutionalTrust5,
  LikertAgreement6,
  LocalityType,
  OrusResponse,
  OtherPartyEvaluation,
  PartyOpinion5,
  PartyProposalsKnowledge,
  SimulationConfig,
  SocioCareArchetype,
  SomosPositioningScenario,
} from '../types/orus';

type RngFn = () => number;

function createSeededRng(seed: number): RngFn {
  let a = seed >>> 0;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted<T>(items: readonly T[], weights: number[], rng: RngFn): T {
  const total = weights.reduce((acc, w) => acc + w, 0);
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function pickUniqueSubset<T>(
  items: readonly T[],
  weights: number[],
  count: number,
  rng: RngFn
): T[] {
  const pool = items.map((item, idx) => ({ item, weight: weights[idx] ?? 1 }));
  const result: T[] = [];
  const target = Math.min(count, pool.length);
  for (let k = 0; k < target; k++) {
    const total = pool.reduce((s, p) => s + p.weight, 0);
    let r = rng() * total;
    let chosenIdx = pool.length - 1;
    for (let i = 0; i < pool.length; i++) {
      r -= pool[i].weight;
      if (r <= 0) {
        chosenIdx = i;
        break;
      }
    }
    result.push(pool[chosenIdx].item);
    pool.splice(chosenIdx, 1);
  }
  return result;
}

const P7_TEMPLATES: Record<SocioCareArchetype, string[]> = {
  MIXTO_NACIONAL: [
    'Significa sostener a mi familia con esfuerzo diario, buscando salir adelante pese a la inseguridad y los precios altos.',
    'Es combinar trabajo, hogar y comunidad con resiliencia, aunque todavía enfrentamos desigualdad en sueldos y trato.',
    'Representa abrir camino con dignidad en mi ciudad, cuidando a quienes quiero sin dejar atrás mis metas propias.',
  ],
  ALTA_CARGA_CUIDADOS: [
    'Ser el pilar cotidiano de mi casa: atender hijas, escuela y adultos mayores mientras estiro el ingreso familiar sin descanso.',
    'Una doble y triple jornada constante donde todo el bienestar del hogar depende de mi tiempo y organización diaria.',
    'Mucho amor por mi familia, pero también cansancio acumulado porque casi no existen apoyos públicos de cuidado.',
  ],
  JOVENES_UNIVERSITARIAS_URBANAS: [
    'Construir autonomía profesional y alzar la voz junto a mis amigas, aunque moverse segura en el transporte sigue siendo un reto diario.',
    'Vivir entre la esperanza de prepararme profesionalmente y la alerta constante al caminar de regreso a casa por la noche.',
    'Cuestionar roles tradicionales, exigir igualdad salarial y tejer redes de apoyo entre mujeres jóvenes en la ciudad.',
  ],
  MUJERES_RURALES_ACCESO_LIMITADO: [
    'Trabajar desde temprano en el hogar y la parcela o comercio local, lidiando con la falta de clínicas cercanas y agua constante.',
    'Mantener viva nuestra comunidad y sacar adelante a los hijos cuando los servicios básicos y empleos quedan lejos.',
    'Resistir con trabajo colectivo entre vecinas ante el abandono de caminos, centros de salud y apoyos productivos.',
  ],
  ECONOMIA_PROPIA_INFORMAL: [
    'Emprender y vender por cuenta propia cada día sin seguridad social, equilibrando las ventas con el cuidado de la casa.',
    'Ganarme cada peso con mi propio negocio local, enfrentando cobros, falta de crédito accesible y alzas en insumos.',
    'Tener independencia para administrar mis horarios de venta, pero sin red de protección médica ni pensión asegurada.',
  ],
};

const P8_TEMPLATES = [
  'Mi capacidad de resolver problemas difíciles, mantener unida a mi red cercana y no rendirme ante la adversidad.',
  'La solidaridad con mis hermanas, amigas y vecinas, así como la independencia que he logrado con mi propio esfuerzo.',
  'Ver crecer a mis hijas e hijos con valores de respeto y saber que mi trabajo sostiene el bienestar de mi hogar.',
  'Mi formación, mi criterio propio para tomar decisiones y la fortaleza emocional que he construido en estos años.',
  'El orgullo de sacar adelante mi oficio y apoyar a otras mujeres de mi colonia cuando más se necesita.',
];

const P9_TEMPLATES: Record<SocioCareArchetype, string[]> = {
  MIXTO_NACIONAL: [
    'La brecha salarial, la inseguridad en el transporte público y que en el trabajo penalicen tener responsabilidades familiares.',
    'Encontrar un empleo bien pagado con horarios compatibles con la vida familiar y caminar tranquila por mi colonia.',
  ],
  ALTA_CARGA_CUIDADOS: [
    'Tuve que rechazar un empleo formal porque no había guardería ni estancia accesible y nadie más podía cuidar en casa.',
    'El agotamiento físico y emocional de cuidar familiares enfermos y menores sin ningún apoyo institucional ni ingreso propio.',
  ],
  JOVENES_UNIVERSITARIAS_URBANAS: [
    'El acoso constante en el transporte público y la precarización de los primeros empleos donde nos pagan menos que a los hombres.',
    'Que descalifiquen mis ideas por ser mujer joven en espacios laborales y el miedo al regresar tarde de clases o del trabajo.',
  ],
  MUJERES_RURALES_ACCESO_LIMITADO: [
    'La falta de médicos, medicamentos y transporte seguro hacia la cabecera municipal cuando hay una emergencia de salud.',
    'La escasez de agua potable, la falta de títulos de propiedad para mujeres y las pocas opciones de ingreso en la localidad.',
  ],
  ECONOMIA_PROPIA_INFORMAL: [
    'La falta de créditos sin intereses abusivos para crecer mi negocio y la inseguridad o extorsiones en zonas comerciales.',
    'Enfermarme y no contar con servicios médicos rápidos ni guarderías mientras atiendo mi puesto o taller.',
  ],
};

const P10_TEMPLATES = [
  'Que puedan salir a cualquier hora sin miedo, estudiar lo que elijan y recibir un salario justo sin discriminación.',
  'Que cuenten con un sistema nacional de cuidados, salud digna y relaciones libres de violencia machista.',
  'Que tengan oportunidades reales de empleo bien remunerado en su propia región sin tener que sacrificar su salud o proyectos.',
  'Que sean escuchadas con respeto por las autoridades y que la justicia sí actúe cuando una mujer denuncia.',
];

const P12_JUSTIFICATIONS = [
  'Porque impacta todos los días nuestra tranquilidad y limita los horarios en los que podemos salir a trabajar o estudiar.',
  'Porque el gasto en alimentos, renta y salud supera lo que ganamos aunque trabajemos jornadas completas.',
  'Porque cuando necesitamos atención médica o medicamentos urgentes en las clínicas públicas simplemente no hay abasto.',
  'Porque sin estancias ni escuelas de tiempo completo toda la carga recae sobre nosotras y frena nuestro ingreso.',
  'Porque la violencia contra las mujeres sigue sin castigo efectivo y genera temor constante en las familias.',
];

const P13_LOCAL_ISSUES = [
  'Calles sin alumbrado público y lotes baldíos que vuelven muy peligroso el camino al transporte temprano y de noche.',
  'Cortes prolongados de agua potable durante semanas que nos obligan a pagar pipas caras y acarrear cubetas.',
  'Falta de médico de planta y desabasto de medicinas básicas en el centro de salud comunitario.',
  'Rutas de transporte público saturadas, irregulares e inseguras donde ocurren robos y acoso frecuente.',
  'Cierre de estancias infantiles y falta de espacios seguros donde niñas y jóvenes puedan estar por las tardes.',
];

const P16_CONTEXT_DIFFS = [
  'En comunidades rurales cercanas las mujeres tardan horas en llegar a un hospital y casi no tienen acceso a empleo remunerado.',
  'Conozco mujeres migrantes y trabajadoras domésticas que laboran sin contrato, lejos de sus hijos y sin seguridad social.',
  'En zonas periféricas la falta de agua y transporte seguro duplica las horas de traslado y cuidado respecto a zonas céntricas.',
];

const P25_VIOLENCE_DETAILS = [
  'En asambleas vecinales suelen interrumpir o minimizar las propuestas de seguridad y cuidados hechas por mujeres.',
  'Comentarios burlones en redes locales y reuniones cuando una mujer levanta la voz para exigir cuentas al municipio.',
  'Presiones para condicionar apoyos sociales a cambio de asistir a mítines o callar quejas sobre servicios públicos.',
];

const P33_CONCRETE_CHANGES = [
  'Sistema público de guarderías, estancias infantiles y centros de día para adultos mayores con horarios laborales reales.',
  'Transporte iluminado, con vigilancia efectiva y rutas seguras conectadas con colonias periféricas.',
  'Clínicas de salud para la mujer con abasto garantizado de medicamentos, salud mental y atención digna sin meses de espera.',
  'Créditos a tasa preferencial, capacitación práctica y seguridad social accesible para mujeres que trabajan por cuenta propia.',
  'Ministerios públicos especializados que atiendan denuncias de violencia de inmediato y sin revictimizar.',
];

const P38_SOMOS_PROPOSALS = [
  'Abrir espacios reales de participación ciudadana para mujeres fuera de las cúpulas partidistas tradicionales.',
  'Impulsar una agenda nacional de cuidados, seguridad barrial y combate frontal a la impunidad.',
  'Construir una opción política nueva basada en escucha territorial y causas ciudadanas concretas.',
];

const P39_POSITIVES = [
  'Se percibe apertura a escuchar primero las necesidades cotidianas de las mujeres antes de imponer candidatos.',
  'Representa una alternativa fresca frente al desgaste y descrédito de los partidos tradicionales.',
  'Pone sobre la mesa temas de cuidados, seguridad local y participación ciudadana genuina.',
];

const P39_CRITICS = [
  'Todavía falta mayor presencia en colonias populares y claridad sobre cómo aterrizarán sus propuestas en lo local.',
  'Existe la duda natural de si mantendrán congruencia o terminarán repitiendo prácticas de los partidos de siempre.',
  'Aún se conoce poco quiénes lo encabezan en cada municipio y cuáles son sus mecanismos de rendición de cuentas.',
];

const P42_CHANGE_REASONS = [
  'He visto mayor conversación en redes y ejercicios de escucha directa sobre problemáticas reales de las mujeres.',
  'Me interesó saber que buscan construir agenda desde necesidades locales y no solo campañas electorales.',
  'Sigo con cautela porque varios proyectos políticos prometen cercanía al inicio y luego se alejan de la gente.',
];

const P43_SOCIAL_STORIES = [
  'Entre vecinas se comenta que todos los partidos aparecen solo a pedir el voto en campaña y desaparecen cuando falta agua o seguridad.',
  'En el trabajo comentamos que aunque hoy hay más mujeres en cargos públicos, aún faltan guarderías, medicinas y calles seguras.',
  'En el grupo de madres de la escuela se habló del hartazgo con el uso político de los apoyos sociales sin resolver la violencia.',
];

export function generateSyntheticNarrativesFromBlockA(params: {
  edad: AgeRange;
  entidad: string;
  localidad: LocalityType;
  cuidados: string[];
}): {
  p7: string;
  p8: string;
  p9: string;
  p10: string;
} {
  const hasHeavyCare =
    params.cuidados.length > 0 &&
    !params.cuidados.includes('No tengo responsabilidades directas de cuidado actualmente');

  let archetype: SocioCareArchetype = 'MIXTO_NACIONAL';
  if (params.localidad === 'Rural') {
    archetype = 'MUJERES_RURALES_ACCESO_LIMITADO';
  } else if (hasHeavyCare) {
    archetype = 'ALTA_CARGA_CUIDADOS';
  } else if (params.edad === '18–24' || params.edad === '25–34') {
    archetype = 'JOVENES_UNIVERSITARIAS_URBANAS';
  }

  const rng = createSeededRng(Date.now() % 100000);
  const p7Base = pickWeighted(P7_TEMPLATES[archetype], [1, 1, 1], rng);
  const p8Base = pickWeighted(P8_TEMPLATES, [1, 1, 1, 1, 1], rng);
  const p9Base = pickWeighted(P9_TEMPLATES[archetype], [1, 1], rng);
  const p10Base = pickWeighted(P10_TEMPLATES, [1, 1, 1, 1], rng);

  return {
    p7: `En ${params.entidad} (${params.localidad.toLowerCase()}, ${params.edad} años): ${p7Base}`,
    p8: p8Base,
    p9: p9Base,
    p10: p10Base,
  };
}

function resolveEntityWeights(geoBias: GeoBiasOption): number[] {
  return MEXICO_ENTITIES.map((ent) => {
    const base = ent.popWeight;
    switch (geoBias) {
      case 'BAJIO_GUANAJUATO':
        if (ent.code === 'GTO') return base * 8.5;
        if (ent.region === 'Bajío-Occidente') return base * 3.2;
        return base * 0.35;
      case 'ZMVM_CENTRO':
        if (ent.code === 'CDMX' || ent.code === 'MEX') return base * 5.0;
        if (ent.region === 'Centro-ZMVM') return base * 2.5;
        return base * 0.3;
      case 'SUR_SURESTE':
        if (ent.region === 'Sur-Sureste') return base * 5.2;
        return base * 0.3;
      case 'NORTE_INDUSTRIAL':
        if (ent.region === 'Norte') return base * 5.2;
        return base * 0.35;
      case 'NACIONAL_PONDERADO':
      default:
        return base;
    }
  });
}

export function generateSingleSyntheticAgent(
  indexNumber: number,
  config: Omit<SimulationConfig, 'batchSize'>,
  customRng?: RngFn,
  forcedEntityName?: string
): OrusResponse {
  const rng = customRng ?? (() => Math.random());

  // Seleccionar arquetipo efectivo
  let effectiveArchetype: SocioCareArchetype = config.socioProfile;
  if (config.socioProfile === 'MIXTO_NACIONAL') {
    effectiveArchetype = pickWeighted(
      [
        'ALTA_CARGA_CUIDADOS',
        'JOVENES_UNIVERSITARIAS_URBANAS',
        'MUJERES_RURALES_ACCESO_LIMITADO',
        'ECONOMIA_PROPIA_INFORMAL',
        'MIXTO_NACIONAL',
      ] as const,
      [30, 22, 16, 20, 12],
      rng
    );
  }

  // P2: Entidad
  const entityMeta = forcedEntityName
    ? MEXICO_ENTITIES.find((e) => e.name === forcedEntityName) ?? MEXICO_ENTITIES[0]
    : pickWeighted(MEXICO_ENTITIES, resolveEntityWeights(config.geoBias), rng);

  // P1: Edad según arquetipo
  const ageWeights =
    effectiveArchetype === 'JOVENES_UNIVERSITARIAS_URBANAS'
      ? [52, 36, 8, 2, 1, 1]
      : effectiveArchetype === 'ALTA_CARGA_CUIDADOS'
      ? [10, 32, 34, 15, 6, 3]
      : [18, 24, 22, 16, 12, 8];
  const p1_edad = pickWeighted(AGE_RANGES, ageWeights, rng);

  // P3: Localidad
  const locWeights =
    effectiveArchetype === 'MUJERES_RURALES_ACCESO_LIMITADO'
      ? [8, 68, 24]
      : effectiveArchetype === 'JOVENES_UNIVERSITARIAS_URBANAS'
      ? [86, 3, 11]
      : entityMeta.code === 'CDMX'
      ? [94, 1, 5]
      : [66, 16, 18];
  const p3_localidad = pickWeighted(['Urbana', 'Rural', 'Mixta'] as LocalityType[], locWeights, rng);

  // P4: Actividades (1 a 3)
  const actWeights =
    effectiveArchetype === 'JOVENES_UNIVERSITARIAS_URBANAS'
      ? [28, 14, 12, 48, 16, 14, 0, 1]
      : effectiveArchetype === 'ALTA_CARGA_CUIDADOS'
      ? [18, 28, 56, 4, 12, 8, 2, 4]
      : effectiveArchetype === 'MUJERES_RURALES_ACCESO_LIMITADO'
      ? [8, 26, 44, 4, 10, 16, 4, 38]
      : effectiveArchetype === 'ECONOMIA_PROPIA_INFORMAL'
      ? [8, 58, 38, 5, 10, 10, 2, 6]
      : [30, 24, 34, 12, 10, 10, 8, 6];
  const actCount = pickWeighted([1, 2, 3], [32, 48, 20], rng);
  const p4_actividades = pickUniqueSubset(P4_ACTIVITIES, actWeights, actCount, rng);

  // P5: Actividad principal (estrictamente derivada de P4 + fallback)
  const p5_actividad_principal =
    rng() < 0.12 && p4_actividades.length > 1
      ? P5_FALLBACK_OPTION
      : p4_actividades[Math.floor(rng() * p4_actividades.length)];

  // P6: Cuidados
  let p6_cuidados: string[] = [];
  const noCareOption = P6_CARE_OPTIONS[5];
  const careChance =
    effectiveArchetype === 'ALTA_CARGA_CUIDADOS'
      ? 0.96
      : effectiveArchetype === 'JOVENES_UNIVERSITARIAS_URBANAS'
      ? 0.34
      : 0.68;

  if (rng() < careChance) {
    const subCarePool = P6_CARE_OPTIONS.slice(0, 5);
    const subWeights = [34, 24, 22, 10, 16];
    const cCount = pickWeighted([1, 2], [65, 35], rng);
    p6_cuidados = pickUniqueSubset(subCarePool, subWeights, cCount, rng);
  } else {
    p6_cuidados = [noCareOption];
  }

  const hasDirectCare = !p6_cuidados.includes(noCareOption);

  // Bloque B (P7–P10)
  const p7_significado_mujer = pickWeighted(P7_TEMPLATES[effectiveArchetype], [1, 1, 1], rng);
  const p8_orgullo_fortaleza = pickWeighted(P8_TEMPLATES, [1, 1, 1, 1, 1], rng);
  const p9_obstaculo_principal = pickWeighted(P9_TEMPLATES[effectiveArchetype], [1, 1], rng);
  const p10_cambio_futuro_jovenes = pickWeighted(P10_TEMPLATES, [1, 1, 1, 1], rng);

  // Bloque C (P11–P16) - máximo 3 opciones de las 16 categorías
  const concernWeights = [
    26, // Seguridad pública
    22, // Violencia contra las mujeres
    25, // Ingresos / costo de vida
    16, // Falta de empleos dignos
    20, // Salud y medicamentos
    11, // Salud mental
    9,  // Educación
    hasDirectCare ? 22 : 7, // Cuidados / guarderías
    p3_localidad === 'Rural' ? 20 : 12, // Agua y servicios básicos
    p3_localidad === 'Urbana' ? 15 : 9, // Transporte
    10, // Vivienda
    13, // Corrupción e impunidad
    12, // Acceso a la justicia
    8,  // Medio ambiente / sequía
    11, // Discriminación salarial
    7,  // Espacios seguros
  ];
  const p11_preocupaciones_top3 = pickUniqueSubset(P11_CONCERNS_16, concernWeights, 3, rng);
  const p12_mas_urgente = p11_preocupaciones_top3[0];
  const p12_justificacion = pickWeighted(P12_JUSTIFICATIONS, [1, 1, 1, 1, 1], rng);

  const p13_problema_local_desatendido: 'Sí' | 'No' = rng() < 0.76 ? 'Sí' : 'No';
  const p13_detalle =
    p13_problema_local_desatendido === 'Sí'
      ? pickWeighted(P13_LOCAL_ISSUES, [1, 1, 1, 1, 1], rng)
      : '';

  const p14_espacios_conversacion = pickUniqueSubset(
    P14_CONVERSATION_SPACES.slice(0, 6),
    [35, 30, 20, 22, 18, 10],
    pickWeighted([2, 3], [55, 45], rng),
    rng
  );
  const p15_preocupacion_entorno_mujeres = pickWeighted(P11_CONCERNS_16, concernWeights, rng);
  const p16_conoce_contextos_distintos: 'Sí' | 'No' = rng() < 0.62 ? 'Sí' : 'No';
  const p16_detalle =
    p16_conoce_contextos_distintos === 'Sí'
      ? pickWeighted(P16_CONTEXT_DIFFS, [1, 1, 1], rng)
      : '';

  // Bloque D (P17–P25)
  const p17_busco_atencion_institucional: 'Sí' | 'No' = rng() < 0.58 ? 'Sí' : 'No';
  let p18_experiencia_institucional: Record<string, LikertAgreement6> | null = null;
  if (p17_busco_atencion_institucional === 'Sí') {
    p18_experiencia_institucional = {};
    for (const item of P18_INSTITUTIONAL_EXPERIENCE_ITEMS) {
      p18_experiencia_institucional[item] = pickWeighted(
        LIKERT_AGREEMENT_6,
        [18, 26, 22, 18, 11, 5],
        rng
      );
    }
  }

  // P19: Matriz 6x5 de confianza institucional (alta desafección hacia partidos, mayor hacia OSC e INE)
  const trustDistByInst: Record<string, number[]> = {
    'Gobierno estatal': [28, 36, 23, 9, 4],
    'Gobierno municipal / Alcaldía': [31, 35, 22, 8, 4],
    'Congreso / Diputadas y diputados': [38, 37, 16, 4, 5],
    'Autoridades electorales (INE / Institutos locales)': [14, 24, 36, 21, 5],
    'Partidos políticos': [52, 33, 10, 3, 2],
    'Organizaciones de la sociedad civil y colectivos ciudadanos': [11, 20, 41, 22, 6],
  };
  const p19_confianza_institucional: Record<string, InstitutionalTrust5> = {};
  for (const inst of P19_TRUST_INSTITUTIONS) {
    p19_confianza_institucional[inst] = pickWeighted(
      INSTITUTIONAL_TRUST_5,
      trustDistByInst[inst] ?? [25, 30, 25, 15, 5],
      rng
    );
  }

  const p20_actividades_participacion = pickUniqueSubset(
    P20_PARTICIPATION_ACTIVITIES.slice(0, 7),
    [55, 26, 24, 22, 16, 9, 10],
    pickWeighted([1, 2, 3], [35, 42, 23], rng),
    rng
  );
  const p21_frecuencia_participacion = pickWeighted(
    ['Frecuentemente', 'Ocasionalmente', 'Casi nunca', 'Nunca'] as const,
    [14, 38, 32, 16],
    rng
  );
  const p22_dificultades_participacion = pickUniqueSubset(
    P22_PARTICIPATION_BARRIERS,
    [hasDirectCare ? 42 : 22, 34, 22, 26, 18, 12, 20, 11],
    3,
    rng
  );
  const p23_condiciones_habilitadoras = pickUniqueSubset(
    P23_ENABLING_CONDITIONS,
    [32, hasDirectCare ? 38 : 16, 34, 28, 20, 22, 24, 18],
    3,
    rng
  );

  const p24_percepcion_incidencia: Record<string, LikertAgreement6> = {
    [P24_INCIDENCE_ITEMS[0]]: pickWeighted(LIKERT_AGREEMENT_6, [24, 30, 22, 14, 7, 3], rng),
    [P24_INCIDENCE_ITEMS[1]]: pickWeighted(LIKERT_AGREEMENT_6, [4, 7, 12, 28, 31, 18], rng),
    [P24_INCIDENCE_ITEMS[2]]: pickWeighted(LIKERT_AGREEMENT_6, [4, 8, 11, 24, 31, 22], rng),
    [P24_INCIDENCE_ITEMS[3]]: pickWeighted(LIKERT_AGREEMENT_6, [7, 11, 16, 29, 24, 13], rng),
  };

  const p25_violencia_politica = pickWeighted(
    [
      'No, nunca',
      'Sí, lo he presenciado hacia otras mujeres',
      'Sí, lo he vivido directamente',
      'Ambas (lo he vivido y presenciado)',
    ] as const,
    [44, 31, 11, 14],
    rng
  );
  const p25_detalle =
    p25_violencia_politica !== 'No, nunca'
      ? pickWeighted(P25_VIOLENCE_DETAILS, [1, 1, 1], rng)
      : '';

  // Bloque E (P26–P33)
  const p26_acceso_derechos: Record<string, AccessDifficulty6> = {};
  const ruralPenalty = p3_localidad === 'Rural' ? 1.5 : 1.0;
  for (const rightItem of P26_RIGHTS_ACCESS_ITEMS) {
    p26_acceso_derechos[rightItem] = pickWeighted(
      ACCESS_DIFFICULTY_6,
      [22 * ruralPenalty, 28 * ruralPenalty, 22, 14, 9, 5],
      rng
    );
  }

  const p27_ambitos_desventaja = pickUniqueSubset(
    P27_DISADVANTAGE_DOMAINS.slice(0, 7),
    [28, 22, 32, 34, 20, 14, 26],
    pickWeighted([2, 3, 4], [35, 45, 20], rng),
    rng
  );
  const p28_situaciones_sexismo = pickUniqueSubset(
    P28_SEXISM_SITUATIONS.slice(0, 7),
    [28, 34, 20, 24, 18, 15, 21],
    pickWeighted([1, 2, 3], [30, 45, 25], rng),
    rng
  );

  const p29_impacto_cuidados: Record<string, CareImpactFrequency7> = {};
  for (const impactItem of P29_CARE_IMPACT_ITEMS) {
    const weights = hasDirectCare
      ? [6, 9, 14, 24, 26, 19, 2]
      : [26, 22, 18, 14, 6, 3, 11];
    p29_impacto_cuidados[impactItem] = pickWeighted(CARE_IMPACT_FREQUENCY_7, weights, rng);
  }

  const p30_abandono_por_temor = pickWeighted(
    ['Sí, varias veces', 'Sí, alguna vez', 'No'] as const,
    [36, 38, 26],
    rng
  );

  const p31_autonomia_decisiones: Record<string, AutonomyLevel7> = {};
  for (const autoItem of P31_AUTONOMY_ITEMS) {
    p31_autonomia_decisiones[autoItem] = pickWeighted(
      AUTONOMY_LEVEL_7,
      [3, 6, 13, 24, 30, 22, 2],
      rng
    );
  }

  const p32_conocimiento_rutas_apoyo = pickWeighted(
    [
      'Sí, conozco rutas claras y confiables',
      'Conozco algunas opciones, pero dudo que funcionen',
      'No sé con claridad a dónde acudir',
    ] as const,
    [21, 52, 27],
    rng
  );
  const p33_apoyo_concreto_cambio = pickWeighted(P33_CONCRETE_CHANGES, [1, 1, 1, 1, 1], rng);

  // Bloque F (P34–P43) con Lógica de Salto Crítica en P34 -> P40
  const somosYesProb =
    config.somosScenario === 'BAJA_15'
      ? 0.16
      : config.somosScenario === 'ALTA_70'
      ? 0.71
      : 0.41;

  const rSomos = rng();
  const p34_conoce_somos: 'Sí' | 'No' | 'No estoy segura' =
    rSomos < somosYesProb
      ? 'Sí'
      : rSomos < somosYesProb + (1 - somosYesProb) * 0.74
      ? 'No'
      : 'No estoy segura';

  let p35_nivel_conocimiento_somos: OrusResponse['p35_nivel_conocimiento_somos'] = null;
  let p36_opinion_somos: OrusResponse['p36_opinion_somos'] = null;
  let p37_cercania_somos: OrusResponse['p37_cercania_somos'] = null;
  let p38_recuerda_propuesta_somos: OrusResponse['p38_recuerda_propuesta_somos'] = null;
  let p38_detalle = '';
  let p39_positivos_somos = '';
  let p39_criticas_somos = '';

  if (p34_conoce_somos === 'Sí') {
    p35_nivel_conocimiento_somos = pickWeighted(
      ['Solo he escuchado el nombre', 'Conozco poco', 'Conozco algo', 'Conozco bastante'] as const,
      [26, 34, 28, 12],
      rng
    );
    p36_opinion_somos = pickWeighted(
      [
        'Muy buena',
        'Buena',
        'Regular / Neutral',
        'Mala',
        'Muy mala',
        'Aún no tengo opinión formada',
      ] as const,
      [15, 37, 26, 6, 3, 13],
      rng
    );
    p37_cercania_somos = pickWeighted([1, 2, 3, 4, 5] as const, [7, 13, 31, 33, 16], rng);
    p38_recuerda_propuesta_somos = rng() < 0.48 ? 'Sí' : 'No';
    if (p38_recuerda_propuesta_somos === 'Sí') {
      p38_detalle = pickWeighted(P38_SOMOS_PROPOSALS, [1, 1, 1], rng);
    }
    p39_positivos_somos = pickWeighted(P39_POSITIVES, [1, 1, 1], rng);
    p39_criticas_somos = pickWeighted(P39_CRITICS, [1, 1, 1], rng);
  }

  // P40: Hasta 3 partidos conocidos + P41 Matriz dinámica
  const partyCount = pickWeighted([2, 3], [30, 70], rng);
  const p40_otros_partidos = pickUniqueSubset(
    SUGGESTED_PARTIES_MEXICO,
    [36, 28, 24, 22, 10, 9],
    partyCount,
    rng
  );

  const partyProfiles: Record<
    string,
    { opW: number[]; cercW: number[]; propW: number[] }
  > = {
    Morena: { opW: [14, 26, 28, 18, 14], cercW: [18, 20, 28, 22, 12], propW: [26, 48, 26] },
    PAN: { opW: [6, 18, 30, 26, 20], cercW: [26, 28, 26, 14, 6], propW: [18, 46, 36] },
    PRI: { opW: [3, 10, 24, 33, 30], cercW: [38, 30, 20, 9, 3], propW: [14, 44, 42] },
    'Movimiento Ciudadano': { opW: [8, 24, 34, 20, 14], cercW: [20, 24, 32, 17, 7], propW: [20, 48, 32] },
    PVEM: { opW: [4, 13, 30, 28, 25], cercW: [32, 28, 24, 11, 5], propW: [10, 44, 46] },
    PT: { opW: [5, 14, 29, 27, 25], cercW: [30, 28, 24, 12, 6], propW: [12, 42, 46] },
  };

  const p41_evaluacion_otros_partidos: OtherPartyEvaluation[] = p40_otros_partidos.map(
    (partido) => {
      const prof = partyProfiles[partido] ?? {
        opW: [8, 18, 34, 22, 18],
        cercW: [24, 26, 28, 15, 7],
        propW: [15, 45, 40],
      };
      return {
        partido,
        opinion: pickWeighted(
          ['Muy buena', 'Buena', 'Regular', 'Mala', 'Muy mala'] as PartyOpinion5[],
          prof.opW,
          rng
        ),
        cercania: pickWeighted([1, 2, 3, 4, 5] as const, prof.cercW, rng),
        conocimientoPropuestas: pickWeighted(
          [
            'Sí conozco propuestas claras',
            'Solo promesas generales',
            'No conozco ninguna',
          ] as PartyProposalsKnowledge[],
          prof.propW,
          rng
        ),
      };
    }
  );

  const p42_cambio_opinion_6meses =
    p34_conoce_somos === 'Sí'
      ? pickWeighted(
          ['Mejoró', 'Empeoró', 'Se mantuvo igual', 'Recién lo escucho aquí'] as const,
          [38, 9, 43, 10],
          rng
        )
      : pickWeighted(
          ['Se mantuvo igual', 'Recién lo escucho aquí'] as const,
          [22, 78],
          rng
        );

  const p42_motivo =
    p42_cambio_opinion_6meses === 'Mejoró' || p42_cambio_opinion_6meses === 'Empeoró'
      ? pickWeighted(P42_CHANGE_REASONS, [1, 1, 1], rng)
      : '';

  const p43_escucha_social_partidos: 'Sí' | 'No' = rng() < 0.64 ? 'Sí' : 'No';
  const p43_relato =
    p43_escucha_social_partidos === 'Sí'
      ? pickWeighted(P43_SOCIAL_STORIES, [1, 1, 1], rng)
      : '';

  const padded = String(indexNumber).padStart(4, '0');
  const createdOffsetMs = Math.floor(rng() * 14 * 24 * 3600 * 1000);
  const createdDate = new Date(Date.now() - createdOffsetMs).toISOString();

  return {
    id: `ocean-${padded}-${Math.floor(rng() * 90000 + 10000)}`,
    folio: `OCEAN-${entityMeta.short}-${padded}`,
    origin: 'SYNTHETIC',
    createdAt: createdDate,
    archetypeTag: effectiveArchetype,
    p1_edad,
    p2_entidad: entityMeta.name,
    p3_localidad,
    p4_actividades,
    p5_actividad_principal,
    p6_cuidados,
    p7_significado_mujer,
    p8_orgullo_fortaleza,
    p9_obstaculo_principal,
    p10_cambio_futuro_jovenes,
    p11_preocupaciones_top3,
    p12_mas_urgente,
    p12_justificacion,
    p13_problema_local_desatendido,
    p13_detalle,
    p14_espacios_conversacion,
    p15_preocupacion_entorno_mujeres,
    p16_conoce_contextos_distintos,
    p16_detalle,
    p17_busco_atencion_institucional,
    p18_experiencia_institucional,
    p19_confianza_institucional,
    p20_actividades_participacion,
    p21_frecuencia_participacion,
    p22_dificultades_participacion,
    p23_condiciones_habilitadoras,
    p24_percepcion_incidencia,
    p25_violencia_politica,
    p25_detalle,
    p26_acceso_derechos,
    p27_ambitos_desventaja,
    p28_situaciones_sexismo,
    p29_impacto_cuidados,
    p30_abandono_por_temor,
    p31_autonomia_decisiones,
    p32_conocimiento_rutas_apoyo,
    p33_apoyo_concreto_cambio,
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
    p42_cambio_opinion_6meses,
    p42_motivo,
    p43_escucha_social_partidos,
    p43_relato,
  };
}

// Genera el dataset semilla precargado N = 120 (garantizando representación en las 33 entidades + mezcla realista)
export function generateInitialSeedDataset(count = 120): OrusResponse[] {
  const rng = createSeededRng(20260443);
  const records: OrusResponse[] = [];

  for (let i = 0; i < count; i++) {
    // Primeros 33 aseguran al menos 1 registro en cada entidad federativa + Exterior
    const forcedEntity = i < MEXICO_ENTITIES.length ? MEXICO_ENTITIES[i].name : undefined;
    const rec = generateSingleSyntheticAgent(
      i + 1,
      {
        geoBias: 'NACIONAL_PONDERADO',
        socioProfile: 'MIXTO_NACIONAL',
        somosScenario: 'ORGANICO_40',
      },
      rng,
      forcedEntity
    );
    // Marcar los primeros 28 registros como capturas de campo reales verificadas y 92 sintéticas (total N = 120)
    if (i % 4 === 0 && records.filter((r) => r.origin === 'REAL').length < 28) {
      rec.origin = 'REAL';
      rec.folio = rec.folio.replace('OCEAN-', 'CAMPO-');
    }
    records.push(rec);
  }

  return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
