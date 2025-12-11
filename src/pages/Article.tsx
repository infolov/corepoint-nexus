import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NewsCard } from "@/components/news/NewsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Share2, Bookmark, ExternalLink } from "lucide-react";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { ArticleSummary } from "@/components/article/ArticleSummary";
import { SourcesCarousel } from "@/components/article/SourcesCarousel";
import {
  newsArticles,
  businessArticles,
  sportArticles,
  techArticles,
  lifestyleArticles,
} from "@/data/mockNews";

// Combine all articles for lookup
const allArticles = [
  ...newsArticles,
  ...businessArticles,
  ...sportArticles,
  ...techArticles,
  ...lifestyleArticles,
];

// Generate detailed Polish content based on category and title
const getArticleContent = (title: string, category: string) => {
  const categoryContent: Record<string, string> = {
    "Wiadomości": `
${title}

Najnowsze doniesienia z kraju i świata potwierdzają, że ta sprawa budzi ogromne zainteresowanie wśród Polaków. Eksperci i analitycy od tygodni obserwują rozwój sytuacji, próbując przewidzieć jej dalszy przebieg.

## Tło wydarzeń

Jak informują źródła bliskie sprawie, wszystko zaczęło się kilka tygodni temu. Początkowo nikt nie spodziewał się, że wydarzenia przyjmą taki obrót. Dziennikarze śledczy dotarli do kluczowych informacji, które rzucają nowe światło na całą sprawę.

Rzecznik prasowy potwierdził: "Prowadzimy intensywne działania w tej sprawie. Wszystkie informacje są na bieżąco weryfikowane przez odpowiednie służby."

## Reakcje społeczne

Polacy reagują żywiołowo na najnowsze doniesienia. W mediach społecznościowych temat stał się numerem jeden, generując tysiące komentarzy i dyskusji. Sondaże pokazują, że większość obywateli uważnie śledzi rozwój wydarzeń.

Organizacje pozarządowe apelują o spokój i rozwagę: "Musimy poczekać na oficjalne stanowisko instytucji państwowych. Spekulacje w tym momencie mogą być szkodliwe."

## Co dalej?

Według naszych informatorów, w najbliższych dniach możemy spodziewać się kolejnych istotnych komunikatów. Władze zapowiedziały konferencję prasową, na której mają zostać przedstawione szczegóły dalszych działań.

Eksperci przewidują, że konsekwencje tych wydarzeń będą odczuwalne przez wiele miesięcy. Niektórzy mówią nawet o przełomowym momencie w historii naszego kraju.

Redakcja będzie na bieżąco informować o wszystkich nowych faktach w tej sprawie.
`,
    "Biznes": `
${title}

Polski rynek finansowy przeżywa dynamiczny okres. Analitycy największych instytucji finansowych w kraju zwracają uwagę na kilka kluczowych wskaźników, które mogą wpłynąć na dalszy rozwój sytuacji gospodarczej.

## Analiza rynku

Dane makroekonomiczne z ostatniego kwartału pokazują interesujące trendy. PKB Polski rośnie w tempie przewyższającym średnią europejską, co cieszy ekonomistów. Jednocześnie inflacja utrzymuje się na kontrolowanym poziomie.

"Widzimy wyraźne sygnały ożywienia gospodarczego" - komentuje główny ekonomista jednego z wiodących banków. "Przedsiębiorcy są coraz bardziej optymistyczni co do przyszłości."

## Inwestycje i kapitał

Napływ inwestycji zagranicznych do Polski w tym roku przekroczył już oczekiwania. Szczególnie aktywne są sektory technologiczny i produkcyjny. Nowe fabryki i centra usług wspólnych powstają w całym kraju.

Giełda Papierów Wartościowych w Warszawie notuje stabilne wzrosty. Indeks WIG20 osiągnął poziomy niewidziane od lat, co przyciąga kolejnych inwestorów indywidualnych i instytucjonalnych.

## Prognozy ekspertów

Ekonomiści są zgodni - najbliższe miesiące będą kluczowe dla polskiej gospodarki. Decyzje Rady Polityki Pieniężnej dotyczące stóp procentowych mogą znacząco wpłynąć na rynek kredytowy i konsumpcję.

"Polska ma wszystkie atuty, by pozostać liderem wzrostu w regionie" - podsumowuje raport jednej z czołowych agencji ratingowych.

Zachęcamy do śledzenia naszych codziennych analiz rynkowych.
`,
    "Sport": `
${title}

To był mecz, który przejdzie do historii! Emocje sięgały zenitu, a kibice nie mogli oderwać oczu od boiska. Polscy sportowcy po raz kolejny pokazali, na co ich stać na międzynarodowej arenie.

## Przebieg rywalizacji

Od pierwszych minut było widać determinację naszych zawodników. Trener przygotował taktykę, która zaskoczyła rywali. Świetna forma fizyczna i mentalna przełożyła się na efektowne zagrania.

"Pracowaliśmy na ten moment przez całą sezon" - powiedział kapitan drużyny w pomeczowym wywiadzie. "Każdy z nas dał z siebie 100 procent."

## Kluczowe momenty

W drugiej połowie spotkania nastąpił punkt zwrotny. Seria błyskawicznych akcji doprowadziła do przewagi, która okazała się decydująca. Publiczność szalała z radości, a sportowcy celebrowali każdy sukces.

Szczególnie wyróżnił się młody talent, który zdobył uznanie ekspertów. "To przyszłość polskiego sportu" - zgodnie twierdzą komentatorzy.

## Reakcje i komentarze

Media sportowe z całej Europy komentują występ Polaków. Zagraniczne redakcje podkreślają profesjonalizm i determinację naszych zawodników. W mediach społecznościowych hashtagi związane z meczem są w trendach.

Prezes federacji zapowiedział specjalne premie dla całego zespołu. "To sukces, który cieszy wszystkich kibiców" - podkreślił.

## Co przed nami?

Już za tydzień kolejne ważne spotkanie. Stawka jest wysoka - chodzi o awans do następnej rundy. Drużyna już rozpoczęła przygotowania. Kibice mogą kupować bilety na oficjalnej stronie.
`,
    "Technologia": `
${title}

Świat technologii nigdy nie stoi w miejscu. Najnowsze innowacje pokazują, jak szybko zmienia się nasza rzeczywistość. Polscy specjaliści IT odgrywają coraz większą rolę w globalnym wyścigu technologicznym.

## Przełomowe rozwiązania

Nowa technologia, o której dziś piszemy, może zrewolucjonizować sposób, w jaki korzystamy z urządzeń elektronicznych. Inżynierowie pracowali nad tym projektem przez lata, a teraz możemy zobaczyć efekty ich pracy.

"To dopiero początek" - mówi główny architekt systemu. "W ciągu najbliższych lat zobaczymy zastosowania, o których dziś nawet nie śnimy."

## Sztuczna inteligencja i przyszłość

AI zmienia praktycznie każdą branżę. Od medycyny przez finanse po rozrywkę - algorytmy uczenia maszynowego usprawniają procesy i tworzą nowe możliwości. Polskie startupy są w czołówce firm rozwijających te technologie.

Etyczne aspekty rozwoju sztucznej inteligencji są przedmiotem ożywionych debat. Eksperci apelują o odpowiedzialne podejście do wdrażania nowych rozwiązań.

## Cyberbezpieczeństwo

W erze cyfrowej transformacji ochrona danych staje się priorytetem. Firmy inwestują miliony w systemy zabezpieczeń. Specjaliści ds. cyberbezpieczeństwa są jednymi z najbardziej poszukiwanych pracowników na rynku.

"Każdy użytkownik powinien dbać o swoją cyfrową higienę" - przypominają eksperci.

## Podsumowanie

Technologia zmienia nasz świat na lepsze, ale wymaga świadomego i odpowiedzialnego korzystania. Śledź nasze publikacje, by być na bieżąco z najnowszymi trendami.
`,
    "Lifestyle": `
${title}

Dbanie o jakość życia to nie luksus, lecz konieczność. Coraz więcej Polaków zwraca uwagę na równowagę między pracą a odpoczynkiem. Przedstawiamy najnowsze trendy, które mogą pozytywnie wpłynąć na Twoje codzienne życie.

## Zdrowy styl życia

Eksperci są zgodni - kluczem do dobrego samopoczucia jest regularna aktywność fizyczna i zbilansowana dieta. Nie chodzi o ekstremalne diety czy morderczy trening, ale o konsekwentne, małe zmiany w codziennych nawykach.

"30 minut ruchu dziennie może całkowicie odmienić Twoje zdrowie" - podkreśla dietetyk kliniczny.

## Wellbeing i mindfulness

Praktyki uważności zyskują coraz więcej zwolenników. Medytacja, joga czy po prostu świadome oddychanie pomagają radzić sobie ze stresem współczesnego życia. Aplikacje do medytacji notują rekordowe liczby pobrań.

Psychologowie zauważają pozytywny trend - Polacy coraz chętniej rozmawiają o zdrowiu psychicznym i szukają profesjonalnej pomocy.

## Dom i wnętrza

Pandemia zmieniła nasze podejście do przestrzeni domowej. Inwestujemy w wygodne meble, rośliny doniczkowe i elementy tworzące przytulną atmosferę. Trendem jest minimalizm - mniej rzeczy, więcej przestrzeni.

Projektanci wnętrz polecają naturalne materiały i stonowane kolory. "Dom ma być oazą spokoju" - radzą specjaliści.

## Podróże i odkrywanie

Polacy coraz chętniej wybierają podróże po własnym kraju. Góry, morze, malownicze miasteczka - mamy wiele do odkrycia. Turystyka lokalna przeżywa renesans.

Zachęcamy do eksplorowania i czerpania radości z małych przyjemności każdego dnia.
`,
  };

  // Default content for unknown categories
  const defaultContent = `
${title}

W dzisiejszym artykule przedstawiamy najważniejsze informacje na ten temat. Sprawa budzi duże zainteresowanie wśród czytelników, dlatego postanowiliśmy przyjrzeć się jej bliżej.

## Szczegółowa analiza

Eksperci zwracają uwagę na kilka kluczowych aspektów tego zagadnienia. Każdy z nich ma istotne znaczenie dla zrozumienia całości problemu. Przedstawiamy kompleksową analizę opartą na sprawdzonych źródłach.

"To temat, który dotyczy wielu z nas" - komentuje specjalista w tej dziedzinie. "Warto być na bieżąco z najnowszymi informacjami."

## Kontekst i tło

Historia tego zagadnienia sięga wielu lat wstecz. Przez ten czas wiele się zmieniło, ale pewne fundamentalne kwestie pozostają aktualne. Zrozumienie kontekstu jest kluczowe dla właściwej oceny obecnej sytuacji.

Dane statystyczne potwierdzają rosnące zainteresowanie tym tematem wśród Polaków.

## Perspektywy na przyszłość

Analitycy przewidują dalszy rozwój wydarzeń w nadchodzących miesiącach. Wiele będzie zależeć od decyzji podejmowanych na różnych szczeblach. Zachęcamy do śledzenia naszych publikacji.

Redakcja pozostaje do dyspozycji czytelników w przypadku pytań i uwag.
`;

  return categoryContent[category] || defaultContent;
};

const Article = () => {
  const { id } = useParams<{ id: string }>();
  const { trackArticleView } = useRecentlyViewed();
  
  const article = allArticles.find((a) => a.id === id);

  // Track article view for logged-in users
  useEffect(() => {
    if (article && id) {
      trackArticleView(id, article.category);
    }
  }, [id, article?.category]);
  
  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Artykuł nie znaleziony</h1>
          <Link to="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Wróć do strony głównej
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Get related articles from same category
  const relatedArticles = allArticles
    .filter((a) => a.category === article.category && a.id !== article.id)
    .slice(0, 4);

  const content = getArticleContent(article.title, article.category);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">
            Strona główna
          </Link>
          <span>/</span>
          <Link 
            to={`/${article.category.toLowerCase()}`} 
            className="hover:text-primary transition-colors"
          >
            {article.category}
          </Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px]">{article.title}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Article Content */}
          <article className="lg:col-span-2">
            {/* Article Header */}
            <header className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                {article.badge && (
                  <Badge variant={article.badge === "hot" ? "destructive" : article.badge}>
                    {article.badge === "hot" ? "🔥 Gorące" : article.badge === "trending" ? "📈 Popularne" : "✨ Nowe"}
                  </Badge>
                )}
                <Badge variant="outline">{article.category}</Badge>
              </div>
              
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4 leading-tight">
                {article.title}
              </h1>
              
              {article.excerpt && (
                <p className="text-lg text-muted-foreground mb-4">
                  {article.excerpt}
                </p>
              )}

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-b border-border pb-4">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{article.timestamp}</span>
                </div>
                
                {/* Source */}
                <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1 rounded-full">
                  <ExternalLink className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium text-primary">
                    Źródło: {article.source || "Informacje.pl"}
                  </span>
                </div>
              </div>
            </header>

            {/* Featured Image */}
            <div className="relative aspect-video rounded-xl overflow-hidden mb-6">
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* AI Summary */}
            <ArticleSummary 
              title={article.title}
              content={content}
              category={article.category}
            />

            {/* Sources Carousel */}
            <SourcesCarousel 
              mainSource={article.source || "Informacje.pl"}
              mainSourceUrl={article.sourceUrl}
              category={article.category}
            />

            {/* Action Buttons */}
            <div className="flex items-center justify-end border-b border-border pb-4 mb-6">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Bookmark className="h-4 w-4 mr-1" />
                  Zapisz
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 className="h-4 w-4 mr-1" />
                  Udostępnij
                </Button>
              </div>
            </div>

            {/* Article Content */}
            <div className="prose prose-lg max-w-none dark:prose-invert">
              {content.split('\n\n').map((paragraph, index) => {
                if (paragraph.startsWith('## ')) {
                  return (
                    <h2 key={index} className="text-xl font-bold mt-8 mb-4 text-foreground">
                      {paragraph.replace('## ', '')}
                    </h2>
                  );
                }
                return (
                  <p key={index} className="text-foreground/90 leading-relaxed mb-4">
                    {paragraph}
                  </p>
                );
              })}
            </div>

            {/* Tags */}
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Tagi:</span>
              {["Polska", article.category, "Aktualności"].map((tag) => (
                <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                  {tag}
                </Badge>
              ))}
            </div>
          </article>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Source Box - Sticky */}
            <div className="lg:sticky lg:top-20 space-y-6">
              {/* Main Source Widget */}
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-primary" />
                  Źródło artykułu
                </h3>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                    <span className="text-lg font-bold text-primary-foreground">
                      {(article.source || "IP").substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-lg">{article.source || "Informacje.pl"}</p>
                    <p className="text-sm text-muted-foreground">Portal informacyjny</p>
                  </div>
                </div>

                {article.sourceUrl ? (
                  <a 
                    href={article.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button className="w-full" size="lg">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Przejdź do oryginalnego artykułu
                    </Button>
                  </a>
                ) : (
                  <Button className="w-full" size="lg" disabled>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Brak odnośnika
                  </Button>
                )}

                {article.sourceUrl && (
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    Kliknij, aby przeczytać pełny artykuł w źródle
                  </p>
                )}
              </div>

              {/* Article Info */}
              <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
                <h4 className="font-semibold text-sm text-muted-foreground mb-3">Informacje o artykule</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{article.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">{article.category}</Badge>
                  </div>
                </div>
              </div>

              {/* Related Articles */}
              <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
                <h3 className="font-bold text-lg mb-4">Powiązane artykuły</h3>
                <div className="space-y-1">
                  {relatedArticles.map((relArticle) => (
                    <Link key={relArticle.id} to={`/artykul/${relArticle.id}`}>
                      <NewsCard
                        title={relArticle.title}
                        category={relArticle.category}
                        image={relArticle.image}
                        timestamp={relArticle.timestamp}
                        source={relArticle.source}
                        variant="compact"
                      />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Back to home */}
              <Link to="/">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Wróć do strony głównej
                </Button>
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Article;
