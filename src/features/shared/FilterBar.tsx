import { useId } from 'react'
import { Button } from '../../components/Button'
import { Chip, ChipGroup } from '../../components/Chip'
import { SearchIcon } from '../../components/icons'
import { CUISINES, NEIGHBORHOODS, OCCASIONS, PRICE_LEVELS, priceLabel } from '../../data/constants'
import { countActiveFilters, EMPTY_FILTERS, hasAnyFilter } from './filters'
import type { FilterState } from './filters'
import styles from './FilterBar.module.css'

interface FilterBarProps {
  filters: FilterState
  onChange: (next: FilterState) => void
  searchLabel: string
  searchPlaceholder: string
  /** My Places shows Want to try / Visited chips. Discover doesn't. */
  showStatus?: boolean
}

const toggle = <T,>(current: T | null, value: T): T | null => (current === value ? null : value)

export function FilterBar({
  filters,
  onChange,
  searchLabel,
  searchPlaceholder,
  showStatus = false,
}: FilterBarProps) {
  const searchId = useId()
  const set = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch })
  const active = countActiveFilters(filters)

  return (
    <section className={styles.bar} aria-label="Search and filters">
      <div className={styles.search}>
        <label htmlFor={searchId} className="visually-hidden">
          {searchLabel}
        </label>
        <SearchIcon size={20} className={styles.searchIcon} />
        <input
          id={searchId}
          type="search"
          className={styles.input}
          value={filters.query}
          onChange={(event) => set({ query: event.target.value })}
          placeholder={searchPlaceholder}
          autoComplete="off"
        />
      </div>

      {showStatus ? (
        <ChipGroup label="Status" scroll>
          <Chip selected={filters.status === null} onToggle={() => set({ status: null })}>
            All
          </Chip>
          <Chip
            selected={filters.status === 'want_to_try'}
            onToggle={() => set({ status: toggle(filters.status, 'want_to_try') })}
          >
            Want to try
          </Chip>
          <Chip
            selected={filters.status === 'visited'}
            onToggle={() => set({ status: toggle(filters.status, 'visited') })}
          >
            Visited
          </Chip>
        </ChipGroup>
      ) : null}

      <details className={styles.details}>
        <summary className={styles.summary}>Filters{active > 0 ? ` (${active})` : ''}</summary>
        <div className={styles.groups}>
          <div>
            <p className={styles.groupTitle}>Cuisine</p>
            <ChipGroup label="Cuisine">
              {CUISINES.map((cuisine) => (
                <Chip
                  key={cuisine}
                  selected={filters.cuisine === cuisine}
                  onToggle={() => set({ cuisine: toggle(filters.cuisine, cuisine) })}
                >
                  {cuisine}
                </Chip>
              ))}
            </ChipGroup>
          </div>
          <div>
            <p className={styles.groupTitle}>Neighborhood</p>
            <ChipGroup label="Neighborhood">
              {NEIGHBORHOODS.map(({ name }) => (
                <Chip
                  key={name}
                  selected={filters.neighborhood === name}
                  onToggle={() => set({ neighborhood: toggle(filters.neighborhood, name) })}
                >
                  {name}
                </Chip>
              ))}
            </ChipGroup>
          </div>
          <div>
            <p className={styles.groupTitle}>Price</p>
            <ChipGroup label="Price">
              {PRICE_LEVELS.map((level) => (
                <Chip
                  key={level}
                  selected={filters.price === level}
                  onToggle={() => set({ price: toggle(filters.price, level) })}
                >
                  <span aria-hidden="true">{priceLabel(level)}</span>
                  <span className="visually-hidden">{`${level} of 4 dollar signs`}</span>
                </Chip>
              ))}
            </ChipGroup>
          </div>
          <div>
            <p className={styles.groupTitle}>Occasion</p>
            <ChipGroup label="Occasion">
              {OCCASIONS.map(({ value, label }) => (
                <Chip
                  key={value}
                  selected={filters.occasion === value}
                  onToggle={() => set({ occasion: toggle(filters.occasion, value) })}
                >
                  {label}
                </Chip>
              ))}
            </ChipGroup>
          </div>
        </div>
      </details>

      {hasAnyFilter(filters) ? (
        <Button variant="ghost" size="sm" onClick={() => onChange(EMPTY_FILTERS)}>
          Clear search and filters
        </Button>
      ) : null}
    </section>
  )
}
