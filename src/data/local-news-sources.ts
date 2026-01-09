// Local news sources for Polish voivodeships
// Each source is mapped to a voivodeship for regional targeting

export interface LocalNewsSource {
  url: string;
  source: string;
  voivodeship: string;
  type: 'rss' | 'scrape';
}

// Polish local/regional news sources by voivodeship
export const LOCAL_RSS_SOURCES: LocalNewsSource[] = [
  // ===== MAZOWIECKIE =====
  { url: 'https://warszawa.wyborcza.pl/rss/wyborcza_warszawa.xml', source: 'Wyborcza Warszawa', voivodeship: 'mazowieckie', type: 'rss' },
  { url: 'https://tvnwarszawa.tvn24.pl/najnowsze.xml', source: 'TVN Warszawa', voivodeship: 'mazowieckie', type: 'rss' },
  { url: 'https://warszawa.naszemiasto.pl/rss/artykuly/1,2,warszawa.xml', source: 'Nasze Miasto Warszawa', voivodeship: 'mazowieckie', type: 'rss' },
  { url: 'https://www.radiozet.pl/rss/warszawa.xml', source: 'Radio ZET Warszawa', voivodeship: 'mazowieckie', type: 'rss' },
  
  // ===== POMORSKIE =====
  { url: 'https://gdansk.wyborcza.pl/rss/wyborcza_gdansk.xml', source: 'Wyborcza Gdańsk', voivodeship: 'pomorskie', type: 'rss' },
  { url: 'https://dziennikbaltycki.pl/rss.xml', source: 'Dziennik Bałtycki', voivodeship: 'pomorskie', type: 'rss' },
  { url: 'https://trojmiasto.pl/rss/wiadomosci.xml', source: 'Trojmiasto.pl', voivodeship: 'pomorskie', type: 'rss' },
  { url: 'https://gdansk.naszemiasto.pl/rss/artykuly/1,2,gdansk.xml', source: 'Nasze Miasto Gdańsk', voivodeship: 'pomorskie', type: 'rss' },
  
  // ===== MAŁOPOLSKIE =====
  { url: 'https://krakow.wyborcza.pl/rss/wyborcza_krakow.xml', source: 'Wyborcza Kraków', voivodeship: 'malopolskie', type: 'rss' },
  { url: 'https://www.dziennikpolski24.pl/rss.xml', source: 'Dziennik Polski', voivodeship: 'malopolskie', type: 'rss' },
  { url: 'https://lovekrakow.pl/feed/', source: 'Love Kraków', voivodeship: 'malopolskie', type: 'rss' },
  { url: 'https://krakow.naszemiasto.pl/rss/artykuly/1,2,krakow.xml', source: 'Nasze Miasto Kraków', voivodeship: 'malopolskie', type: 'rss' },
  
  // ===== ŚLĄSKIE =====
  { url: 'https://katowice.wyborcza.pl/rss/wyborcza_katowice.xml', source: 'Wyborcza Katowice', voivodeship: 'slaskie', type: 'rss' },
  { url: 'https://dziennikzachodni.pl/rss.xml', source: 'Dziennik Zachodni', voivodeship: 'slaskie', type: 'rss' },
  { url: 'https://katowice.naszemiasto.pl/rss/artykuly/1,2,katowice.xml', source: 'Nasze Miasto Katowice', voivodeship: 'slaskie', type: 'rss' },
  { url: 'https://slazag.pl/feed/', source: 'Ślązag', voivodeship: 'slaskie', type: 'rss' },
  
  // ===== WIELKOPOLSKIE =====
  { url: 'https://poznan.wyborcza.pl/rss/wyborcza_poznan.xml', source: 'Wyborcza Poznań', voivodeship: 'wielkopolskie', type: 'rss' },
  { url: 'https://gloswielkopolski.pl/rss.xml', source: 'Głos Wielkopolski', voivodeship: 'wielkopolskie', type: 'rss' },
  { url: 'https://poznan.naszemiasto.pl/rss/artykuly/1,2,poznan.xml', source: 'Nasze Miasto Poznań', voivodeship: 'wielkopolskie', type: 'rss' },
  
  // ===== DOLNOŚLĄSKIE =====
  { url: 'https://wroclaw.wyborcza.pl/rss/wyborcza_wroclaw.xml', source: 'Wyborcza Wrocław', voivodeship: 'dolnoslaskie', type: 'rss' },
  { url: 'https://gazetawroclawska.pl/rss.xml', source: 'Gazeta Wrocławska', voivodeship: 'dolnoslaskie', type: 'rss' },
  { url: 'https://wroclaw.naszemiasto.pl/rss/artykuly/1,2,wroclaw.xml', source: 'Nasze Miasto Wrocław', voivodeship: 'dolnoslaskie', type: 'rss' },
  
  // ===== ŁÓDZKIE =====
  { url: 'https://lodz.wyborcza.pl/rss/wyborcza_lodz.xml', source: 'Wyborcza Łódź', voivodeship: 'lodzkie', type: 'rss' },
  { url: 'https://expressilustrowany.pl/rss.xml', source: 'Express Ilustrowany', voivodeship: 'lodzkie', type: 'rss' },
  { url: 'https://lodz.naszemiasto.pl/rss/artykuly/1,2,lodz.xml', source: 'Nasze Miasto Łódź', voivodeship: 'lodzkie', type: 'rss' },
  
  // ===== ZACHODNIOPOMORSKIE =====
  { url: 'https://szczecin.wyborcza.pl/rss/wyborcza_szczecin.xml', source: 'Wyborcza Szczecin', voivodeship: 'zachodniopomorskie', type: 'rss' },
  { url: 'https://gs24.pl/rss.xml', source: 'Głos Szczeciński', voivodeship: 'zachodniopomorskie', type: 'rss' },
  { url: 'https://szczecin.naszemiasto.pl/rss/artykuly/1,2,szczecin.xml', source: 'Nasze Miasto Szczecin', voivodeship: 'zachodniopomorskie', type: 'rss' },
  
  // ===== KUJAWSKO-POMORSKIE =====
  { url: 'https://bydgoszcz.wyborcza.pl/rss/wyborcza_bydgoszcz.xml', source: 'Wyborcza Bydgoszcz', voivodeship: 'kujawsko-pomorskie', type: 'rss' },
  { url: 'https://expressbydgoski.pl/rss.xml', source: 'Express Bydgoski', voivodeship: 'kujawsko-pomorskie', type: 'rss' },
  { url: 'https://nowosci.com.pl/rss.xml', source: 'Nowości Toruńskie', voivodeship: 'kujawsko-pomorskie', type: 'rss' },
  
  // ===== LUBELSKIE =====
  { url: 'https://lublin.wyborcza.pl/rss/wyborcza_lublin.xml', source: 'Wyborcza Lublin', voivodeship: 'lubelskie', type: 'rss' },
  { url: 'https://kurierlubelski.pl/rss.xml', source: 'Kurier Lubelski', voivodeship: 'lubelskie', type: 'rss' },
  { url: 'https://lublin.naszemiasto.pl/rss/artykuly/1,2,lublin.xml', source: 'Nasze Miasto Lublin', voivodeship: 'lubelskie', type: 'rss' },
  
  // ===== PODKARPACKIE =====
  { url: 'https://rzeszow.wyborcza.pl/rss/wyborcza_rzeszow.xml', source: 'Wyborcza Rzeszów', voivodeship: 'podkarpackie', type: 'rss' },
  { url: 'https://nowiny24.pl/rss.xml', source: 'Nowiny24', voivodeship: 'podkarpackie', type: 'rss' },
  { url: 'https://rzeszow.naszemiasto.pl/rss/artykuly/1,2,rzeszow.xml', source: 'Nasze Miasto Rzeszów', voivodeship: 'podkarpackie', type: 'rss' },
  
  // ===== PODLASKIE =====
  { url: 'https://bialystok.wyborcza.pl/rss/wyborcza_bialystok.xml', source: 'Wyborcza Białystok', voivodeship: 'podlaskie', type: 'rss' },
  { url: 'https://poranny.pl/rss.xml', source: 'Poranny', voivodeship: 'podlaskie', type: 'rss' },
  { url: 'https://bialystok.naszemiasto.pl/rss/artykuly/1,2,bialystok.xml', source: 'Nasze Miasto Białystok', voivodeship: 'podlaskie', type: 'rss' },
  
  // ===== WARMIŃSKO-MAZURSKIE =====
  { url: 'https://olsztyn.wyborcza.pl/rss/wyborcza_olsztyn.xml', source: 'Wyborcza Olsztyn', voivodeship: 'warminsko-mazurskie', type: 'rss' },
  { url: 'https://gazetaolsztynska.pl/rss.xml', source: 'Gazeta Olsztyńska', voivodeship: 'warminsko-mazurskie', type: 'rss' },
  { url: 'https://olsztyn.naszemiasto.pl/rss/artykuly/1,2,olsztyn.xml', source: 'Nasze Miasto Olsztyn', voivodeship: 'warminsko-mazurskie', type: 'rss' },
  
  // ===== LUBUSKIE =====
  { url: 'https://zielonagora.wyborcza.pl/rss/wyborcza_zielonagora.xml', source: 'Wyborcza Zielona Góra', voivodeship: 'lubuskie', type: 'rss' },
  { url: 'https://gazetalubuska.pl/rss.xml', source: 'Gazeta Lubuska', voivodeship: 'lubuskie', type: 'rss' },
  { url: 'https://zielonagora.naszemiasto.pl/rss/artykuly/1,2,zielona-gora.xml', source: 'Nasze Miasto Zielona Góra', voivodeship: 'lubuskie', type: 'rss' },
  
  // ===== ŚWIĘTOKRZYSKIE =====
  { url: 'https://kielce.wyborcza.pl/rss/wyborcza_kielce.xml', source: 'Wyborcza Kielce', voivodeship: 'swietokrzyskie', type: 'rss' },
  { url: 'https://echodnia.eu/rss.xml', source: 'Echo Dnia', voivodeship: 'swietokrzyskie', type: 'rss' },
  { url: 'https://kielce.naszemiasto.pl/rss/artykuly/1,2,kielce.xml', source: 'Nasze Miasto Kielce', voivodeship: 'swietokrzyskie', type: 'rss' },
  
  // ===== OPOLSKIE =====
  { url: 'https://opole.wyborcza.pl/rss/wyborcza_opole.xml', source: 'Wyborcza Opole', voivodeship: 'opolskie', type: 'rss' },
  { url: 'https://nto.pl/rss.xml', source: 'Nowa Trybuna Opolska', voivodeship: 'opolskie', type: 'rss' },
  { url: 'https://opole.naszemiasto.pl/rss/artykuly/1,2,opole.xml', source: 'Nasze Miasto Opole', voivodeship: 'opolskie', type: 'rss' },
];

// Map voivodeship names to normalized slugs
export const voivodeshipSlugMap: Record<string, string> = {
  'mazowieckie': 'mazowieckie',
  'pomorskie': 'pomorskie',
  'małopolskie': 'malopolskie',
  'malopolskie': 'malopolskie',
  'śląskie': 'slaskie',
  'slaskie': 'slaskie',
  'wielkopolskie': 'wielkopolskie',
  'dolnośląskie': 'dolnoslaskie',
  'dolnoslaskie': 'dolnoslaskie',
  'łódzkie': 'lodzkie',
  'lodzkie': 'lodzkie',
  'zachodniopomorskie': 'zachodniopomorskie',
  'kujawsko-pomorskie': 'kujawsko-pomorskie',
  'lubelskie': 'lubelskie',
  'podkarpackie': 'podkarpackie',
  'podlaskie': 'podlaskie',
  'warmińsko-mazurskie': 'warminsko-mazurskie',
  'warminsko-mazurskie': 'warminsko-mazurskie',
  'lubuskie': 'lubuskie',
  'świętokrzyskie': 'swietokrzyskie',
  'swietokrzyskie': 'swietokrzyskie',
  'opolskie': 'opolskie',
};

// Get sources for a specific voivodeship
export const getLocalSourcesForVoivodeship = (voivodeship: string): LocalNewsSource[] => {
  const normalizedSlug = voivodeshipSlugMap[voivodeship.toLowerCase()] || voivodeship.toLowerCase();
  return LOCAL_RSS_SOURCES.filter(source => source.voivodeship === normalizedSlug);
};

// Get all unique voivodeships with sources
export const getVoivodeshipsWithSources = (): string[] => {
  return [...new Set(LOCAL_RSS_SOURCES.map(s => s.voivodeship))].sort();
};
