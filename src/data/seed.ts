/**
 * Demo data: realistic Seattle places with FICTIONAL business names, so the demo never
 * makes claims about real restaurants. Ids are stable so shareable list URLs keep working.
 */
import { DEMO_OWNER_ID, NEIGHBORHOODS } from './constants'
import { approximateLocation } from './geo'
import type {
  CatalogPlace,
  DietaryOption,
  Guest,
  Id,
  ListItem,
  Neighborhood,
  Occasion,
  Place,
  PlaceList,
  PriceLevel,
  Rating,
  Recommendation,
  Visit,
} from './types'

export interface DbShape {
  places: Place[]
  catalog: CatalogPlace[]
  visits: Visit[]
  lists: PlaceList[]
  listItems: ListItem[]
  guests: Guest[]
}

export const SEED_PUBLIC_LIST_ID = 'list-visitors'

const DAY_MS = 24 * 60 * 60 * 1000

export function buildSeed(now: Date = new Date()): DbShape {
  const daysAgo = (days: number): string => new Date(now.getTime() - days * DAY_MS).toISOString()
  const coords = (neighborhood: Neighborhood, id: Id) => {
    const point = approximateLocation(neighborhood, id)
    if (!point) throw new Error(`Unknown neighborhood: ${neighborhood}`)
    return point
  }

  // ---------------------------------------------------------------- catalog (Discover)
  interface CatalogSeed {
    id: Id
    name: string
    neighborhood: Neighborhood
    cuisine: string
    price: PriceLevel
    blurb: string
    tags: string[]
    occasions: Occasion[]
    diet?: DietaryOption[]
    /** Days since opening; under 75 counts as new. */
    openedDaysAgo: number
    trending?: boolean
  }

  const catalogSeeds: CatalogSeed[] = [
    {
      id: 'cat-basil-brine',
      name: 'Basil & Brine',
      neighborhood: 'Capitol Hill',
      cuisine: 'Thai',
      price: 2,
      blurb: 'Northern Thai grill smoke and house-fermented chili pastes.',
      tags: ['spicy', 'grill', 'curry'],
      occasions: ['friends', 'date_night'],
      diet: ['gluten_free'],
      openedDaysAgo: 30,
    },
    {
      id: 'cat-velvet-hour',
      name: 'Velvet Hour',
      neighborhood: 'Capitol Hill',
      cuisine: 'Cocktail bar',
      price: 3,
      blurb: 'Candlelit bar with a clarified-milk-punch menu and a very good tiki corner.',
      tags: ['cocktails', 'late night', 'fun drinks'],
      occasions: ['date_night', 'friends', 'celebration'],
      openedDaysAgo: 400,
      trending: true,
    },
    {
      id: 'cat-dumpling-lab',
      name: 'Little Dumpling Lab',
      neighborhood: 'Capitol Hill',
      cuisine: 'Chinese',
      price: 2,
      blurb: 'Hand-pleated soup dumplings in flavors that change every month.',
      tags: ['dumplings', 'soup dumplings', 'small plates'],
      occasions: ['friends', 'casual'],
      diet: ['vegetarian'],
      openedDaysAgo: 45,
      trending: true,
    },
    {
      id: 'cat-fiamma',
      name: 'Pizzeria Fiamma',
      neighborhood: 'Capitol Hill',
      cuisine: 'Pizza',
      price: 2,
      blurb: 'Blistered wood-fired pies and a Sunday-only tiramisu worth planning around.',
      tags: ['pizza', 'wood-fired', 'wine'],
      occasions: ['friends', 'family', 'casual'],
      diet: ['vegetarian'],
      openedDaysAgo: 20,
    },
    {
      id: 'cat-rosewater',
      name: 'Rosewater Brunch Club',
      neighborhood: 'Capitol Hill',
      cuisine: 'Café & bakery',
      price: 2,
      blurb: 'Cardamom buns, rose lattes and a sunny corner patio.',
      tags: ['brunch', 'pastries', 'coffee', 'patio'],
      occasions: ['friends', 'visitors', 'solo'],
      diet: ['vegetarian', 'vegan'],
      openedDaysAgo: 600,
    },
    {
      id: 'cat-salmon-run',
      name: 'Salmon Run Kitchen',
      neighborhood: 'Ballard',
      cuisine: 'Pacific NW',
      price: 3,
      blurb:
        'Cedar-plank salmon, wild mushrooms and a tasting menu that tells you where it came from.',
      tags: ['seafood', 'salmon', 'local ingredients'],
      occasions: ['visitors', 'celebration', 'date_night'],
      diet: ['gluten_free', 'dairy_free'],
      openedDaysAgo: 300,
      trending: true,
    },
    {
      id: 'cat-fika-corner',
      name: 'Fika Corner',
      neighborhood: 'Ballard',
      cuisine: 'Café & bakery',
      price: 1,
      blurb: 'Scandinavian bakery: cardamom knots, open-faced sandwiches, strong coffee.',
      tags: ['pastries', 'coffee', 'brunch'],
      occasions: ['solo', 'casual', 'visitors'],
      diet: ['vegetarian'],
      openedDaysAgo: 900,
    },
    {
      id: 'cat-baan-lanna',
      name: 'Baan Lanna',
      neighborhood: 'Ballard',
      cuisine: 'Thai',
      price: 2,
      blurb: 'Family-run khao soi that locals quietly argue is the best in the city.',
      tags: ['curry', 'noodles', 'spicy'],
      occasions: ['casual', 'friends'],
      diet: ['vegetarian', 'dairy_free'],
      openedDaysAgo: 1200,
    },
    {
      id: 'cat-harbor-social',
      name: 'Harbor Social',
      neighborhood: 'Ballard',
      cuisine: 'Cocktail bar',
      price: 2,
      blurb: 'Dockside cocktails, a briny martini flight and oyster happy hour.',
      tags: ['cocktails', 'oysters', 'happy hour', 'patio'],
      occasions: ['friends', 'date_night'],
      openedDaysAgo: 40,
      trending: true,
    },
    {
      id: 'cat-ember-hearth',
      name: 'Ember Hearth',
      neighborhood: 'Fremont',
      cuisine: 'Pizza',
      price: 2,
      blurb: 'Sourdough crust, charred broccolini and a heated patio all winter.',
      tags: ['pizza', 'patio', 'wine'],
      occasions: ['family', 'friends', 'casual'],
      diet: ['vegetarian'],
      openedDaysAgo: 800,
    },
    {
      id: 'cat-lotus-lime',
      name: 'Lotus & Lime',
      neighborhood: 'Fremont',
      cuisine: 'Vietnamese',
      price: 2,
      blurb: 'Bright, herb-heavy Vietnamese with a banh xeo you will think about for days.',
      tags: ['herbs', 'noodles', 'fresh', 'banh xeo'],
      occasions: ['friends', 'casual', 'date_night'],
      diet: ['gluten_free', 'vegetarian'],
      openedDaysAgo: 55,
      trending: true,
    },
    {
      id: 'cat-habesha-nights',
      name: 'Habesha Nights',
      neighborhood: 'Fremont',
      cuisine: 'Ethiopian',
      price: 2,
      blurb: 'Shared injera platters and a traditional coffee ceremony on weekends.',
      tags: ['shareable', 'stews', 'coffee ceremony'],
      occasions: ['friends', 'visitors', 'family'],
      diet: ['vegetarian', 'vegan', 'gluten_free'],
      openedDaysAgo: 500,
    },
    {
      id: 'cat-wild-fig',
      name: 'Wild Fig Bistro',
      neighborhood: 'Fremont',
      cuisine: 'Mediterranean',
      price: 3,
      blurb: 'Mezze-first menu with a wood oven and a deeply good Turkish wine list.',
      tags: ['mezze', 'wine', 'shareable'],
      occasions: ['date_night', 'celebration', 'friends'],
      diet: ['vegetarian', 'vegan', 'halal'],
      openedDaysAgo: 28,
    },
    {
      id: 'cat-bluebird-tacos',
      name: 'Bluebird Tacos',
      neighborhood: 'Fremont',
      cuisine: 'Mexican',
      price: 1,
      blurb: 'Hand-pressed tortillas, al pastor off the trompo and a two-dollar-fifty agua fresca.',
      tags: ['tacos', 'quick', 'casual'],
      occasions: ['casual', 'friends', 'solo'],
      diet: ['gluten_free'],
      openedDaysAgo: 365,
    },
    {
      id: 'cat-pearl-pine',
      name: 'Pearl & Pine',
      neighborhood: 'Queen Anne',
      cuisine: 'Pacific NW',
      price: 4,
      blurb: 'Tasting-menu dining with a view; the geoduck course is the one to book for.',
      tags: ['tasting menu', 'seafood', 'view', 'special occasion'],
      occasions: ['celebration', 'date_night', 'visitors'],
      diet: ['gluten_free'],
      openedDaysAgo: 700,
      trending: true,
    },
    {
      id: 'cat-trattoria-alba',
      name: 'Trattoria Alba',
      neighborhood: 'Queen Anne',
      cuisine: 'Italian',
      price: 3,
      blurb: 'Hand-rolled pasta and a tiny, very romantic dining room.',
      tags: ['pasta', 'wine', 'date night'],
      occasions: ['date_night', 'celebration', 'family'],
      diet: ['vegetarian'],
      openedDaysAgo: 450,
    },
    {
      id: 'cat-mochi-mornings',
      name: 'Mochi Mornings',
      neighborhood: 'Queen Anne',
      cuisine: 'Café & bakery',
      price: 1,
      blurb: 'Mochi donuts, matcha everything and a window seat for people-watching.',
      tags: ['matcha', 'pastries', 'coffee'],
      occasions: ['solo', 'casual', 'friends'],
      diet: ['vegetarian', 'vegan'],
      openedDaysAgo: 15,
    },
    {
      id: 'cat-dragonfly-hotpot',
      name: 'Dragonfly Hot Pot',
      neighborhood: 'International District',
      cuisine: 'Chinese',
      price: 2,
      blurb: 'Split pots, a build-your-own sauce bar and a group-friendly setup.',
      tags: ['hot pot', 'group-friendly', 'spicy', 'shareable'],
      occasions: ['friends', 'celebration', 'family'],
      diet: ['vegetarian'],
      openedDaysAgo: 600,
      trending: true,
    },
    {
      id: 'cat-banh-mi-corner',
      name: 'Bánh Mì Corner',
      neighborhood: 'International District',
      cuisine: 'Vietnamese',
      price: 1,
      blurb: 'Crackly baguettes, pate that wins people over, and sandwiches under ten dollars.',
      tags: ['sandwiches', 'quick', 'cheap eats'],
      occasions: ['casual', 'solo'],
      openedDaysAgo: 2000,
    },
    {
      id: 'cat-manila-sunday',
      name: 'Manila Sunday',
      neighborhood: 'International District',
      cuisine: 'Filipino',
      price: 2,
      blurb: 'Kamayan-style feasts, ube everything and a roast pork that sells out by 8.',
      tags: ['shareable', 'family-style', 'dessert'],
      occasions: ['family', 'friends', 'visitors'],
      openedDaysAgo: 35,
      trending: true,
    },
    {
      id: 'cat-sakura-counter',
      name: 'Sakura Sushi Counter',
      neighborhood: 'International District',
      cuisine: 'Japanese',
      price: 4,
      blurb: 'Eight-seat omakase with fish flown in twice a week.',
      tags: ['omakase', 'sushi', 'seafood', 'special occasion'],
      occasions: ['celebration', 'date_night'],
      openedDaysAgo: 250,
    },
    {
      id: 'cat-tea-tales',
      name: 'Tea & Tales',
      neighborhood: 'International District',
      cuisine: 'Café & bakery',
      price: 1,
      blurb: 'Bubble tea with a rotating pastry case and a corner full of board games.',
      tags: ['boba', 'dessert', 'games'],
      occasions: ['friends', 'casual'],
      diet: ['vegetarian'],
      openedDaysAgo: 60,
    },
    // These three are already saved in the demo (see `placeSeeds` below).
    {
      id: 'cat-casa-lupita',
      name: 'Casa Lupita',
      neighborhood: 'Ballard',
      cuisine: 'Mexican',
      price: 2,
      blurb: 'Mole negro, mezcal flights and the best patio on Market Street.',
      tags: ['tacos', 'margaritas', 'patio', 'mezcal'],
      occasions: ['friends', 'date_night'],
      diet: ['vegetarian', 'gluten_free'],
      openedDaysAgo: 500,
    },
    {
      id: 'cat-noodle-theory',
      name: 'Noodle Theory',
      neighborhood: 'Capitol Hill',
      cuisine: 'Ramen',
      price: 2,
      blurb: 'Thick tonkotsu, chewy hand-cut noodles and a spicy miso that earns the line.',
      tags: ['ramen', 'noodles', 'broth'],
      occasions: ['casual', 'friends', 'solo'],
      openedDaysAgo: 70,
      trending: true,
    },
    {
      id: 'cat-seoul-hearth',
      name: 'Seoul Hearth',
      neighborhood: 'International District',
      cuisine: 'Korean',
      price: 2,
      blurb: 'Tabletop Korean BBQ with endless banchan and a soju cocktail list.',
      tags: ['bbq', 'group-friendly', 'shareable', 'grill'],
      occasions: ['friends', 'celebration', 'visitors'],
      openedDaysAgo: 600,
    },
  ]

  const catalog: CatalogPlace[] = catalogSeeds.map((c) => {
    const point = coords(c.neighborhood, c.id)
    return {
      id: c.id,
      name: c.name,
      neighborhood: c.neighborhood,
      cuisine: c.cuisine,
      priceLevel: c.price,
      blurb: c.blurb,
      tags: c.tags,
      occasions: c.occasions,
      dietaryOptions: c.diet ?? [],
      isNew: c.openedDaysAgo < 75,
      isTrending: c.trending ?? false,
      lat: point.lat,
      lng: point.lng,
      createdAt: daysAgo(c.openedDaysAgo),
    }
  })

  // ---------------------------------------------------------------- saved places
  interface PlaceSeed {
    id: Id
    name: string
    neighborhood: Neighborhood
    cuisine: string
    price: PriceLevel
    recommendation: Recommendation
    catalogId?: Id
    note?: string
    tags: string[]
    occasions: Occasion[]
    diet?: DietaryOption[]
    savedDaysAgo: number
    visit?: { rating: Rating; occasion: Occasion; daysAgo: number }
  }

  const placeSeeds: PlaceSeed[] = [
    {
      id: 'place-mala-moon',
      name: 'Mala & Moon',
      neighborhood: 'Capitol Hill',
      cuisine: 'Chinese',
      price: 2,
      recommendation: { source: 'friend', detail: 'Priya' },
      note: 'Order the dan dan noodles and the cumin lamb. Bring people who like numbing heat.',
      tags: ['spicy', 'noodles', 'dumplings'],
      occasions: ['friends'],
      diet: ['vegetarian'],
      savedDaysAgo: 80,
      visit: { rating: 5, occasion: 'friends', daysAgo: 60 },
    },
    {
      id: 'place-sorella',
      name: 'Sorella Pasta Bar',
      neighborhood: 'Fremont',
      cuisine: 'Italian',
      price: 3,
      recommendation: { source: 'instagram', detail: '@pnweats' },
      note: 'Saw the cacio e pepe reel and made a reservation that week.',
      tags: ['pasta', 'wine', 'date night'],
      occasions: ['date_night'],
      diet: ['vegetarian'],
      savedDaysAgo: 70,
      visit: { rating: 4, occasion: 'date_night', daysAgo: 45 },
    },
    {
      id: 'place-tidewater',
      name: 'Tidewater Oyster House',
      neighborhood: 'Ballard',
      cuisine: 'Pacific NW',
      price: 3,
      recommendation: { source: 'friend', detail: 'Dan' },
      note: 'Great first-night-in-Seattle dinner for visitors. Sit on the patio if it is dry.',
      tags: ['oysters', 'seafood', 'patio'],
      occasions: ['visitors', 'celebration'],
      diet: ['gluten_free'],
      savedDaysAgo: 120,
      visit: { rating: 5, occasion: 'visitors', daysAgo: 30 },
    },
    {
      id: 'place-pho-saigon',
      name: 'Pho Saigon Corner',
      neighborhood: 'International District',
      cuisine: 'Vietnamese',
      price: 1,
      recommendation: { source: 'friend', detail: 'Mai' },
      note: 'Cash-friendly, fast, and the broth is unreal. Go before 6:30.',
      tags: ['pho', 'noodles', 'quick', 'broth'],
      occasions: ['casual', 'family'],
      diet: ['gluten_free'],
      savedDaysAgo: 150,
      visit: { rating: 4, occasion: 'casual', daysAgo: 20 },
    },
    {
      id: 'place-copper-heron',
      name: 'The Copper Heron',
      neighborhood: 'Capitol Hill',
      cuisine: 'Cocktail bar',
      price: 3,
      recommendation: { source: 'rating_site', detail: 'Seattle best bars list' },
      note: 'Ask for the smoked pineapple old fashioned.',
      tags: ['cocktails', 'late night', 'fun drinks'],
      occasions: ['date_night', 'friends'],
      savedDaysAgo: 95,
      visit: { rating: 4, occasion: 'friends', daysAgo: 14 },
    },
    {
      id: 'place-hanabi',
      name: 'Hanabi Izakaya',
      neighborhood: 'Queen Anne',
      cuisine: 'Japanese',
      price: 3,
      recommendation: { source: 'friend', detail: 'Sam' },
      note: 'Order a few small plates and a sake flight, then keep ordering.',
      tags: ['izakaya', 'sake', 'small plates', 'seafood'],
      occasions: ['friends', 'visitors'],
      diet: ['dairy_free'],
      savedDaysAgo: 60,
      visit: { rating: 4, occasion: 'visitors', daysAgo: 9 },
    },
    {
      id: 'place-cardamom',
      name: 'Cardamom & Co.',
      neighborhood: 'Fremont',
      cuisine: 'Indian',
      price: 2,
      recommendation: { source: 'friend', detail: 'Priya' },
      note: 'Her favorite for dosas and a big vegetarian thali.',
      tags: ['curry', 'dosa', 'vegetarian-friendly'],
      occasions: ['family', 'friends'],
      diet: ['vegetarian', 'vegan', 'gluten_free'],
      savedDaysAgo: 12,
    },
    {
      id: 'place-casa-lupita',
      name: 'Casa Lupita',
      neighborhood: 'Ballard',
      cuisine: 'Mexican',
      price: 2,
      recommendation: { source: 'discover' },
      catalogId: 'cat-casa-lupita',
      note: 'Mole negro, mezcal flights and the best patio on Market Street.',
      tags: ['tacos', 'margaritas', 'patio', 'mezcal'],
      occasions: ['friends', 'date_night'],
      diet: ['vegetarian', 'gluten_free'],
      savedDaysAgo: 6,
    },
    {
      id: 'place-jade-palace',
      name: 'Jade Palace Dim Sum',
      neighborhood: 'International District',
      cuisine: 'Dim Sum',
      price: 2,
      recommendation: { source: 'friend', detail: 'Mei' },
      note: 'Weekend carts are best. Go early with a big group and share everything.',
      tags: ['dim sum', 'brunch', 'family-style', 'shareable'],
      occasions: ['family', 'visitors'],
      savedDaysAgo: 25,
    },
    {
      id: 'place-smoke-salt',
      name: 'Smoke & Salt',
      neighborhood: 'Ballard',
      cuisine: 'BBQ',
      price: 2,
      recommendation: { source: 'other', detail: 'Walked past, line out the door' },
      tags: ['bbq', 'brisket', 'casual'],
      occasions: ['casual', 'friends'],
      savedDaysAgo: 18,
    },
    {
      id: 'place-lumen',
      name: 'Lumen Coffee & Pastry',
      neighborhood: 'Queen Anne',
      cuisine: 'Café & bakery',
      price: 1,
      recommendation: { source: 'instagram', detail: '@seattlebakes' },
      note: 'Vegan croissants that apparently do not taste vegan.',
      tags: ['pastries', 'coffee', 'brunch'],
      occasions: ['solo', 'casual'],
      diet: ['vegetarian', 'vegan'],
      savedDaysAgo: 10,
    },
    {
      id: 'place-noodle-theory',
      name: 'Noodle Theory',
      neighborhood: 'Capitol Hill',
      cuisine: 'Ramen',
      price: 2,
      recommendation: { source: 'discover' },
      catalogId: 'cat-noodle-theory',
      note: 'Thick tonkotsu, chewy hand-cut noodles and a spicy miso that earns the line.',
      tags: ['ramen', 'noodles', 'broth'],
      occasions: ['casual', 'friends', 'solo'],
      savedDaysAgo: 4,
    },
    {
      id: 'place-verde-table',
      name: 'Verde Table',
      neighborhood: 'Queen Anne',
      cuisine: 'Mediterranean',
      price: 3,
      recommendation: { source: 'rating_site', detail: 'Local food blog roundup' },
      note: 'Good option when there are vegetarians and gluten-free eaters in the group.',
      tags: ['mezze', 'wine', 'shareable'],
      occasions: ['date_night', 'family', 'visitors'],
      diet: ['vegetarian', 'vegan', 'gluten_free'],
      savedDaysAgo: 33,
    },
    {
      id: 'place-tiki-room',
      name: 'The Night Market Tiki',
      neighborhood: 'Fremont',
      cuisine: 'Cocktail bar',
      price: 2,
      recommendation: { source: 'instagram', detail: '@sippingseattle' },
      note: 'Drinks arrive on fire. Obviously going.',
      tags: ['tiki', 'cocktails', 'fun drinks', 'late night'],
      occasions: ['friends', 'celebration'],
      savedDaysAgo: 8,
    },
    {
      id: 'place-seoul-hearth',
      name: 'Seoul Hearth',
      neighborhood: 'International District',
      cuisine: 'Korean',
      price: 2,
      recommendation: { source: 'discover' },
      catalogId: 'cat-seoul-hearth',
      note: 'Tabletop Korean BBQ with endless banchan and a soju cocktail list.',
      tags: ['bbq', 'group-friendly', 'shareable', 'grill'],
      occasions: ['friends', 'celebration', 'visitors'],
      savedDaysAgo: 3,
    },
  ]

  const places: Place[] = placeSeeds.map((p) => {
    const point = coords(p.neighborhood, p.id)
    const place: Place = {
      id: p.id,
      ownerId: DEMO_OWNER_ID,
      name: p.name,
      neighborhood: p.neighborhood,
      cuisine: p.cuisine,
      priceLevel: p.price,
      status: p.visit ? 'visited' : 'want_to_try',
      recommendation: p.recommendation,
      note: p.note,
      tags: p.tags,
      occasions: p.occasions,
      dietaryOptions: p.diet ?? [],
      lat: point.lat,
      lng: point.lng,
      createdAt: daysAgo(p.savedDaysAgo),
      updatedAt: daysAgo(p.visit?.daysAgo ?? p.savedDaysAgo),
    }
    if (p.catalogId) place.catalogId = p.catalogId
    return place
  })

  const visits: Visit[] = placeSeeds.flatMap((p) =>
    p.visit
      ? [
          {
            id: `visit-${p.id}`,
            placeId: p.id,
            ownerId: DEMO_OWNER_ID,
            rating: p.visit.rating,
            occasion: p.visit.occasion,
            photoUrls: [],
            visitedAt: daysAgo(p.visit.daysAgo),
            createdAt: daysAgo(p.visit.daysAgo),
          },
        ]
      : [],
  )

  // ---------------------------------------------------------------- guests
  const guests: Guest[] = [
    {
      id: 'guest-mom',
      ownerId: DEMO_OWNER_ID,
      name: 'Mom (visiting from Ohio)',
      likes: ['seafood', 'pasta', 'brunch', 'wine'],
      dislikes: ['spicy', 'late night'],
      dietaryNeeds: [],
      createdAt: daysAgo(40),
      updatedAt: daysAgo(40),
    },
    {
      id: 'guest-dev',
      ownerId: DEMO_OWNER_ID,
      name: 'Dev (college friend)',
      likes: ['cocktails', 'curry', 'pizza', 'patio'],
      dislikes: ['seafood', 'oysters'],
      dietaryNeeds: ['vegetarian'],
      createdAt: daysAgo(22),
      updatedAt: daysAgo(22),
    },
  ]

  // ---------------------------------------------------------------- lists
  const lists: PlaceList[] = [
    {
      id: SEED_PUBLIC_LIST_ID,
      ownerId: DEMO_OWNER_ID,
      title: "Visitors' first weekend in Seattle",
      description:
        'Where I take friends and family when they land: seafood, a big dim sum brunch, and one great cocktail night.',
      isPublic: true,
      createdAt: daysAgo(30),
      updatedAt: daysAgo(30),
    },
  ]

  const listPlaceIds = [
    'place-tidewater',
    'place-jade-palace',
    'place-hanabi',
    'place-copper-heron',
  ]
  const listItems: ListItem[] = listPlaceIds.map((placeId, position) => ({
    listId: SEED_PUBLIC_LIST_ID,
    placeId,
    position,
    createdAt: daysAgo(30),
  }))

  return { places, catalog, visits, lists, listItems, guests }
}

/** Exposed so tests and the map can sanity-check that every neighborhood has seed data. */
export const SEED_NEIGHBORHOODS = NEIGHBORHOODS.map((n) => n.name)
