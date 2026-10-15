/** "Ramen, cocktails ,  ramen" -> ["ramen", "cocktails"] (trimmed, lowercase, no duplicates). */
export function parseTerms(text: string): string[] {
  const terms = text
    .split(/[,\n]/)
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean)
  return [...new Set(terms)]
}

export const formatTerms = (terms: readonly string[]): string => terms.join(', ')
