import type { FilterState } from '../../types';
import { ALL_ELEMENTS, ALL_RACES } from '../../data/mvps';

interface Props {
  filter: FilterState;
  onChange: (filter: FilterState) => void;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'unknown', label: 'Unknown' },
  { value: 'dead', label: 'Dead' },
  { value: 'window', label: 'Window' },
  { value: 'alive', label: 'Alive' },
] as const;

export function FilterBar({ filter, onChange }: Props) {
  const set = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    onChange({ ...filter, [key]: value });

  return (
    <div className="bg-ro-card border-b border-ro-border px-4 py-3">
      <div className="max-w-screen-2xl mx-auto flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={filter.search}
          onChange={(e) => set('search', e.target.value)}
          placeholder="Search MVP..."
          className="bg-ro-input border border-ro-border rounded px-3 py-1.5 text-sm text-white placeholder-ro-muted focus:outline-none focus:border-ro-gold w-44 transition-colors"
        />

        <select
          value={filter.status}
          onChange={(e) => set('status', e.target.value as FilterState['status'])}
          className="bg-ro-input border border-ro-border rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-ro-gold transition-colors"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={filter.element}
          onChange={(e) => set('element', e.target.value)}
          className="bg-ro-input border border-ro-border rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-ro-gold transition-colors"
        >
          <option value="">All Elements</option>
          {ALL_ELEMENTS.map((el) => (
            <option key={el} value={el}>{el}</option>
          ))}
        </select>

        <select
          value={filter.race}
          onChange={(e) => set('race', e.target.value)}
          className="bg-ro-input border border-ro-border rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-ro-gold transition-colors"
        >
          <option value="">All Races</option>
          {ALL_RACES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        {(filter.search || filter.status !== 'all' || filter.element || filter.race) && (
          <button
            onClick={() => onChange({ search: '', status: 'all', element: '', race: '' })}
            className="text-ro-muted hover:text-white text-xs underline transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
