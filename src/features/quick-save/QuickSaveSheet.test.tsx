import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useQuickSave } from './quickSaveContext'
import { renderWithApp } from '../../test-utils'

function OpenButton() {
  const { openQuickSave } = useQuickSave()
  return <button onClick={openQuickSave}>Open quick save</button>
}

describe('Quick Save', () => {
  it('saves a place with only a name and lands it in Want to try', async () => {
    const user = userEvent.setup()
    const { repositories } = renderWithApp(<OpenButton />)

    await user.click(screen.getByRole('button', { name: 'Open quick save' }))
    await user.type(await screen.findByLabelText(/Place name/), 'Taco Time Test{Enter}')

    await waitFor(async () => {
      const places = await repositories.places.list()
      const created = places.find((p) => p.name === 'Taco Time Test')
      expect(created?.status).toBe('want_to_try')
      expect(created?.recommendation).toBeUndefined()
    })
    expect(await screen.findByText('Saved Taco Time Test to Want to try')).toBeInTheDocument()
  })

  it('records the neighborhood, who recommended it and a note when given', async () => {
    const user = userEvent.setup()
    const { repositories } = renderWithApp(<OpenButton />)

    await user.click(screen.getByRole('button', { name: 'Open quick save' }))
    await user.type(await screen.findByLabelText(/Place name/), 'Detail Diner')
    await user.click(screen.getByText('Add details (optional)'))
    await user.selectOptions(screen.getByLabelText(/Neighborhood/), 'Ballard')
    await user.click(screen.getByRole('button', { name: 'A friend' }))
    await user.type(screen.getByLabelText(/Friend's name/), 'Priya')
    await user.type(screen.getByLabelText(/Why did it catch your eye/), 'Great brunch')
    await user.click(screen.getByRole('button', { name: 'Save to Want to try' }))

    await waitFor(async () => {
      const created = (await repositories.places.list()).find((p) => p.name === 'Detail Diner')
      expect(created).toMatchObject({
        neighborhood: 'Ballard',
        note: 'Great brunch',
        recommendation: { source: 'friend', detail: 'Priya' },
      })
      expect(created?.lat).toBeTypeOf('number')
    })
  })

  it('asks for a name instead of saving an empty place', async () => {
    const user = userEvent.setup()
    const { repositories } = renderWithApp(<OpenButton />)
    const before = (await repositories.places.list()).length

    await user.click(screen.getByRole('button', { name: 'Open quick save' }))
    await user.click(await screen.findByRole('button', { name: 'Save to Want to try' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/name/i)
    expect(await repositories.places.list()).toHaveLength(before)
  })
})
