import type { MediaCategory } from '../../lib/media';
import { CATEGORY_INFO, CATEGORY_ORDER } from './constants';

interface Props {
  active: MediaCategory;
  counts: Record<MediaCategory, number>;
  onChange: (category: MediaCategory) => void;
}

export default function CategoryTabs({ active, counts, onChange }: Props) {
  return (
    <div
      className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0"
      role="tablist"
      aria-label="Kategoriyalar"
    >
      {CATEGORY_ORDER.map((cat) => (
        <button
          key={cat}
          type="button"
          role="tab"
          aria-selected={cat === active}
          onClick={() => onChange(cat)}
          className="chip flex-none"
        >
          {CATEGORY_INFO[cat].label} · {counts[cat]}
        </button>
      ))}
    </div>
  );
}
