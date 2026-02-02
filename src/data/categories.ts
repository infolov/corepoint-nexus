// Centralna definicja kategorii dla całej aplikacji
// Zgodna z nową specyfikacją: informacje.pl

export interface SubSubCategory {
  name: string;
  slug: string;
}

export interface SubCategory {
  name: string;
  slug: string;
  subcategories?: SubSubCategory[];
}

export interface Category {
  name: string;
  slug: string;
  icon?: string;
  subcategories: SubCategory[];
}

// System tagów wspólnych dla całego serwisu
export const COMMON_TAGS = [
  { name: "Pilne", slug: "pilne", color: "destructive" },
  { name: "News", slug: "news", color: "primary" },
  { name: "Ceny", slug: "ceny", color: "secondary" },
  { name: "Dla firm", slug: "dla-firm", color: "muted" },
  { name: "Dla kierowców", slug: "dla-kierowcow", color: "muted" },
  { name: "Bezpieczeństwo", slug: "bezpieczenstwo", color: "warning" },
] as const;

// Podkategorie lokalne z słowami kluczowymi do filtrowania
export interface LocalSubCategory {
  name: string;
  slug: string;
  keywords: string[];
}

export const LOCAL_SUBCATEGORIES: LocalSubCategory[] = [
  { name: "Wypadki", slug: "wypadki", keywords: ["wypadek", "kolizja", "zderzenie", "potrącenie", "śmiertelny", "ranny", "ofiara", "karetka", "straż"] },
  { name: "Utrudnienia", slug: "utrudnienia", keywords: ["utrudnienia", "korek", "objazd", "remont drogi", "zamknięta", "blokada", "roboty drogowe", "awaria"] },
  { name: "Miasto i samorząd", slug: "miasto-samorzad", keywords: ["burmistrz", "wójt", "prezydent miasta", "rada miasta", "radny", "sesja", "uchwała", "samorząd", "urząd"] },
  { name: "Inwestycje i remonty", slug: "inwestycje-remonty", keywords: ["inwestycja", "remont", "budowa", "modernizacja", "przebudowa", "dotacja", "fundusze", "przetarg"] },
  { name: "Bezpieczeństwo", slug: "bezpieczenstwo", keywords: ["policja", "straż", "kradzież", "włamanie", "oszustwo", "zatrzymanie", "patrol", "bezpieczeństwo", "przestępstwo"] },
  { name: "Kultura", slug: "kultura-lokalna", keywords: ["koncert", "festiwal", "wystawa", "teatr", "muzeum", "biblioteka", "dom kultury", "wydarzenie", "impreza"] },
  { name: "Sport", slug: "sport-lokalny", keywords: ["mecz", "turniej", "zawody", "liga", "drużyna", "klub sportowy", "stadion", "hala", "mistrzostwa"] },
];

// Województwa Polski
export const VOIVODESHIPS = [
  { name: "Dolnośląskie", slug: "dolnoslaskie" },
  { name: "Kujawsko-Pomorskie", slug: "kujawsko-pomorskie" },
  { name: "Lubelskie", slug: "lubelskie" },
  { name: "Lubuskie", slug: "lubuskie" },
  { name: "Łódzkie", slug: "lodzkie" },
  { name: "Małopolskie", slug: "malopolskie" },
  { name: "Mazowieckie", slug: "mazowieckie" },
  { name: "Opolskie", slug: "opolskie" },
  { name: "Podkarpackie", slug: "podkarpackie" },
  { name: "Podlaskie", slug: "podlaskie" },
  { name: "Pomorskie", slug: "pomorskie" },
  { name: "Śląskie", slug: "slaskie" },
  { name: "Świętokrzyskie", slug: "swietokrzyskie" },
  { name: "Warmińsko-Mazurskie", slug: "warminsko-mazurskie" },
  { name: "Wielkopolskie", slug: "wielkopolskie" },
  { name: "Zachodniopomorskie", slug: "zachodniopomorskie" },
];

// Główna struktura kategorii zgodna z nową specyfikacją
export const CATEGORIES: Category[] = [
  {
    name: "Wszystko",
    slug: "all",
    subcategories: [],
  },
  {
    name: "Lokalne",
    slug: "lokalne",
    subcategories: LOCAL_SUBCATEGORIES,
  },
  {
    name: "Wiadomości",
    slug: "wiadomosci",
    subcategories: [
      { name: "Najważniejsze", slug: "najwazniejsze" },
      { name: "Polityka i rząd", slug: "polityka-rzad" },
      { name: "Społeczeństwo", slug: "spoleczenstwo" },
      { name: "Prawo i sądy", slug: "prawo-sady" },
      { name: "Bezpieczeństwo", slug: "bezpieczenstwo" },
      { name: "Edukacja", slug: "edukacja" },
    ],
  },
  {
    name: "Świat",
    slug: "swiat",
    subcategories: [
      { name: "Europa", slug: "europa" },
      { name: "USA", slug: "usa" },
      { name: "Ukraina/Rosja", slug: "ukraina-rosja" },
      { name: "Bliski Wschód", slug: "bliski-wschod" },
      { name: "Azja", slug: "azja" },
      { name: "Afryka", slug: "afryka" },
    ],
  },
  {
    name: "Biznes",
    slug: "biznes",
    subcategories: [
      { name: "Gospodarka i rynek", slug: "gospodarka-rynek" },
      { name: "Firmy i branże", slug: "firmy-branze" },
      { name: "Ceny i inflacja", slug: "ceny-inflacja" },
      { name: "Energetyka i paliwa", slug: "energetyka-paliwa" },
      { name: "Rynek pracy", slug: "rynek-pracy" },
      { name: "Nieruchomości", slug: "nieruchomosci" },
    ],
  },
  {
    name: "Finanse",
    slug: "finanse",
    subcategories: [
      { name: "Kredyty i banki", slug: "kredyty-banki" },
      { name: "Kursy walut", slug: "kursy-walut" },
      { name: "ZUS i emerytury", slug: "zus-emerytury" },
      { name: "Dofinansowania", slug: "dofinansowania" },
      { name: "Leasing", slug: "leasing" },
      { name: "Rynek finansowy", slug: "rynek-finansowy" },
      { name: "Ubezpieczenia", slug: "ubezpieczenia" },
    ],
  },
  {
    name: "Prawo",
    slug: "prawo",
    subcategories: [
      { name: "Zmiany w prawie", slug: "zmiany-prawie" },
      { name: "PIT/VAT/CIT", slug: "pit-vat-cit" },
      { name: "Obowiązki firm i obywateli", slug: "obowiazki" },
      { name: "KSeF", slug: "ksef" },
    ],
  },
  {
    name: "Nauka i Technologia",
    slug: "tech-nauka",
    subcategories: [
      { name: "AI", slug: "ai" },
      { name: "Cyberbezpieczeństwo", slug: "cyberbezpieczenstwo" },
      { name: "Internet i platformy", slug: "internet-platformy" },
      { name: "Nowe technologie", slug: "nowe-technologie" },
      { name: "Odkrycia", slug: "odkrycia" },
      { name: "Kosmos", slug: "kosmos" },
      { name: "Środowisko i klimat", slug: "srodowisko-klimat" },
    ],
  },
  {
    name: "Motoryzacja",
    slug: "motoryzacja",
    subcategories: [
      { name: "Ceny paliw", slug: "ceny-paliw" },
      { name: "Przepisy i mandaty", slug: "przepisy-mandaty" },
      { name: "Nowości/testy", slug: "nowosci-testy" },
      { name: "Elektromobilność", slug: "elektromobilnosc" },
    ],
  },
  {
    name: "Sport",
    slug: "sport",
    subcategories: [
      {
        name: "Piłka nożna",
        slug: "pilka-nozna",
        subcategories: [
          { name: "Ekstraklasa", slug: "ekstraklasa" },
          { name: "Premier League", slug: "premier-league" },
          { name: "La Liga", slug: "la-liga" },
          { name: "Bundesliga", slug: "bundesliga" },
          { name: "Serie A", slug: "serie-a" },
          { name: "Ligue 1", slug: "ligue-1" },
          { name: "Liga Mistrzów", slug: "liga-mistrzow" },
          { name: "Liga Europy", slug: "liga-europy" },
          { name: "Reprezentacja", slug: "reprezentacja" },
          { name: "Transfery", slug: "transfery" },
        ],
      },
      {
        name: "Koszykówka",
        slug: "koszykowka",
        subcategories: [
          { name: "NBA", slug: "nba" },
          { name: "Euroliga", slug: "euroliga" },
          { name: "Polska Liga Koszykówki", slug: "plk" },
        ],
      },
      {
        name: "Siatkówka",
        slug: "siatkowka",
        subcategories: [
          { name: "PlusLiga", slug: "plusliga" },
          { name: "Liga Mistrzów Siatkówki", slug: "liga-mistrzow-siatkowki" },
          { name: "Reprezentacja Siatkówki", slug: "reprezentacja-siatkowki" },
        ],
      },
      {
        name: "Tenis",
        slug: "tenis",
        subcategories: [
          { name: "ATP", slug: "atp" },
          { name: "WTA", slug: "wta" },
          { name: "Wielki Szlem", slug: "wielki-szlem" },
        ],
      },
      {
        name: "Sporty Motorowe",
        slug: "sporty-motorowe",
        subcategories: [
          { name: "Formuła 1", slug: "formula-1" },
          { name: "MotoGP", slug: "motogp" },
          { name: "Rajdy WRC", slug: "rajdy-wrc" },
          { name: "Żużel", slug: "zuzel" },
        ],
      },
      {
        name: "Sporty Walki",
        slug: "sporty-walki",
        subcategories: [
          { name: "MMA", slug: "mma" },
          { name: "UFC", slug: "ufc" },
          { name: "KSW", slug: "ksw" },
          { name: "Boks", slug: "boks" },
        ],
      },
      {
        name: "Hokej",
        slug: "hokej",
        subcategories: [
          { name: "NHL", slug: "nhl" },
          { name: "Liga Europejska Hokeja", slug: "liga-europejska-hokeja" },
        ],
      },
      {
        name: "E-sport",
        slug: "esport",
        subcategories: [
          { name: "CS2", slug: "cs2" },
          { name: "League of Legends", slug: "lol" },
          { name: "Valorant", slug: "valorant" },
        ],
      },
      { name: "Lekkoatletyka", slug: "lekkoatletyka" },
      {
        name: "Sporty Zimowe",
        slug: "sporty-zimowe",
        subcategories: [
          { name: "Skoki Narciarskie", slug: "skoki-narciarskie" },
          { name: "Biegi Narciarskie", slug: "biegi-narciarskie" },
          { name: "Biathlon", slug: "biathlon" },
        ],
      },
    ],
  },
  {
    name: "Kultura",
    slug: "kultura",
    subcategories: [
      { name: "Kino", slug: "kino" },
      { name: "Seriale", slug: "seriale" },
      { name: "Muzyka", slug: "muzyka" },
      { name: "Eventy i koncerty", slug: "eventy-koncerty" },
      { name: "Popkultura", slug: "popkultura" },
    ],
  },
  {
    name: "Lifestyle",
    slug: "lifestyle",
    subcategories: [
      { name: "Zdrowie i wellbeing", slug: "zdrowie-wellbeing" },
      { name: "Zdrowe odżywianie", slug: "zdrowe-odzywianie" },
      { name: "Styl życia", slug: "styl-zycia" },
      { name: "Rodzina i relacje", slug: "rodzina-relacje" },
      { name: "Podróże", slug: "podroze" },
      { name: "Moda", slug: "moda" },
    ],
  },
];

// Sekcje dla modułu "Skrót dnia" (Top 10)
export const DAILY_SUMMARY_SECTIONS = [
  { name: "Polska", slug: "polska", categories: ["wiadomosci"] },
  { name: "Świat", slug: "swiat", categories: ["swiat"] },
  { name: "MIX", slug: "mix", categories: ["biznes", "tech-nauka", "sport"] },
] as const;

// Typy alertów dla paska alertów
export const ALERT_TYPES = [
  { name: "Pilne", slug: "pilne", priority: 10 },
  { name: "Ostrzeżenia", slug: "ostrzezenia", priority: 5 },
  { name: "Lokalnie", slug: "lokalnie", priority: 3 },
] as const;

// Helper: Pobierz kategorię po slug
export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

// Helper: Pobierz wszystkie slugi kategorii (płaska lista)
export function getAllCategorySlugs(): string[] {
  const slugs: string[] = [];
  CATEGORIES.forEach((cat) => {
    slugs.push(cat.slug);
    cat.subcategories.forEach((sub) => {
      slugs.push(`${cat.slug}/${sub.slug}`);
      sub.subcategories?.forEach((subsub) => {
        slugs.push(`${cat.slug}/${sub.slug}/${subsub.slug}`);
      });
    });
  });
  return slugs;
}

// Helper: Mapowanie słów kluczowych dla kategorii (do filtrowania artykułów)
// Słowa kluczowe są bardziej specyficzne, aby uniknąć fałszywych dopasowań
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  wiadomosci: ["Polska", "Polski", "Polskie", "Rząd", "Sejm", "Minister", "Premier", "Prezydent"],
  swiat: ["USA", "Europa", "Chiny", "Rosja", "Ukraina", "Świat", "NATO", "UE", "Biden", "Trump", "Putin"],
  biznes: ["Gospodarka", "Firma", "Ceny", "Inflacja", "Rynek", "Praca", "Spółka", "Giełda", "PKB"],
  finanse: ["Kredyt", "Bank", "ZUS", "Emerytura", "Waluta", "PLN", "EUR", "Stopy procentowe", "NBP"],
  // Prawo - bardziej specyficzne terminy prawnicze (unikamy ogólnych jak "sąd", "prawo")
  prawo: [
    "Kodeks cywilny", "Kodeks karny", "Nowelizacja ustawy", "Dziennik Ustaw", 
    "Sąd Najwyższy", "Trybunał Konstytucyjny", "Przepisy prawne", "Legislacja",
    "VAT", "PIT", "CIT", "KSeF", "Urząd skarbowy", "Ordynacja podatkowa",
    "Prawo pracy", "Prawo handlowe", "Zmiana przepisów", "Wchodzi w życie"
  ],
  "tech-nauka": ["AI", "Technologia", "Kosmos", "NASA", "Klimat", "Nauka", "Odkrycie", "ChatGPT", "SpaceX"],
  motoryzacja: ["Samochód", "Auto", "Paliwo", "Mandat", "Kierowca", "EV", "Tesla", "Elektryk"],
  sport: ["Piłka nożna", "Mecz", "Liga", "Reprezentacja", "Trener", "Mistrzostwa", "Ekstraklasa", "Champions League"],
  kultura: ["Film", "Kino", "Serial", "Koncert", "Muzyka", "Artysta", "Netflix", "Premiera filmowa", "Oscar"],
  lifestyle: ["Zdrowie", "Dieta", "Moda", "Podróż", "Rodzina", "Wellbeing", "Fitness"],
  lokalne: ["Powiat", "Gmina", "Miasto", "Wójt", "Burmistrz", "Samorząd", "Rada miasta"],
};

// Słowa kluczowe wykluczające - jeśli artykuł zawiera te słowa, NIE przypisuj do danej kategorii
// Zapobiega to fałszywym dopasowaniom (np. "sąd arbitrażowy FIFA" nie trafia do "prawo")
export const CATEGORY_EXCLUSIONS: Record<string, string[]> = {
  prawo: [
    // Sport - wykluczenia
    "mecz", "piłka", "liga", "ekstraklasa", "champions", "transfer", "trener", "bramka", "gol",
    "reprezentacja", "mundial", "euro 2024", "mistrzostwa", "puchar", "stadion", "kibic",
    "siatkarze", "koszykówka", "tenis", "formuła 1", "mma", "ufc", "ksw", "boks", "żużel",
    "nba", "nhl", "wta", "atp", "plusliga", "fifa", "uefa", "pzpn",
    // Kultura/rozrywka - wykluczenia  
    "film", "kino", "serial", "netflix", "hbo", "aktor", "aktorka", "reżyser", "premiera filmowa",
    "koncert", "festiwal", "album", "piosenkarz", "muzyka", "hollywood", "oscar", "cannes",
    "celebryta", "influencer", "youtuber", "tiktoker",
    // Motoryzacja - wykluczenia (prawo jazdy to nie "prawo")
    "prawo jazdy", "egzamin na prawo jazdy",
    // Lifestyle - wykluczenia
    "dieta", "fitness", "moda", "uroda", "wellness"
  ],
  
  // Biznes - nie łap artykułów o transferach sportowych, box office filmów
  biznes: [
    // Sport - transfery to nie biznes ogólny
    "transfer piłkarza", "okienko transferowe", "rekord transferowy", "kontrakt piłkarza",
    "zarobki sportowca", "pensja zawodnika", "premier league", "la liga", "bundesliga",
    // Kultura - box office to nie biznes ogólny  
    "box office", "wpływy kinowe", "budżet filmu", "kasa filmowa",
    // E-sport
    "nagrody turniejowe", "pula nagród esport"
  ],
  
  // Finanse - nie łap sportowych kontraktów
  finanse: [
    // Sport
    "kontrakt sportowy", "transfer", "klauzula wykupu", "odstępne", "agent piłkarski",
    "pensja piłkarza", "zarobki w sporcie",
    // Kryptowaluty/NFT w kontekście rozrywki
    "nft kolekcjonerskie", "tokeny fanów"
  ],
  
  // Tech-nauka - nie łap recenzji gier, technologii w filmach
  "tech-nauka": [
    // Gaming/Rozrywka - to kultura, nie tech
    "recenzja gry", "premiera gry", "playstation", "xbox", "nintendo", "steam",
    "efekty specjalne", "cgi w filmie", "animacja filmowa",
    // Sport
    "var", "goal-line", "hawk-eye", "technologia w sporcie"
  ],
  
  // Motoryzacja - nie łap sportów motorowych (to sport)
  motoryzacja: [
    // Sporty motorowe - to kategoria Sport
    "grand prix", "pole position", "pit stop", "podium", "mistrzostwa świata f1",
    "motogp", "rajd wrc", "wyścig", "tor wyścigowy", "żużel", "speedway",
    "klasyfikacja generalna", "kierowca wyścigowy", "team principal"
  ],
  
  // Kultura - nie łap sportu i lifestyle
  kultura: [
    // Sport
    "mecz", "liga", "mistrzostwa", "reprezentacja", "bramka", "gol", "trener",
    "transfer", "ekstraklasa", "puchar", "stadion",
    // Lifestyle/zdrowie
    "dieta", "odchudzanie", "trening", "siłownia", "fitness", "wellness"
  ],
  
  // Lifestyle - nie łap sportu wyczynowego
  lifestyle: [
    // Sport wyczynowy (nie fitness/wellness)
    "liga", "mistrzostwa", "reprezentacja", "mecz", "puchar", "transfer",
    "ekstraklasa", "champions league", "mundial", "olimpiada wyczynowa"
  ],
  
  // Sport - nie łap biznesu/finansów (chyba że transfery)
  sport: [
    // Biznes ogólny
    "giełda", "akcje spółki", "pkb", "inflacja", "stopy procentowe", "nbp",
    // Polityka  
    "sejm", "senat", "rząd", "minister", "premier", "prezydent",
    // Prawo ogólne (nie sportowe)
    "kodeks cywilny", "kodeks karny", "sąd najwyższy", "trybunał konstytucyjny"
  ],
  
  // Świat - nie łap sportu międzynarodowego
  swiat: [
    // Sport międzynarodowy to sport, nie świat
    "mundial", "euro 2024", "liga mistrzów", "champions league", "puchar świata",
    "mistrzostwa europy", "mistrzostwa świata", "olimpiada", "igrzyska"
  ],
  
  // Wiadomości - nie łap sportu i rozrywki
  wiadomosci: [
    // Sport
    "mecz", "liga", "ekstraklasa", "transfer", "bramka", "gol",
    // Kultura
    "premiera filmowa", "serial", "koncert", "album muzyczny", "box office"
  ]
};

// Priorytet kategorii - wyższy numer = wyższy priorytet przy niejednoznacznych dopasowaniach
// Sport i Kultura mają wyższy priorytet niż Prawo dla artykułów o procesach sportowców/celebrytów
export const CATEGORY_PRIORITY: Record<string, number> = {
  sport: 10,
  kultura: 9,
  motoryzacja: 8,
  "tech-nauka": 7,
  biznes: 6,
  finanse: 5,
  lifestyle: 4,
  swiat: 3,
  wiadomosci: 2,
  prawo: 1, // Najniższy priorytet - łapie tylko gdy artykuł jest wyraźnie prawniczy
  lokalne: 0,
};

// Algorytm mieszania treści lokalnych
export interface LocalContentMixConfig {
  cityPercentage: number;
  countyPercentage: number;
  voivodeshipPercentage: number;
}

export function getLocalContentMixConfig(
  selectedLevel: "city" | "county" | "voivodeship"
): LocalContentMixConfig {
  switch (selectedLevel) {
    case "city":
      return { cityPercentage: 80, countyPercentage: 15, voivodeshipPercentage: 5 };
    case "county":
      return { cityPercentage: 0, countyPercentage: 85, voivodeshipPercentage: 15 };
    case "voivodeship":
    default:
      return { cityPercentage: 0, countyPercentage: 0, voivodeshipPercentage: 100 };
  }
}

// Mapowanie kategorii z RSS na nową strukturę
export const RSS_CATEGORY_MAP: Record<string, string> = {
  wiadomosci: "wiadomosci",
  news: "wiadomosci",
  polska: "wiadomosci",
  swiat: "swiat",
  world: "swiat",
  biznes: "biznes",
  business: "biznes",
  gospodarka: "biznes",
  finanse: "finanse",
  finance: "finanse",
  prawo: "prawo",
  law: "prawo",
  technologia: "tech-nauka",
  tech: "tech-nauka",
  nauka: "tech-nauka",
  science: "tech-nauka",
  motoryzacja: "motoryzacja",
  auto: "motoryzacja",
  sport: "sport",
  rozrywka: "kultura",
  entertainment: "kultura",
  kultura: "kultura",
  culture: "kultura",
  lifestyle: "lifestyle",
  zdrowie: "lifestyle",
  health: "lifestyle",
};

// Mapuj kategorię z RSS na nową strukturę
export function mapRSSCategory(rssCategory: string): string {
  const normalized = rssCategory.toLowerCase().trim();
  return RSS_CATEGORY_MAP[normalized] || "wiadomosci";
}
