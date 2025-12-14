import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Decode HTML entities like &#34; &quot; &amp; etc.
export function decodeHTMLEntities(text: string): string {
  if (!text) return text;
  
  const entities: Record<string, string> = {
    '&quot;': '"',
    '&#34;': '"',
    '&amp;': '&',
    '&#38;': '&',
    '&lt;': '<',
    '&#60;': '<',
    '&gt;': '>',
    '&#62;': '>',
    '&apos;': "'",
    '&#39;': "'",
    '&nbsp;': ' ',
    '&#160;': ' ',
    '&ndash;': '\u2013',
    '&#8211;': '\u2013',
    '&mdash;': '\u2014',
    '&#8212;': '\u2014',
    '&lsquo;': '\u2018',
    '&rsquo;': '\u2019',
    '&ldquo;': '\u201C',
    '&rdquo;': '\u201D',
    '&hellip;': '…',
    '&#8230;': '…',
  };
  
  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.split(entity).join(char);
  }
  
  // Handle numeric entities like &#123;
  decoded = decoded.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
  
  return decoded;
}
