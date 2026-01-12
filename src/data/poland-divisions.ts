// Poland administrative divisions: Voivodeship -> Powiat -> Gmina
// This is a simplified mock dataset for testing purposes

export interface PolandDivisions {
  [voivodeship: string]: {
    [powiat: string]: string[];
  };
}

export const polandDivisions: PolandDivisions = {
  "mazowieckie": {
    "m. st. Warszawa": ["Mokotów", "Ursynów", "Wilanów", "Wola", "Śródmieście", "Praga-Południe"],
    "piaseczyński": ["Piaseczno", "Konstancin-Jeziorna", "Góra Kalwaria", "Lesznowola"],
    "warszawski zachodni": ["Łomianki", "Izabelin", "Stare Babice", "Ożarów Mazowiecki"],
    "pruszkowski": ["Pruszków", "Brwinów", "Piastów", "Michałowice"],
    "legionowski": ["Legionowo", "Jabłonna", "Nieporęt", "Wieliszew"]
  },
  "pomorskie": {
    "m. Gdańsk": ["Wrzeszcz", "Oliwa", "Przymorze", "Zaspa", "Śródmieście"],
    "m. Gdynia": ["Śródmieście", "Orłowo", "Redłowo", "Działki Leśne"],
    "m. Sopot": ["Sopot"],
    "kartuski": ["Kartuzy", "Żukowo", "Somonino", "Przodkowo"],
    "wejherowski": ["Wejherowo", "Rumia", "Reda", "Luzino"]
  },
  "małopolskie": {
    "m. Kraków": ["Stare Miasto", "Krowodrza", "Podgórze", "Nowa Huta", "Prądnik Czerwony"],
    "krakowski": ["Wieliczka", "Niepołomice", "Skawina", "Zielonki"],
    "wielicki": ["Wieliczka", "Niepołomice", "Gdów", "Kłaj"],
    "nowosądecki": ["Nowy Sącz", "Grybów", "Stary Sącz", "Krynica-Zdrój"]
  },
  "śląskie": {
    "m. Katowice": ["Śródmieście", "Brynów", "Ligota", "Koszutka", "Załęże"],
    "m. Gliwice": ["Śródmieście", "Trynek", "Sikornik", "Obrońców Pokoju"],
    "bielski": ["Bielsko-Biała", "Czechowice-Dziedzice", "Szczyrk", "Kozy"],
    "cieszyński": ["Cieszyn", "Ustroń", "Wisła", "Skoczów"]
  },
  "wielkopolskie": {
    "m. Poznań": ["Stare Miasto", "Jeżyce", "Grunwald", "Wilda", "Rataje"],
    "poznański": ["Swarzędz", "Luboń", "Kórnik", "Mosina"],
    "kaliski": ["Kalisz", "Opatówek", "Żelazków", "Blizanów"],
    "leszczyński": ["Leszno", "Rydzyna", "Święciechowa", "Lipno"]
  },
  "dolnośląskie": {
    "m. Wrocław": ["Stare Miasto", "Krzyki", "Fabryczna", "Psie Pole", "Śródmieście"],
    "wrocławski": ["Kobierzyce", "Siechnice", "Kąty Wrocławskie", "Długołęka"],
    "jeleniogórski": ["Jelenia Góra", "Karpacz", "Szklarska Poręba", "Kowary"],
    "wałbrzyski": ["Wałbrzych", "Szczawno-Zdrój", "Boguszów-Gorce", "Głuszyca"]
  },
  "łódzkie": {
    "m. Łódź": ["Śródmieście", "Bałuty", "Górna", "Polesie", "Widzew"],
    "łódzki wschodni": ["Koluszki", "Brzeziny", "Tuszyn", "Andrespol"],
    "pabianicki": ["Pabianice", "Konstantynów Łódzki", "Ksawerów", "Lutomiersk"],
    "zgierski": ["Zgierz", "Ozorków", "Głowno", "Stryków"]
  },
  "zachodniopomorskie": {
    "m. Szczecin": ["Śródmieście", "Pogodno", "Niebuszewo", "Dąbie", "Gumieńce"],
    "m. Koszalin": ["Śródmieście", "Rokosowo", "Jamno", "Dzierżęcino"],
    "kołobrzeski": ["Kołobrzeg", "Dygowo", "Gościno", "Ustronie Morskie"],
    "policki": ["Police", "Dobra", "Kołbaskowo", "Nowe Warpno"]
  },
  "kujawsko-pomorskie": {
    "m. Bydgoszcz": ["Śródmieście", "Fordon", "Bartodzieje", "Wyżyny", "Błonie"],
    "m. Toruń": ["Stare Miasto", "Bydgoskie Przedmieście", "Mokre", "Rubinkowo"],
    "bydgoski": ["Białe Błota", "Nowa Wieś Wielka", "Osielsko", "Sicienko"],
    "toruński": ["Chełmża", "Łubianka", "Łysomice", "Obrowo"]
  },
  "lubelskie": {
    "m. Lublin": ["Śródmieście", "Rury", "Wieniawa", "Czechów", "Kalinowszczyzna"],
    "lubelski": ["Niemce", "Głusk", "Jastków", "Konopnica"],
    "puławski": ["Puławy", "Końskowola", "Kurów", "Żyrzyn"],
    "zamojski": ["Zamość", "Szczebrzeszyn", "Krasnobród", "Zwierzyniec"]
  },
  "podkarpackie": {
    "m. Rzeszów": ["Śródmieście", "Nowe Miasto", "Staroniwa", "Drabinianka"],
    "rzeszowski": ["Boguchwała", "Głogów Małopolski", "Tyczyn", "Świlcza"],
    "krośnieński": ["Krosno", "Dukla", "Iwonicz-Zdrój", "Rymanów"],
    "przemyski": ["Przemyśl", "Krasiczyn", "Medyka", "Orły"]
  },
  "podlaskie": {
    "m. Białystok": ["Centrum", "Bojary", "Dojlidy", "Antoniuk", "Wygoda"],
    "białostocki": ["Łapy", "Supraśl", "Wasilków", "Zabłudów"],
    "suwalski": ["Suwałki", "Bakałarzewo", "Filipów", "Jeleniewo"],
    "augustowski": ["Augustów", "Lipsk", "Nowinka", "Płaska"]
  },
  "warmińsko-mazurskie": {
    "m. Olsztyn": ["Śródmieście", "Zatorze", "Jaroty", "Dajtki", "Kortowo"],
    "m. Elbląg": ["Śródmieście", "Zatorze", "Zawada", "Dąbrowa"],
    "olsztyński": ["Barczewo", "Dywity", "Gietrzwałd", "Jonkowo", "Stawiguda", "Purda"],
    "elbląski": ["Pasłęk", "Tolkmicko", "Młynary", "Godkowo", "Gronowo Elbląskie", "Markusy", "Rychliki", "Milejewo"],
    "ełcki": ["Ełk", "Stare Juchy", "Kalinowo", "Prostki"],
    "giżycki": ["Giżycko", "Miłki", "Ryn", "Wydminy"],
    "ostródzki": ["Ostróda", "Morąg", "Miłakowo", "Małdyty", "Dąbrówno"],
    "iławski": ["Iława", "Lubawa", "Zalewo", "Susz", "Kisielice"],
    "braniewski": ["Braniewo", "Frombork", "Pieniężno", "Wilczęta", "Lelkowo"],
    "bartoszycki": ["Bartoszyce", "Górowo Iławeckie", "Bisztynek", "Sępopol"],
    "kętrzyński": ["Kętrzyn", "Reszel", "Korsze", "Srokowo", "Barciany"],
    "mrągowski": ["Mrągowo", "Mikołajki", "Piecki", "Sorkwity"],
    "nidzicki": ["Nidzica", "Kozłowo", "Janowiec Kościelny", "Janowo"],
    "nowomiejski": ["Nowe Miasto Lubawskie", "Kurzętnik", "Grodziczno", "Biskupiec"],
    "działdowski": ["Działdowo", "Lidzbark", "Płośnica", "Iłowo-Osada", "Rybno"],
    "szczycieński": ["Szczytno", "Pasym", "Wielbark", "Świętajno", "Dźwierzuty"],
    "piski": ["Pisz", "Ruciane-Nida", "Orzysz", "Biała Piska"],
    "gołdapski": ["Gołdap", "Banie Mazurskie", "Dubeninki"],
    "olecki": ["Olecko", "Kowale Oleckie", "Świętajno", "Wieliczki"],
    "węgorzewski": ["Węgorzewo", "Pozezdrze", "Budry"]
  },
  "lubuskie": {
    "m. Zielona Góra": ["Centrum", "Przylepska", "Jędrzychów", "Łężyca"],
    "m. Gorzów Wielkopolski": ["Śródmieście", "Górczyn", "Zawarcie", "Wieprzyce"],
    "zielonogórski": ["Sulechów", "Czerwieńsk", "Nowogród Bobrzański", "Zabór"],
    "gorzowski": ["Lubiszyn", "Kłodawa", "Bogdaniec", "Santok"]
  },
  "świętokrzyskie": {
    "m. Kielce": ["Centrum", "Czarnów", "Herby", "Barwinek", "Szydłówek"],
    "kielecki": ["Daleszyce", "Górno", "Masłów", "Morawica"],
    "sandomierski": ["Sandomierz", "Dwikozy", "Klimontów", "Koprzywnica"],
    "ostrowiecki": ["Ostrowiec Świętokrzyski", "Bodzechów", "Kunów", "Waśniów"]
  },
  "opolskie": {
    "m. Opole": ["Śródmieście", "Zaodrze", "Grudzice", "Półwieś", "Gosławice"],
    "opolski": ["Ozimek", "Prószków", "Turawa", "Dąbrowa"],
    "kędzierzyńsko-kozielski": ["Kędzierzyn-Koźle", "Reńska Wieś", "Polska Cerekiew", "Pawłowiczki"],
    "nyski": ["Nysa", "Głuchołazy", "Otmuchów", "Paczków"]
  }
};

// Helper function to get all voivodeships
export const getVoivodeships = (): string[] => {
  return Object.keys(polandDivisions).sort();
};

// Helper function to get powiats for a voivodeship
export const getPowiats = (voivodeship: string): string[] => {
  if (!voivodeship || !polandDivisions[voivodeship]) {
    return [];
  }
  return Object.keys(polandDivisions[voivodeship]).sort();
};

// Helper function to get gminas for a powiat
export const getGminas = (voivodeship: string, powiat: string): string[] => {
  if (!voivodeship || !powiat || !polandDivisions[voivodeship]?.[powiat]) {
    return [];
  }
  return [...polandDivisions[voivodeship][powiat]].sort();
};
