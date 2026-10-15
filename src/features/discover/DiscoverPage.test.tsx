import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithApp } from '../../test-utils'
import { DiscoverPage } from './DiscoverPage'

describe('DiscoverPage', () => {
  it('shows new and trending highlights from the catalog', async () => {
    renderWithApp(<DiscoverPage />)
    expect(await screen.findByRole('heading', { name: 'New & notable' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Trending this month' })).toBeInTheDocument()
  })

  it('saves a place to Want to try with one tap and flips the card to Saved', async () => {
    const user = userEvent.setup()
    const { repositories } = renderWithApp(<DiscoverPage />)

    const before = (await repositories.places.list()).length
    const [saveButton] = await screen.findAllByRole('button', {
      name: 'Save Basil & Brine to Want to try',
    })
    await user.click(saveButton as HTMLElement)

    await waitFor(async () => {
      const places = await repositories.places.list()
      expect(places).toHaveLength(before + 1)
      const saved = places.find((p) => p.catalogId === 'cat-basil-brine')
      expect(saved?.status).toBe('want_to_try')
      expect(saved?.recommendation?.source).toBe('discover')
    })
    expect(await screen.findByText('Saved Basil & Brine to Want to try')).toBeInTheDocument()
    // The highlight rows no longer push it; its "All of Seattle" card now says Saved.
    const allSection = screen.getByRole('region', { name: 'All of Seattle' })
    expect(within(allSection).getAllByText(/Saved · View/).length).toBeGreaterThan(0)
  })

  it('filters by search text and offers a way out when nothing matches', async () => {
    const user = userEvent.setup()
    renderWithApp(<DiscoverPage />)
    const search = await screen.findByRole('searchbox', { name: 'Search Discover' })

    await user.type(search, 'dumpling')
    expect(await screen.findByText('Little Dumpling Lab')).toBeInTheDocument()
    expect(screen.queryByText('Fika Corner')).not.toBeInTheDocument()

    await user.clear(search)
    await user.type(search, 'zzzzzz')
    expect(await screen.findByText('Nothing matches those filters')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(await screen.findByRole('heading', { name: 'New & notable' })).toBeInTheDocument()
  })
})
