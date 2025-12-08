import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, Share2, Bookmark, Tag } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NewsCard } from "@/components/news/NewsCard";
import {
  newsArticles,
  businessArticles,
  sportArticles,
  techArticles,
  lifestyleArticles,
  recommendedArticles,
  Article as ArticleType,
} from "@/data/mockNews";

const allArticles = [
  ...newsArticles,
  ...businessArticles,
  ...sportArticles,
  ...techArticles,
  ...lifestyleArticles,
  ...recommendedArticles,
];

const categoryDescriptions: Record<string, { description: string; icon: string }> = {
  "Wiadomości": {
    description: "Najważniejsze wydarzenia z kraju i świata. Bądź na bieżąco z aktualnymi informacjami.",
    icon: "📰",
  },
  "Biznes": {
    description: "Gospodarka, finanse, giełda i świat przedsiębiorczości. Wszystko co potrzebujesz wiedzieć o biznesie.",
    icon: "💼",
  },
  "Sport": {
    description: "Wyniki, relacje i komentarze ze świata sportu. Piłka nożna, tenis, F1 i więcej.",
    icon: "⚽",
  },
  "Technologia": {
    description: "Najnowsze innowacje, gadżety i trendy technologiczne. Przyszłość zaczyna się tutaj.",
    icon: "💻",
  },
  "Lifestyle": {
    description: "Styl życia, zdrowie, podróże i inspiracje na co dzień.",
    icon: "🌟",
  },
  "Analiza": {
    description: "Dogłębne analizy i ekspertyzy na ważne tematy.",
    icon: "📊",
  },
  "Kultura": {
    description: "Książki, filmy, muzyka i sztuka. Odkrywaj kulturę.",
    icon: "🎭",
  },
  "Poradnik": {
    description: "Praktyczne porady i wskazówki na każdą okazję.",
    icon: "📖",
  },
};

export default function Article() {
  const { id } = useParams<{ id: string }>();
  
  const article = allArticles.find((a) => a.id === id);
  
  if (!article) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Artykuł nie został znaleziony</h1>
            <Link to="/">
              <Button variant="gradient">Wróć do strony głównej</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const relatedArticles = allArticles
    .filter((a) => a.category === article.category && a.id !== article.id)
    .slice(0, 4);

  const categoryInfo = categoryDescriptions[article.category] || {
    description: "Odkrywaj więcej artykułów z tej kategorii.",
    icon: "📄",
  };

  // Mock article content
  const articleContent = `
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

    Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

    Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
  `;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Image */}
        <div className="relative h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        <div className="container mx-auto px-4 -mt-32 relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Back button */}
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Powrót
            </Link>

            {/* Article Header */}
            <div className="bg-card rounded-2xl shadow-lg p-6 md:p-8 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="category" className="text-sm">
                  {categoryInfo.icon} {article.category}
                </Badge>
                {article.badge && (
                  <Badge variant={article.badge}>
                    {article.badge === "hot" && "🔥 Gorące"}
                    {article.badge === "trending" && "📈 Trending"}
                    {article.badge === "new" && "✨ Nowe"}
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
                {article.title}
              </h1>

              {article.excerpt && (
                <p className="text-lg text-muted-foreground mb-6">
                  {article.excerpt}
                </p>
              )}

              <div className="flex items-center justify-between border-t border-border pt-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {article.timestamp}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Bookmark className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Article Content */}
            <div className="bg-card rounded-2xl shadow-lg p-6 md:p-8 mb-8">
              <div className="prose prose-lg max-w-none dark:prose-invert">
                {articleContent.split("\n\n").map((paragraph, index) => (
                  <p key={index} className="text-foreground/90 leading-relaxed mb-4">
                    {paragraph.trim()}
                  </p>
                ))}
              </div>
            </div>

            {/* Category Info Box */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="text-4xl">{categoryInfo.icon}</div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    O kategorii: {article.category}
                  </h3>
                  <p className="text-muted-foreground">{categoryInfo.description}</p>
                  <Link
                    to={`/?category=${encodeURIComponent(article.category)}`}
                    className="inline-flex items-center gap-1 text-primary hover:underline mt-3 text-sm font-medium"
                  >
                    Zobacz wszystkie artykuły z tej kategorii →
                  </Link>
                </div>
              </div>
            </div>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xl font-bold text-foreground mb-6">
                  Więcej z kategorii {article.category}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {relatedArticles.map((related) => (
                    <Link key={related.id} to={`/article/${related.id}`}>
                      <NewsCard
                        title={related.title}
                        category={related.category}
                        image={related.image}
                        timestamp={related.timestamp}
                        badge={related.badge}
                      />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
