import { useMemo } from "react";

export interface RelatedArticleCandidate {
  id: string;
  title: string;
  category: string;
  image: string;
  timestamp?: string;
  source?: string;
  excerpt?: string;
  content?: string;
  sourceUrl?: string;
}

interface UseRelatedArticlesOptions {
  currentArticle: RelatedArticleCandidate | null;
  allArticles: RelatedArticleCandidate[];
  limit?: number;
}

// Polish stop words to ignore when extracting keywords
const POLISH_STOP_WORDS = new Set([
  'i', 'w', 'na', 'z', 'do', 'o', 'się', 'nie', 'to', 'co', 'jak', 'po', 'za', 'od',
  'ale', 'że', 'jest', 'dla', 'są', 'ten', 'ta', 'te', 'tym', 'tej', 'tego',
  'już', 'tak', 'tylko', 'czy', 'może', 'przez', 'przy', 'jako', 'oraz', 'też',
  'być', 'był', 'była', 'było', 'będzie', 'ma', 'mają', 'jego', 'jej', 'ich',
  'roku', 'lat', 'dni', 'dnia', 'temu', 'które', 'który', 'która', 'których',
  'przed', 'więcej', 'nowe', 'nowy', 'nowa', 'bardzo', 'dziś', 'teraz', 'kiedy',
  'gdzie', 'tutaj', 'tam', 'wszystko', 'każdy', 'każda', 'każde', 'inne', 'inny',
  'pierwszy', 'pierwsza', 'pierwsze', 'drugi', 'druga', 'drugie', 'jeden', 'jedna',
  'dwa', 'trzy', 'cztery', 'pięć', 'bez', 'nad', 'pod', 'między', 'jednak',
  'czyli', 'ponieważ', 'gdyż', 'bowiem', 'właśnie', 'jeszcze', 'także', 'również'
]);

// Extract meaningful keywords from text
function extractKeywords(text: string): string[] {
  if (!text) return [];
  
  // Normalize and split
  const words = text
    .toLowerCase()
    .replace(/[^\wąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s]/g, ' ')
    .split(/\s+/)
    .filter(word => 
      word.length > 3 && 
      !POLISH_STOP_WORDS.has(word) &&
      !/^\d+$/.test(word) // Exclude pure numbers
    );
  
  // Return unique keywords
  return [...new Set(words)];
}

// Calculate similarity score between two articles
function calculateSimilarityScore(
  article1: RelatedArticleCandidate,
  article2: RelatedArticleCandidate
): number {
  let score = 0;
  
  // Category match - highest priority (40 points)
  if (article1.category && article2.category) {
    if (article1.category.toLowerCase() === article2.category.toLowerCase()) {
      score += 40;
    }
  }
  
  // Extract keywords from both articles
  const keywords1 = extractKeywords(article1.title);
  const keywords2 = extractKeywords(article2.title);
  
  // Title keyword overlap (up to 40 points)
  const titleOverlap = keywords1.filter(kw => keywords2.includes(kw)).length;
  score += Math.min(titleOverlap * 10, 40);
  
  // Check for named entities (proper nouns - capitalized words)
  const namedEntities1 = extractNamedEntities(article1.title);
  const namedEntities2 = extractNamedEntities(article2.title);
  
  // Named entity overlap (20 points per match, up to 40)
  const entityOverlap = namedEntities1.filter(e => namedEntities2.includes(e)).length;
  score += Math.min(entityOverlap * 20, 40);
  
  // Excerpt/content keyword overlap (up to 20 points)
  if (article1.excerpt && article2.excerpt) {
    const excerptKeywords1 = extractKeywords(article1.excerpt).slice(0, 20);
    const excerptKeywords2 = extractKeywords(article2.excerpt).slice(0, 20);
    const excerptOverlap = excerptKeywords1.filter(kw => excerptKeywords2.includes(kw)).length;
    score += Math.min(excerptOverlap * 2, 20);
  }
  
  return score;
}

// Extract potential named entities (capitalized words that aren't at sentence start)
function extractNamedEntities(text: string): string[] {
  if (!text) return [];
  
  // Find words that start with uppercase but aren't at the start of a sentence
  const words = text.split(/\s+/);
  const entities: string[] = [];
  
  words.forEach((word, index) => {
    // Skip first word (might be sentence start)
    if (index === 0) return;
    
    // Check if word starts with uppercase
    const cleaned = word.replace(/[^\wąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, '');
    if (cleaned.length > 2 && /^[A-ZĄĆĘŁŃÓŚŹŻ]/.test(cleaned)) {
      entities.push(cleaned.toLowerCase());
    }
  });
  
  return [...new Set(entities)];
}

/**
 * Hook that finds related articles based on category and content similarity
 */
export function useRelatedArticles({
  currentArticle,
  allArticles,
  limit = 4
}: UseRelatedArticlesOptions): RelatedArticleCandidate[] {
  return useMemo(() => {
    if (!currentArticle || !allArticles.length) return [];
    
    // Filter out current article
    const candidates = allArticles.filter(a => a.id !== currentArticle.id);
    
    if (candidates.length === 0) return [];
    
    // Calculate similarity scores for all candidates
    const scoredArticles = candidates.map(article => ({
      article,
      score: calculateSimilarityScore(currentArticle, article)
    }));
    
    // Sort by score (highest first) and take top results
    scoredArticles.sort((a, b) => b.score - a.score);
    
    // Get top articles with score > 0
    const topArticles = scoredArticles
      .filter(item => item.score > 0)
      .slice(0, limit)
      .map(item => item.article);
    
    // If we don't have enough related articles, fill with same category
    if (topArticles.length < limit) {
      const sameCategoryFill = candidates
        .filter(a => 
          a.category?.toLowerCase() === currentArticle.category?.toLowerCase() &&
          !topArticles.some(top => top.id === a.id)
        )
        .slice(0, limit - topArticles.length);
      
      topArticles.push(...sameCategoryFill);
    }
    
    // If still not enough, fill with any articles
    if (topArticles.length < limit) {
      const anyFill = candidates
        .filter(a => !topArticles.some(top => top.id === a.id))
        .slice(0, limit - topArticles.length);
      
      topArticles.push(...anyFill);
    }
    
    return topArticles.slice(0, limit);
  }, [currentArticle, allArticles, limit]);
}

// For debugging/testing: get scores for all candidates
export function getRelatedArticlesWithScores(
  currentArticle: RelatedArticleCandidate,
  allArticles: RelatedArticleCandidate[]
): Array<{ article: RelatedArticleCandidate; score: number; matchDetails: string }> {
  const candidates = allArticles.filter(a => a.id !== currentArticle.id);
  
  return candidates.map(article => {
    const score = calculateSimilarityScore(currentArticle, article);
    
    const keywords1 = extractKeywords(currentArticle.title);
    const keywords2 = extractKeywords(article.title);
    const keywordMatches = keywords1.filter(kw => keywords2.includes(kw));
    
    const entities1 = extractNamedEntities(currentArticle.title);
    const entities2 = extractNamedEntities(article.title);
    const entityMatches = entities1.filter(e => entities2.includes(e));
    
    const categoryMatch = currentArticle.category?.toLowerCase() === article.category?.toLowerCase();
    
    const matchDetails = [
      categoryMatch ? `kategoria: ${article.category}` : null,
      keywordMatches.length > 0 ? `słowa: ${keywordMatches.join(', ')}` : null,
      entityMatches.length > 0 ? `nazwy: ${entityMatches.join(', ')}` : null
    ].filter(Boolean).join(' | ');
    
    return { article, score, matchDetails };
  }).sort((a, b) => b.score - a.score);
}
