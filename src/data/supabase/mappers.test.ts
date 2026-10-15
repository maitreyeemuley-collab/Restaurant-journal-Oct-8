import type { PlaceRow, PublicListJson } from './rows'
import {
  guestPatchToRow,
  listPatchToRow,
  listToInsertRow,
  placeFromRow,
  placePatchToRow,
  placeToInsertRow,
  publicListFromJson,
} from './mappers'

const row: PlaceRow = {
  id: '11111111-1111-4111-8111-111111111111',
  owner_id: '22222222-2222-4222-8222-222222222222',
  name: 'Noodle Theory',
  neighborhood: 'Capitol Hill',
  cuisine: 'Ramen',
  price_level: 2,
  status: 'visited',
  recommendation_source: 'friend',
  recommendation_detail: 'Sam',
  catalog_id: 'cat-noodle-theory',
  note: 'Spicy miso',
  tags: ['ramen'],
  occasions: ['friends'],
  dietary_options: ['vegetarian'],
  lat: 47.62,
  lng: -122.32,
  created_at: '2026-10-08T12:00:00Z',
  updated_at: '2026-10-09T12:00:00Z',
}

describe('placeFromRow', () => {
  it('maps snake_case columns to the domain Place', () => {
    expect(placeFromRow(row)).toEqual({
      id: row.id,
      ownerId: row.owner_id,
      name: 'Noodle Theory',
      neighborhood: 'Capitol Hill',
      cuisine: 'Ramen',
      priceLevel: 2,
      status: 'visited',
      recommendation: { source: 'friend', detail: 'Sam' },
      catalogId: 'cat-noodle-theory',
      note: 'Spicy miso',
      tags: ['ramen'],
      occasions: ['friends'],
      dietaryOptions: ['vegetarian'],
      lat: 47.62,
      lng: -122.32,
      createdAt: '2026-10-08T12:00:00Z',
      updatedAt: '2026-10-09T12:00:00Z',
    })
  })

  it('turns nulls into missing fields', () => {
    const place = placeFromRow({
      ...row,
      neighborhood: null,
      cuisine: null,
      price_level: null,
      recommendation_source: null,
      recommendation_detail: null,
      catalog_id: null,
      note: null,
      lat: null,
      lng: null,
    })
    expect(place.neighborhood).toBeUndefined()
    expect(place.recommendation).toBeUndefined()
    expect(place).not.toHaveProperty('catalogId')
    expect(place.lat).toBeUndefined()
  })
})

describe('placeToInsertRow', () => {
  it('trims text, defaults arrays, and never sends owner_id or status', () => {
    const insert = placeToInsertRow({
      name: '  Pho Real ',
      note: '   ',
      recommendation: { source: 'instagram', detail: ' @pnweats ' },
    })
    expect(insert).toMatchObject({
      name: 'Pho Real',
      note: null,
      recommendation_source: 'instagram',
      recommendation_detail: '@pnweats',
      neighborhood: null,
      tags: [],
      occasions: [],
      dietary_options: [],
    })
    expect(insert).not.toHaveProperty('owner_id')
    expect(insert).not.toHaveProperty('status')
  })
})

describe('placePatchToRow', () => {
  it('only includes fields that were provided', () => {
    expect(placePatchToRow({ status: 'visited' })).toEqual({ status: 'visited' })
  })

  it('treats a present-but-undefined field as "clear it" (null)', () => {
    expect(placePatchToRow({ note: undefined })).toEqual({ note: null })
    expect(placePatchToRow({ recommendation: undefined })).toEqual({
      recommendation_source: null,
      recommendation_detail: null,
    })
  })

  it('trims the note and renames camelCase keys', () => {
    expect(
      placePatchToRow({ note: '  great  ', priceLevel: 3, dietaryOptions: ['vegan'] }),
    ).toEqual({
      note: 'great',
      price_level: 3,
      dietary_options: ['vegan'],
    })
  })
})

describe('list and guest mappers', () => {
  it('defaults new lists to public and trims the title', () => {
    expect(listToInsertRow({ title: ' Date nights ' })).toEqual({
      title: 'Date nights',
      description: null,
      is_public: true,
    })
  })

  it('clears a list description only when asked', () => {
    expect(listPatchToRow({ isPublic: false })).toEqual({ is_public: false })
    expect(listPatchToRow({ description: undefined })).toEqual({ description: null })
  })

  it('maps guest patches to snake_case', () => {
    expect(guestPatchToRow({ dietaryNeeds: ['vegetarian'], likes: ['ramen'] })).toEqual({
      dietary_needs: ['vegetarian'],
      likes: ['ramen'],
    })
  })
})

describe('publicListFromJson', () => {
  it('maps the get_public_list() payload and exposes only public fields', () => {
    const json: PublicListJson = {
      list: {
        id: 'l1',
        title: 'Visitors',
        description: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z',
      },
      places: [
        {
          id: 'p1',
          name: 'Tidewater',
          neighborhood: 'Ballard',
          cuisine: null,
          price_level: 3,
          tags: ['oysters'],
          lat: 1,
          lng: 2,
        },
      ],
    }
    const result = publicListFromJson(json)
    expect(result.list.description).toBeUndefined()
    expect(result.places[0]).toEqual({
      id: 'p1',
      name: 'Tidewater',
      neighborhood: 'Ballard',
      cuisine: undefined,
      priceLevel: 3,
      tags: ['oysters'],
      lat: 1,
      lng: 2,
    })
    expect(result.places[0]).not.toHaveProperty('note')
    expect(result.places[0]).not.toHaveProperty('status')
  })
})
