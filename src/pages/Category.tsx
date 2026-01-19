import { useState, useCallback, useMemo, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CategoryBar } from "@/components/navigation/CategoryBar";
import { NewsCard } from "@/components/news/NewsCard";
import { AuctionAdSlot } from "@/components/widgets/AuctionAdSlot";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useDisplayMode } from "@/hooks/use-display-mode";
import { Loader2 } from "lucide-react";
import { useArticles, formatArticleForCard } from "@/hooks/use-articles";
import { useRSSArticles, formatRSSArticleForCard } from "@/hooks/use-rss-articles";
import { CATEGORIES, getCategoryBySlug, CATEGORY_KEYWORDS } from "@/data/categories";

// Responsive initial count based on device
const getInitialCount = () => {
  if (typeof window === "undefined") return 12;
  if (window.innerWidth < 640) return 6;
  if (window.innerWidth < 1024) return 9;
  return 12;
};

const ARTICLES_PER_LOAD = 6;

// Sort articles by date (newest first)
const sortByDate = <T extends { pubDateMs?: number; createdAt?: string }>(array: T[]): T[] => {
  return [...array].sort((a, b) => {
    const dateA = a.pubDateMs || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const dateB = b.pubDateMs || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    return dateB - dateA;
  });
};

export default function Category() {
  const { category, subcategory } = useParams<{ category: string; subcategory?: string }>();
  const [searchParams] = useSearchParams();
  const subFromQuery = searchParams.get("sub");
  const subSubFromQuery = searchParams.get("subsub");
  
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
  
  const [visibleCount, setVisibleCount] = useState(getInitialCount);

  // Determine current category/subcategory
  const currentCategorySlug = category || "all";
  const currentSubcategorySlug = subcategory || subFromQuery || null;
  
  // Get category info for display
  const categoryInfo = getCategoryBySlug(currentCategorySlug);
  const categoryName = categoryInfo?.name || currentCategorySlug;
  
  // Get subcategory name
  const subcategoryInfo = currentSubcategorySlug 
    ? categoryInfo?.subcategories.find(s => s.slug === currentSubcategorySlug)
    : null;
  const subcategoryName = subcategoryInfo?.name || currentSubcategorySlug;

  // Build active category slug for CategoryBar
  const activeCategory = useMemo(() => {
    if (currentSubcategorySlug) {
      return `${currentCategorySlug}/${currentSubcategorySlug}`;
    }
    return currentCategorySlug;
  }, [currentCategorySlug, currentSubcategorySlug]);

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

      // ========== SPORT ==========
      "sport/pilka-nozna": [
        "piłka nożna", "ekstraklasa", "liga", "uefa", "fifa", "champions league",
        "liga mistrzów", "liga europy", "puchar", "mecz", "bramka", "gol", "trener",
        "transfer", "lech", "legia", "raków", "jagiellonia", "wisła", "górnik",
        "śląsk", "pogoń", "piast", "warta", "cracovia", "widzew", "zagłębie",
        "real", "barcelona", "manchester", "liverpool", "bayern", "dortmund", "psg"
      ],
      "sport/reprezentacja": [
        "reprezentacja", "kadra", "biało-czerwoni", "probierz", "selekcjoner",
        "eliminacje", "mistrzostwa", "euro", "mundial", "mecz reprezentacji"
      ],
      "sport/rozgrywki-europejskie": [
        "champions league", "liga mistrzów", "liga europy", "liga konferencji",
        "puchar europy", "runda", "faza grupowa", "półfinał", "finał"
      ],
      "sport/siatkowka": [
        "siatkówka", "plusliga", "tauron liga", "siatkarze", "siatkarki", "set",
        "tie-break", "atak", "blok", "zagrywka", "heynena", "jastrzębski", "zaksa",
        "resovia", "skra", "gdańsk", "warszawa", "liga narodów"
      ],
      "sport/sporty-walki": [
        "mma", "ufc", "ksw", "boks", "bokser", "walka", "gala", "knockout", "ko",
        "tko", "waga", "kategoria wagowa", "mistrz", "pas", "oktagon", "ring",
        "jędrzejczyk", "błachowicz", "mamed chalidow", "tyson"
      ],
      "sport/tenis": [
        "tenis", "atp", "wta", "wimbledon", "roland garros", "us open", "australian open",
        "wielkoszlemowy", "rakieta", "kort", "świątek", "hurkacz", "djokovic", "nadal",
        "federer", "alcaraz", "sinner", "ranking", "turniej"
      ],
      "sport/motorsport": [
        "f1", "formuła 1", "motogp", "rajdy", "wrc", "żużel", "tor", "wyścig",
        "grand prix", "pole position", "pit stop", "verstappen", "hamilton", "leclerc",
        "kubica", "zmarzlik", "speedway"
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

    // Filter by main category first
    let filtered = articles.filter(article => {
      const articleCategory = (article.category || "").toLowerCase();
      
      // Direct category match
      const directMatch = categoryNames.some(cat => 
        articleCategory === cat.toLowerCase() || 
        articleCategory.includes(cat.toLowerCase())
      );
      
      if (directMatch) return true;
      
      // Keyword match in title
      const titleLower = (article.title || "").toLowerCase();
      return keywords.some(keyword => 
        titleLower.includes(keyword.toLowerCase())
      );
    });

    // If subcategory is selected, filter further by title keywords
    if (currentSubcategorySlug) {
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

    return filtered;
  }, [rssArticles, dbArticles, currentCategorySlug, currentSubcategorySlug]);

  // Infinite scroll
  const hasMore = visibleCount < filteredArticles.length;
  
  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + ARTICLES_PER_LOAD, filteredArticles.length));
  }, [filteredArticles.length]);

  const { loadMoreRef, isLoading } = useInfiniteScroll(loadMore, hasMore);

  // Reset visible count when category changes
  useEffect(() => {
    setVisibleCount(getInitialCount());
  }, [currentCategorySlug, currentSubcategorySlug]);

  const visibleArticles = filteredArticles.slice(0, visibleCount);
  const heroArticle = visibleArticles[0];
  const gridArticles = visibleArticles.slice(1);

  const isLoadingData = rssLoading || dbLoading;

  // Build page title
  const pageTitle = subcategoryName 
    ? `${categoryName} › ${subcategoryName}`
    : categoryName;

  return (
    <div className="min-h-screen bg-background w-full overflow-x-clip">
      <Header />
      
      {/* Floating Category Bar */}
      <CategoryBar activeCategory={activeCategory} />
      
      <main className="w-full px-2 sm:px-4 md:container py-3 sm:py-4 md:py-6">
        {/* Top Ad Banner */}
        <div className="mb-4 sm:mb-6">
          <AuctionAdSlot variant="horizontal" className="w-full" slotIndex={0} />
        </div>

        {/* Page Title */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6">
          {pageTitle}
        </h1>

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

        {/* Articles Grid */}
        {filteredArticles.length > 0 && (
          <div className="space-y-4 sm:space-y-6">
            {/* Hero Article - hidden in compact mode */}
            {heroArticle && !isCompact && (
              <NewsCard
                id={heroArticle.id}
                title={heroArticle.title}
                excerpt={heroArticle.excerpt}
                category={heroArticle.category}
                image={heroArticle.image}
                timestamp={heroArticle.timestamp}
                source={heroArticle.source}
                sourceUrl={'sourceUrl' in heroArticle ? heroArticle.sourceUrl : undefined}
                badge={'badge' in heroArticle ? heroArticle.badge : undefined}
                variant="hero"
                className="h-[250px] sm:h-[350px] lg:h-[400px]"
              />
            )}

            {/* Compact mode - list view */}
            {isCompact ? (
              <div className="space-y-1">
                {visibleArticles.map((article, index) => (
                  <NewsCard
                    key={`${article.id}-${index}`}
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
              /* Grid of Articles */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {gridArticles.map((article, index) => (
                  <NewsCard
                    key={`${article.id}-${index}`}
                    id={article.id}
                    title={article.title}
                    category={article.category}
                    image={article.image}
                    timestamp={article.timestamp}
                    source={article.source}
                    sourceUrl={'sourceUrl' in article ? article.sourceUrl : undefined}
                    badge={'badge' in article ? article.badge : undefined}
                    variant="default"
                  />
                ))}
              </div>
            )}

            {/* Infinite scroll trigger */}
            <div 
              ref={loadMoreRef} 
              className="py-6 sm:py-8 flex justify-center min-h-[60px]"
            >
              {isLoading && hasMore && (
                <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                  <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                  <span className="text-sm sm:text-base">Ładowanie więcej artykułów...</span>
                </div>
              )}
              
              {!hasMore && filteredArticles.length > 0 && (
                <p className="text-muted-foreground text-sm">
                  To wszystkie artykuły w tej kategorii
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
