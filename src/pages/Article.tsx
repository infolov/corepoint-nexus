import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NewsCard } from "@/components/news/NewsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Share2, Bookmark, ThumbsUp, ThumbsDown, MessageSquare, ExternalLink } from "lucide-react";
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

// Mock full content for articles
const getArticleContent = (title: string) => `
${title}

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## Szczegóły

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.

## Podsumowanie

Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.

Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?
`;

const Article = () => {
  const { id } = useParams<{ id: string }>();
  
  const article = allArticles.find((a) => a.id === id);
  
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

  const content = getArticleContent(article.title);

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

            {/* Action Buttons */}
            <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  <span>{Math.floor(Math.random() * 100)}</span>
                </Button>
                <Button variant="ghost" size="sm">
                  <ThumbsDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  <span>{Math.floor(Math.random() * 50)}</span>
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Bookmark className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 className="h-4 w-4" />
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

            {/* Source Box */}
            <div className="mt-8 p-4 bg-muted/50 rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">
                    {(article.source || "IP").substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Źródło informacji</p>
                  <p className="font-semibold text-foreground">{article.source || "Informacje.pl"}</p>
                </div>
                <Button variant="outline" size="sm" className="ml-auto">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Odwiedź źródło
                </Button>
              </div>
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
            {/* Related Articles */}
            <div className="bg-card rounded-xl p-5 shadow-sm">
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
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Article;
