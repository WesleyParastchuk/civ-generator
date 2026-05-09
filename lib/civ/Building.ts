import { Stats } from './Stats';

export enum BuildingType {
  // City Center
  Monument = 'monument', Granary = 'granary', WaterMill = 'water_mill',
  AncientWalls = 'ancient_walls', MedievalWalls = 'medieval_walls', Palace = 'palace',
  // Campus
  Library = 'library', University = 'university', ResearchLab = 'research_lab',
  // Commercial Hub
  Market = 'market', Bank = 'bank', StockExchange = 'stock_exchange',
  // Holy Site
  Shrine = 'shrine', Temple = 'temple',
  // Industrial Zone
  Workshop = 'workshop', Factory = 'factory', PowerPlant = 'power_plant',
  // Theater Square
  Amphitheater = 'amphitheater', ArtMuseum = 'art_museum', ArchaeologicalMuseum = 'archaeological_museum',
  // Harbor
  Lighthouse = 'lighthouse', Shipyard = 'shipyard', Seaport = 'seaport',
  // Encampment
  Barracks = 'barracks', Armory = 'armory', MilitaryAcademy = 'military_academy',
  // Entertainment Complex
  Arena = 'arena', Zoo = 'zoo', Stadium = 'stadium',
}

export class Building {
  constructor(
    readonly type: BuildingType,
    readonly label: string,
    readonly stats: Stats,
  ) {}
}

export const BUILDING_DATA: Record<BuildingType, { label: string; stats: Stats }> = {
  [BuildingType.Monument]:               { label: 'Monumento',              stats: Stats.of({ culture: 2 }) },
  [BuildingType.Granary]:                { label: 'Celeiro',                stats: Stats.of({ food: 1, housing: 2 }) },
  [BuildingType.WaterMill]:              { label: 'Moinho de Água',         stats: Stats.of({ food: 1, production: 1, housing: 1 }) },
  [BuildingType.AncientWalls]:           { label: 'Muralhas Antigas',       stats: Stats.zero() },
  [BuildingType.MedievalWalls]:          { label: 'Muralhas Medievais',     stats: Stats.zero() },
  [BuildingType.Palace]:                 { label: 'Palácio',                stats: Stats.of({ food: 2, production: 2, gold: 5, science: 2, culture: 2, faith: 1, housing: 1 }) },
  [BuildingType.Library]:                { label: 'Biblioteca',             stats: Stats.of({ science: 2 }) },
  [BuildingType.University]:             { label: 'Universidade',           stats: Stats.of({ science: 4, housing: 1 }) },
  [BuildingType.ResearchLab]:            { label: 'Laboratório de Pesquisa', stats: Stats.of({ science: 5 }) },
  [BuildingType.Market]:                 { label: 'Mercado',                stats: Stats.of({ gold: 3 }) },
  [BuildingType.Bank]:                   { label: 'Banco',                  stats: Stats.of({ gold: 5 }) },
  [BuildingType.StockExchange]:          { label: 'Bolsa de Valores',       stats: Stats.of({ gold: 7 }) },
  [BuildingType.Shrine]:                 { label: 'Santuário',              stats: Stats.of({ faith: 2 }) },
  [BuildingType.Temple]:                 { label: 'Templo',                 stats: Stats.of({ faith: 4 }) },
  [BuildingType.Workshop]:               { label: 'Oficina',                stats: Stats.of({ production: 2 }) },
  [BuildingType.Factory]:                { label: 'Fábrica',                stats: Stats.of({ production: 4 }) },
  [BuildingType.PowerPlant]:             { label: 'Usina de Energia',       stats: Stats.of({ production: 4 }) },
  [BuildingType.Amphitheater]:           { label: 'Anfiteatro',             stats: Stats.of({ culture: 2 }) },
  [BuildingType.ArtMuseum]:              { label: 'Museu de Arte',          stats: Stats.of({ culture: 2 }) },
  [BuildingType.ArchaeologicalMuseum]:   { label: 'Museu Arqueológico',     stats: Stats.of({ culture: 2 }) },
  [BuildingType.Lighthouse]:             { label: 'Farol',                  stats: Stats.of({ food: 1, gold: 1, housing: 1 }) },
  [BuildingType.Shipyard]:               { label: 'Estaleiro',              stats: Stats.of({ production: 1, gold: 1 }) },
  [BuildingType.Seaport]:                { label: 'Porto',                  stats: Stats.of({ gold: 2, production: 2, housing: 1 }) },
  [BuildingType.Barracks]:               { label: 'Quartel',                stats: Stats.of({ production: 1, housing: 1 }) },
  [BuildingType.Armory]:                 { label: 'Armaria',                stats: Stats.of({ production: 2 }) },
  [BuildingType.MilitaryAcademy]:        { label: 'Academia Militar',       stats: Stats.of({ production: 3 }) },
  [BuildingType.Arena]:                  { label: 'Arena',                  stats: Stats.of({ amenities: 1, culture: 1 }) },
  [BuildingType.Zoo]:                    { label: 'Zoológico',              stats: Stats.of({ amenities: 1, science: 1 }) },
  [BuildingType.Stadium]:                { label: 'Estádio',                stats: Stats.of({ amenities: 2, culture: 3 }) },
};

export function makeBuilding(type: BuildingType): Building {
  const data = BUILDING_DATA[type];
  return new Building(type, data.label, data.stats.clone());
}
