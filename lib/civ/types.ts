export enum Terrain {
  Fog = 'fog',
  Ocean = 'ocean',
  Coast = 'coast',
  Grassland = 'grassland',
  GrasslandHills = 'grassland_hills',
  Plains = 'plains',
  PlainsHills = 'plains_hills',
  Desert = 'desert',
  DesertHills = 'desert_hills',
  Tundra = 'tundra',
  TundraHills = 'tundra_hills',
  Snow = 'snow',
  SnowHills = 'snow_hills',
  Mountain = 'mountain',
}

export enum Feature {
  None = 'none',
  Forest = 'forest',
  Rainforest = 'rainforest',
  Marsh = 'marsh',
  Floodplains = 'floodplains',
  Oasis = 'oasis',
  Reef = 'reef',
  Ice = 'ice',
}

export enum Resource {
  None = 'none',
  // bonus
  Wheat = 'wheat', Rice = 'rice', Cattle = 'cattle', Sheep = 'sheep',
  Deer = 'deer', Bananas = 'bananas', Fish = 'fish', Crabs = 'crabs',
  Stone = 'stone', Copper = 'copper',
  // luxury
  Wine = 'wine', Silk = 'silk', Citrus = 'citrus', Cotton = 'cotton',
  Diamonds = 'diamonds', Furs = 'furs', Ivory = 'ivory', Jade = 'jade',
  Pearls = 'pearls', Salt = 'salt', Silver = 'silver', Spices = 'spices',
  Sugar = 'sugar', Tea = 'tea', Tobacco = 'tobacco', Truffles = 'truffles',
  // strategic
  Horses = 'horses', Iron = 'iron', Niter = 'niter', Coal = 'coal',
  Oil = 'oil', Aluminum = 'aluminum', Uranium = 'uranium',
}

export enum DistrictType {
  CityCenter = 'city_center',
  Campus = 'campus',
  CommercialHub = 'commercial_hub',
  HolySite = 'holy_site',
  IndustrialZone = 'industrial_zone',
  TheaterSquare = 'theater_square',
  Harbor = 'harbor',
  Encampment = 'encampment',
  EntertainmentComplex = 'entertainment_complex',
  Aqueduct = 'aqueduct',
  Dam = 'dam',
  Neighborhood = 'neighborhood',
  Aerodrome = 'aerodrome',
  Spaceport = 'spaceport',
  GovernmentPlaza = 'government_plaza',
}

export enum WonderType {
  Pyramids = 'pyramids',
  Stonehenge = 'stonehenge',
  HangingGardens = 'hanging_gardens',
  GreatLibrary = 'great_library',
  Oracle = 'oracle',
  Colosseum = 'colosseum',
  Petra = 'petra',
  HagiaSophia = 'hagia_sophia',
  MachuPicchu = 'machu_picchu',
  ChichenItza = 'chichen_itza',
  ForbiddenCity = 'forbidden_city',
  TajMahal = 'taj_mahal',
  Versailles = 'palace_of_versailles',
  BigBen = 'big_ben',
  EiffelTower = 'eiffel_tower',
  StatueOfLiberty = 'statue_of_liberty',
  CristoRedentor = 'cristo_redentor',
}

export enum ToolId {
  Select = 'select',
  Fog = 'fog',
  Terrain = 'terrain',
  Feature = 'feature',
  Resource = 'resource',
  District = 'district',
  Wonder = 'wonder',
  River = 'river',
  Erase = 'erase',
  Pan = 'pan',
}

export const TERRAIN_COLORS: Record<Terrain, string> = {
  [Terrain.Fog]:            '#2a2f38',
  [Terrain.Ocean]:          '#1a3a5c',
  [Terrain.Coast]:          '#2d6a9f',
  [Terrain.Grassland]:      '#4a7c3f',
  [Terrain.GrasslandHills]: '#3d6834',
  [Terrain.Plains]:         '#c8a850',
  [Terrain.PlainsHills]:    '#b09040',
  [Terrain.Desert]:         '#d4b483',
  [Terrain.DesertHills]:    '#c0a070',
  [Terrain.Tundra]:         '#8fa8a0',
  [Terrain.TundraHills]:    '#7a9390',
  [Terrain.Snow]:           '#dde8ee',
  [Terrain.SnowHills]:      '#c8d8e0',
  [Terrain.Mountain]:       '#6b5a4e',
};

export const TERRAIN_LABEL: Record<Terrain, string> = {
  [Terrain.Fog]:            'Névoa',
  [Terrain.Ocean]:          'Oceano',
  [Terrain.Coast]:          'Costa',
  [Terrain.Grassland]:      'Planície Verde',
  [Terrain.GrasslandHills]: 'Colinas Verdes',
  [Terrain.Plains]:         'Planície',
  [Terrain.PlainsHills]:    'Colinas',
  [Terrain.Desert]:         'Deserto',
  [Terrain.DesertHills]:    'Colinas Desérticas',
  [Terrain.Tundra]:         'Tundra',
  [Terrain.TundraHills]:    'Colinas Tundra',
  [Terrain.Snow]:           'Neve',
  [Terrain.SnowHills]:      'Colinas Nevadas',
  [Terrain.Mountain]:       'Montanha',
};

export const FEATURE_LABEL: Record<Feature, string> = {
  [Feature.None]:        'Nenhuma',
  [Feature.Forest]:      'Floresta',
  [Feature.Rainforest]:  'Floresta Tropical',
  [Feature.Marsh]:       'Pântano',
  [Feature.Floodplains]: 'Planície Inundada',
  [Feature.Oasis]:       'Oásis',
  [Feature.Reef]:        'Recife',
  [Feature.Ice]:         'Gelo',
};

export const FEATURE_COLOR: Record<Feature, string> = {
  [Feature.None]:        '#555555',
  [Feature.Forest]:      '#228b22',
  [Feature.Rainforest]:  '#006400',
  [Feature.Marsh]:       '#4a5c3f',
  [Feature.Floodplains]: '#7ab800',
  [Feature.Oasis]:       '#a0c830',
  [Feature.Reef]:        '#0099cc',
  [Feature.Ice]:         '#cce8ff',
};

export const RESOURCE_LABEL: Record<Resource, string> = {
  [Resource.None]:      'Nenhum',
  [Resource.Wheat]:     'Trigo',
  [Resource.Rice]:      'Arroz',
  [Resource.Cattle]:    'Gado',
  [Resource.Sheep]:     'Ovelha',
  [Resource.Deer]:      'Veado',
  [Resource.Bananas]:   'Banana',
  [Resource.Fish]:      'Peixe',
  [Resource.Crabs]:     'Caranguejo',
  [Resource.Stone]:     'Pedra',
  [Resource.Copper]:    'Cobre',
  [Resource.Wine]:      'Vinho',
  [Resource.Silk]:      'Seda',
  [Resource.Citrus]:    'Cítricos',
  [Resource.Cotton]:    'Algodão',
  [Resource.Diamonds]:  'Diamantes',
  [Resource.Furs]:      'Peles',
  [Resource.Ivory]:     'Marfim',
  [Resource.Jade]:      'Jade',
  [Resource.Pearls]:    'Pérolas',
  [Resource.Salt]:      'Sal',
  [Resource.Silver]:    'Prata',
  [Resource.Spices]:    'Especiarias',
  [Resource.Sugar]:     'Açúcar',
  [Resource.Tea]:       'Chá',
  [Resource.Tobacco]:   'Tabaco',
  [Resource.Truffles]:  'Trufas',
  [Resource.Horses]:    'Cavalos',
  [Resource.Iron]:      'Ferro',
  [Resource.Niter]:     'Salitre',
  [Resource.Coal]:      'Carvão',
  [Resource.Oil]:       'Petróleo',
  [Resource.Aluminum]:  'Alumínio',
  [Resource.Uranium]:   'Urânio',
};

export const RESOURCE_COLOR: Record<Resource, string> = {
  [Resource.None]:      '#555555',
  // bonus
  [Resource.Wheat]:     '#c8a850', [Resource.Rice]:     '#c8a850',
  [Resource.Cattle]:    '#c8a850', [Resource.Sheep]:    '#c8a850',
  [Resource.Deer]:      '#c8a850', [Resource.Bananas]:  '#c8a850',
  [Resource.Fish]:      '#c8a850', [Resource.Crabs]:    '#c8a850',
  [Resource.Stone]:     '#c8a850', [Resource.Copper]:   '#c8a850',
  // luxury
  [Resource.Wine]:      '#9b59b6', [Resource.Silk]:     '#9b59b6',
  [Resource.Citrus]:    '#9b59b6', [Resource.Cotton]:   '#9b59b6',
  [Resource.Diamonds]:  '#9b59b6', [Resource.Furs]:     '#9b59b6',
  [Resource.Ivory]:     '#9b59b6', [Resource.Jade]:     '#9b59b6',
  [Resource.Pearls]:    '#9b59b6', [Resource.Salt]:     '#9b59b6',
  [Resource.Silver]:    '#9b59b6', [Resource.Spices]:   '#9b59b6',
  [Resource.Sugar]:     '#9b59b6', [Resource.Tea]:      '#9b59b6',
  [Resource.Tobacco]:   '#9b59b6', [Resource.Truffles]: '#9b59b6',
  // strategic
  [Resource.Horses]:    '#7f8c8d', [Resource.Iron]:     '#7f8c8d',
  [Resource.Niter]:     '#7f8c8d', [Resource.Coal]:     '#7f8c8d',
  [Resource.Oil]:       '#7f8c8d', [Resource.Aluminum]: '#7f8c8d',
  [Resource.Uranium]:   '#7f8c8d',
};

export function isHills(t: Terrain): boolean {
  return t === Terrain.GrasslandHills || t === Terrain.PlainsHills ||
         t === Terrain.DesertHills || t === Terrain.TundraHills ||
         t === Terrain.SnowHills;
}

export function isWater(t: Terrain): boolean {
  return t === Terrain.Ocean || t === Terrain.Coast;
}

export function isImpassable(t: Terrain): boolean {
  return t === Terrain.Mountain;
}
