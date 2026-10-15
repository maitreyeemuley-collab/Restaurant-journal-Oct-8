const EMOJI: Record<string, string> = {
  Chinese: '🥟',
  'Dim Sum': '🥟',
  Japanese: '🍣',
  Ramen: '🍜',
  Korean: '🥘',
  Thai: '🍛',
  Vietnamese: '🍲',
  Filipino: '🍢',
  Indian: '🍛',
  Ethiopian: '🫓',
  Italian: '🍝',
  Pizza: '🍕',
  Mexican: '🌮',
  Mediterranean: '🥙',
  'Pacific NW': '🦪',
  BBQ: '🍖',
  'Cocktail bar': '🍸',
  'Café & bakery': '🥐',
}

/** A decorative emoji for a cuisine. Always rendered with aria-hidden. */
export const cuisineEmoji = (cuisine: string | undefined): string =>
  (cuisine && EMOJI[cuisine]) || '🍽️'
