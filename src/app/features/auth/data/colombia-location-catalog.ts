export interface NeighborhoodOption {
  value: string;
  label: string;
  commune: number;
}

export const COLOMBIA_DOCUMENT_TYPES = [
  { value: 'CC', label: 'Cedula de ciudadania (CC)' },
  { value: 'CE', label: 'Cedula de extranjeria (CE)' },
  { value: 'TI', label: 'Tarjeta de identidad (TI)' },
  { value: 'RC', label: 'Registro civil (RC)' },
  { value: 'NUIP', label: 'Numero unico de identificacion personal (NUIP)' },
  { value: 'NIT', label: 'Numero de identificacion tributaria (NIT)' },
  { value: 'PASSPORT', label: 'Pasaporte (PASSPORT)' },
  { value: 'PPT', label: 'Permiso por proteccion temporal (PPT)' },
  { value: 'PEP', label: 'Permiso especial de permanencia (PEP)' },
  { value: 'CDI', label: 'Carnet diplomatico de identidad (CDI)' },
  { value: 'SC', label: 'Salvoconducto (SC)' },
  { value: 'AS', label: 'Adulto sin identificacion (AS)' },
  { value: 'MS', label: 'Menor sin identificacion (MS)' },
  { value: 'CN', label: 'Certificado de nacido vivo (CN)' },
] as const;

const CALI_NEIGHBORHOODS_BY_COMMUNE: Record<number, string[]> = {
  1: [
    'Terron Colorado',
    'Vista Hermosa',
    'Aguacatal',
    'Patio Bonito',
    'San Luis',
    'Alto Aguacatal',
    'Brisas de Mayo Norte',
    'La Castilla',
  ],
  2: [
    'Granada',
    'Versalles',
    'Santa Monica Residencial',
    'Santa Monica Popular',
    'Juanambu',
    'Centenario',
    'Normandia',
    'La Flora',
    'Los Andes',
    'Chipichape',
  ],
  3: [
    'San Nicolas',
    'El Calvario',
    'San Pascual',
    'Sucre',
    'Fray Damian',
    'El Hoyo',
    'La Merced',
    'Prados del Norte Centro',
  ],
  4: [
    'San Vicente',
    'Bolivariano',
    'Salomia',
    'La Isla',
    'Flora Industrial',
    'Popular',
    'Marco Fidel Suarez',
    'Evaristo Garcia',
    'Fepicol',
  ],
  5: [
    'La Rivera',
    'Chiminangos I',
    'Chiminangos II',
    'Chiminangos III',
    'Los Guayacanes',
    'Pacara',
    'Parque de la Flora',
    'Brisas de los Alamos',
    'Prados del Norte',
  ],
  6: [
    'Petecuy I',
    'Petecuy II',
    'Petecuy III',
    'Floralia',
    'Calimio Decepaz',
    'San Luis II',
    'Los Guaduales',
    'Ciudadela Comfandi Norte',
    'San Luisito',
  ],
  7: [
    'Alfonso Lopez I',
    'Alfonso Lopez II',
    'Alfonso Lopez III',
    'Puerto Mallarino',
    'Andres Sanin',
    'Siete de Agosto',
    'Base Aerea',
    'Las Ceibas',
    'Mojica Norte',
  ],
  8: [
    'Atanasio Girardot',
    'La Base',
    'Municipal',
    'Primitivo Crespo',
    'Las Americas',
    'Urbanizacion La Base',
    'Villacolombia',
    'Benjamin Herrera',
    'Industrial',
  ],
  9: [
    'Bretaña',
    'Junin',
    'Guayaquil',
    'Alameda',
    'Belen',
    'Aranjuez',
    'Champagnat',
    'Lido',
    'Nueva Tequendama',
  ],
  10: [
    'San Judas',
    'El Dorado',
    'Cristobal Colon',
    'La Selva',
    'Departamental',
    'Panamericano',
    'Urbanizacion Militar',
    'Las Acacias',
    'Santo Domingo',
  ],
  11: [
    'Prados de Oriente',
    'El Prado',
    'Antonio Narino',
    'Eduardo Santos',
    'Doce de Octubre',
    'Villas de Veracruz',
    'Mariano Ramos',
    'Ciudad Modelo',
    'Primero de Mayo',
  ],
  12: [
    'El Rodeo',
    'Nueva Floresta',
    'Villanueva',
    'Sindical',
    'Julio Rincon',
    'El Trebol',
    'Asturias',
    'Los Sauces',
    'Santa Elena',
  ],
  13: [
    'El Poblado I',
    'El Poblado II',
    'El Diamante',
    'Los Comuneros I',
    'Los Comuneros II',
    'Calipso',
    'Lleras Camargo',
    'El Vergel',
    'Ricardo Balcazar',
  ],
  14: [
    'Manuela Beltran',
    'Las Orquideas',
    'Promociones Populares B',
    'Alfonso Bonilla Aragon',
    'Los Naranjos I',
    'Los Naranjos II',
    'Marroquin I',
    'Marroquin II',
    'Marroquin III',
    'Puertas del Sol',
  ],
  15: [
    'Ciudad Cordoba',
    'Vallado',
    'El Retiro',
    'Mojica',
    'Laureano Gomez',
    'El Pondaje',
    'Comuneros III',
    'Promociones Populares A',
    'Los Mangos',
  ],
  16: [
    'Union de Vivienda Popular',
    'Republica de Israel',
    'Mariano Ramos',
    'Ciudad 2000',
    'Canaveralejo Sur',
    'El Gran Limonar',
    'La Alborada',
    'El Ingenio II',
  ],
  17: [
    'El Ingenio',
    'Caney',
    'Ciudadela Comfandi',
    'Valle del Lili',
    'Lili',
    'Bochalema',
    'Pance Urbano',
    'La Hacienda',
    'El Refugio Sur',
  ],
  18: [
    'Melendez',
    'Buenos Aires',
    'Napania',
    'Prados del Sur',
    'Caldas',
    'Los Chorros',
    'Alferez Real',
    'Polvorines',
    'Horizontes',
  ],
  19: [
    'San Fernando Viejo',
    'San Fernando Nuevo',
    'Tequendama',
    'El Cedro',
    'Miraflores',
    'Bellavista',
    'Normandia Sur',
    'Santa Rita',
    'El Penon',
  ],
  20: [
    'Siloe',
    'Brisas de Mayo',
    'Belisario Caicedo',
    'Tierra Blanca',
    'Pueblo Joven',
    'Lleras Camargo Alto',
    'La Sultana',
    'Cortijo',
  ],
  21: [
    'Desepaz',
    'Potrero Grande',
    'Calimio Desepaz',
    'Ciudad Talanga',
    'Pizamos I',
    'Pizamos II',
    'Pizamos III',
    'Ciudadela del Rio',
    'Llano Verde',
  ],
  22: [
    'Ciudad Jardin',
    'Pance',
    'La Buitrera Urbana',
    'Parcelaciones Pance',
    'Valle del Lili Sur',
    'Bochalema Sur',
    'Universidades',
    'Canasgordas',
  ],
};

function dedupeNeighborhoods(items: NeighborhoodOption[]): NeighborhoodOption[] {
  const unique = new Map<string, NeighborhoodOption>();

  for (const item of items) {
    const key = `${item.commune}-${item.value.toLowerCase().trim()}`;
    if (!unique.has(key)) {
      unique.set(key, item);
    }
  }

  return Array.from(unique.values());
}

export function buildCaliNeighborhoodOptions(): NeighborhoodOption[] {
  const all = Object.entries(CALI_NEIGHBORHOODS_BY_COMMUNE).flatMap(
    ([commune, neighborhoods]) =>
      neighborhoods.map((name) => ({
        value: name,
        label: name,
        commune: Number(commune),
      })),
  );

  return dedupeNeighborhoods(all).sort((a, b) => a.label.localeCompare(b.label));
}

export const DEFAULT_LOCATION_CATALOG: Record<string, Record<string, NeighborhoodOption[]>> = {
  'Valle del Cauca': {
    Cali: buildCaliNeighborhoodOptions(),
    Palmira: [],
    Jamundi: [],
    Yumbo: [],
  },
  Antioquia: {
    Medellin: [],
  },
  Cundinamarca: {
    Bogota: [],
  },
};
