import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, Share2, Bookmark, ThumbsUp, MessageCircle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { NewsCard } from "@/components/news/NewsCard";
import { useArticle, useRelatedArticles } from "@/hooks/useArticles";

export default function Article() {
  const { id } = useParams<{ id: string }>();
  const { data: article, isLoading } = useArticle(id || "");
  const { data: relatedArticles = [] } = useRelatedArticles(
    article?.category || "",
    id || ""
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container py-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="aspect-video rounded-lg mb-4" />
              <Skeleton className="h-8 w-3/4 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div>
              <Skeleton className="h-64 rounded-lg" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Artykuł nie został znaleziony</h1>
            <Link to="/">
              <Button>Wróć do strony głównej</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container py-6">
        {/* Back button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Powrót
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Article Card */}
            <article className="bg-card rounded-lg overflow-hidden">
              {/* Image */}
              <div className="aspect-video overflow-hidden">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="p-5">
                {/* Meta */}
                <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                  <span>INFORMACJE.PL</span>
                  <span>·</span>
                  <span>{article.category}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {article.timestamp}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  {article.title}
                </h1>

                {/* Excerpt */}
                {article.excerpt && (
                  <p className="text-lg text-muted-foreground mb-6">
                    {article.excerpt}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between border-t border-border pt-4 mb-6">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                      <ThumbsUp className="h-4 w-4" />
                      <span className="text-sm">234</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-sm">56</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Article Content */}
                <div className="prose prose-lg max-w-none dark:prose-invert">
                  {article.content?.split("\n\n").map((paragraph, index) => (
                    <p key={index} className="text-foreground/90 leading-relaxed mb-4">
                      {paragraph.trim()}
                    </p>
                  )) || (
                    <p className="text-foreground/90 leading-relaxed">
                      Treść artykułu jest w przygotowaniu.
                    </p>
                  )}
                </div>
              </div>
            </article>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="bg-card rounded-lg p-4">
                <h3 className="font-semibold text-sm mb-3">
                  Więcej z kategorii {article.category}
                </h3>
                <div className="divide-y divide-border">
                  {relatedArticles.map((related) => (
                    <NewsCard
                      key={related.id}
                      id={related.id}
                      title={related.title}
                      category={related.category}
                      image={related.image}
                      timestamp={related.timestamp}
                      variant="list"
                    />
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
