export type Position = 'GK' | 'DEF' | 'MID' | 'FWD'

export interface Player {
  name:     string
  number:   number
  position: Position
  club:     string
  caps?:    number
  goals?:   number
}

// Keys match the exact team names used in the matches table.
export const ROSTERS: Record<string, Player[]> = {

  // ── GROUP A ──────────────────────────────────────────────────────────────────

  Mexico: [
    { name: 'Guillermo Ochoa',    number:  1, position: 'GK',  club: 'Salernitana',       caps: 148, goals: 0 },
    { name: 'Jesús Gallardo',     number: 23, position: 'DEF', club: 'Monterrey',          caps:  72, goals: 2 },
    { name: 'César Montes',       number:  3, position: 'DEF', club: 'Espanyol',           caps:  46, goals: 3 },
    { name: 'Edson Álvarez',      number: 18, position: 'MID', club: 'West Ham United',    caps:  83, goals: 5 },
    { name: 'Héctor Herrera',     number: 16, position: 'MID', club: 'Houston Dynamo',     caps: 109, goals: 12 },
    { name: 'Hirving Lozano',     number: 22, position: 'FWD', club: 'PSV Eindhoven',      caps:  88, goals: 19 },
    { name: 'Raúl Jiménez',       number:  9, position: 'FWD', club: 'Fulham',             caps: 108, goals: 36 },
    { name: 'Henry Martín',       number: 14, position: 'FWD', club: 'Club América',        caps:  49, goals: 16 },
    { name: 'Roberto Alvarado',   number: 25, position: 'MID', club: 'Guadalajara',        caps:  36, goals: 5 },
  ],

  'South Africa': [
    { name: 'Ronwen Williams',    number:  1, position: 'GK',  club: 'SuperSport United',  caps:  54, goals: 0 },
    { name: 'Siyanda Xulu',       number:  5, position: 'DEF', club: 'Hellas Verona',      caps:  43, goals: 1 },
    { name: 'Rushine De Reuck',   number: 15, position: 'DEF', club: 'Coventry City',      caps:  24, goals: 2 },
    { name: 'Teboho Mokoena',     number:  8, position: 'MID', club: 'SuperSport United',  caps:  47, goals: 7 },
    { name: 'Yusuf Maart',        number: 12, position: 'MID', club: 'Kaizer Chiefs',       caps:  24, goals: 2 },
    { name: 'Themba Zwane',       number: 10, position: 'MID', club: 'Mamelodi Sundowns',  caps:  55, goals: 10 },
    { name: 'Percy Tau',          number: 11, position: 'FWD', club: 'Al Ahly',             caps:  73, goals: 16 },
    { name: 'Lyle Foster',        number:  9, position: 'FWD', club: 'Burnley',             caps:  27, goals: 6 },
    { name: 'Evidence Makgopa',   number: 19, position: 'FWD', club: 'Bafana Bafana',      caps:  22, goals: 8 },
  ],

  'South Korea': [
    { name: 'Jo Hyeon-woo',       number:  1, position: 'GK',  club: 'Ulsan HD',           caps:  42, goals: 0 },
    { name: 'Kim Min-jae',        number:  3, position: 'DEF', club: 'Bayern Munich',       caps:  63, goals: 5 },
    { name: 'Kim Jin-su',         number: 12, position: 'DEF', club: 'Jeonbuk Hyundai',    caps:  62, goals: 1 },
    { name: 'Hwang In-beom',      number:  6, position: 'MID', club: 'Feyenoord',           caps:  52, goals: 5 },
    { name: 'Jung Woo-young',     number:  5, position: 'MID', club: 'Al-Qadsiah',         caps:  67, goals: 0 },
    { name: 'Lee Jae-sung',       number: 14, position: 'MID', club: 'Mainz 05',            caps:  70, goals: 9 },
    { name: 'Son Heung-min',      number:  7, position: 'FWD', club: 'Tottenham Hotspur',  caps: 124, goals: 37 },
    { name: 'Hwang Hee-chan',     number: 11, position: 'FWD', club: 'Wolverhampton',       caps:  65, goals: 14 },
    { name: 'Cho Gue-sung',       number: 17, position: 'FWD', club: 'Midtjylland',        caps:  32, goals: 14 },
  ],

  Czechia: [
    { name: 'Jiří Pavlenka',      number:  1, position: 'GK',  club: 'Werder Bremen',      caps:  38, goals: 0 },
    { name: 'Vladimír Coufal',    number:  2, position: 'DEF', club: 'West Ham United',    caps:  44, goals: 1 },
    { name: 'Tomáš Holeš',        number:  5, position: 'DEF', club: 'Slavia Prague',      caps:  30, goals: 2 },
    { name: 'Tomáš Souček',       number:  6, position: 'MID', club: 'West Ham United',    caps:  70, goals: 12 },
    { name: 'Lukáš Provod',       number: 11, position: 'MID', club: 'Slavia Prague',      caps:  28, goals: 3 },
    { name: 'Alex Král',          number:  8, position: 'MID', club: 'Spartak Moscow',     caps:  38, goals: 1 },
    { name: 'Patrik Schick',      number:  9, position: 'FWD', club: 'Bayer Leverkusen',   caps:  55, goals: 24 },
    { name: 'Adam Hložek',        number: 18, position: 'FWD', club: 'Bayer Leverkusen',   caps:  24, goals: 5 },
    { name: 'Ondřej Lingr',       number: 16, position: 'FWD', club: 'Feyenoord',          caps:  14, goals: 4 },
  ],

  // ── GROUP B ──────────────────────────────────────────────────────────────────

  Canada: [
    { name: 'Maxime Crépeau',     number:  1, position: 'GK',  club: 'LA Galaxy',          caps:  43, goals: 0 },
    { name: 'Alistair Johnston',  number:  2, position: 'DEF', club: 'Celtic',              caps:  34, goals: 1 },
    { name: 'Kamal Miller',       number:  5, position: 'DEF', club: 'Middlesbrough',       caps:  40, goals: 2 },
    { name: 'Atiba Hutchinson',   number: 13, position: 'MID', club: 'Beşiktaş',           caps: 102, goals: 12 },
    { name: 'Stephen Eustáquio',  number: 16, position: 'MID', club: 'Porto',               caps:  43, goals: 6 },
    { name: 'Jonathan Osorio',    number:  7, position: 'MID', club: 'Toronto FC',         caps:  68, goals: 10 },
    { name: 'Alphonso Davies',    number: 19, position: 'DEF', club: 'Bayern Munich',       caps:  59, goals: 13 },
    { name: 'Jonathan David',     number:  9, position: 'FWD', club: 'Lille',               caps:  54, goals: 28 },
    { name: 'Cyle Larin',         number: 17, position: 'FWD', club: 'Club Brugge',        caps:  60, goals: 26 },
  ],

  Bosnia: [
    { name: 'Nikola Vasilj',      number:  1, position: 'GK',  club: 'St. Pauli',          caps:  22, goals: 0 },
    { name: 'Anel Ahmedhodžić',   number:  5, position: 'DEF', club: 'Sheffield United',   caps:  26, goals: 2 },
    { name: 'Sead Kolašinac',     number: 13, position: 'DEF', club: 'Marseille',           caps:  54, goals: 2 },
    { name: 'Gojko Cimirot',      number: 14, position: 'MID', club: 'Standard Liège',     caps:  51, goals: 2 },
    { name: 'Amer Gojak',         number:  8, position: 'MID', club: 'Dinamo Zagreb',       caps:  34, goals: 5 },
    { name: 'Denis Huseinbašić',  number: 20, position: 'MID', club: '1. FC Köln',         caps:  18, goals: 2 },
    { name: 'Armin Hodžić',       number:  9, position: 'FWD', club: 'Adana Demirspor',    caps:  34, goals: 11 },
    { name: 'Ermedin Demirović',  number: 11, position: 'FWD', club: 'Augsburg',            caps:  29, goals: 10 },
    { name: 'Veldin Karić',       number: 17, position: 'FWD', club: 'Club Brugge',        caps:  20, goals: 4 },
  ],

  Qatar: [
    { name: 'Meshaal Barsham',    number: 22, position: 'GK',  club: 'Al-Sadd',            caps:  24, goals: 0 },
    { name: 'Pedro Miguel',       number:  3, position: 'DEF', club: 'Al-Sadd',            caps:  45, goals: 3 },
    { name: 'Abdelkarim Hassan',  number: 13, position: 'DEF', club: 'Al-Sadd',            caps:  78, goals: 8 },
    { name: 'Assim Madibo',       number:  8, position: 'MID', club: 'Al-Duhail',          caps:  31, goals: 2 },
    { name: 'Karim Boudiaf',      number:  6, position: 'MID', club: 'Al-Duhail',          caps:  66, goals: 2 },
    { name: 'Akram Afif',         number: 11, position: 'MID', club: 'Al-Sadd',            caps:  76, goals: 25 },
    { name: 'Almoez Ali',         number: 19, position: 'FWD', club: 'Al-Duhail',          caps:  88, goals: 44 },
    { name: 'Hasan Al-Haydos',    number: 10, position: 'FWD', club: 'Al-Sadd',            caps: 115, goals: 25 },
    { name: 'Mohammed Muntari',   number:  9, position: 'FWD', club: 'Al-Duhail',          caps:  24, goals: 9 },
  ],

  Switzerland: [
    { name: 'Yann Sommer',        number:  1, position: 'GK',  club: 'Inter Milan',        caps:  87, goals: 0 },
    { name: 'Manuel Akanji',      number:  5, position: 'DEF', club: 'Manchester City',    caps:  55, goals: 3 },
    { name: 'Ricardo Rodríguez',  number: 13, position: 'DEF', club: 'Torino',              caps:  91, goals: 9 },
    { name: 'Granit Xhaka',       number: 10, position: 'MID', club: 'Bayer Leverkusen',   caps: 122, goals: 16 },
    { name: 'Remo Freuler',       number: 11, position: 'MID', club: 'Nottingham Forest',  caps:  68, goals: 5 },
    { name: 'Denis Zakaria',      number:  8, position: 'MID', club: 'AS Monaco',           caps:  38, goals: 3 },
    { name: 'Breel Embolo',       number:  7, position: 'FWD', club: 'AS Monaco',           caps:  64, goals: 17 },
    { name: 'Xherdan Shaqiri',    number: 23, position: 'FWD', club: 'Chicago Fire',       caps: 110, goals: 27 },
    { name: 'Noah Okafor',        number: 17, position: 'FWD', club: 'AC Milan',            caps:  26, goals: 6 },
  ],

  // ── GROUP C ──────────────────────────────────────────────────────────────────

  Brazil: [
    { name: 'Alisson Becker',     number:  1, position: 'GK',  club: 'Liverpool',          caps:  83, goals: 1 },
    { name: 'Marquinhos',         number:  4, position: 'DEF', club: 'PSG',                caps: 101, goals: 11 },
    { name: 'Éder Militão',       number:  3, position: 'DEF', club: 'Real Madrid',        caps:  42, goals: 4 },
    { name: 'Danilo',             number:  2, position: 'DEF', club: 'Juventus',            caps:  84, goals: 7 },
    { name: 'Casemiro',           number:  5, position: 'MID', club: 'Manchester United',  caps: 101, goals: 9 },
    { name: 'Lucas Paquetá',      number: 10, position: 'MID', club: 'West Ham United',    caps:  55, goals: 10 },
    { name: 'Bruno Guimarães',    number: 17, position: 'MID', club: 'Newcastle United',   caps:  38, goals: 4 },
    { name: 'Vinicius Jr',        number:  7, position: 'FWD', club: 'Real Madrid',        caps:  47, goals: 21 },
    { name: 'Rodrygo',            number: 11, position: 'FWD', club: 'Real Madrid',        caps:  32, goals: 12 },
    { name: 'Richarlison',        number:  9, position: 'FWD', club: 'Tottenham Hotspur',  caps:  57, goals: 21 },
  ],

  Morocco: [
    { name: 'Yassine Bounou',     number:  1, position: 'GK',  club: 'Al-Hilal',           caps:  51, goals: 0 },
    { name: 'Achraf Hakimi',      number:  2, position: 'DEF', club: 'PSG',                caps:  75, goals: 14 },
    { name: 'Nayef Aguerd',       number:  5, position: 'DEF', club: 'West Ham United',    caps:  41, goals: 5 },
    { name: 'Noussair Mazraoui',  number: 12, position: 'DEF', club: 'Manchester United',  caps:  40, goals: 4 },
    { name: 'Sofyan Amrabat',     number:  4, position: 'MID', club: 'Fenerbahçe',         caps:  68, goals: 2 },
    { name: 'Azzedine Ounahi',    number:  8, position: 'MID', club: 'Marseille',           caps:  34, goals: 2 },
    { name: 'Hakim Ziyech',       number:  7, position: 'FWD', club: 'Galatasaray',        caps:  63, goals: 21 },
    { name: 'Youssef En-Nesyri',  number:  9, position: 'FWD', club: 'Fenerbahçe',         caps:  62, goals: 22 },
    { name: 'Soufiane Boufal',    number: 11, position: 'FWD', club: 'Southampton',        caps:  58, goals: 9 },
  ],

  Haiti: [
    { name: 'Josué Duverger',     number:  1, position: 'GK',  club: 'Kavala FC',          caps:  22, goals: 0 },
    { name: 'Mechack Jérôme',     number:  5, position: 'DEF', club: 'Montreal Impact',    caps:  52, goals: 2 },
    { name: 'Pascal Métayer',     number:  3, position: 'DEF', club: 'Orlando City',       caps:  38, goals: 1 },
    { name: 'Duckens Nazon',      number: 10, position: 'MID', club: 'Troyes',             caps:  48, goals: 13 },
    { name: 'Nicolas Janvier',    number:  6, position: 'MID', club: 'Racing Louisville',  caps:  31, goals: 3 },
    { name: 'Derrick Etienne Jr', number: 11, position: 'MID', club: 'Columbus Crew',      caps:  29, goals: 5 },
    { name: 'Frantzdy Pierrot',   number:  9, position: 'FWD', club: 'Guingamp',           caps:  37, goals: 11 },
    { name: 'Stéphane Abaul',     number: 17, position: 'FWD', club: 'Toulouse FC',        caps:  26, goals: 6 },
    { name: 'Nicky Haynes',       number: 19, position: 'FWD', club: 'Inter Miami',        caps:  18, goals: 4 },
  ],

  Scotland: [
    { name: 'Angus Gunn',         number:  1, position: 'GK',  club: 'Norwich City',       caps:  22, goals: 0 },
    { name: 'Andrew Robertson',   number:  3, position: 'DEF', club: 'Liverpool',          caps:  70, goals: 5 },
    { name: 'Kieran Tierney',     number:  5, position: 'DEF', club: 'Real Sociedad',      caps:  56, goals: 1 },
    { name: 'Scott McKenna',      number:  6, position: 'DEF', club: 'Nottingham Forest',  caps:  42, goals: 4 },
    { name: 'John McGinn',        number:  7, position: 'MID', club: 'Aston Villa',        caps:  79, goals: 14 },
    { name: 'Callum McGregor',    number:  8, position: 'MID', club: 'Celtic',              caps:  55, goals: 4 },
    { name: 'Billy Gilmour',      number: 11, position: 'MID', club: 'Brighton',            caps:  32, goals: 1 },
    { name: 'Che Adams',          number:  9, position: 'FWD', club: 'Southampton',        caps:  33, goals: 8 },
    { name: 'Lyndon Dykes',       number: 20, position: 'FWD', club: 'QPR',                caps:  40, goals: 12 },
    { name: 'Ryan Christie',      number: 14, position: 'MID', club: 'Bournemouth',        caps:  49, goals: 8 },
  ],

  // ── GROUP D ──────────────────────────────────────────────────────────────────

  USA: [
    { name: 'Matt Turner',        number:  1, position: 'GK',  club: 'Nottingham Forest',  caps:  34, goals: 0 },
    { name: 'Sergiño Dest',       number:  2, position: 'DEF', club: 'PSV Eindhoven',      caps:  29, goals: 2 },
    { name: 'Miles Robinson',     number:  5, position: 'DEF', club: 'Atlanta United',     caps:  28, goals: 4 },
    { name: 'Antonee Robinson',   number: 15, position: 'DEF', club: 'Fulham',              caps:  40, goals: 4 },
    { name: 'Tyler Adams',        number:  4, position: 'MID', club: 'Bournemouth',        caps:  47, goals: 1 },
    { name: 'Weston McKennie',    number:  8, position: 'MID', club: 'Juventus',            caps:  46, goals: 9 },
    { name: 'Yunus Musah',        number:  6, position: 'MID', club: 'AC Milan',            caps:  32, goals: 1 },
    { name: 'Christian Pulisic',  number: 10, position: 'FWD', club: 'AC Milan',            caps:  77, goals: 31 },
    { name: 'Josh Sargent',       number:  9, position: 'FWD', club: 'Norwich City',       caps:  36, goals: 9 },
    { name: 'Folarin Balogun',    number: 16, position: 'FWD', club: 'Monaco',              caps:  10, goals: 5 },
  ],

  Paraguay: [
    { name: 'Antony Silva',       number:  1, position: 'GK',  club: 'Olimpia',            caps:  53, goals: 0 },
    { name: 'Gustavo Gómez',      number:  3, position: 'DEF', club: 'Palmeiras',          caps:  69, goals: 9 },
    { name: 'Junior Alonso',      number:  4, position: 'DEF', club: 'Atlético Mineiro',   caps:  36, goals: 3 },
    { name: 'Robert Rojas',       number:  6, position: 'DEF', club: 'River Plate',        caps:  48, goals: 3 },
    { name: 'Miguel Almirón',     number: 10, position: 'MID', club: 'Newcastle United',   caps:  67, goals: 12 },
    { name: 'Ángel Romero',       number:  7, position: 'MID', club: 'Corinthians',        caps:  61, goals: 15 },
    { name: 'Mathías Villasanti', number:  8, position: 'MID', club: 'Grêmio',             caps:  35, goals: 2 },
    { name: 'Antonio Sanabria',   number:  9, position: 'FWD', club: 'Torino',              caps:  52, goals: 13 },
    { name: 'Julio Enciso',       number: 11, position: 'FWD', club: 'Brighton',            caps:  25, goals: 7 },
  ],

  Australia: [
    { name: 'Mat Ryan',           number:  1, position: 'GK',  club: 'AZ Alkmaar',         caps:  84, goals: 0 },
    { name: 'Miloš Degenek',      number:  6, position: 'DEF', club: 'Columbus Crew',      caps:  57, goals: 2 },
    { name: 'Harry Souttar',      number:  5, position: 'DEF', club: 'Leicester City',     caps:  28, goals: 5 },
    { name: 'Aziz Behich',        number: 16, position: 'DEF', club: 'Dundee United',      caps:  48, goals: 2 },
    { name: 'Aaron Mooy',         number: 13, position: 'MID', club: 'Celtic',              caps:  64, goals: 7 },
    { name: 'Jackson Irvine',     number:  8, position: 'MID', club: 'St. Pauli',          caps:  68, goals: 14 },
    { name: 'Riley McGree',       number: 13, position: 'MID', club: 'Middlesbrough',       caps:  35, goals: 7 },
    { name: 'Mathew Leckie',      number:  7, position: 'FWD', club: 'Melbourne City',     caps:  87, goals: 14 },
    { name: 'Mitchell Duke',      number: 20, position: 'FWD', club: 'Fagiano Okayama',    caps:  42, goals: 11 },
    { name: 'Martin Boyle',       number: 11, position: 'FWD', club: 'Al-Faisaly',         caps:  38, goals: 10 },
  ],

  Turkiye: [
    { name: 'Altay Bayındır',     number:  1, position: 'GK',  club: 'Manchester United',  caps:  14, goals: 0 },
    { name: 'Merih Demiral',      number:  3, position: 'DEF', club: 'Al-Qadsiah',         caps:  45, goals: 7 },
    { name: 'Çağlar Söyüncü',     number:  4, position: 'DEF', club: 'Atlético Madrid',    caps:  48, goals: 3 },
    { name: 'Zeki Çelik',         number:  2, position: 'DEF', club: 'Roma',                caps:  38, goals: 1 },
    { name: 'Hakan Çalhanoğlu',   number: 10, position: 'MID', club: 'Inter Milan',        caps:  85, goals: 19 },
    { name: 'Salih Özcan',        number:  8, position: 'MID', club: 'Borussia Dortmund',  caps:  25, goals: 0 },
    { name: 'Kaan Ayhan',         number:  5, position: 'MID', club: 'Galatasaray',        caps:  36, goals: 2 },
    { name: 'Kerem Aktürkoğlu',   number: 11, position: 'FWD', club: 'Galatasaray',        caps:  32, goals: 8 },
    { name: 'Yusuf Yazıcı',       number:  7, position: 'FWD', club: 'LOSC Lille',         caps:  37, goals: 8 },
    { name: 'Cenk Tosun',         number: 17, position: 'FWD', club: 'Beşiktaş',           caps:  48, goals: 17 },
  ],

  // ── GROUP E ──────────────────────────────────────────────────────────────────

  Germany: [
    { name: 'Manuel Neuer',       number:  1, position: 'GK',  club: 'Bayern Munich',      caps: 119, goals: 1 },
    { name: 'Antonio Rüdiger',    number:  2, position: 'DEF', club: 'Real Madrid',        caps:  79, goals: 5 },
    { name: 'Joshua Kimmich',     number:  6, position: 'MID', club: 'Bayern Munich',      caps:  88, goals: 8 },
    { name: 'David Raum',         number: 16, position: 'DEF', club: 'RB Leipzig',         caps:  33, goals: 4 },
    { name: 'Ilkay Gündoğan',     number: 21, position: 'MID', club: 'Barcelona',          caps: 103, goals: 19 },
    { name: 'Leon Goretzka',      number:  8, position: 'MID', club: 'Bayern Munich',      caps:  57, goals: 15 },
    { name: 'Jamal Musiala',      number: 10, position: 'FWD', club: 'Bayern Munich',      caps:  37, goals: 10 },
    { name: 'Florian Wirtz',      number: 17, position: 'FWD', club: 'Bayer Leverkusen',   caps:  22, goals: 8 },
    { name: 'Leroy Sané',         number: 19, position: 'FWD', club: 'Bayern Munich',      caps:  60, goals: 16 },
    { name: 'Kai Havertz',        number: 11, position: 'FWD', club: 'Arsenal',             caps:  55, goals: 21 },
  ],

  Curacao: [
    { name: 'Eloy Room',          number:  1, position: 'GK',  club: 'Columbus Crew',      caps:  38, goals: 0 },
    { name: 'Cuco Martina',       number:  2, position: 'DEF', club: 'Retired',            caps:  45, goals: 1 },
    { name: 'Rangelo Janga',      number:  5, position: 'DEF', club: 'SC Telstar',         caps:  28, goals: 2 },
    { name: 'Riechedly Bazoer',   number:  4, position: 'DEF', club: 'Vitesse',            caps:  22, goals: 1 },
    { name: 'Leandro Bacuna',     number:  6, position: 'MID', club: 'Cardiff City',       caps:  48, goals: 8 },
    { name: 'Juninho',            number:  8, position: 'MID', club: 'NEC Nijmegen',       caps:  32, goals: 4 },
    { name: 'Gevero Markiet',     number: 11, position: 'FWD', club: 'FC Dordrecht',       caps:  24, goals: 5 },
    { name: 'Jafar Arias',        number:  9, position: 'FWD', club: 'Almere City',        caps:  22, goals: 6 },
    { name: 'Jurien Gaari',       number: 17, position: 'FWD', club: 'Jong AZ',            caps:  16, goals: 3 },
  ],

  'Ivory Coast': [
    { name: 'Badra Ali Sangaré',  number:  1, position: 'GK',  club: 'Wydad AC',           caps:  35, goals: 0 },
    { name: 'Serge Aurier',       number: 24, position: 'DEF', club: 'Nottingham Forest',  caps:  72, goals: 7 },
    { name: 'Eric Bailly',        number:  3, position: 'DEF', club: 'OGC Nice',           caps:  42, goals: 2 },
    { name: 'Simon Deli',         number: 21, position: 'DEF', club: 'Club Brugge',        caps:  30, goals: 1 },
    { name: 'Seko Fofana',        number:  8, position: 'MID', club: 'Al-Qadsiah',         caps:  43, goals: 4 },
    { name: 'Franck Kessié',      number:  4, position: 'MID', club: 'Al-Ahli',            caps:  76, goals: 15 },
    { name: 'Ibrahim Sangaré',    number: 14, position: 'MID', club: 'Nottingham Forest',  caps:  32, goals: 2 },
    { name: 'Sébastien Haller',   number:  9, position: 'FWD', club: 'Borussia Dortmund',  caps:  42, goals: 16 },
    { name: 'Nicolas Pépé',       number: 19, position: 'FWD', club: 'OGC Nice',           caps:  55, goals: 14 },
    { name: 'Wilfried Zaha',      number: 11, position: 'FWD', club: 'Galatasaray',        caps:  37, goals: 6 },
  ],

  Ecuador: [
    { name: 'Hernán Galíndez',    number:  1, position: 'GK',  club: 'Athletic Bilbao',    caps:  48, goals: 0 },
    { name: 'Piero Hincapié',     number:  3, position: 'DEF', club: 'Bayer Leverkusen',   caps:  39, goals: 2 },
    { name: 'Pervis Estupiñán',   number:  7, position: 'DEF', club: 'Brighton',            caps:  52, goals: 6 },
    { name: 'Ángelo Preciado',    number:  2, position: 'DEF', club: 'Genk',               caps:  36, goals: 2 },
    { name: 'Moisés Caicedo',     number: 10, position: 'MID', club: 'Chelsea',             caps:  42, goals: 3 },
    { name: 'Carlos Gruezo',      number: 13, position: 'MID', club: 'Augsburg',            caps:  53, goals: 1 },
    { name: 'Jeremy Sarmiento',   number: 11, position: 'MID', club: 'Brighton',            caps:  24, goals: 3 },
    { name: 'Enner Valencia',     number: 13, position: 'FWD', club: 'Internacional',       caps: 108, goals: 42 },
    { name: 'Michael Estrada',    number:  9, position: 'FWD', club: 'Cruz Azul',           caps:  40, goals: 12 },
    { name: 'Djorkaeff Reasco',   number: 17, position: 'FWD', club: 'Tigres UANL',        caps:  22, goals: 4 },
  ],

  // ── GROUP F ──────────────────────────────────────────────────────────────────

  Netherlands: [
    { name: 'Mark Flekken',       number:  1, position: 'GK',  club: 'Brentford',          caps:  15, goals: 0 },
    { name: 'Virgil van Dijk',    number:  4, position: 'DEF', club: 'Liverpool',          caps:  68, goals: 6 },
    { name: 'Matthijs de Ligt',   number:  3, position: 'DEF', club: 'Manchester United',  caps:  54, goals: 5 },
    { name: 'Denzel Dumfries',    number: 22, position: 'DEF', club: 'Inter Milan',        caps:  58, goals: 10 },
    { name: 'Frenkie de Jong',    number: 21, position: 'MID', club: 'Barcelona',          caps:  60, goals: 4 },
    { name: 'Tijjani Reijnders',  number:  6, position: 'MID', club: 'AC Milan',            caps:  22, goals: 4 },
    { name: 'Teun Koopmeiners',   number:  8, position: 'MID', club: 'Juventus',            caps:  38, goals: 8 },
    { name: 'Cody Gakpo',         number: 11, position: 'FWD', club: 'Liverpool',          caps:  40, goals: 15 },
    { name: 'Memphis Depay',      number: 10, position: 'FWD', club: 'Atlético Madrid',    caps:  96, goals: 44 },
    { name: 'Xavi Simons',        number: 17, position: 'FWD', club: 'RB Leipzig',         caps:  16, goals: 5 },
  ],

  Japan: [
    { name: 'Shuichi Gonda',      number: 12, position: 'GK',  club: 'Shimizu S-Pulse',    caps:  50, goals: 0 },
    { name: 'Hiroki Sakai',       number:  5, position: 'DEF', club: 'Urawa Red Diamonds', caps:  68, goals: 4 },
    { name: 'Ko Itakura',         number: 16, position: 'DEF', club: 'Borussia M\'gladbach',caps: 38, goals: 3 },
    { name: 'Wataru Endo',        number:  3, position: 'MID', club: 'Liverpool',          caps:  61, goals: 3 },
    { name: 'Hidemasa Morita',    number:  6, position: 'MID', club: 'Sporting CP',        caps:  44, goals: 2 },
    { name: 'Daichi Kamada',      number: 10, position: 'MID', club: 'Crystal Palace',     caps:  41, goals: 9 },
    { name: 'Kaoru Mitoma',       number:  9, position: 'FWD', club: 'Brighton',            caps:  30, goals: 7 },
    { name: 'Takumi Minamino',    number: 10, position: 'FWD', club: 'Monaco',              caps:  62, goals: 21 },
    { name: 'Ritsu Doan',         number:  8, position: 'FWD', club: 'SC Freiburg',        caps:  53, goals: 18 },
    { name: 'Ayase Ueda',         number: 20, position: 'FWD', club: 'Feyenoord',          caps:  22, goals: 9 },
  ],

  Sweden: [
    { name: 'Robin Olsen',        number:  1, position: 'GK',  club: 'Aston Villa',        caps:  56, goals: 0 },
    { name: 'Victor Lindelöf',    number:  6, position: 'DEF', club: 'Manchester United',  caps:  63, goals: 5 },
    { name: 'Isak Hien',          number:  5, position: 'DEF', club: 'Atalanta',            caps:  22, goals: 2 },
    { name: 'Emil Krafth',        number: 13, position: 'DEF', club: 'Newcastle United',   caps:  24, goals: 0 },
    { name: 'Mattias Svanberg',   number:  8, position: 'MID', club: 'Wolfsburg',           caps:  36, goals: 4 },
    { name: 'Dejan Kulusevski',   number: 10, position: 'MID', club: 'Tottenham Hotspur',  caps:  44, goals: 9 },
    { name: 'Emil Forsberg',      number: 10, position: 'MID', club: 'RB Leipzig',         caps:  68, goals: 20 },
    { name: 'Alexander Isak',     number: 11, position: 'FWD', club: 'Newcastle United',   caps:  40, goals: 12 },
    { name: 'Viktor Gyökeres',    number:  9, position: 'FWD', club: 'Sporting CP',        caps:  24, goals: 11 },
  ],

  Tunisia: [
    { name: 'Aymen Dahmen',       number:  1, position: 'GK',  club: 'Montpellier',        caps:  22, goals: 0 },
    { name: 'Montassar Talbi',    number: 21, position: 'DEF', club: 'Lorient',             caps:  27, goals: 2 },
    { name: 'Dylan Bronn',        number:  5, position: 'DEF', club: 'Salernitana',         caps:  32, goals: 2 },
    { name: 'Ellyes Skhiri',      number:  6, position: 'MID', club: 'Eintracht Frankfurt', caps:  55, goals: 4 },
    { name: 'Ferjani Sassi',      number:  8, position: 'MID', club: 'Al-Wahda',           caps:  74, goals: 12 },
    { name: 'Anis Ben Slimane',   number: 14, position: 'MID', club: 'Brøndby IF',         caps:  22, goals: 3 },
    { name: 'Youssef Msakni',     number: 10, position: 'FWD', club: 'Al-Arabi',           caps:  91, goals: 22 },
    { name: 'Issam Jebali',       number:  9, position: 'FWD', club: 'Wisła Kraków',       caps:  40, goals: 12 },
    { name: 'Seifeddine Jaziri',  number: 11, position: 'FWD', club: 'FC Zurich',          caps:  33, goals: 8 },
  ],

  // ── GROUP G ──────────────────────────────────────────────────────────────────

  Belgium: [
    { name: 'Thibaut Courtois',   number:  1, position: 'GK',  club: 'Real Madrid',        caps:  106, goals: 0 },
    { name: 'Arthur Theate',      number:  3, position: 'DEF', club: 'Rennes',              caps:  26, goals: 3 },
    { name: 'Thomas Meunier',     number:  2, position: 'DEF', club: 'Trabzonspor',        caps:  68, goals: 12 },
    { name: 'Jan Vertonghen',     number:  5, position: 'DEF', club: 'Anderlecht',         caps: 159, goals: 10 },
    { name: 'Kevin De Bruyne',    number:  7, position: 'MID', club: 'Manchester City',    caps: 103, goals: 26 },
    { name: 'Youri Tielemans',    number:  8, position: 'MID', club: 'Aston Villa',        caps:  74, goals: 14 },
    { name: 'Leandro Trossard',   number: 11, position: 'MID', club: 'Arsenal',             caps:  40, goals: 7 },
    { name: 'Romelu Lukaku',      number:  9, position: 'FWD', club: 'Roma',                caps: 121, goals: 77 },
    { name: 'Lois Openda',        number: 10, position: 'FWD', club: 'RB Leipzig',         caps:  22, goals: 8 },
    { name: 'Dodi Lukebakio',     number: 17, position: 'FWD', club: 'Sevilla',             caps:  28, goals: 6 },
  ],

  Egypt: [
    { name: 'Mohamed El-Shenawy', number:  1, position: 'GK',  club: 'Al Ahly',             caps:  52, goals: 0 },
    { name: 'Ahmed Hegazi',       number:  5, position: 'DEF', club: 'Al-Ittihad',         caps:  78, goals: 5 },
    { name: 'Omar Kamal Hamid',   number: 12, position: 'DEF', club: 'Al Ahly',             caps:  28, goals: 1 },
    { name: 'Ayman Ashraf',       number: 21, position: 'DEF', club: 'Al Ahly',             caps:  30, goals: 1 },
    { name: 'Tarek Hamed',        number:  8, position: 'MID', club: 'Al-Qadsiah',         caps:  50, goals: 1 },
    { name: 'Emam Ashour',        number: 14, position: 'MID', club: 'Al Ahly',             caps:  32, goals: 4 },
    { name: 'Mohamed Salah',      number: 10, position: 'FWD', club: 'Liverpool',          caps: 100, goals: 59 },
    { name: 'Omar Marmoush',      number:  7, position: 'FWD', club: 'Manchester City',    caps:  34, goals: 13 },
    { name: 'Mustafa Mohamed',    number:  9, position: 'FWD', club: 'Galatasaray',        caps:  32, goals: 15 },
  ],

  Iran: [
    { name: 'Alireza Beiranvand', number:  1, position: 'GK',  club: 'Club Brugge',        caps:  69, goals: 0 },
    { name: 'Ehsan Hajsafi',      number:  3, position: 'DEF', club: 'AEK Athens',         caps:  98, goals: 7 },
    { name: 'Majid Hosseini',     number:  4, position: 'DEF', club: 'Kayserispor',        caps:  38, goals: 2 },
    { name: 'Shoja Khalilzadeh', number: 25, position: 'DEF', club: 'Al-Shabab',          caps:  42, goals: 3 },
    { name: 'Saeid Ezatolahi',    number:  6, position: 'MID', club: 'Cercle Brugge',      caps:  54, goals: 1 },
    { name: 'Ahmad Nourollahi',   number: 15, position: 'MID', club: 'Kayserispor',        caps:  41, goals: 4 },
    { name: 'Ali Gholizadeh',     number: 11, position: 'MID', club: 'Chartres FC',        caps:  38, goals: 6 },
    { name: 'Sardar Azmoun',      number: 20, position: 'FWD', club: 'Bayer Leverkusen',   caps:  70, goals: 46 },
    { name: 'Mehdi Taremi',       number:  9, position: 'FWD', club: 'Inter Milan',        caps:  86, goals: 47 },
    { name: 'Saman Ghoddos',      number: 11, position: 'FWD', club: 'Brentford',          caps:  46, goals: 11 },
  ],

  'New Zealand': [
    { name: 'Stefan Marinovic',   number:  1, position: 'GK',  club: 'Vancouver Whitecaps',caps: 38, goals: 0 },
    { name: 'Winston Reid',       number:  5, position: 'DEF', club: 'Brentford',           caps:  45, goals: 3 },
    { name: 'Tommy Smith',        number:  2, position: 'DEF', club: 'Ipswich Town',        caps:  40, goals: 1 },
    { name: 'Bill Tuiloma',       number:  4, position: 'DEF', club: 'Portland Timbers',   caps:  34, goals: 3 },
    { name: 'Liberato Cacace',    number:  3, position: 'DEF', club: 'Empoli',              caps:  26, goals: 1 },
    { name: 'Callum McCowatt',    number: 14, position: 'MID', club: 'Hearts',              caps:  24, goals: 3 },
    { name: 'Marko Stamenic',     number:  6, position: 'MID', club: 'Auckland FC',        caps:  18, goals: 2 },
    { name: 'Chris Wood',         number:  9, position: 'FWD', club: 'Nottingham Forest',  caps:  66, goals: 31 },
    { name: 'Kosta Barbarouses',  number: 11, position: 'FWD', club: 'LA Galaxy',          caps:  60, goals: 14 },
    { name: 'Sarpreet Singh',     number: 10, position: 'FWD', club: 'Jahn Regensburg',    caps:  30, goals: 7 },
  ],

  // ── GROUP H ──────────────────────────────────────────────────────────────────

  Spain: [
    { name: 'Unai Simón',         number:  1, position: 'GK',  club: 'Athletic Bilbao',    caps:  28, goals: 0 },
    { name: 'Dani Carvajal',      number:  2, position: 'DEF', club: 'Real Madrid',        caps:  50, goals: 3 },
    { name: 'Aymeric Laporte',    number: 14, position: 'DEF', club: 'Al-Nassr',           caps:  26, goals: 2 },
    { name: 'Robin Le Normand',   number:  4, position: 'DEF', club: 'Atlético Madrid',    caps:  10, goals: 1 },
    { name: 'Rodri',              number: 16, position: 'MID', club: 'Manchester City',    caps:  55, goals: 13 },
    { name: 'Pedri',              number: 26, position: 'MID', club: 'Barcelona',          caps:  36, goals: 4 },
    { name: 'Fabián Ruiz',        number: 18, position: 'MID', club: 'PSG',                caps:  34, goals: 5 },
    { name: 'Lamine Yamal',       number: 19, position: 'FWD', club: 'Barcelona',          caps:  12, goals: 4 },
    { name: 'Álvaro Morata',      number:  7, position: 'FWD', club: 'AC Milan',            caps:  74, goals: 35 },
    { name: 'Nico Williams',      number: 17, position: 'FWD', club: 'Athletic Bilbao',    caps:  15, goals: 5 },
  ],

  'Cape Verde': [
    { name: 'Vozinha',            number:  1, position: 'GK',  club: 'Vitória de Setúbal',  caps: 38, goals: 0 },
    { name: 'Roberto Lopes',      number: 15, position: 'DEF', club: 'Shamrock Rovers',    caps:  32, goals: 5 },
    { name: 'Stopira',            number:  4, position: 'DEF', club: 'Vitória SC',         caps:  52, goals: 2 },
    { name: 'Júlio Tavares',      number:  3, position: 'DEF', club: 'Brest',              caps:  24, goals: 1 },
    { name: 'Kenny Rocha Santos', number:  8, position: 'MID', club: 'Santa Clara',        caps:  26, goals: 2 },
    { name: 'Jamiro Monteiro',    number: 10, position: 'MID', club: 'FC Cincinnati',      caps:  44, goals: 6 },
    { name: 'Ryan Mendes',        number: 11, position: 'MID', club: 'Angers',              caps:  42, goals: 8 },
    { name: 'Garry Rodrigues',    number:  7, position: 'FWD', club: 'Galatasaray',        caps:  46, goals: 12 },
    { name: 'Djaniny Tavares',    number:  9, position: 'FWD', club: 'Al Ahly',             caps:  48, goals: 18 },
  ],

  'Saudi Arabia': [
    { name: 'Mohammed Al-Owais',  number:  1, position: 'GK',  club: 'Al-Hilal',           caps:  55, goals: 0 },
    { name: 'Saud Abdulhamid',    number:  2, position: 'DEF', club: 'Roma',                caps:  34, goals: 2 },
    { name: 'Ali Al-Bulaihi',     number: 13, position: 'DEF', club: 'Al-Hilal',           caps:  58, goals: 2 },
    { name: 'Hassan Al-Tambakti', number:  6, position: 'DEF', club: 'Al-Hilal',           caps:  28, goals: 2 },
    { name: 'Riyadh Sharahili',   number:  5, position: 'MID', club: 'Al-Hilal',           caps:  35, goals: 1 },
    { name: 'Ali Al-Hassan',      number:  8, position: 'MID', club: 'Al-Qadsiah',         caps:  22, goals: 3 },
    { name: 'Salem Al-Dawsari',   number: 10, position: 'FWD', club: 'Al-Hilal',           caps:  74, goals: 22 },
    { name: 'Firas Al-Buraikan',  number:  9, position: 'FWD', club: 'Al-Fateh',           caps:  46, goals: 21 },
    { name: 'Hattan Bahebri',     number: 11, position: 'FWD', club: 'Al-Shabab',          caps:  32, goals: 9 },
  ],

  Uruguay: [
    { name: 'Sergio Rochet',      number:  1, position: 'GK',  club: 'Nacional',            caps:  26, goals: 0 },
    { name: 'José María Giménez', number:  2, position: 'DEF', club: 'Atlético Madrid',    caps:  65, goals: 4 },
    { name: 'Ronald Araújo',      number:  4, position: 'DEF', club: 'Barcelona',          caps:  32, goals: 3 },
    { name: 'Mathías Olivera',    number:  3, position: 'DEF', club: 'Napoli',              caps:  28, goals: 2 },
    { name: 'Federico Valverde',  number: 14, position: 'MID', club: 'Real Madrid',        caps:  55, goals: 9 },
    { name: 'Rodrigo Bentancur',  number:  5, position: 'MID', club: 'Tottenham Hotspur',  caps:  61, goals: 5 },
    { name: 'Lucas Torreira',     number:  6, position: 'MID', club: 'Galatasaray',        caps:  54, goals: 3 },
    { name: 'Darwin Núñez',       number: 11, position: 'FWD', club: 'Liverpool',          caps:  43, goals: 18 },
    { name: 'Facundo Torres',     number: 17, position: 'FWD', club: 'Orlando City',       caps:  22, goals: 7 },
    { name: 'Maximiliano Gómez',  number:  9, position: 'FWD', club: 'Valencia',            caps:  38, goals: 11 },
  ],

  // ── GROUP I ──────────────────────────────────────────────────────────────────

  France: [
    { name: 'Mike Maignan',       number: 16, position: 'GK',  club: 'AC Milan',            caps:  20, goals: 0 },
    { name: 'Théo Hernández',     number: 22, position: 'DEF', club: 'AC Milan',            caps:  38, goals: 7 },
    { name: 'William Saliba',     number: 17, position: 'DEF', club: 'Arsenal',             caps:  16, goals: 1 },
    { name: 'Benjamin Pavard',    number:  5, position: 'DEF', club: 'Inter Milan',        caps:  56, goals: 5 },
    { name: 'N\'Golo Kanté',       number: 13, position: 'MID', club: 'Al-Ittihad',         caps:  56, goals: 2 },
    { name: 'Aurélien Tchouaméni',number:  8, position: 'MID', club: 'Real Madrid',        caps:  28, goals: 2 },
    { name: 'Eduardo Camavinga',  number:  6, position: 'MID', club: 'Real Madrid',        caps:  22, goals: 2 },
    { name: 'Kylian Mbappé',      number: 10, position: 'FWD', club: 'Real Madrid',        caps:  80, goals: 48 },
    { name: 'Antoine Griezmann',  number:  7, position: 'FWD', club: 'Atlético Madrid',    caps: 132, goals: 56 },
    { name: 'Ousmane Dembélé',    number: 11, position: 'FWD', club: 'PSG',                caps:  56, goals: 13 },
  ],

  Senegal: [
    { name: 'Édouard Mendy',      number: 16, position: 'GK',  club: 'Al-Ahli',            caps:  41, goals: 0 },
    { name: 'Kalidou Koulibaly',  number:  3, position: 'DEF', club: 'Al-Hilal',           caps:  72, goals: 6 },
    { name: 'Abdou Diallo',       number:  5, position: 'DEF', club: 'RB Leipzig',         caps:  41, goals: 3 },
    { name: 'Youssouf Sabaly',    number: 22, position: 'DEF', club: 'Real Betis',         caps:  38, goals: 2 },
    { name: 'Idrissa Gueye',      number: 15, position: 'MID', club: 'Everton',             caps:  88, goals: 4 },
    { name: 'Pape Matar Sarr',    number: 16, position: 'MID', club: 'Tottenham Hotspur',  caps:  24, goals: 3 },
    { name: 'Cheikhou Kouyaté',   number:  8, position: 'MID', club: 'Nottingham Forest',  caps:  78, goals: 8 },
    { name: 'Sadio Mané',         number: 10, position: 'FWD', club: 'Al-Nassr',           caps: 101, goals: 38 },
    { name: 'Ismaïla Sarr',       number: 23, position: 'FWD', club: 'Crystal Palace',     caps:  55, goals: 15 },
    { name: 'Boulaye Dia',        number: 13, position: 'FWD', club: 'Lazio',               caps:  28, goals: 9 },
  ],

  Iraq: [
    { name: 'Mohammed Hamid',     number:  1, position: 'GK',  club: 'Al-Zawraa',          caps:  38, goals: 0 },
    { name: 'Ali Adnan',          number:  3, position: 'DEF', club: 'Fatih Karagümrük',   caps:  72, goals: 5 },
    { name: 'Ahmed Ibrahim',      number:  5, position: 'DEF', club: 'Al-Shorta',          caps:  34, goals: 2 },
    { name: 'Rebin Sulaka',       number: 14, position: 'DEF', club: 'Örebro SK',          caps:  22, goals: 1 },
    { name: 'Aymen Hussein',      number: 17, position: 'MID', club: 'Al-Zawraa',          caps:  44, goals: 8 },
    { name: 'Saad Abdul Amir',    number:  8, position: 'MID', club: 'Al-Quwa Al-Jawiya', caps:  36, goals: 5 },
    { name: 'Amjed Attwan',       number:  6, position: 'MID', club: 'Al-Naft',            caps:  28, goals: 3 },
    { name: 'Mohanad Ali',        number:  9, position: 'FWD', club: 'Al-Zawraa',          caps:  52, goals: 18 },
    { name: 'Bashar Resan',       number: 11, position: 'FWD', club: 'Shabab Al-Ahli',     caps:  40, goals: 11 },
    { name: 'Alaa Abbas',         number: 20, position: 'FWD', club: 'Al-Shorta',          caps:  30, goals: 7 },
  ],

  Norway: [
    { name: 'Ørjan Nyland',       number:  1, position: 'GK',  club: 'Brentford',          caps:  42, goals: 0 },
    { name: 'Kristoffer Ajer',    number:  5, position: 'DEF', club: 'Brentford',          caps:  38, goals: 1 },
    { name: 'Andreas Hanche-Olsen',number: 6, position: 'DEF', club: 'Hoffenheim',         caps:  22, goals: 2 },
    { name: 'Leo Østigård',       number: 24, position: 'DEF', club: 'Napoli',              caps:  24, goals: 1 },
    { name: 'Martin Ødegaard',    number:  8, position: 'MID', club: 'Arsenal',             caps:  63, goals: 12 },
    { name: 'Sander Berge',       number:  6, position: 'MID', club: 'Fulham',              caps:  44, goals: 7 },
    { name: 'Mohamed Elyounoussi',number: 18, position: 'MID', club: 'Celtic',              caps:  68, goals: 18 },
    { name: 'Erling Haaland',     number:  9, position: 'FWD', club: 'Manchester City',    caps:  32, goals: 27 },
    { name: 'Alexander Sørloth',  number: 20, position: 'FWD', club: 'Atlético Madrid',    caps:  52, goals: 25 },
    { name: 'Jørgen Strand Larsen',number:21, position: 'FWD', club: 'Celta Vigo',         caps:  22, goals: 9 },
  ],

  // ── GROUP J ──────────────────────────────────────────────────────────────────

  Argentina: [
    { name: 'Emiliano Martínez',  number: 23, position: 'GK',  club: 'Aston Villa',        caps:  38, goals: 0 },
    { name: 'Nicolás Otamendi',   number: 19, position: 'DEF', club: 'Benfica',             caps:  97, goals: 5 },
    { name: 'Cristian Romero',    number: 13, position: 'DEF', club: 'Tottenham Hotspur',  caps:  32, goals: 3 },
    { name: 'Nahuel Molina',      number: 26, position: 'DEF', club: 'Atlético Madrid',    caps:  35, goals: 5 },
    { name: 'Rodrigo De Paul',    number:  7, position: 'MID', club: 'Atlético Madrid',    caps:  66, goals: 10 },
    { name: 'Enzo Fernández',     number: 24, position: 'MID', club: 'Chelsea',             caps:  34, goals: 5 },
    { name: 'Alexis Mac Allister',number: 20, position: 'MID', club: 'Liverpool',          caps:  34, goals: 8 },
    { name: 'Lionel Messi',       number: 10, position: 'FWD', club: 'Inter Miami',        caps: 191, goals: 109 },
    { name: 'Julián Álvarez',     number:  9, position: 'FWD', club: 'Atlético Madrid',    caps:  33, goals: 21 },
    { name: 'Lautaro Martínez',   number: 22, position: 'FWD', club: 'Inter Milan',        caps:  64, goals: 30 },
  ],

  Algeria: [
    { name: 'Raïs M\'Bolhi',       number:  1, position: 'GK',  club: 'Al-Ettifaq',         caps:  80, goals: 0 },
    { name: 'Ramy Bensebaini',    number:  3, position: 'DEF', club: 'Borussia Dortmund',  caps:  44, goals: 6 },
    { name: 'Djamel Benlamri',    number:  4, position: 'DEF', club: 'Lyon',                caps:  38, goals: 1 },
    { name: 'Youcef Atal',        number:  2, position: 'DEF', club: 'OGC Nice',           caps:  36, goals: 6 },
    { name: 'Ismaël Bennacer',    number:  8, position: 'MID', club: 'AC Milan',            caps:  54, goals: 2 },
    { name: 'Houssem Aouar',      number: 10, position: 'MID', club: 'Roma',                caps:  32, goals: 4 },
    { name: 'Saïd Benrahma',      number: 14, position: 'MID', club: 'Lyon',                caps:  44, goals: 8 },
    { name: 'Riyad Mahrez',       number:  7, position: 'FWD', club: 'Al-Ahli',            caps:  90, goals: 35 },
    { name: 'Andy Delort',        number:  9, position: 'FWD', club: 'Al-Qadsiah',         caps:  26, goals: 6 },
    { name: 'Youcef Belaïli',     number: 11, position: 'FWD', club: 'Sharjah FC',         caps:  52, goals: 18 },
  ],

  Austria: [
    { name: 'Patrick Pentz',      number:  1, position: 'GK',  club: 'Bayer Leverkusen',   caps:  18, goals: 0 },
    { name: 'David Alaba',        number:  8, position: 'DEF', club: 'Real Madrid',        caps: 103, goals: 16 },
    { name: 'Philipp Lienhart',   number:  5, position: 'DEF', club: 'SC Freiburg',        caps:  26, goals: 2 },
    { name: 'Stefan Posch',       number: 14, position: 'DEF', club: 'Bologna',             caps:  22, goals: 2 },
    { name: 'Florian Grillitsch', number:  8, position: 'MID', club: 'Hoffenheim',         caps:  42, goals: 5 },
    { name: 'Nicolas Seiwald',    number:  6, position: 'MID', club: 'RB Leipzig',         caps:  24, goals: 1 },
    { name: 'Marcel Sabitzer',    number:  7, position: 'MID', club: 'Borussia Dortmund',  caps:  66, goals: 15 },
    { name: 'Marko Arnautović',   number:  9, position: 'FWD', club: 'Inter Milan',        caps: 106, goals: 37 },
    { name: 'Christoph Baumgartner',number:18,position: 'FWD', club: 'RB Leipzig',         caps:  32, goals: 9 },
    { name: 'Michael Gregoritsch',number: 11, position: 'FWD', club: 'SC Freiburg',        caps:  44, goals: 14 },
  ],

  Jordan: [
    { name: 'Amer Shafi',         number:  1, position: 'GK',  club: 'Al-Jazeera',         caps:  48, goals: 0 },
    { name: 'Yazan Al-Naimat',    number:  3, position: 'DEF', club: 'Al-Faisaly',         caps:  34, goals: 1 },
    { name: 'Baha\' Abdulrahman', number:  5, position: 'DEF', club: 'Al-Qadsia',          caps:  30, goals: 2 },
    { name: 'Moath Abu-Nima',     number: 14, position: 'DEF', club: 'Al-Wehdeh',         caps:  26, goals: 1 },
    { name: 'Musa Al-Taamari',    number:  7, position: 'MID', club: 'Montpellier',        caps:  38, goals: 10 },
    { name: 'Nour Al-Rawabdeh',   number:  8, position: 'MID', club: 'Al-Faisaly',         caps:  24, goals: 3 },
    { name: 'Khalil Bani Attiyeh',number:  6, position: 'MID', club: 'Al-Jazeera',         caps:  36, goals: 4 },
    { name: 'Laith Al-Olayan',    number: 10, position: 'FWD', club: 'Al-Ahli Amman',     caps:  32, goals: 9 },
    { name: 'Mousa Suleiman',     number:  9, position: 'FWD', club: 'Al-Faisaly',         caps:  28, goals: 8 },
  ],

  // ── GROUP K ──────────────────────────────────────────────────────────────────

  Portugal: [
    { name: 'Diogo Costa',        number:  1, position: 'GK',  club: 'Porto',               caps:  24, goals: 0 },
    { name: 'Rúben Dias',         number:  6, position: 'DEF', club: 'Manchester City',    caps:  57, goals: 6 },
    { name: 'Nuno Mendes',        number: 19, position: 'DEF', club: 'PSG',                caps:  28, goals: 2 },
    { name: 'João Cancelo',       number: 20, position: 'DEF', club: 'Barcelona',          caps:  54, goals: 5 },
    { name: 'Bruno Fernandes',    number:  8, position: 'MID', club: 'Manchester United',  caps:  68, goals: 18 },
    { name: 'Bernardo Silva',     number: 10, position: 'MID', club: 'Manchester City',    caps:  72, goals: 12 },
    { name: 'Vitinha',            number: 16, position: 'MID', club: 'PSG',                caps:  24, goals: 2 },
    { name: 'Cristiano Ronaldo',  number:  7, position: 'FWD', club: 'Al-Nassr',           caps: 215, goals: 136 },
    { name: 'Rafael Leão',        number: 17, position: 'FWD', club: 'AC Milan',            caps:  32, goals: 10 },
    { name: 'Gonçalo Ramos',      number: 15, position: 'FWD', club: 'PSG',                caps:  20, goals: 12 },
  ],

  'DR Congo': [
    { name: 'Joël Kiassumbua',    number:  1, position: 'GK',  club: 'Beerschot',          caps:  38, goals: 0 },
    { name: 'Chancel Mbemba',     number: 22, position: 'DEF', club: 'Marseille',           caps:  52, goals: 4 },
    { name: 'Marcel Tisserand',   number:  5, position: 'DEF', club: 'Fenerbahçe',         caps:  44, goals: 2 },
    { name: 'Arthur Masuaku',     number:  3, position: 'DEF', club: 'Besiktas',            caps:  36, goals: 3 },
    { name: 'Gaël Kakuta',        number: 10, position: 'MID', club: 'Amiens SC',           caps:  48, goals: 8 },
    { name: 'Silas',              number:  7, position: 'MID', club: 'VfB Stuttgart',       caps:  22, goals: 4 },
    { name: 'Théo Bongonda',      number: 17, position: 'MID', club: 'Genk',               caps:  26, goals: 5 },
    { name: 'Yoane Wissa',        number:  9, position: 'FWD', club: 'Brentford',          caps:  28, goals: 9 },
    { name: 'Cédric Bakambu',     number: 14, position: 'FWD', club: 'Olympiacos',         caps:  52, goals: 16 },
  ],

  Uzbekistan: [
    { name: 'Eldorbek Smatov',    number: 12, position: 'GK',  club: 'Lokomotiv Tashkent', caps:  22, goals: 0 },
    { name: 'Jasurbek Yakhshiboev',number:5,  position: 'DEF', club: 'Pakhtakor',          caps:  28, goals: 2 },
    { name: 'Akbar Turgunov',     number:  3, position: 'DEF', club: 'Pakhtakor',          caps:  34, goals: 1 },
    { name: 'Husan Abduraximov',  number:  4, position: 'DEF', club: 'Lokomotiv Tashkent', caps:  24, goals: 1 },
    { name: 'Jaloliddin Masharipov',number:10,position: 'MID', club: 'Pakhtakor',          caps:  48, goals: 10 },
    { name: 'Abbosbek Fayzullaev',number: 17, position: 'MID', club: 'CSKA Moscow',        caps:  32, goals: 7 },
    { name: 'Otabek Shukurov',    number:  8, position: 'MID', club: 'Pakhtakor',          caps:  28, goals: 3 },
    { name: 'Eldor Shomurodov',   number: 20, position: 'FWD', club: 'Roma',                caps:  54, goals: 18 },
    { name: 'Sherzod Nasrullayev',number: 11, position: 'FWD', club: 'Pakhtakor',          caps:  24, goals: 7 },
  ],

  Colombia: [
    { name: 'Camilo Vargas',      number:  1, position: 'GK',  club: 'Atlas',               caps:  35, goals: 0 },
    { name: 'Dávinson Sánchez',   number:  2, position: 'DEF', club: 'Galatasaray',        caps:  62, goals: 6 },
    { name: 'Daniel Muñoz',       number: 12, position: 'DEF', club: 'Crystal Palace',     caps:  22, goals: 2 },
    { name: 'Yerry Mina',         number: 13, position: 'DEF', club: 'Fiorentina',         caps:  52, goals: 10 },
    { name: 'James Rodríguez',    number: 10, position: 'MID', club: 'Rayo Vallecano',     caps:  99, goals: 31 },
    { name: 'Wilmar Barrios',     number:  5, position: 'MID', club: 'Zenit St. Petersburg',caps: 58, goals: 1 },
    { name: 'Richard Ríos',       number: 16, position: 'MID', club: 'Palmeiras',          caps:  20, goals: 3 },
    { name: 'Luis Díaz',          number:  7, position: 'FWD', club: 'Liverpool',          caps:  46, goals: 19 },
    { name: 'Jhon Durán',         number:  9, position: 'FWD', club: 'Aston Villa',        caps:  14, goals: 6 },
    { name: 'Cucho Hernández',    number: 11, position: 'FWD', club: 'Columbus Crew',      caps:  30, goals: 12 },
  ],

  // ── GROUP L ──────────────────────────────────────────────────────────────────

  England: [
    { name: 'Jordan Pickford',    number:  1, position: 'GK',  club: 'Everton',             caps:  62, goals: 0 },
    { name: 'Trent Alexander-Arnold',number:66,position:'DEF', club: 'Real Madrid',        caps:  36, goals: 3 },
    { name: 'John Stones',        number:  5, position: 'DEF', club: 'Manchester City',    caps:  67, goals: 4 },
    { name: 'Luke Shaw',          number: 23, position: 'DEF', club: 'Manchester United',  caps:  37, goals: 2 },
    { name: 'Declan Rice',        number:  4, position: 'MID', club: 'Arsenal',             caps:  45, goals: 5 },
    { name: 'Jude Bellingham',    number: 22, position: 'MID', club: 'Real Madrid',        caps:  32, goals: 10 },
    { name: 'Phil Foden',         number: 47, position: 'MID', club: 'Manchester City',    caps:  34, goals: 4 },
    { name: 'Harry Kane',         number:  9, position: 'FWD', club: 'Bayern Munich',      caps:  97, goals: 68 },
    { name: 'Bukayo Saka',        number: 17, position: 'FWD', club: 'Arsenal',             caps:  38, goals: 14 },
    { name: 'Ollie Watkins',      number: 18, position: 'FWD', club: 'Aston Villa',        caps:  22, goals: 7 },
  ],

  Croatia: [
    { name: 'Dominik Livaković',  number:  1, position: 'GK',  club: 'Fenerbahçe',         caps:  48, goals: 0 },
    { name: 'Joško Gvardiol',     number: 24, position: 'DEF', club: 'Manchester City',    caps:  42, goals: 5 },
    { name: 'Šime Vrsaljko',      number:  2, position: 'DEF', club: 'Atlético Madrid',    caps:  59, goals: 4 },
    { name: 'Dejan Lovren',       number:  6, position: 'DEF', club: 'Zenit St. Petersburg',caps: 74, goals: 7 },
    { name: 'Luka Modrić',        number: 10, position: 'MID', club: 'Real Madrid',        caps: 174, goals: 24 },
    { name: 'Mateo Kovačić',      number:  8, position: 'MID', club: 'Manchester City',    caps:  98, goals: 8 },
    { name: 'Lovro Majer',        number: 13, position: 'MID', club: 'Real Betis',         caps:  30, goals: 7 },
    { name: 'Andrej Kramarić',    number:  9, position: 'FWD', club: 'Hoffenheim',         caps:  80, goals: 37 },
    { name: 'Ivan Perišić',       number:  4, position: 'FWD', club: 'Hajduk Split',       caps: 138, goals: 37 },
    { name: 'Bruno Petković',     number: 16, position: 'FWD', club: 'Dinamo Zagreb',       caps:  34, goals: 9 },
  ],

  Ghana: [
    { name: 'Lawrence Ati-Zigi',  number:  1, position: 'GK',  club: 'St. Gallen',         caps:  32, goals: 0 },
    { name: 'Alexander Djiku',    number:  5, position: 'DEF', club: 'Fenerbahçe',         caps:  36, goals: 1 },
    { name: 'Daniel Amartey',     number: 21, position: 'DEF', club: 'Besiktas',            caps:  44, goals: 3 },
    { name: 'Abdul-Rahman Baba',  number:  3, position: 'DEF', club: 'Reading',             caps:  42, goals: 1 },
    { name: 'Thomas Partey',      number:  5, position: 'MID', club: 'Arsenal',             caps:  48, goals: 14 },
    { name: 'Mohammed Kudus',     number: 14, position: 'MID', club: 'West Ham United',    caps:  34, goals: 10 },
    { name: 'Salis Abdul Samed',  number: 18, position: 'MID', club: 'RC Lens',             caps:  22, goals: 2 },
    { name: 'Inaki Williams',     number:  7, position: 'FWD', club: 'Athletic Bilbao',    caps:  22, goals: 6 },
    { name: 'Jordan Ayew',        number:  9, position: 'FWD', club: 'Crystal Palace',     caps:  93, goals: 22 },
    { name: 'Antoine Semenyo',    number: 11, position: 'FWD', club: 'Bournemouth',        caps:  18, goals: 5 },
  ],

  Panama: [
    { name: 'Luis Mejía',         number:  1, position: 'GK',  club: 'Independiente',       caps:  44, goals: 0 },
    { name: 'Eric Davis',         number:  3, position: 'DEF', club: 'Millwall',            caps:  60, goals: 4 },
    { name: 'Harold Cummings',    number:  4, position: 'DEF', club: 'Columbus Crew',      caps:  42, goals: 5 },
    { name: 'Fidel Escobar',      number: 15, position: 'DEF', club: 'New York Red Bulls',  caps:  38, goals: 2 },
    { name: 'Roderick Miller',    number: 12, position: 'DEF', club: 'Burnley',             caps:  36, goals: 0 },
    { name: 'Anibal Godoy',       number: 11, position: 'MID', club: 'Nashville SC',       caps:  78, goals: 5 },
    { name: 'Adalberto Carrasquilla',number:19,position:'MID', club: 'Watford',             caps:  34, goals: 4 },
    { name: 'Gabriel Torres',     number: 21, position: 'FWD', club: 'Al-Ain',             caps:  76, goals: 21 },
    { name: 'Rolando Blackburn',  number: 22, position: 'FWD', club: 'Nashville SC',       caps:  30, goals: 9 },
    { name: 'Abdiel Arroyo',      number:  7, position: 'FWD', club: 'Pittsburgh Riverhounds',caps:24,goals:7 },
  ],
}
