import { formatTerms, parseTerms } from './terms'

describe('parseTerms', () => {
  it('splits on commas and newlines, trims, lowercases and de-duplicates', () => {
    expect(parseTerms('Ramen, cocktails ,  ramen\nPatio')).toEqual(['ramen', 'cocktails', 'patio'])
  })

  it('returns an empty list for blank input', () => {
    expect(parseTerms('  , ,\n')).toEqual([])
  })

  it('round-trips through formatTerms', () => {
    expect(parseTerms(formatTerms(['a', 'b']))).toEqual(['a', 'b'])
  })
})
