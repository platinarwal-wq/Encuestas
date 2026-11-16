export type AgeRange = '18–24' | '25–34' | '35–44' | '45–54' | '55–64' | '65+';
export type LocalityType = 'Urbana' | 'Rural' | 'Mixta';
export type RecordOrigin = 'REAL' | 'SYNTHETIC';

export type LikertAgreement6 =
  | 'Totalmente en desacuerdo'
  | 'En desacuerdo'
  | 'Algo en desacuerdo'
  | 'Algo de acuerdo'
  | 'De acuerdo'
  | 'Totalmente de acuerdo';

export type InstitutionalTrust5 =
  | 'Ninguna confianza'
  | 'Poca confianza'
  | 'Algo de confianza'
  | 'Mucha confianza'
  | 'No sabe / No conoce';

export type AccessDifficulty6 =
  | 'Muy difícil'
  | 'Difícil'
  | 'Algo difícil'
  | 'Algo fácil'
  | 'Fácil'
  | 'No aplica / No lo he buscado';

export type CareImpactFrequency7 =
  | 'Nunca'
  | 'Casi nunca'
  | 'Pocas veces'
  | 'Algunas veces'
  | 'Frecuentemente'
  | 'Siempre'
  | 'No aplica';

export type AutonomyLevel7 =
  | 'Ninguna autonomía'
  | 'Muy poca'
  | 'Poca'
  | 'Moderada'
  | 'Bastante'
  | 'Total autonomía'
  | 'No aplica';

export type PartyOpinion5 = 'Muy buena' | 'Buena' | 'Regular' | 'Mala' | 'Muy mala';
export type PartyProposalsKnowledge =
  | 'Sí conozco propuestas claras'
  | 'Solo promesas generales'
  | 'No conozco ninguna';

export interface OtherPartyEvaluation {
  partido: string;
  opinion: PartyOpinion5;
  cercania: 1 | 2 | 3 | 4 | 5;
  conocimientoPropuestas: PartyProposalsKnowledge;
}

export type SurveyModality =
  | 'Autoadministrada digital'
  | 'Entrevista presencial en campo'
  | 'Entrevista telefónica / remota';

export interface SurveyRegistrationMeta {
  participanteAlias: string;
  municipioColonia: string;
  modalidad: SurveyModality;
  encuestadoraClave: string;
  consentimientoAceptado: boolean;
  notasCampo?: string;
}

export type SurveySourceChannel = 'EXCEL_STATE_BLOCK' | 'TERMINAL' | 'SWARM_IA';

export interface StateBatchRecord {
  id: string;
  ownerId: string;
  batchCode: string;
  entidad: string;
  fileName: string;
  recordsCount: number;
  targetQuota: number;
  status: 'completed';
  createdAtIso: string;
}

export interface OrusResponse {
  id: string;
  folio: string;
  origin: RecordOrigin;
  createdAt: string;
  archetypeTag?: string;
  batchId?: string;
  sourceChannel?: SurveySourceChannel;
  persistedInDb?: boolean;
  registroCampo?: SurveyRegistrationMeta;
  datosArchivoOriginal?: Record<string, string>;

  // Bloque A. Sobre ti y el lugar donde vives (P1–P6)
  p1_edad: AgeRange;
  p2_entidad: string;
  p3_localidad: LocalityType;
  p4_actividades: string[];
  p5_actividad_principal: string;
  p6_cuidados: string[];

  // Bloque B. Identidad y experiencias de ser mujer (P7–P10)
  p7_significado_mujer: string;
  p8_orgullo_fortaleza: string;
  p9_obstaculo_principal: string;
  p10_cambio_futuro_jovenes: string;

  // Bloque C. Preocupaciones y necesidades (P11–P16)
  p11_preocupaciones_top3: string[]; // max 3 of 16
  p12_mas_urgente: string; // filtered from p11
  p12_justificacion: string;
  p13_problema_local_desatendido: 'Sí' | 'No';
  p13_detalle: string;
  p14_espacios_conversacion: string[];
  p15_preocupacion_entorno_mujeres: string; // from 16 categories
  p16_conoce_contextos_distintos: 'Sí' | 'No';
  p16_detalle: string;

  // Bloque D. Instituciones y participación pública (P17–P25)
  p17_busco_atencion_institucional: 'Sí' | 'No';
  p18_experiencia_institucional: Record<string, LikertAgreement6> | null; // 3x6 if P17 === 'Sí'
  p19_confianza_institucional: Record<string, InstitutionalTrust5>; // 6x5
  p20_actividades_participacion: string[];
  p21_frecuencia_participacion: 'Frecuentemente' | 'Ocasionalmente' | 'Casi nunca' | 'Nunca';
  p22_dificultades_participacion: string[]; // max 3
  p23_condiciones_habilitadoras: string[]; // max 3
  p24_percepcion_incidencia: Record<string, LikertAgreement6>; // 4x6
  p25_violencia_politica:
    | 'No, nunca'
    | 'Sí, lo he presenciado hacia otras mujeres'
    | 'Sí, lo he vivido directamente'
    | 'Ambas (lo he vivido y presenciado)';
  p25_detalle: string;

  // Bloque E. Tú como mujer: oportunidades y dificultades (P26–P33)
  p26_acceso_derechos: Record<string, AccessDifficulty6>; // 10x6
  p27_ambitos_desventaja: string[];
  p28_situaciones_sexismo: string[];
  p29_impacto_cuidados: Record<string, CareImpactFrequency7>; // 5x7
  p30_abandono_por_temor: 'Sí, varias veces' | 'Sí, alguna vez' | 'No';
  p31_autonomia_decisiones: Record<string, AutonomyLevel7>; // 5x7
  p32_conocimiento_rutas_apoyo:
    | 'Sí, conozco rutas claras y confiables'
    | 'Conozco algunas opciones, pero dudo que funcionen'
    | 'No sé con claridad a dónde acudir';
  p33_apoyo_concreto_cambio: string;

  // Bloque F. Percepción de Somos y otros partidos (P34–P43)
  p34_conoce_somos: 'Sí' | 'No' | 'No estoy segura';
  // P35–P39 son null cuando P34 !== 'Sí' (Lógica de Salto Crítica P34 -> P40)
  p35_nivel_conocimiento_somos:
    | 'Solo he escuchado el nombre'
    | 'Conozco poco'
    | 'Conozco algo'
    | 'Conozco bastante'
    | null;
  p36_opinion_somos:
    | 'Muy buena'
    | 'Buena'
    | 'Regular / Neutral'
    | 'Mala'
    | 'Muy mala'
    | 'Aún no tengo opinión formada'
    | null;
  p37_cercania_somos: 1 | 2 | 3 | 4 | 5 | null;
  p38_recuerda_propuesta_somos: 'Sí' | 'No' | null;
  p38_detalle: string;
  p39_positivos_somos: string;
  p39_criticas_somos: string;

  p40_otros_partidos: string[]; // hasta 3 partidos
  p41_evaluacion_otros_partidos: OtherPartyEvaluation[]; // matriz dinámica generada para P40
  p42_cambio_opinion_6meses:
    | 'Mejoró'
    | 'Empeoró'
    | 'Se mantuvo igual'
    | 'Recién lo escucho aquí';
  p42_motivo: string;
  p43_escucha_social_partidos: 'Sí' | 'No';
  p43_relato: string;
}

export type GeoBiasOption =
  | 'NACIONAL_PONDERADO'
  | 'BAJIO_GUANAJUATO'
  | 'ZMVM_CENTRO'
  | 'SUR_SURESTE'
  | 'NORTE_INDUSTRIAL';

export type SocioCareArchetype =
  | 'MIXTO_NACIONAL'
  | 'ALTA_CARGA_CUIDADOS'
  | 'JOVENES_UNIVERSITARIAS_URBANAS'
  | 'MUJERES_RURALES_ACCESO_LIMITADO'
  | 'ECONOMIA_PROPIA_INFORMAL';

export type SomosPositioningScenario = 'BAJA_15' | 'ORGANICO_40' | 'ALTA_70';

export interface SimulationConfig {
  batchSize: 10 | 50 | 250 | 1000;
  geoBias: GeoBiasOption;
  socioProfile: SocioCareArchetype;
  somosScenario: SomosPositioningScenario;
}

export interface MexicoEntityMeta {
  code: string;
  name: string;
  short: string;
  region: 'Norte' | 'Bajío-Occidente' | 'Centro-ZMVM' | 'Sur-Sureste' | 'Exterior';
  lat: number;
  lng: number;
  // Coordenadas en retícula cartográfica táctica (col 0..12, row 0..7)
  gridX: number;
  gridY: number;
  popWeight: number;
}

export type ActiveModule =
  | 'DASHBOARD'
  | 'SURVEY'
  | 'EXCEL_BATCHES'
  | 'SIMULATOR'
  | 'EXPLORER';
