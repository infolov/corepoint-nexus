import { useState, useCallback, useMemo, useEffect } from "react";
import { useParams, useSearchParams, Link, Navigate } from "react-router-dom";
// Header i Footer renderowane globalnie przez MainLayout
// import { Header } from "@/components/layout/Header";
// import { Footer } from "@/components/layout/Footer";
import { CategoryBar } from "@/components/navigation/CategoryBar";
import { NewsCard } from "@/components/news/NewsCard";
import { CategoryDailySummary } from "@/components/news/CategoryDailySummary";
import { AuctionAdSlot } from "@/components/widgets/AuctionAdSlot";
import { CategoryTopBanner } from "@/components/widgets/CategoryTopBanner";
import { FeedBannerCarousel, formatBannersForCarousel } from "@/components/widgets/FeedBannerCarousel";
import { FeedTileAdCard } from "@/components/widgets/FeedTileAdCard";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useDisplayMode } from "@/hooks/use-display-mode";
import { useCarouselBanners } from "@/hooks/use-carousel-banners";
import { useFeedTileAds } from "@/hooks/use-feed-tile-ads";
import { useCategoryStatus } from "@/hooks/use-category-status";
import { Loader2 } from "lucide-react";
import { useArticles, formatArticleForCard } from "@/hooks/use-articles";
import { useRSSArticles, formatRSSArticleForCard } from "@/hooks/use-rss-articles";
import { CATEGORIES, getCategoryBySlug, CATEGORY_KEYWORDS, CATEGORY_EXCLUSIONS, CATEGORY_PRIORITY } from "@/data/categories";

// Grid layout constants - consistent with Index.tsx
const ARTICLES_PER_GRID = 12;
const INITIAL_GRIDS = 2;
const GRIDS_PER_LOAD = 1;

// Sort articles by date (newest first)
const sortByDate = <T extends { pubDateMs?: number; createdAt?: string }>(array: T[]): T[] => {
  return [...array].sort((a, b) => {
    const dateA = a.pubDateMs || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const dateB = b.pubDateMs || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    return dateB - dateA;
  });
};

export default function Category() {
  const { category, subcategory, subsubcategory } = useParams<{ category: string; subcategory?: string; subsubcategory?: string }>();
  const [searchParams] = useSearchParams();
  const subFromQuery = searchParams.get("sub");
  const subSubFromQuery = searchParams.get("subsub") || subsubcategory;
  
  // Determine current category/subcategory/subsubcategory
  const currentCategorySlug = category || "all";
  const currentSubcategorySlug = subcategory || subFromQuery || null;
  const currentSubSubcategorySlug = subSubFromQuery || null;

  // Check if category is active in database
  const { isActive: isCategoryActive, loading: categoryStatusLoading, checked: categoryStatusChecked } = useCategoryStatus(currentCategorySlug);

  const { settings: displaySettings } = useDisplayMode();
  const isCompact = displaySettings.mode === "compact" || displaySettings.dataSaver;
  
  // Fetch real articles
  const {
    articles: dbArticles,
    loading: dbLoading,
  } = useArticles({ limit: 100 });
  
  const {
    articles: rssArticles,
    loading: rssLoading,
  } = useRSSArticles();
  
  const [visibleGrids, setVisibleGrids] = useState(INITIAL_GRIDS);
  const { getCarouselForPosition } = useCarouselBanners();
  const { getAdForPosition, trackImpression, trackClick } = useFeedTileAds();

  // Flag to redirect to home if category is hidden (will be checked after all hooks)
  
  // Get category info for display
  const categoryInfo = getCategoryBySlug(currentCategorySlug);
  const categoryName = categoryInfo?.name || currentCategorySlug;
  
  // Get subcategory name
  const subcategoryInfo = currentSubcategorySlug 
    ? categoryInfo?.subcategories.find(s => s.slug === currentSubcategorySlug)
    : null;
  const subcategoryName = subcategoryInfo?.name || currentSubcategorySlug;
  
  // Get sub-subcategory name
  const subSubcategoryInfo = currentSubSubcategorySlug && subcategoryInfo?.subcategories
    ? subcategoryInfo.subcategories.find(s => s.slug === currentSubSubcategorySlug)
    : null;
  const subSubcategoryName = subSubcategoryInfo?.name || currentSubSubcategorySlug;

  // Build active category slug for CategoryBar
  const activeCategory = useMemo(() => {
    if (currentSubSubcategorySlug) {
      return `${currentCategorySlug}/${currentSubcategorySlug}/${currentSubSubcategorySlug}`;
    }
    if (currentSubcategorySlug) {
      return `${currentCategorySlug}/${currentSubcategorySlug}`;
    }
    return currentCategorySlug;
  }, [currentCategorySlug, currentSubcategorySlug, currentSubSubcategorySlug]);

  // Combine and filter articles
  const filteredArticles = useMemo(() => {
    // Format RSS articles
    const formattedRSSArticles = rssArticles.map(article => ({
      ...formatRSSArticleForCard(article),
      pubDateMs: article.pubDateMs || Date.now(),
    }));

    // Format DB articles
    const formattedDbArticles = dbArticles.map(article => ({
      ...formatArticleForCard(article),
      createdAt: article.created_at,
    }));

    // Combine - RSS has priority
    let articles = formattedRSSArticles.length > 0 
      ? [...sortByDate(formattedRSSArticles), ...sortByDate(formattedDbArticles)]
      : sortByDate(formattedDbArticles);

    // If showing all, return everything
    if (currentCategorySlug === "all") {
      return articles;
    }

    // Category mapping - match article categories to our slugs
    const categoryMap: Record<string, string[]> = {
      wiadomosci: ["wiadomości", "wiadomosci", "news", "polska"],
      swiat: ["świat", "swiat", "world", "usa", "europa"],
      biznes: ["biznes", "business", "gospodarka", "economy"],
      finanse: ["finanse", "finance", "pieniądze"],
      prawo: ["prawo", "law", "sąd"],
      "tech-nauka": ["technologia", "tech", "nauka", "science", "technology"],
      motoryzacja: ["motoryzacja", "auto", "samochody", "automotive"],
      sport: ["sport", "sports"],
      kultura: ["kultura", "culture", "rozrywka", "entertainment"],
      lifestyle: ["lifestyle", "zdrowie", "health", "moda"],
    };

    // Subcategory keywords for filtering by title - comprehensive list
    const subcategoryKeywords: Record<string, string[]> = {
      // ========== WIADOMOŚCI ==========
      "wiadomosci/najwazniejsze": [
        "ważne", "pilne", "breaking", "natychmiast", "alarm", "nadzwyczajne", 
        "dramatyczne", "tragedia", "katastrofa", "eksplozja", "zamach"
      ],
      "wiadomosci/polityka-rzad": [
        "polityka", "sejm", "senat", "rząd", "minister", "premier", "prezydent", 
        "partia", "pis", "po", "koalicja", "opozycja", "ustawa", "głosowanie", 
        "komisja", "poseł", "senator", "marszałek", "wotum", "dymisja", "tusk", 
        "kaczyński", "duda", "morawiecki", "hołownia"
      ],
      "wiadomosci/spoleczenstwo": [
        "społeczeństwo", "społeczny", "ludzie", "obywatel", "protest", "manifestacja",
        "strajk", "demonstracja", "związki zawodowe", "emeryt", "rencista", "bezrobocie",
        "bieda", "pomoc społeczna", "wolontariat", "ngo", "fundacja"
      ],
      "wiadomosci/prawo-sady": [
        "sąd", "trybunał", "wyrok", "proces", "prokuratura", "oskarżenie", "zarzuty",
        "areszt", "więzienie", "adwokat", "prawnik", "apelacja", "kasacja", "sędzia"
      ],
      "wiadomosci/bezpieczenstwo": [
        "policja", "bezpieczeństwo", "kradzież", "przestępstwo", "włamanie", "napad",
        "oszustwo", "morderstwo", "zabójstwo", "wypadek", "straż pożarna", "ratownicy",
        "ewakuacja", "pożar", "powódź", "zatrzymanie", "aresztowanie", "pościg"
      ],
      "wiadomosci/edukacja": [
        "edukacja", "szkoła", "nauczyciel", "uczeń", "student", "uniwersytet", 
        "matura", "egzamin", "rekrutacja", "stypendium", "reforma", "ministerstwo edukacji",
        "kuratorium", "lekcje", "przedszkole", "żłobek"
      ],

      // ========== ŚWIAT ==========
      "swiat/europa": [
        "europa", "unia europejska", "ue", "bruksela", "niemcy", "francja", "włochy",
        "hiszpania", "wielka brytania", "londyn", "paryż", "berlin", "rzym", "madryt",
        "holandia", "belgia", "austria", "szwajcaria", "czechy", "słowacja", "węgry",
        "komisja europejska", "parlament europejski", "nato", "scholz", "macron", "meloni"
      ],
      "swiat/usa": [
        "usa", "ameryka", "stany zjednoczone", "waszyngton", "biały dom", "kongres",
        "biden", "trump", "harris", "republikanie", "demokraci", "nowy jork", "kalifornia",
        "teksas", "floryda", "pentagon", "cia", "fbi", "senat usa", "fed", "dolar"
      ],
      "swiat/ukraina-rosja": [
        "ukraina", "rosja", "putin", "zełenski", "kijów", "moskwa", "wojna", "konflikt",
        "front", "donbas", "krym", "charków", "odessa", "mariupol", "bachmut", "kreml",
        "sankcje", "mobilizacja", "drony", "rakiety", "natarcie", "obrona", "wagnerowcy"
      ],
      "swiat/bliski-wschod": [
        "bliski wschód", "izrael", "palestyna", "gaza", "hamas", "hezbollah", "iran",
        "arabia saudyjska", "liban", "syria", "irak", "jordania", "egipt", "tel awiw",
        "jerozolima", "netanjahu", "teheran", "jemen", "zatoka perska"
      ],
      "swiat/azja": [
        "azja", "chiny", "japonia", "korea", "indie", "pakistan", "tajwan", "pekin",
        "tokio", "seul", "xi jinping", "azja południowo-wschodnia", "singapur", "wietnam",
        "indonezja", "filipiny", "hongkong", "tybet"
      ],
      "swiat/afryka": [
        "afryka", "egipt", "nigeria", "rpa", "kenia", "maroko", "algieria", "etiopia",
        "ghana", "kair", "afryka subsaharyjska", "sahel", "somalia", "sudan"
      ],

      // ========== BIZNES ==========
      "biznes/gospodarka-rynek": [
        "gospodarka", "rynek", "pkb", "wzrost gospodarczy", "recesja", "koniunktura",
        "produkcja przemysłowa", "eksport", "import", "handel zagraniczny", "deficyt",
        "nadwyżka", "produkt krajowy", "gus", "statystyki"
      ],
      "biznes/firmy-branze": [
        "firma", "przedsiębiorstwo", "branża", "spółka", "korporacja", "startup",
        "fuzja", "przejęcie", "inwestycja", "ekspansja", "restrukturyzacja", "zwolnienia",
        "zatrudnienie", "ceo", "prezes", "zarząd", "giełda", "akcje", "orlen", "pko",
        "pzu", "kghm", "pgnig", "pekao", "allegro", "cdprojekt", "lpp"
      ],
      "biznes/ceny-inflacja": [
        "ceny", "inflacja", "podwyżka", "drożeje", "tanieje", "koszty", "rachunki",
        "cena żywności", "cena paliwa", "cena energii", "cena gazu", "deflacja",
        "stopa procentowa", "rppc", "nbp", "glapiński", "stopy procentowe"
      ],
      "biznes/energetyka-paliwa": [
        "energetyka", "paliwa", "energia", "prąd", "gaz", "węgiel", "atom", "elektrownia",
        "oze", "fotowoltaika", "wiatraki", "energia odnawialna", "transformacja energetyczna",
        "cena prądu", "rachunek za prąd", "taryfa", "pge", "tauron", "enea", "energa"
      ],
      "biznes/rynek-pracy": [
        "rynek pracy", "praca", "zatrudnienie", "bezrobocie", "wynagrodzenie", "pensja",
        "minimalna", "umowa", "etat", "zlecenie", "b2b", "pracodawca", "pracownik",
        "rekrutacja", "cv", "rozmowa kwalifikacyjna", "urlop", "l4", "zwolnienie"
      ],
      "biznes/nieruchomosci": [
        "nieruchomości", "mieszkanie", "dom", "działka", "kredyt hipoteczny", "deweloper",
        "ceny mieszkań", "wynajem", "najm", "czynsz", "metr kwadratowy", "bezpieczny kredyt",
        "rynek mieszkaniowy", "rynek nieruchomości", "budowa", "inwestycja mieszkaniowa"
      ],

      // ========== FINANSE ==========
      "finanse/kredyty-banki": [
        "kredyt", "bank", "pożyczka", "oprocentowanie", "rata", "hipoteka", "gotówkowy",
        "refinansowanie", "konsolidacja", "bankowy", "konto", "lokata", "bankowość",
        "ing", "mbank", "santander", "pko bp", "bnp paribas", "millennium"
      ],
      "finanse/kursy-walut": [
        "kurs", "waluta", "dolar", "euro", "frank", "funt", "jen", "wymiana walut",
        "kantor", "forex", "pln", "usd", "eur", "chf", "gbp", "złoty", "kurs złotego"
      ],
      "finanse/zus-emerytury": [
        "zus", "emerytura", "renta", "składka", "ubezpieczenie społeczne", "świadczenie",
        "waloryzacja", "trzynasta emerytura", "czternasta emerytura", "wiek emerytalny",
        "staż pracy", "okres składkowy"
      ],
      "finanse/dofinansowania": [
        "dofinansowanie", "dotacja", "dopłata", "wsparcie", "fundusze", "grant",
        "czyste powietrze", "mój prąd", "800 plus", "500 plus", "rodzina", "becikowe"
      ],
      "finanse/ubezpieczenia": [
        "ubezpieczenie", "polisa", "oc", "ac", "nw", "ubezpieczyciel", "odszkodowanie",
        "likwidacja szkody", "składka ubezpieczeniowa", "agent ubezpieczeniowy"
      ],

      // ========== PRAWO ==========
      "prawo/zmiany-prawie": [
        "zmiana prawa", "nowelizacja", "ustawa", "rozporządzenie", "przepisy", "regulacja",
        "kodeks", "prawo", "legislacja", "dziennik ustaw", "wchodzi w życie"
      ],
      "prawo/pit-vat-cit": [
        "pit", "vat", "cit", "podatek", "deklaracja", "zeznanie podatkowe", "rozliczenie",
        "urząd skarbowy", "fiskus", "ulga", "odliczenie", "zwrot podatku", "skala podatkowa"
      ],
      "prawo/obowiazki": [
        "obowiązek", "wymóg", "termin", "kara", "mandat", "grzywna", "sankcja",
        "kontrola", "inspekcja", "zgłoszenie", "rejestracja"
      ],
      "prawo/ksef": [
        "ksef", "faktura", "e-faktura", "faktura elektroniczna", "krajowy system e-faktur"
      ],

      // ========== TECH + NAUKA ==========
      "tech-nauka/ai": [
        "ai", "sztuczna inteligencja", "chatgpt", "openai", "gpt", "claude", "gemini",
        "machine learning", "uczenie maszynowe", "deep learning", "neural network",
        "sieć neuronowa", "algorytm", "automatyzacja", "robot", "chatbot", "llm"
      ],
      "tech-nauka/cyberbezpieczenstwo": [
        "cyberbezpieczeństwo", "haker", "cyberatak", "włamanie", "phishing", "ransomware",
        "wirus", "malware", "dane osobowe", "rodo", "wyciek danych", "hasło", "ochrona danych"
      ],
      "tech-nauka/internet-platformy": [
        "internet", "facebook", "instagram", "twitter", "x", "tiktok", "youtube",
        "google", "apple", "microsoft", "amazon", "meta", "social media", "platforma",
        "aplikacja", "streaming", "netflix", "spotify"
      ],
      "tech-nauka/nowe-technologie": [
        "technologia", "innowacja", "gadżet", "urządzenie", "smartwatch", "vr", "ar",
        "5g", "6g", "blockchain", "kryptowaluta", "bitcoin", "nft", "metaverse", "quantum"
      ],
      "tech-nauka/odkrycia": [
        "odkrycie", "badanie", "nauka", "naukowiec", "eksperyment", "laboratorium",
        "publikacja naukowa", "research", "przełom", "wynalazek", "patent"
      ],
      "tech-nauka/kosmos": [
        "kosmos", "astronomia", "nasa", "esa", "spacex", "kometa", "asteroida", "mars",
        "księżyc", "rakieta", "satelita", "stacja kosmiczna", "iss", "teleskop", "hubble",
        "james webb", "galaktyka", "gwiazda", "planeta", "czarna dziura", "lot kosmiczny"
      ],
      "tech-nauka/srodowisko-klimat": [
        "klimat", "środowisko", "ekologia", "zmiany klimatyczne", "globalne ocieplenie",
        "emisja co2", "ślad węglowy", "recykling", "segregacja", "zanieczyszczenie",
        "smog", "powietrze", "zrównoważony rozwój", "cop", "szczyt klimatyczny"
      ],

      // ========== MOTORYZACJA ==========
      "motoryzacja/ceny-paliw": [
        "paliwo", "benzyna", "diesel", "lpg", "cena paliwa", "stacja benzynowa",
        "orlen", "bp", "shell", "lotos", "tankowanie", "ropa", "ceny ropy"
      ],
      "motoryzacja/przepisy-mandaty": [
        "mandat", "przepisy", "kodeks drogowy", "prawo jazdy", "punkty karne",
        "fotoradar", "kontrola drogowa", "policja drogowa", "wykroczenie", "kara",
        "oc", "przegląd techniczny", "rejestracja pojazdu", "dowód rejestracyjny"
      ],
      "motoryzacja/nowosci-testy": [
        "nowy model", "premiera", "test", "recenzja", "porównanie", "suv", "sedan",
        "kombi", "hatchback", "pickup", "toyota", "volkswagen", "bmw", "mercedes",
        "audi", "ford", "hyundai", "kia", "skoda", "renault", "peugeot", "opel"
      ],
      "motoryzacja/elektromobilnosc": [
        "elektryk", "samochód elektryczny", "ev", "ładowarka", "ładowanie", "zasięg",
        "tesla", "bateria", "akumulator", "hybryda", "plug-in", "phev", "zeroemisyjny"
      ],

      // ========== SPORT - Main categories ==========
      "sport/pilka-nozna": [
        "piłka nożna", "ekstraklasa", "liga", "uefa", "fifa", "champions league",
        "liga mistrzów", "liga europy", "puchar", "mecz", "bramka", "gol", "trener",
        "transfer", "lech", "legia", "raków", "jagiellonia", "wisła", "górnik",
        "śląsk", "pogoń", "piast", "warta", "cracovia", "widzew", "zagłębie",
        "real", "barcelona", "manchester", "liverpool", "bayern", "dortmund", "psg"
      ],
      "sport/koszykowka": [
        "koszykówka", "nba", "euroliga", "plk", "basket", "kosz", "rzut", "trójka",
        "slam dunk", "playoff", "lakers", "celtics", "bulls", "warriors", "nets",
        "lebron", "curry", "durant", "antetokoumpo", "slask wroclaw"
      ],
      "sport/siatkowka": [
        "siatkówka", "plusliga", "tauron liga", "siatkarze", "siatkarki", "set",
        "tie-break", "atak", "blok", "zagrywka", "heynena", "jastrzębski", "zaksa",
        "resovia", "skra", "gdańsk", "warszawa", "liga narodów"
      ],
      "sport/tenis": [
        "tenis", "atp", "wta", "wimbledon", "roland garros", "us open", "australian open",
        "wielkoszlemowy", "rakieta", "kort", "świątek", "hurkacz", "djokovic", "nadal",
        "federer", "alcaraz", "sinner", "ranking", "turniej"
      ],
      "sport/sporty-motorowe": [
        "f1", "formuła 1", "motogp", "rajdy", "wrc", "żużel", "tor", "wyścig",
        "grand prix", "pole position", "pit stop", "verstappen", "hamilton", "leclerc",
        "kubica", "zmarzlik", "speedway", "rally", "dakar"
      ],
      "sport/sporty-walki": [
        "mma", "ufc", "ksw", "boks", "bokser", "walka", "gala", "knockout", "ko",
        "tko", "waga", "kategoria wagowa", "mistrz", "pas", "oktagon", "ring",
        "jędrzejczyk", "błachowicz", "mamed chalidow", "tyson", "fury", "usyk"
      ],
      "sport/hokej": [
        "hokej", "nhl", "krążek", "bramkarz", "gol hokejowy", "powerplay",
        "stanley cup", "lodowisko", "łyżwy", "kij hokejowy", "oilers", "rangers"
      ],
      "sport/esport": [
        "esport", "e-sport", "gaming", "cs2", "csgo", "counter-strike", "valorant",
        "league of legends", "lol", "dota", "fortnite", "turniej esportowy",
        "drużyna esportowa", "streamer", "twitch", "iem", "blast"
      ],
      "sport/lekkoatletyka": [
        "lekkoatletyka", "bieg", "maraton", "sprint", "skok", "pchnięcie kulą",
        "oszczep", "młot", "wielobój", "mistrzostwa świata lekkoatletyka",
        "diamentowa liga", "stadion lekkoatletyczny", "rekord świata"
      ],
      "sport/sporty-zimowe": [
        "sporty zimowe", "skoki narciarskie", "skoki", "biegi narciarskie",
        "biathlon", "łyżwiarstwo", "curling", "snowboard", "narciarstwo",
        "stoch", "kubacki", "żyła", "kobayashi", "kraft", "puchar świata skoków"
      ],
      "sport/reprezentacja": [
        "reprezentacja", "kadra", "biało-czerwoni", "probierz", "selekcjoner",
        "eliminacje", "mistrzostwa", "euro", "mundial", "mecz reprezentacji"
      ],

      // ========== SPORT - Third level (sub-subcategories) ==========
      // Piłka nożna
      "sport/pilka-nozna/ekstraklasa": [
        "ekstraklasa", "lech", "legia", "raków", "jagiellonia", "wisła kraków",
        "górnik zabrze", "śląsk wrocław", "pogoń szczecin", "piast gliwice",
        "warta poznań", "cracovia", "widzew łódź", "zagłębie lubin", "korona kielce",
        "kolejka ekstraklasy", "tabela ekstraklasy"
      ],
      "sport/pilka-nozna/premier-league": [
        "premier league", "manchester", "united", "city", "liverpool", "chelsea",
        "arsenal", "tottenham", "newcastle", "west ham", "brighton", "aston villa",
        "angielska liga", "english premier"
      ],
      "sport/pilka-nozna/la-liga": [
        "la liga", "real madryt", "barcelona", "atletico", "sevilla", "villarreal",
        "real sociedad", "betis", "athletic bilbao", "hiszpania liga"
      ],
      "sport/pilka-nozna/bundesliga": [
        "bundesliga", "bayern", "dortmund", "borussia", "leipzig", "leverkusen",
        "wolfsburg", "frankfurt", "monachium", "niemiecka liga"
      ],
      "sport/pilka-nozna/serie-a": [
        "serie a", "juventus", "inter", "milan", "napoli", "roma", "lazio",
        "fiorentina", "atalanta", "włoska liga"
      ],
      "sport/pilka-nozna/ligue-1": [
        "ligue 1", "psg", "paris saint germain", "marseille", "lyon", "monaco",
        "lille", "lens", "francuska liga"
      ],
      "sport/pilka-nozna/liga-mistrzow": [
        "liga mistrzów", "champions league", "ucl", "puchar europy", "faza grupowa",
        "półfinał lm", "finał lm", "hymn ligi mistrzów"
      ],
      "sport/pilka-nozna/liga-europy": [
        "liga europy", "europa league", "puchar uefa", "liga konferencji"
      ],
      "sport/pilka-nozna/reprezentacja": [
        "reprezentacja polski", "kadra", "biało-czerwoni", "probierz", "selekcjoner",
        "eliminacje", "euro 2024", "mundial", "mecz towarzyski"
      ],
      "sport/pilka-nozna/transfery": [
        "transfer", "okno transferowe", "sprzedaż", "wypożyczenie", "kontrakt",
        "agent", "rekord transferowy", "wolny transfer", "podpis"
      ],

      // Koszykówka
      "sport/koszykowka/nba": [
        "nba", "lakers", "celtics", "bulls", "warriors", "nets", "lebron james",
        "stephen curry", "kevin durant", "giannis", "playoff nba", "finały nba"
      ],
      "sport/koszykowka/euroliga": [
        "euroliga", "euroleague", "cska", "real madryt koszykówka", "fenerbahce",
        "olympiakos", "barcelona basket", "final four euroliga"
      ],
      "sport/koszykowka/plk": [
        "plk", "polska liga koszykówki", "slask wroclaw", "trefl sopot",
        "zastal zielona góra", "arka gdynia", "basket zielona góra"
      ],

      // Siatkówka
      "sport/siatkowka/plusliga": [
        "plusliga", "zaksa kędzierzyn", "jastrzębski węgiel", "skra bełchatów",
        "resovia", "cev", "mistrz plusligi"
      ],
      "sport/siatkowka/liga-mistrzow-siatkowki": [
        "liga mistrzów siatkówki", "cev champions league", "final four siatkówka"
      ],
      "sport/siatkowka/reprezentacja-siatkowki": [
        "reprezentacja siatkówki", "kadra siatkarzy", "heynena", "grbic",
        "liga narodów siatkówka", "mistrzostwa świata siatkówka"
      ],

      // Tenis
      "sport/tenis/atp": [
        "atp", "ranking atp", "turniej atp", "masters 1000", "djokovic", "nadal",
        "alcaraz", "sinner", "medvedev", "zverev"
      ],
      "sport/tenis/wta": [
        "wta", "ranking wta", "świątek", "sabalenka", "rybakina", "gauff",
        "turniej wta", "wta finals"
      ],
      "sport/tenis/wielki-szlem": [
        "wielki szlem", "australian open", "roland garros", "wimbledon", "us open",
        "grand slam", "puchar tenisowy"
      ],

      // Sporty motorowe
      "sport/sporty-motorowe/formula-1": [
        "f1", "formuła 1", "verstappen", "hamilton", "leclerc", "sainz", "norris",
        "red bull racing", "ferrari f1", "mercedes f1", "mclaren f1", "grand prix"
      ],
      "sport/sporty-motorowe/motogp": [
        "motogp", "moto2", "moto3", "marquez", "bagnaia", "quartararo", "ducati",
        "honda motogp", "yamaha motogp"
      ],
      "sport/sporty-motorowe/rajdy-wrc": [
        "wrc", "rajdy", "rally", "ogier", "neuville", "tanak", "rajd polski",
        "rajd monte carlo", "dakar"
      ],
      "sport/sporty-motorowe/zuzel": [
        "żużel", "speedway", "zmarzlik", "sajfutdinow", "madsen", "grand prix żużel",
        "pgp żużel", "drużynowe mistrzostwa świata"
      ],

      // Sporty walki
      "sport/sporty-walki/mma": [
        "mma", "mieszane sztuki walki", "klatka", "oktagon", "grappling",
        "ground and pound", "submission"
      ],
      "sport/sporty-walki/ufc": [
        "ufc", "ultimate fighting", "dana white", "jon jones", "conor mcgregor",
        "khabib", "makhachev", "volkanovski"
      ],
      "sport/sporty-walki/ksw": [
        "ksw", "mamed chalidow", "soldic", "pudzianowski", "juras", "gamrot",
        "gala ksw", "federacja ksw"
      ],
      "sport/sporty-walki/boks": [
        "boks", "boxing", "tyson fury", "usyk", "canelo", "joshua", "wilder",
        "walka bokserska", "pas mistrzowski boks", "wbc", "wba", "ibf", "wbo"
      ],

      // Hokej
      "sport/hokej/nhl": [
        "nhl", "stanley cup", "oilers", "rangers", "bruins", "maple leafs",
        "mcdavid", "crosby", "ovechkin"
      ],
      "sport/hokej/liga-europejska-hokeja": [
        "chl", "khl", "liga hokejowa", "europejski hokej"
      ],

      // E-sport
      "sport/esport/cs2": [
        "cs2", "counter-strike 2", "csgo", "faze clan", "natus vincere", "g2",
        "iem katowice", "blast premier", "major cs"
      ],
      "sport/esport/lol": [
        "lol", "league of legends", "lck", "lec", "lcs", "worlds", "t1", "gen.g",
        "fnatic lol", "g2 esports"
      ],
      "sport/esport/valorant": [
        "valorant", "vct", "champions valorant", "sentinels", "loud", "fnatic valorant"
      ],

      // Sporty zimowe
      "sport/sporty-zimowe/skoki-narciarskie": [
        "skoki narciarskie", "puchar świata skoków", "turniej czterech skoczni",
        "stoch", "kubacki", "żyła", "kobayashi", "kraft", "raw air"
      ],
      "sport/sporty-zimowe/biegi-narciarskie": [
        "biegi narciarskie", "tour de ski", "kowalczyk", "klaebo", "johaug",
        "bieg narciarski", "styl klasyczny", "łyżwa"
      ],
      "sport/sporty-zimowe/biathlon": [
        "biathlon", "puchar świata biathlon", "boe", "jacquelin", "wierer",
        "strzelanie biathlon", "sprint biathlon"
      ],

      // ========== KULTURA ==========
      "kultura/kino": [
        "film", "kino", "reżyser", "aktor", "aktorka", "premiera filmowa", "oscar",
        "festiwal filmowy", "cannes", "wenecja", "berlin", "box office", "blockbuster",
        "hollywood", "polska kinematografia", "netflix", "hbo max", "disney"
      ],
      "kultura/seriale": [
        "serial", "hbo", "netflix", "amazon prime", "apple tv", "disney+", "sezon",
        "odcinek", "epizod", "obsada", "showrunner", "binge", "streaming", "premiera serialu"
      ],
      "kultura/muzyka": [
        "muzyka", "koncert", "album", "piosenkarz", "piosenkarka", "zespół", "trasa",
        "festiwal", "open'er", "pol'and'rock", "spotify", "top lista", "hit",
        "singiel", "teledysk", "raper", "dj", "pop", "rock", "hip-hop"
      ],
      "kultura/eventy-koncerty": [
        "event", "koncert", "festiwal", "impreza", "występ", "bilet", "wejściówka",
        "arena", "stadion", "hala", "organizator", "gwiazdor"
      ],
      "kultura/popkultura": [
        "popkultura", "celebryta", "influencer", "youtuber", "tiktoker", "viral",
        "memy", "trend", "plotka", "skandal", "social media", "fame"
      ],

      // ========== LIFESTYLE ==========
      "lifestyle/zdrowie-wellbeing": [
        "zdrowie", "wellbeing", "medycyna", "lekarz", "pacjent", "szpital", "klinika",
        "diagnoza", "leczenie", "terapia", "rehabilitacja", "profilaktyka", "badania",
        "szczepienie", "choroba", "objawy", "covid", "grypa", "rak", "cukrzyca"
      ],
      "lifestyle/zdrowe-odzywianie": [
        "dieta", "odżywianie", "kalorie", "białko", "węglowodany", "tłuszcze", "witaminy",
        "suplementy", "odchudzanie", "wegetarianizm", "wegańskie", "zdrowe jedzenie"
      ],
      "lifestyle/styl-zycia": [
        "styl życia", "lifestyle", "rutyna", "produktywność", "work-life balance",
        "minimalizm", "slow life", "mindfulness", "medytacja", "relaks"
      ],
      "lifestyle/rodzina-relacje": [
        "rodzina", "relacje", "związek", "małżeństwo", "dziecko", "wychowanie",
        "rodzicielstwo", "ciąża", "macierzyństwo", "ojcostwo", "psychologia"
      ],
      "lifestyle/podroze": [
        "podróże", "turystyka", "wakacje", "urlop", "lot", "hotel", "rezerwacja",
        "plaża", "góry", "wycieczka", "zwiedzanie", "all inclusive", "last minute",
        "paszport", "wiza", "lotnisko", "samolot", "grecja", "włochy", "hiszpania"
      ],
      "lifestyle/moda": [
        "moda", "fashion", "ubrania", "styl", "trend", "kolekcja", "projektant",
        "butik", "zakupy", "outfit", "stylizacja", "dodatki", "buty", "torebka"
      ],
    };

    // Get category names to match
    const categoryNames = categoryMap[currentCategorySlug] || [currentCategorySlug];
    const keywords = CATEGORY_KEYWORDS[currentCategorySlug] || [];
    const exclusions = CATEGORY_EXCLUSIONS?.[currentCategorySlug] || [];

    // Helper function to check if article should be excluded from category
    const shouldExclude = (article: { title?: string; category?: string }) => {
      if (exclusions.length === 0) return false;
      const titleLower = (article.title || "").toLowerCase();
      const categoryLower = (article.category || "").toLowerCase();
      
      // Check if any exclusion keyword is present
      return exclusions.some(exclusion => 
        titleLower.includes(exclusion.toLowerCase()) || 
        categoryLower.includes(exclusion.toLowerCase())
      );
    };

    // Helper function to check if article belongs to a higher priority category
    const belongsToHigherPriorityCategory = (article: { title?: string; category?: string }) => {
      const currentPriority = CATEGORY_PRIORITY?.[currentCategorySlug] || 0;
      const titleLower = (article.title || "").toLowerCase();
      const articleCategoryLower = (article.category || "").toLowerCase();
      
      // Check each category with higher priority
      for (const [catSlug, catPriority] of Object.entries(CATEGORY_PRIORITY || {})) {
        if (catPriority <= currentPriority) continue;
        if (catSlug === currentCategorySlug) continue;
        
        // Check if article matches this higher priority category
        const higherCatKeywords = CATEGORY_KEYWORDS[catSlug] || [];
        const higherCatNames = categoryMap[catSlug] || [catSlug];
        
        // Direct category match with higher priority category
        const directMatch = higherCatNames.some(cat => 
          articleCategoryLower === cat.toLowerCase() || 
          articleCategoryLower.includes(cat.toLowerCase())
        );
        
        if (directMatch) return true;
        
        // Keyword match with higher priority category
        const keywordMatch = higherCatKeywords.some(keyword => 
          titleLower.includes(keyword.toLowerCase())
        );
        
        if (keywordMatch) return true;
      }
      
      return false;
    };

    // Filter by main category first
    let filtered = articles.filter(article => {
      const articleCategory = (article.category || "").toLowerCase();
      const titleLower = (article.title || "").toLowerCase();
      
      // Check exclusions first - if article contains exclusion keywords, skip it
      if (shouldExclude(article)) {
        return false;
      }
      
      // Check if article belongs to a higher priority category
      if (belongsToHigherPriorityCategory(article)) {
        return false;
      }
      
      // Direct category match
      const directMatch = categoryNames.some(cat => 
        articleCategory === cat.toLowerCase() || 
        articleCategory.includes(cat.toLowerCase())
      );
      
      if (directMatch) return true;
      
      // Keyword match in title
      return keywords.some(keyword => 
        titleLower.includes(keyword.toLowerCase())
      );
    });

    // If subcategory is selected, filter further by title keywords
    if (currentSubcategorySlug) {
      // First try sub-subcategory level
      if (currentSubSubcategorySlug) {
        const subSubKey = `${currentCategorySlug}/${currentSubcategorySlug}/${currentSubSubcategorySlug}`;
        const subSubKeywords = subcategoryKeywords[subSubKey] || [];
        
        if (subSubKeywords.length > 0) {
          filtered = filtered.filter(article => {
            const titleLower = (article.title || "").toLowerCase();
            return subSubKeywords.some(keyword => 
              titleLower.includes(keyword.toLowerCase())
            );
          });
        }
      } else {
        // Standard subcategory filtering
        const subKey = `${currentCategorySlug}/${currentSubcategorySlug}`;
        const subKeywords = subcategoryKeywords[subKey] || [];
        
        if (subKeywords.length > 0) {
          filtered = filtered.filter(article => {
            const titleLower = (article.title || "").toLowerCase();
            return subKeywords.some(keyword => 
              titleLower.includes(keyword.toLowerCase())
            );
          });
        }
      }
    }

    return filtered;
  }, [rssArticles, dbArticles, currentCategorySlug, currentSubcategorySlug, currentSubSubcategorySlug]);

  // Infinite scroll - always has more by cycling through articles
  const hasMore = true;
  
  const loadMore = useCallback(() => {
    setVisibleGrids(prev => prev + GRIDS_PER_LOAD);
  }, []);

  const { loadMoreRef, isLoading } = useInfiniteScroll(loadMore, hasMore);

  // Reset visible grids when category changes
  useEffect(() => {
    setVisibleGrids(INITIAL_GRIDS);
  }, [currentCategorySlug, currentSubcategorySlug, currentSubSubcategorySlug]);

  // Generate enough articles for infinite scroll by cycling
  const getArticlesForDisplay = useMemo(() => {
    if (filteredArticles.length === 0) return [];
    
    const totalNeeded = visibleGrids * ARTICLES_PER_GRID;
    const result = [];
    for (let i = 0; i < totalNeeded; i++) {
      result.push(filteredArticles[i % filteredArticles.length]);
    }
    return result;
  }, [filteredArticles, visibleGrids]);

  // Split feed articles into grids of 12
  const articleGrids = useMemo(() => {
    const grids = [];
    for (let i = 0; i < visibleGrids; i++) {
      const startIndex = i * ARTICLES_PER_GRID;
      const gridArticles = getArticlesForDisplay.slice(startIndex, startIndex + ARTICLES_PER_GRID);
      if (gridArticles.length > 0) {
        grids.push(gridArticles);
      }
    }
    return grids;
  }, [getArticlesForDisplay, visibleGrids]);

  const isLoadingData = rssLoading || dbLoading;

  // Build page title
  const pageTitle = subSubcategoryName 
    ? `${categoryName} › ${subcategoryName} › ${subSubcategoryName}`
    : subcategoryName 
      ? `${categoryName} › ${subcategoryName}`
      : categoryName;

  // Redirect to home if category is hidden (after all hooks are called)
  if (categoryStatusChecked && !isCategoryActive && currentCategorySlug !== "all") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="w-full">
      
      {/* Floating Category Bar */}
      <CategoryBar activeCategory={activeCategory} />
      
      <main className="w-full px-2 sm:px-4 md:container py-3 sm:py-4 md:py-6">
        {/* Category-specific Top Ad Banner with fallback to homepage banner */}
        <div className="mb-4 sm:mb-6">
          <CategoryTopBanner categorySlug={currentCategorySlug} className="w-full" />
        </div>

        {/* Page Title */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6">
          {pageTitle}
        </h1>

        {/* Category Daily Summary */}
        {currentCategorySlug && currentCategorySlug !== "all" && currentCategorySlug !== "lokalne" && (
          <CategoryDailySummary 
            categorySlug={currentCategorySlug} 
            categoryName={categoryName} 
          />
        )}

        {/* Loading State */}
        {isLoadingData && filteredArticles.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Ładowanie artykułów...</span>
          </div>
        )}

        {/* No Articles State */}
        {!isLoadingData && filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">
              Brak artykułów w kategorii "{pageTitle}"
            </p>
            <Link 
              to="/" 
              className="text-primary hover:underline"
            >
              ← Wróć do strony głównej
            </Link>
          </div>
        )}

        {/* Main Content - Grid pattern with carousels (same as Index) */}
        {filteredArticles.length > 0 && (
          <div className="space-y-6 sm:space-y-8">
            {articleGrids.map((gridArticles, gridIndex) => (
              <div key={`grid-${gridIndex}`}>
                {/* Compact mode - list view */}
                {isCompact ? (
                  <div className="space-y-1">
                    {gridArticles.map((article, articleIndex) => (
                      <NewsCard
                        key={`${article.id}-${gridIndex}-${articleIndex}`}
                        id={article.id}
                        title={article.title}
                        category={article.category}
                        image={article.image}
                        timestamp={article.timestamp}
                        source={article.source}
                        sourceUrl={'sourceUrl' in article ? article.sourceUrl : undefined}
                        badge={'badge' in article ? article.badge : undefined}
                        variant="compact"
                      />
                    ))}
                  </div>
                ) : (
                  /* 3x4 Article Grid (12 articles) - with feed-tile ads replacing specific positions */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gridArticles.map((article, articleIndex) => {
                      // Check if there's an ad for this position (1-indexed)
                      const tilePosition = articleIndex + 1;
                      const adForPosition = getAdForPosition(tilePosition);
                      
                      if (adForPosition) {
                        return (
                          <FeedTileAdCard
                            key={`ad-tile-${gridIndex}-${tilePosition}`}
                            id={adForPosition.id}
                            contentUrl={adForPosition.contentUrl}
                            targetUrl={adForPosition.targetUrl}
                            name={adForPosition.name}
                            onImpression={trackImpression}
                            onClick={trackClick}
                          />
                        );
                      }
                      
                      return (
                        <NewsCard 
                          key={`${article.id}-${gridIndex}-${articleIndex}`} 
                          id={article.id} 
                          title={article.title} 
                          category={article.category} 
                          image={article.image} 
                          timestamp={article.timestamp} 
                          badge={'badge' in article ? article.badge : undefined} 
                          source={article.source} 
                          sourceUrl={'sourceUrl' in article ? article.sourceUrl : undefined} 
                          variant="default" 
                        />
                      );
                    })}
                  </div>
                )}

                {/* Carousel Banner after each grid of 12 items */}
                <div className="mt-6 sm:mt-8">
                  {(() => {
                    // Check if there's a carousel group for this position
                    const carouselGroup = getCarouselForPosition(gridIndex + 1);
                    
                    if (carouselGroup && carouselGroup.banners.length > 0) {
                      // Use the carousel with banners from the database
                      const formattedBanners = formatBannersForCarousel(carouselGroup.banners);
                      return (
                        <FeedBannerCarousel
                          banners={formattedBanners}
                          className="w-full"
                        />
                      );
                    }
                    
                    // Fallback to auction ad slot if no carousel configured
                    return (
                      <AuctionAdSlot 
                        variant="horizontal" 
                        placementSlug="feed-carousel"
                        className="w-full" 
                        slotIndex={gridIndex + 1}
                      />
                    );
                  })()}
                </div>
              </div>
            ))}

            {/* Load more trigger - infinite scroll */}
            <div 
              ref={loadMoreRef} 
              className="py-8 flex justify-center min-h-[200px] sm:min-h-[180px] md:min-h-[150px]"
              style={{ touchAction: 'pan-y' }}
            >
              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                  <Loader2 className="h-6 w-6 sm:h-7 sm:w-7 animate-spin" />
                  <span className="text-senior-base">Ładowanie...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
