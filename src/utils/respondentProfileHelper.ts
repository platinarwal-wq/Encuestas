import { OrusResponse } from '../types/orus';

const FIRST_NAMES_MX = [
  'María Guadalupe',
  'Ana Sofía',
  'Carmen Elena',
  'Laura Patricia',
  'Rosa María',
  'Fernanda Valeria',
  'Gabriela Alejandra',
  'Claudia Verónica',
  'Adriana Leticia',
  'Daniela Paulina',
  'Juana Francisca',
  'Martha Alicia',
  'Silvia Beatriz',
  'Mariana Ximena',
  'Lucía Carolina',
  'Paola Andrea',
  'Mónica Elizabeth',
  'Verónica Isabel',
  'Norma Angélica',
  'Teresa de Jesús',
  'Sandra Karina',
  'Alejandra Montserrat',
  'Natalia Regina',
  'Irma Yolanda',
  'Diana Cecilia',
  'Rocío Esmeralda',
  'Gloria Estela',
  'Lourdes Margarita',
  'Karla Viridiana',
  'Miriam Araceli',
];

const LAST_NAMES_1_MX = [
  'Hernández',
  'García',
  'Martínez',
  'López',
  'González',
  'Pérez',
  'Rodríguez',
  'Sánchez',
  'Ramírez',
  'Cruz',
  'Flores',
  'Gómez',
  'Morales',
  'Vázquez',
  'Reyes',
  'Jiménez',
  'Torres',
  'Díaz',
  'Gutiérrez',
  'Ruiz',
];

const LAST_NAMES_2_MX = [
  'Mendoza',
  'Aguilar',
  'Ortiz',
  'Moreno',
  'Castillo',
  'Romero',
  'Álvarez',
  'Méndez',
  'Chávez',
  'Rivera',
  'Juárez',
  'Domínguez',
  'Herrera',
  'Medina',
  'Castro',
  'Vargas',
  'Guzmán',
  'Velázquez',
  'Rojas',
  'Salazar',
];

export const MUNICIPIOS_POR_ENTIDAD: Record<string, string[]> = {
  Aguascalientes: ['Aguascalientes Capital', 'Jesús María', 'Calvillo', 'Rincón de Romos'],
  'Baja California': ['Tijuana', 'Mexicali', 'Ensenada', 'Playas de Rosarito', 'Tecate'],
  'Baja California Sur': ['La Paz', 'Los Cabos', 'Comondú', 'Loreto', 'Mulegé'],
  Campeche: ['San Francisco de Campeche', 'Ciudad del Carmen', 'Champotón', 'Escárcega'],
  Chiapas: ['Tuxtla Gutiérrez', 'Tapachula', 'San Cristóbal de las Casas', 'Comitán', 'Palenque'],
  Chihuahua: ['Chihuahua Capital', 'Ciudad Juárez', 'Cuauhtémoc', 'Delicias', 'Parral'],
  'Ciudad de México': ['Iztapalapa', 'Gustavo A. Madero', 'Coyoacán', 'Tlalpan', 'Cuauhtémoc', 'Benito Juárez'],
  Coahuila: ['Saltillo', 'Torreón', 'Monclova', 'Piedras Negras', 'Ramos Arizpe'],
  Colima: ['Colima Capital', 'Manzanillo', 'Villa de Álvarez', 'Tecomán'],
  Durango: ['Victoria de Durango', 'Gómez Palacio', 'Lerdo', 'Santiago Papasquiaro'],
  'Estado de México': ['Ecatepec', 'Nezahualcóyotl', 'Toluca', 'Naucalpan', 'Tlalnepantla', 'Chimalhuacán'],
  Guanajuato: ['León', 'Irapuato', 'Celaya', 'Salamanca', 'Guanajuato Capital', 'Silao'],
  Guerrero: ['Acapulco', 'Chilpancingo', 'Iguala', 'Zihuatanejo', 'Taxco'],
  Hidalgo: ['Pachuca de Soto', 'Mineral de la Reforma', 'Tulancingo', 'Tula de Allende', 'Huejutla'],
  Jalisco: ['Guadalajara', 'Zapopan', 'San Pedro Tlaquepaque', 'Tonalá', 'Puerto Vallarta', 'Tlajomulco'],
  Michoacán: ['Morelia', 'Uruapan', 'Zamora', 'Lázaro Cárdenas', 'Zitácuaro'],
  Morelos: ['Cuernavaca', 'Jiutepec', 'Cuautla', 'Temixco', 'Yautepec'],
  Nayarit: ['Tepic', 'Bahía de Banderas', 'Santiago Ixcuintla', 'Compostela'],
  'Nuevo León': ['Monterrey', 'Guadalupe', 'Apodaca', 'San Nicolás de los Garza', 'General Escobedo'],
  Oaxaca: ['Oaxaca de Juárez', 'Salina Cruz', 'Juchitán de Zaragoza', 'San Juan Bautista Tuxtepec', 'Huajuapan'],
  Puebla: ['Puebla de Zaragoza', 'Tehuacán', 'San Martín Texmelucan', 'San Andrés Cholula', 'Atlixco'],
  Querétaro: ['Santiago de Querétaro', 'San Juan del Río', 'Corregidora', 'El Marqués'],
  'Quintana Roo': ['Cancún (Benito Juárez)', 'Playa del Carmen', 'Chetumal', 'Cozumel', 'Tulum'],
  'San Luis Potosí': ['San Luis Potosí Capital', 'Soledad de Graciano Sánchez', 'Ciudad Valles', 'Matehuala'],
  Sinaloa: ['Culiacán', 'Mazatlán', 'Los Mochis (Ahome)', 'Guasave'],
  Sonora: ['Hermosillo', 'Ciudad Obregón', 'Nogales', 'San Luis Río Colorado', 'Guaymas'],
  Tabasco: ['Villahermosa (Centro)', 'Cárdenas', 'Comalcalco', 'Macuspana'],
  Tamaulipas: ['Reynosa', 'Matamoros', 'Nuevo Laredo', 'Tampico', 'Ciudad Victoria'],
  Tlaxcala: ['Tlaxcala de Xicohténcatl', 'Apizaco', 'Huamantla', 'Chiautempan'],
  Veracruz: ['Veracruz Puerto', 'Xalapa', 'Coatzacoalcos', 'Córdoba', 'Poza Rica', 'Orizaba'],
  Yucatán: ['Mérida', 'Kanasín', 'Valladolid', 'Tizimín', 'Progreso'],
  Zacatecas: ['Zacatecas Capital', 'Guadalupe', 'Fresnillo', 'Jerez'],
  'Fuera de México': ['Los Ángeles, CA', 'Chicago, IL', 'Houston, TX', 'Dallas, TX'],
};

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function generateDeterministicMexicanName(seedKey: string): string {
  const h = hashString(seedKey);
  const fn = FIRST_NAMES_MX[h % FIRST_NAMES_MX.length];
  const ln1 = LAST_NAMES_1_MX[(h >>> 5) % LAST_NAMES_1_MX.length];
  const ln2 = LAST_NAMES_2_MX[(h >>> 11) % LAST_NAMES_2_MX.length];
  return `${fn} ${ln1} ${ln2}`;
}

export function generateDeterministicMunicipio(entidad: string, seedKey: string): string {
  const list = MUNICIPIOS_POR_ENTIDAD[entidad] || [`Zona Centro ${entidad}`];
  const h = hashString(seedKey);
  return list[h % list.length];
}

export function getRespondentDisplayProfile(rec: OrusResponse): {
  nombre: string;
  municipio: string;
  modalidad: string;
  encuestadora: string;
  notas: string;
} {
  const rawAlias = rec.registroCampo?.participanteAlias?.trim() || '';
  const isGenericPlaceholder =
    !rawAlias ||
    rawAlias === 'Participante Anónima' ||
    rawAlias === 'Anónima';

  const nombre = isGenericPlaceholder
    ? generateDeterministicMexicanName(`${rec.folio}_${rec.id}`)
    : rawAlias;

  const municipio =
    rec.registroCampo?.municipioColonia?.trim() ||
    generateDeterministicMunicipio(rec.p2_entidad, `${rec.folio}_${rec.id}`);

  const modalidad =
    rec.registroCampo?.modalidad ||
    (rec.origin === 'REAL' ? 'Entrevista presencial en campo' : 'Encuesta analizada OCEAN');

  const encuestadora =
    rec.registroCampo?.encuestadoraClave?.trim() ||
    (rec.origin === 'REAL' ? 'BRIGADA-CAMPO' : 'ANALISIS-OCEAN');

  const notas = rec.registroCampo?.notasCampo?.trim() || '';

  return {
    nombre,
    municipio,
    modalidad,
    encuestadora,
    notas,
  };
}
