import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { publicUrl, type AdminMediaItem } from '../../lib/media';

interface Props {
  item: AdminMediaItem;
  index: number;
  total: number;
  sortable: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}

export default function MediaCard({
  item,
  index,
  total,
  sortable,
  onEdit,
  onToggle,
  onDelete,
  onMove,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: !sortable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  const title = item.title_uz ?? item.caption_uz ?? item.alt_uz;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`card overflow-hidden ${isDragging ? 'opacity-80 shadow-card' : ''}`}
    >
      <div className="relative aspect-[4/5] bg-blush-100">
        <img
          src={publicUrl(item.path_sm)}
          alt={item.alt_uz ?? ''}
          loading="lazy"
          decoding="async"
          className={`size-full object-cover transition-opacity ${item.is_published ? '' : 'opacity-45'}`}
          style={{ objectPosition: `${item.focal_x}% ${item.focal_y}%` }}
          draggable={false}
        />
        <span
          className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.08em] ${
            item.is_published ? 'bg-primary text-white' : 'border border-line bg-white text-ink'
          }`}
        >
          {item.is_published ? 'Saytda' : 'Yashirilgan'}
        </span>
        {sortable && (
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            className="drag-handle absolute right-2 top-2 grid size-10 cursor-grab place-items-center rounded-full bg-white/90 text-ink shadow-soft active:cursor-grabbing"
            aria-label="Sudrab tartiblash"
          >
            <GripVertical className="size-5" />
          </button>
        )}
      </div>

      <div className="p-3">
        <p className="truncate text-[13px] font-semibold text-ink" title={title ?? undefined}>
          {title ?? <span className="text-ink-soft">Sarlavhasiz</span>}
        </p>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          <button
            type="button"
            className="admin-icon-btn"
            onClick={onEdit}
            aria-label="Tahrirlash"
            title="Tahrirlash"
          >
            <Pencil className="size-[18px]" />
          </button>
          <button
            type="button"
            className="admin-icon-btn"
            onClick={onToggle}
            aria-label={item.is_published ? 'Yashirish' : 'Ko‘rsatish'}
            title={item.is_published ? 'Yashirish' : 'Ko‘rsatish'}
          >
            {item.is_published ? (
              <EyeOff className="size-[18px]" />
            ) : (
              <Eye className="size-[18px]" />
            )}
          </button>
          <button
            type="button"
            className="admin-icon-btn hover:!border-primary hover:!text-primary-hover"
            onClick={onDelete}
            aria-label="O‘chirish"
            title="O‘chirish"
          >
            <Trash2 className="size-[18px]" />
          </button>
        </div>
        {sortable && (
          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
            <button
              type="button"
              className="admin-icon-btn"
              onClick={() => onMove(-1)}
              disabled={index === 0}
              aria-label="Oldinga surish"
              title="Oldinga"
            >
              <ArrowUp className="size-[18px]" />
            </button>
            <button
              type="button"
              className="admin-icon-btn"
              onClick={() => onMove(1)}
              disabled={index === total - 1}
              aria-label="Orqaga surish"
              title="Orqaga"
            >
              <ArrowDown className="size-[18px]" />
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
