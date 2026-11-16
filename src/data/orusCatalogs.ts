import {
  AccessDifficulty6,
  AgeRange,
  AutonomyLevel7,
  CareImpactFrequency7,
  InstitutionalTrust5,
  LikertAgreement6,
  LocalityType,
  MexicoEntityMeta,
  PartyOpinion5,
  PartyProposalsKnowledge,
} from '../types/orus';

export const AGE_RANGES: AgeRange[] = ['18–24', '25–34', '35–44', '45–54', '55–64', '65+'];

export const LOCALITY_TYPES: LocalityType[] = ['Urbana', 'Rural', 'Mixta'];

// 32 Entidades Federativas de México + Fuera de México con coordenadas reales y retícula cartográfica sin colisiones
export const MEXICO_ENTITIES: MexicoEntityMeta[] = [
  { code: 'BC', name: 'Baja California', short: 'BC', region: 'Norte', lat: 30.8406, lng: -115.2838, gridX: 0, gridY: 0, popWeight: 3.0 },
  { code: 'SON', name: 'Sonora', short: 'SON', region: 'Norte', lat: 29.2972, lng: -110.3309, gridX: 1, gridY: 0, popWeight: 2.4 },
  { code: 'CHIH', name: 'Chihuahua', short: 'CHIH', region: 'Norte', lat: 28.633, lng: -106.0691, gridX: 2, gridY: 0, popWeight: 3.0 },
  { code: 'COAH', name: 'Coahuila', short: 'COAH', region: 'Norte', lat: 27.0587, lng: -101.7068, gridX: 3, gridY: 0, popWeight: 2.5 },
  { code: 'NL', name: 'Nuevo León', short: 'NL', region: 'Norte', lat: 25.5922, lng: -99.9962, gridX: 4, gridY: 0, popWeight: 4.6 },
  { code: 'TAM', name: 'Tamaulipas', short: 'TAM', region: 'Norte', lat: 24.2669, lng: -98.8363, gridX: 5, gridY: 0, popWeight: 2.8 },

  { code: 'BCS', name: 'Baja California Sur', short: 'BCS', region: 'Norte', lat: 26.0444, lng: -111.6661, gridX: 0, gridY: 1, popWeight: 0.7 },
  { code: 'SIN', name: 'Sinaloa', short: 'SIN', region: 'Norte', lat: 25.1721, lng: -107.4795, gridX: 1, gridY: 1, popWeight: 2.4 },
  { code: 'DUR', name: 'Durango', short: 'DGO', region: 'Norte', lat: 24.5593, lng: -104.6588, gridX: 2, gridY: 1, popWeight: 1.5 },
  { code: 'ZAC', name: 'Zacatecas', short: 'ZAC', region: 'Bajío-Occidente', lat: 22.7709, lng: -102.5832, gridX: 3, gridY: 1, popWeight: 1.3 },
  { code: 'SLP', name: 'San Luis Potosí', short: 'SLP', region: 'Bajío-Occidente', lat: 22.1565, lng: -100.9855, gridX: 4, gridY: 1, popWeight: 2.2 },

  { code: 'NAY', name: 'Nayarit', short: 'NAY', region: 'Bajío-Occidente', lat: 21.7514, lng: -104.8455, gridX: 1, gridY: 2, popWeight: 1.0 },
  { code: 'AGS', name: 'Aguascalientes', short: 'AGS', region: 'Bajío-Occidente', lat: 21.8853, lng: -102.2916, gridX: 2, gridY: 2, popWeight: 1.2 },
  { code: 'GTO', name: 'Guanajuato', short: 'GTO', region: 'Bajío-Occidente', lat: 21.019, lng: -101.2574, gridX: 3, gridY: 2, popWeight: 5.0 },
  { code: 'QRO', name: 'Querétaro', short: 'QRO', region: 'Bajío-Occidente', lat: 20.5888, lng: -100.3899, gridX: 4, gridY: 2, popWeight: 1.9 },
  { code: 'HGO', name: 'Hidalgo', short: 'HGO', region: 'Centro-ZMVM', lat: 20.0911, lng: -98.7624, gridX: 5, gridY: 2, popWeight: 2.4 },
  { code: 'VER', name: 'Veracruz', short: 'VER', region: 'Sur-Sureste', lat: 19.1738, lng: -96.1342, gridX: 6, gridY: 2, popWeight: 6.4 },

  { code: 'JAL', name: 'Jalisco', short: 'JAL', region: 'Bajío-Occidente', lat: 20.6595, lng: -103.3494, gridX: 1, gridY: 3, popWeight: 6.6 },
  { code: 'COL', name: 'Colima', short: 'COL', region: 'Bajío-Occidente', lat: 19.2452, lng: -103.7241, gridX: 1, gridY: 4, popWeight: 0.6 },
  { code: 'MICH', name: 'Michoacán', short: 'MICH', region: 'Bajío-Occidente', lat: 19.5665, lng: -101.7068, gridX: 2, gridY: 3, popWeight: 3.8 },
  { code: 'MEX', name: 'Estado de México', short: 'EDOMEX', region: 'Centro-ZMVM', lat: 19.2826, lng: -99.6557, gridX: 3, gridY: 3, popWeight: 13.4 },
  { code: 'CDMX', name: 'Ciudad de México', short: 'CDMX', region: 'Centro-ZMVM', lat: 19.4326, lng: -99.1332, gridX: 4, gridY: 3, popWeight: 7.4 },
  { code: 'TLAX', name: 'Tlaxcala', short: 'TLAX', region: 'Centro-ZMVM', lat: 19.3139, lng: -98.2404, gridX: 5, gridY: 3, popWeight: 1.1 },
  { code: 'PUE', name: 'Puebla', short: 'PUE', region: 'Centro-ZMVM', lat: 19.0414, lng: -98.2063, gridX: 5, gridY: 4, popWeight: 5.2 },

  { code: 'MOR', name: 'Morelos', short: 'MOR', region: 'Centro-ZMVM', lat: 18.6813, lng: -99.1013, gridX: 4, gridY: 4, popWeight: 1.6 },
  { code: 'GRO', name: 'Guerrero', short: 'GRO', region: 'Sur-Sureste', lat: 17.4392, lng: -99.5451, gridX: 3, gridY: 4, popWeight: 2.8 },
  { code: 'OAX', name: 'Oaxaca', short: 'OAX', region: 'Sur-Sureste', lat: 17.0732, lng: -96.7266, gridX: 5, gridY: 5, popWeight: 3.3 },
  { code: 'CHIS', name: 'Chiapas', short: 'CHIS', region: 'Sur-Sureste', lat: 16.7569, lng: -93.1292, gridX: 6, gridY: 5, popWeight: 4.4 },

  { code: 'TAB', name: 'Tabasco', short: 'TAB', region: 'Sur-Sureste', lat: 17.8409, lng: -92.6189, gridX: 6, gridY: 4, popWeight: 1.9 },
  { code: 'CAMP', name: 'Campeche', short: 'CAMP', region: 'Sur-Sureste', lat: 19.8301, lng: -90.5349, gridX: 7, gridY: 4, popWeight: 0.8 },
  { code: 'YUC', name: 'Yucatán', short: 'YUC', region: 'Sur-Sureste', lat: 20.7099, lng: -89.0943, gridX: 8, gridY: 3, popWeight: 1.8 },
  { code: 'QROO', name: 'Quintana Roo', short: 'QROO', region: 'Sur-Sureste', lat: 19.1817, lng: -88.4791, gridX: 8, gridY: 4, popWeight: 1.5 },

  { code: 'EXT', name: 'Fuera de México', short: 'EXT', region: 'Exterior', lat: 34.0522, lng: -118.2437, gridX: 8, gridY: 0, popWeight: 0.9 },
];

export const P4_ACTIVITIES = [
  'Trabajo remunerado con contrato o empleo formal',
  'Trabajo por cuenta propia, negocio o comercio informal',
  'Trabajo del hogar y cuidados no remunerados',
  'Estudios (universidad, posgrado o capacitación técnica)',
  'Búsqueda activa de empleo',
  'Participación comunitaria, social o voluntariado',
  'Jubilada o pensionada',
  'Trabajo agrícola, artesanal o en el campo',
];

export const P5_FALLBACK_OPTION = 'No puedo identificar una sola';

export const P6_CARE_OPTIONS = [
  'Hijas o hijos menores de 12 años',
  'Hijas o hijos adolescentes (12 a 17 años)',
  'Personas adultas mayores',
  'Personas con discapacidad o enfermedad crónica',
  'Otros familiares o personas cercanas (nietos, sobrinos, pareja)',
  'No tengo responsabilidades directas de cuidado actualmente',
];

// 16 categorías oficiales de P11 y P15
export const P11_CONCERNS_16 = [
  'Seguridad pública y violencia en mi entorno',
  'Violencia contra las mujeres y feminicidios',
  'Ingresos insuficientes y alto costo de la vida',
  'Falta de empleos dignos y bien pagados',
  'Acceso y calidad de servicios de salud y medicamentos',
  'Salud mental y bienestar emocional',
  'Educación de calidad y permanencia escolar',
  'Falta de apoyos y servicios para el cuidado (guarderías, estancias)',
  'Agua potable, drenaje y servicios básicos',
  'Transporte público seguro, accesible y eficiente',
  'Vivienda digna y accesible',
  'Corrupción e impunidad de las autoridades',
  'Acceso a la justicia y atención a denuncias',
  'Medio ambiente, sequía y cambio climático',
  'Discriminación y desigualdad salarial',
  'Falta de espacios seguros de recreación y comunidad',
];

export const P14_CONVERSATION_SPACES = [
  'En familia o en el hogar',
  'Con amigas, vecinas o conocidas',
  'En el trabajo o escuela',
  'En grupos de WhatsApp o redes vecinales',
  'En redes sociales abiertas (Facebook, Instagram, TikTok, X)',
  'En reuniones comunitarias, parroquiales o asociaciones',
  'Casi no hablo de estos temas con nadie',
];

export const LIKERT_AGREEMENT_6: LikertAgreement6[] = [
  'Totalmente en desacuerdo',
  'En desacuerdo',
  'Algo en desacuerdo',
  'Algo de acuerdo',
  'De acuerdo',
  'Totalmente de acuerdo',
];

export const P18_INSTITUTIONAL_EXPERIENCE_ITEMS = [
  'Recibí un trato digno, respetuoso y libre de discriminación',
  'La información y los pasos a seguir fueron claros y accesibles',
  'Mi solicitud o problema tuvo una respuesta útil y en tiempo razonable',
];

export const P19_TRUST_INSTITUTIONS = [
  'Gobierno estatal',
  'Gobierno municipal / Alcaldía',
  'Congreso / Diputadas y diputados',
  'Autoridades electorales (INE / Institutos locales)',
  'Partidos políticos',
  'Organizaciones de la sociedad civil y colectivos ciudadanos',
];

export const INSTITUTIONAL_TRUST_5: InstitutionalTrust5[] = [
  'Ninguna confianza',
  'Poca confianza',
  'Algo de confianza',
  'Mucha confianza',
  'No sabe / No conoce',
];

export const P20_PARTICIPATION_ACTIVITIES = [
  'Votar en elecciones',
  'Juntas vecinales, comités escolares o asambleas comunitarias',
  'Voluntariado, colectas o apoyo mutuo comunitario',
  'Firmar peticiones o compartir causas sociales en redes',
  'Marchas, movilizaciones o colectivos de mujeres',
  'Reuniones o actividades convocadas por partidos o candidaturas',
  'Presupuesto participativo, consultas públicas o contraloría social',
  'Ninguna de las anteriores',
];

export const P21_FREQUENCY_OPTIONS = [
  'Frecuentemente',
  'Ocasionalmente',
  'Casi nunca',
  'Nunca',
] as const;

export const P22_PARTICIPATION_BARRIERS = [
  'Falta de tiempo por trabajo y responsabilidades de cuidado',
  'Desconfianza en que realmente sirva para cambiar algo',
  'Falta de información clara sobre cómo o dónde participar',
  'Inseguridad en traslados o horarios poco seguros',
  'Falta de recursos económicos para transporte o gastos',
  'Sentir que no tengo suficiente preparación o experiencia',
  'Ambientes hostiles, machistas o dominados por los mismos grupos',
  'Temor a represalias, críticas o señalamientos en mi comunidad',
];

export const P23_ENABLING_CONDITIONS = [
  'Horarios flexibles y modalidades híbridas o cercanas a mi casa',
  'Espacios seguros con apoyo de cuidado infantil durante las reuniones',
  'Ver resultados concretos y transparentes en mi comunidad',
  'Que sean espacios libres de violencia, respetuosos e incluyentes',
  'Capacitación práctica y acompañamiento entre mujeres',
  'Independencia frente a prácticas clientelares o condicionamiento de apoyos',
  'Información clara y directa sobre temas que afectan mi vida diaria',
  'Apoyo para transporte seguro o conectividad',
];

export const P24_INCIDENCE_ITEMS = [
  'Las opiniones de mujeres como yo son tomadas en cuenta en las decisiones públicas',
  'Cuando las mujeres se organizan logran cambios reales en su comunidad',
  'La política actual está diseñada sin considerar los tiempos y realidades de las mujeres',
  'Participar vale la pena aunque los resultados tarden en verse',
];

export const P25_POLITICAL_VIOLENCE_OPTIONS = [
  'No, nunca',
  'Sí, lo he presenciado hacia otras mujeres',
  'Sí, lo he vivido directamente',
  'Ambas (lo he vivido y presenciado)',
] as const;

export const P26_RIGHTS_ACCESS_ITEMS = [
  'Servicios de salud oportunos y de calidad',
  'Atención a la salud sexual, reproductiva y materna',
  'Empleo formal con salario justo y prestaciones',
  'Crédito, financiamiento o apoyo para emprender',
  'Educación superior o capacitación para el trabajo',
  'Vivienda propia o renta accesible',
  'Transporte público seguro en cualquier horario',
  'Servicios de cuidado (guarderías, escuelas de tiempo completo, estancias)',
  'Acceso a la justicia y protección efectiva ante violencia',
  'Espacios públicos seguros, iluminados y recreativos',
];

export const ACCESS_DIFFICULTY_6: AccessDifficulty6[] = [
  'Muy difícil',
  'Difícil',
  'Algo difícil',
  'Algo fácil',
  'Fácil',
  'No aplica / No lo he buscado',
];

export const P27_DISADVANTAGE_DOMAINS = [
  'Salario e ingresos por el mismo esfuerzo o trabajo',
  'Oportunidades de ascenso o liderazgo laboral',
  'Reparto de tareas domésticas y de cuidado en casa',
  'Seguridad al caminar o moverme en la calle y transporte',
  'Trato en instituciones públicas, policía o juzgados',
  'Acceso a propiedad, tierra, herencia o patrimonio',
  'Tiempo libre y descanso personal',
  'En ninguno en particular',
];

export const P28_SEXISM_SITUATIONS = [
  'Comentarios machistas, descalificaciones o desdén sobre mi capacidad',
  'Acoso callejero o miradas/comentarios intimidantes en el transporte',
  'Obstáculos laborales por embarazo, maternidad o cuidados familiares',
  'Menor pago o falta de reconocimiento por mi trabajo',
  'Presión familiar o social sobre mis decisiones personales',
  'Violencia digital o acoso en redes sociales',
  'Trato condescendiente o negligencia en servicios médicos o públicos',
  'Ninguna de las anteriores',
];

export const P29_CARE_IMPACT_ITEMS = [
  'Dejar o rechazar un trabajo remunerado o turno laboral',
  'Posponer o abandonar estudios o capacitación',
  'Descuidar mi propia salud física o acudir tarde al médico',
  'Sentir agotamiento constante, estrés o sobrecarga emocional',
  'Dejar de asistir a reuniones sociales, comunitarias o políticas',
];

export const CARE_IMPACT_FREQUENCY_7: CareImpactFrequency7[] = [
  'Nunca',
  'Casi nunca',
  'Pocas veces',
  'Algunas veces',
  'Frecuentemente',
  'Siempre',
  'No aplica',
];

export const P30_FEAR_ABANDONMENT_OPTIONS = [
  'Sí, varias veces',
  'Sí, alguna vez',
  'No',
] as const;

export const P31_AUTONOMY_ITEMS = [
  'Uso y administración de dinero propio o del hogar',
  'Trabajar fuera de casa, emprender o estudiar',
  'Salir, viajar o reunirme con amistades y participar en grupos',
  'Decisiones sobre mi cuerpo, salud y maternidad',
  'Definir mi postura política y decidir por quién votar',
];

export const AUTONOMY_LEVEL_7: AutonomyLevel7[] = [
  'Ninguna autonomía',
  'Muy poca',
  'Poca',
  'Moderada',
  'Bastante',
  'Total autonomía',
  'No aplica',
];

export const P32_SUPPORT_ROUTES_OPTIONS = [
  'Sí, conozco rutas claras y confiables',
  'Conozco algunas opciones, pero dudo que funcionen',
  'No sé con claridad a dónde acudir',
] as const;

export const P34_SOMOS_AWARENESS_OPTIONS = ['Sí', 'No', 'No estoy segura'] as const;

export const P35_SOMOS_KNOWLEDGE_OPTIONS = [
  'Solo he escuchado el nombre',
  'Conozco poco',
  'Conozco algo',
  'Conozco bastante',
] as const;

export const P36_SOMOS_OPINION_OPTIONS = [
  'Muy buena',
  'Buena',
  'Regular / Neutral',
  'Mala',
  'Muy mala',
  'Aún no tengo opinión formada',
] as const;

export const SUGGESTED_PARTIES_MEXICO = [
  'Morena',
  'PAN',
  'PRI',
  'Movimiento Ciudadano',
  'PVEM',
  'PT',
];

export const PARTY_OPINION_5: PartyOpinion5[] = [
  'Muy buena',
  'Buena',
  'Regular',
  'Mala',
  'Muy mala',
];

export const PARTY_PROPOSALS_KNOWLEDGE: PartyProposalsKnowledge[] = [
  'Sí conozco propuestas claras',
  'Solo promesas generales',
  'No conozco ninguna',
];

export const P42_OPINION_CHANGE_OPTIONS = [
  'Mejoró',
  'Empeoró',
  'Se mantuvo igual',
  'Recién lo escucho aquí',
] as const;

export const ORUS_BLOCKS_META = [
  {
    id: 'A',
    code: 'BLOQUE A',
    title: 'Sobre ti y el lugar donde vives',
    range: 'P1 – P6',
    description: 'Perfil sociodemográfico, territorio, ocupación y carga de cuidados directos.',
  },
  {
    id: 'B',
    code: 'BLOQUE B',
    title: 'Identidad y experiencias de ser mujer',
    range: 'P7 – P10',
    description: 'Narrativas abiertas sobre identidad, orgullo, obstáculos y expectativas intergeneracionales.',
  },
  {
    id: 'C',
    code: 'BLOQUE C',
    title: 'Preocupaciones y necesidades',
    range: 'P11 – P16',
    description: 'Priorización estricta de problemáticas urgentes, vacíos locales y conversación social.',
  },
  {
    id: 'D',
    code: 'BLOQUE D',
    title: 'Instituciones y participación pública',
    range: 'P17 – P25',
    description: 'Experiencia institucional, confianza pública, barreras de participación y violencia política.',
  },
  {
    id: 'E',
    code: 'BLOQUE E',
    title: 'Tú como mujer: oportunidades y dificultades',
    range: 'P26 – P33',
    description: 'Acceso a derechos, brechas de género, impacto del cuidado, seguridad y autonomía vital.',
  },
  {
    id: 'F',
    code: 'BLOQUE F',
    title: 'Percepción de Somos y otros partidos',
    range: 'P34 – P43',
    description: 'Reconocimiento de Somos (con salto lógico P34→P40), evaluación comparativa partidista y escucha social.',
  },
] as const;
