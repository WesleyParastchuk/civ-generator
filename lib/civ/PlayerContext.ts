export enum Civilization {
  None = 'none',
  Brazil = 'brazil',
  Rome = 'rome',
  Egypt = 'egypt',
  Greece = 'greece',
  China = 'china',
  Japan = 'japan',
  America = 'america',
}

export enum Policy {
  None = 'none',
  UrbanPlanning = 'urban_planning',
  GodKing = 'god_king',
  ColonialOffices = 'colonial_offices',
}

export enum Tech {
  None = 'none',
  Pottery = 'pottery',
  Writing = 'writing',
  Sailing = 'sailing',
  Engineering = 'engineering',
}

export class PlayerContext {
  civ: Civilization = Civilization.None;
  activePolicies: Policy[] = [];
  unlockedTechs: Tech[] = [];

  hasPolicy(p: Policy): boolean { return this.activePolicies.includes(p); }
  hasTech(t: Tech): boolean { return this.unlockedTechs.includes(t); }
}
