import type { Recommendation } from '../../data/types'

/** Human-readable "who told me about it" line, or null when there's nothing to say. */
export function describeRecommendation(recommendation: Recommendation | undefined): string | null {
  if (!recommendation) return null
  const detail = recommendation.detail?.trim()
  switch (recommendation.source) {
    case 'friend':
      return detail ? `Recommended by ${detail}` : 'Recommended by a friend'
    case 'instagram':
      return detail ? `Spotted on Instagram: ${detail}` : 'Spotted on Instagram'
    case 'rating_site':
      return detail ? `Rating site: ${detail}` : 'Found on a rating site'
    case 'discover':
      return 'Saved from Discover'
    case 'other':
      return detail ? detail : 'Heard about it somewhere'
  }
}
