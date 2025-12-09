export interface Article {
  id: string;
  title: string;
  excerpt?: string;
  category: string;
  image: string;
  timestamp: string;
  badge?: "hot" | "trending" | "new";
  source?: string;
}

export const newsArticles: Article[] = [
  {
    id: "n1",
    title: "Nowe przepisy podatkowe wchodzą w życie od przyszłego roku",
    excerpt: "Ministerstwo Finansów ogłosiło szczegóły zmian w systemie podatkowym. Sprawdź, co się zmieni.",
    category: "Wiadomości",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=500&fit=crop",
    timestamp: "1 godz. temu",
    badge: "hot",
    source: "PAP",
  },
  {
    id: "n2",
    title: "Szczyt klimatyczny: kluczowe decyzje dla przyszłości planety",
    category: "Wiadomości",
    image: "https://images.unsplash.com/photo-1569163139599-0f4517e36f51?w=400&h=300&fit=crop",
    timestamp: "3 godz. temu",
    source: "Reuters",
  },
  {
    id: "n3",
    title: "Reforma edukacji: co czeka uczniów i nauczycieli?",
    category: "Wiadomości",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop",
    timestamp: "5 godz. temu",
    source: "TVN24",
  },
  {
    id: "n4",
    title: "Protesty w centrum stolicy - tysiące na ulicach",
    category: "Wiadomości",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop",
    timestamp: "7 godz. temu",
    badge: "trending",
    source: "Polsat News",
  },
];

export const businessArticles: Article[] = [
  {
    id: "b1",
    title: "GPW bije rekordy - indeksy na historycznych szczytach",
    excerpt: "Polski rynek kapitałowy przeżywa boom. Analitycy komentują sytuację i prognozują dalsze wzrosty.",
    category: "Biznes",
    image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=500&fit=crop",
    timestamp: "30 min temu",
    badge: "trending",
    source: "Money.pl",
  },
  {
    id: "b2",
    title: "Kurs złotego najsilniejszy od 5 lat",
    category: "Biznes",
    image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&h=300&fit=crop",
    timestamp: "2 godz. temu",
    source: "Bloomberg",
  },
  {
    id: "b3",
    title: "Nowa siedziba polskiego giganta technologicznego",
    category: "Biznes",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop",
    timestamp: "4 godz. temu",
    source: "Forbes",
  },
  {
    id: "b4",
    title: "Startup z Krakowa pozyskał 50 mln USD",
    category: "Biznes",
    image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=300&fit=crop",
    timestamp: "6 godz. temu",
    badge: "new",
    source: "Business Insider",
  },
];

export const sportArticles: Article[] = [
  {
    id: "s1",
    title: "Lewandowski z hat-trickiem! Barcelona demoluje rywala",
    excerpt: "Polski napastnik w znakomitej formie strzelił trzy bramki w meczu ligowym.",
    category: "Sport",
    image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=500&fit=crop",
    timestamp: "45 min temu",
    badge: "hot",
    source: "Sport.pl",
  },
  {
    id: "s2",
    title: "Świątek w półfinale turnieju WTA",
    category: "Sport",
    image: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=300&fit=crop",
    timestamp: "3 godz. temu",
    source: "Eurosport",
  },
  {
    id: "s3",
    title: "Reprezentacja poznała rywali w eliminacjach",
    category: "Sport",
    image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&h=300&fit=crop",
    timestamp: "5 godz. temu",
    source: "TVP Sport",
  },
  {
    id: "s4",
    title: "Formuła 1: Verstappen z pole position",
    category: "Sport",
    image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&h=300&fit=crop",
    timestamp: "8 godz. temu",
    source: "F1.com",
  },
];

export const techArticles: Article[] = [
  {
    id: "t1",
    title: "Apple prezentuje nową generację iPhone - rewolucja w fotografii",
    excerpt: "Najnowszy model wprowadza przełomowe rozwiązania w dziedzinie fotografii mobilnej.",
    category: "Technologia",
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=500&fit=crop",
    timestamp: "1 godz. temu",
    badge: "new",
    source: "The Verge",
  },
  {
    id: "t2",
    title: "ChatGPT dostaje nową funkcję - rozmowy głosowe",
    category: "Technologia",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop",
    timestamp: "4 godz. temu",
    badge: "trending",
    source: "TechCrunch",
  },
  {
    id: "t3",
    title: "Tesla otwiera fabrykę w Polsce - 5000 nowych miejsc pracy",
    category: "Technologia",
    image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=300&fit=crop",
    timestamp: "6 godz. temu",
    source: "Wyborcza",
  },
  {
    id: "t4",
    title: "Polska firma tworzy konkurenta dla Starlink",
    category: "Technologia",
    image: "https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=400&h=300&fit=crop",
    timestamp: "9 godz. temu",
    source: "Spider's Web",
  },
];

export const lifestyleArticles: Article[] = [
  {
    id: "l1",
    title: "10 najlepszych miejsc na jesienną wycieczkę w Polsce",
    excerpt: "Odkryj piękno polskiej jesieni. Przedstawiamy najciekawsze destynacje na weekend.",
    category: "Lifestyle",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=500&fit=crop",
    timestamp: "2 godz. temu",
    source: "National Geographic",
  },
  {
    id: "l2",
    title: "Nowy trend w dietetyce: czy warto go wypróbować?",
    category: "Lifestyle",
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop",
    timestamp: "5 godz. temu",
    source: "Zdrowie.pl",
  },
  {
    id: "l3",
    title: "Jak zorganizować idealne home office?",
    category: "Lifestyle",
    image: "https://images.unsplash.com/photo-1486946255434-2466348c2166?w=400&h=300&fit=crop",
    timestamp: "7 godz. temu",
    source: "Elle Decor",
  },
];

export const recommendedArticles: Article[] = [
  {
    id: "r1",
    title: "Ekspert: To będzie najważniejsza zmiana w 2024 roku",
    category: "Analiza",
    image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=200&h=200&fit=crop",
    timestamp: "2 godz. temu",
    source: "Newsweek",
  },
  {
    id: "r2",
    title: "5 książek, które musisz przeczytać tej jesieni",
    category: "Kultura",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&h=200&fit=crop",
    timestamp: "4 godz. temu",
    source: "Polityka",
  },
  {
    id: "r3",
    title: "Przepis na idealny weekend: co robić w Warszawie?",
    category: "Lifestyle",
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=200&h=200&fit=crop",
    timestamp: "6 godz. temu",
    source: "Warszawa.pl",
  },
  {
    id: "r4",
    title: "Jak zaoszczędzić na rachunkach za prąd?",
    category: "Poradnik",
    image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=200&h=200&fit=crop",
    timestamp: "8 godz. temu",
    source: "Money.pl",
  },
];
