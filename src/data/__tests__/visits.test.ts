import { latestRatingByPlace } from '../selectors'
import { freshRepositories } from './helpers'

describe('VisitRepository (localStorage)', () => {
  it('logging a visit moves a want-to-try place to visited', async () => {
    const repos = freshRepositories()
    const place = await repos.places.create({ name: 'Try Me' })
    expect(place.status).toBe('want_to_try')

    const visit = await repos.visits.logVisit({
      placeId: place.id,
      rating: 5,
      occasion: 'date_night',
      photoUrls: ['data:image/jpeg;base64,AAAA'],
    })

    const updated = await repos.places.get(place.id)
    expect(updated?.status).toBe('visited')
    expect(updated?.occasions).toContain('date_night')
    expect(visit.rating).toBe(5)
    expect(await repos.visits.listForPlace(place.id)).toHaveLength(1)
  })

  it('works with only a rating (photo and occasion are optional)', async () => {
    const repos = freshRepositories()
    const place = await repos.places.create({ name: 'Rating Only' })
    const visit = await repos.visits.logVisit({ placeId: place.id, rating: 3 })
    expect(visit.photoUrls).toEqual([])
    expect(visit.occasion).toBeUndefined()
  })

  it('rejects ratings outside 1 to 5', async () => {
    const repos = freshRepositories()
    const place = await repos.places.create({ name: 'Bad Rating' })
    await expect(
      repos.visits.logVisit({ placeId: place.id, rating: 6 as unknown as 5 }),
    ).rejects.toThrow('1 to 5')
    expect((await repos.places.get(place.id))?.status).toBe('want_to_try')
  })

  it('rejects visits for places that do not exist', async () => {
    const repos = freshRepositories()
    await expect(repos.visits.logVisit({ placeId: 'ghost', rating: 4 })).rejects.toThrow()
  })

  it('latestRatingByPlace uses the most recent visit', async () => {
    const repos = freshRepositories()
    const place = await repos.places.create({ name: 'Twice' })
    await repos.visits.logVisit({ placeId: place.id, rating: 2, visitedAt: '2026-01-01T00:00:00Z' })
    await repos.visits.logVisit({ placeId: place.id, rating: 5, visitedAt: '2026-06-01T00:00:00Z' })
    const ratings = latestRatingByPlace(await repos.visits.listAll())
    expect(ratings.get(place.id)).toBe(5)
  })
})
