import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { ImageOff } from 'lucide-react';
import type { AdminMediaItem } from '../../lib/media';
import MediaCard from './MediaCard';

interface Props {
  items: AdminMediaItem[];
  sortable: boolean;
  onReorder: (next: AdminMediaItem[]) => void;
  onEdit: (item: AdminMediaItem) => void;
  onToggle: (item: AdminMediaItem) => void;
  onDelete: (item: AdminMediaItem) => void;
}

export default function MediaGrid({
  items,
  sortable,
  onReorder,
  onEdit,
  onToggle,
  onDelete,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[22px] border border-line bg-white px-6 py-12 text-center">
        <ImageOff className="size-8 text-rose-300" strokeWidth={1.5} />
        <p className="font-semibold text-ink">Bu bo‘limda hali rasm yo‘q</p>
        <p className="max-w-sm text-sm text-ink-soft">
          Rasm yuklanmaguncha bu bo‘lim saytda ko‘rinmaydi (asosiy portret va «Men haqimda» uchun
          zaxira rasm ko‘rsatiladi).
        </p>
      </div>
    );
  }

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(items, from, to));
  };

  const move = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= items.length) return;
    onReorder(arrayMove(items, index, to));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item, index) => (
            <MediaCard
              key={item.id}
              item={item}
              index={index}
              total={items.length}
              sortable={sortable}
              onEdit={() => onEdit(item)}
              onToggle={() => onToggle(item)}
              onDelete={() => onDelete(item)}
              onMove={(dir) => move(index, dir)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
