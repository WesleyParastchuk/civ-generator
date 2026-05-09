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
