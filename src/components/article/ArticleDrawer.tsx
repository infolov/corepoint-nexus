import { useEffect, useState } from "react";
import { X, Clock, ExternalLink, ThumbsUp, ThumbsDown, Bookmark, BookmarkCheck, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ArticleSummary } from "@/components/article/ArticleSummary";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ArticleData {
  id: string;
  title: string;
  excerpt?: string;
  content?: string;
  category: string;
  image: string;
  timestamp: string;
  source?: string;
  sourceUrl?: string;
}

interface ArticleDrawerProps {
  article: ArticleData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ArticleDrawer({ article, isOpen, onClose }: ArticleDrawerProps) {
  const { trackArticleView } = useRecentlyViewed();
  const [isSaved, setIsSaved] = useState(false);

  // Track view and check saved status
  useEffect(() => {
    if (article && isOpen) {
      trackArticleView(article.id, article.category);
      
      const saved = localStorage.getItem('savedArticles');
      if (saved) {
        const savedArticles = JSON.parse(saved);
        setIsSaved(savedArticles.includes(article.id));
      }
    }
  }, [article?.id, isOpen]);

  const handleSaveArticle = () => {
    if (!article) return;
    
    const saved = localStorage.getItem('savedArticles');
    let savedArticles = saved ? JSON.parse(saved) : [];
    
    if (isSaved) {
      savedArticles = savedArticles.filter((id: string) => id !== article.id);
      toast.success("Usunięto z zapisanych");
    } else {
      savedArticles.push(article.id);
      toast.success("Zapisano na później");
    }
    
    localStorage.setItem('savedArticles', JSON.stringify(savedArticles));
    setIsSaved(!isSaved);
  };

  const handleShare = async () => {
    if (!article) return;
    
    const url = `${window.location.origin}/artykul/${article.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: article.title, url });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link skopiowany");
    }
  };

  if (!article) return null;

  const content = article.content || article.excerpt || article.title;
  const source = article.source || "Informacje.pl";

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-2xl p-0 overflow-hidden"
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-sm rounded-full"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Scrollable content */}
        <div className="h-full overflow-y-auto">
          {/* Hero image */}
          <div className="relative w-full aspect-[16/9]">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>

          {/* Article content */}
          <div className="px-6 pb-8 -mt-12 relative">
            {/* Meta */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
              <Badge variant="secondary" className="bg-primary text-primary-foreground">
                {article.category}
              </Badge>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{article.timestamp}</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight mb-6">
              {article.title}
            </h1>

            {/* AI Summary */}
            <ArticleSummary 
              title={article.title}
              content={content}
              category={article.category}
            />

            {/* Actions */}
            <div className="flex items-center justify-between py-4 my-6 border-t border-b border-border">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="gap-1">
                  <ThumbsUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="gap-1">
                  <ThumbsDown className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-1"
                  onClick={handleSaveArticle}
                >
                  {isSaved ? (
                    <BookmarkCheck className="h-4 w-4 text-primary" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="gap-1" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                Udostępnij
              </Button>
            </div>

            {/* Source */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-foreground">
                      {source.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Źródło</p>
                    <p className="font-medium text-foreground">{source}</p>
                  </div>
                </div>
                
                {article.sourceUrl && (
                  <a 
                    href={article.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Czytaj oryginał
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
