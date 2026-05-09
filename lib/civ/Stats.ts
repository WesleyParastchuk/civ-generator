export class Stats {
  food = 0;
  production = 0;
  science = 0;
  gold = 0;
  culture = 0;
  faith = 0;
  housing = 0;
  amenities = 0;
  appeal = 0;

  add(other: Stats): this {
    this.food += other.food;
    this.production += other.production;
    this.science += other.science;
    this.gold += other.gold;
    this.culture += other.culture;
    this.faith += other.faith;
    this.housing += other.housing;
    this.amenities += other.amenities;
    this.appeal += other.appeal;
    return this;
  }

  scale(n: number): this {
    this.food *= n;
    this.production *= n;
    this.science *= n;
    this.gold *= n;
    this.culture *= n;
    this.faith *= n;
    this.housing *= n;
    this.amenities *= n;
    this.appeal *= n;
    return this;
  }

  clone(): Stats {
    const s = new Stats();
    Object.assign(s, this);
    return s;
  }

  isZero(): boolean {
    return this.food === 0 && this.production === 0 && this.science === 0 &&
           this.gold === 0 && this.culture === 0 && this.faith === 0 &&
           this.housing === 0 && this.amenities === 0 && this.appeal === 0;
  }

  static zero(): Stats {
    return new Stats();
  }

  static of(partial: Partial<Pick<Stats,
    'food' | 'production' | 'science' | 'gold' | 'culture' | 'faith' |
    'housing' | 'amenities' | 'appeal'
  >>): Stats {
    const s = new Stats();
    Object.assign(s, partial);
    return s;
  }
}
