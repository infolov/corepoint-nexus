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
    '&hellip;': '\u2026',
    '&#8230;': '\u2026',
    // Polish characters
    '&oacute;': '\u00F3',
    '&Oacute;': '\u00D3',
    '&aogon;': '\u0105',
    '&Aogon;': '\u0104',
    '&eogon;': '\u0119',
    '&Eogon;': '\u0118',
    '&sacute;': '\u015B',
    '&Sacute;': '\u015A',
    '&cacute;': '\u0107',
    '&Cacute;': '\u0106',
    '&nacute;': '\u0144',
    '&Nacute;': '\u0143',
    '&zacute;': '\u017A',
    '&Zacute;': '\u0179',
    '&zdot;': '\u017C',
    '&Zdot;': '\u017B',
    '&lstrok;': '\u0142',
    '&Lstrok;': '\u0141',
  };
  
  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.split(entity).join(char);
  }
  
  // Handle decimal numeric entities like &#243; (ó)
  decoded = decoded.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
  
  // Handle hexadecimal numeric entities like &#xF3; (ó)
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  
  return decoded;
}
