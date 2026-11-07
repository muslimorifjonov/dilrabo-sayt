import { LoaderCircle, Save } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { publicUrl, type AdminMediaItem, type MediaCategory } from '../../lib/media';
import type { MediaPatch } from './api';
import { CATEGORY_INFO } from './constants';
import FocalPointPicker from './FocalPointPicker';

interface Props {
  item: AdminMediaItem | null;
  busy: boolean;
  onSave: (patch: MediaPatch) => void;
  onCancel: () => void;
}

type TextField = 'title_uz' | 'title_ru' | 'caption_uz' | 'caption_ru' | 'alt_uz' | 'alt_ru';

/** Sarlavha/izoh maydonlari uchun kategoriyaga mos maslahat */
const TEXT_HINTS: Partial<Record<MediaCategory, { title: string; caption: string }>> = {
  results: {
    title: 'Muolaja nomi — masalan, «Akne davolash». Kartaning pastida chiqadi',
    caption: 'Natija haqida — masalan, «3 seans · 2 oy»',
  },
  certificates: {
    title: 'Sertifikat nomi — masalan, «Botulinoterapiya kursi»',
    caption: 'Beruvchi tashkilot va sana',
  },
};

const DEFAULT_HINTS = { title: 'Masalan, sertifikat nomi', caption: 'Masalan, beruvchi tashkilot' };

/** hint: 'title' | 'caption' — kategoriyaga mos maslahat; boshqa matn — o‘zi chiqadi */
const FIELDS: { key: TextField; label: string; hint?: string }[] = [
  { key: 'title_uz', label: 'Sarlavha (UZ)', hint: 'title' },
  { key: 'title_ru', label: 'Sarlavha (RU)' },
  { key: 'caption_uz', label: 'Izoh (UZ)', hint: 'caption' },
  { key: 'caption_ru', label: 'Izoh (RU)' },
  {
    key: 'alt_uz',
    label: 'Alt matn (UZ)',
    hint: 'Rasmni so‘z bilan tasvirlang (ko‘rish qobiliyati cheklanganlar uchun)',
  },
  { key: 'alt_ru', label: 'Alt matn (RU)' },
];

const emptyForm = (): Record<TextField, string> => ({
  title_uz: '',
  title_ru: '',
  caption_uz: '',
  caption_ru: '',
  alt_uz: '',
  alt_ru: '',
});

export default function EditDialog({ item, busy, onSave, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const baseId = useId();
  const [form, setForm] = useState(emptyForm);
  const [focal, setFocal] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (item) {
      setForm({
        title_uz: item.title_uz ?? '',
        title_ru: item.title_ru ?? '',
        caption_uz: item.caption_uz ?? '',
        caption_ru: item.caption_ru ?? '',
        alt_uz: item.alt_uz ?? '',
        alt_ru: item.alt_ru ?? '',
      });
      setFocal({ x: item.focal_x, y: item.focal_y });
      if (!dlg.open) dlg.showModal();
    } else if (dlg.open) {
      dlg.close();
    }
  }, [item]);

  const submit = () => {
    const patch: MediaPatch = { focal_x: focal.x, focal_y: focal.y };
    for (const f of FIELDS) {
      const v = form[f.key].trim();
      patch[f.key] = v.length > 0 ? v : null;
    }
    onSave(patch);
  };

  return (
    <dialog
      ref={ref}
      className="admin-dialog w-[min(760px,calc(100vw-24px))]"
      aria-labelledby={`${baseId}-title`}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
    >
      {item && (
        <form
          method="dialog"
          className="flex max-h-[calc(100svh-48px)] flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="border-b border-line px-6 py-5">
            <h2 id={`${baseId}-title`} className="font-display text-[28px] leading-tight text-ink">
              Rasmni tahrirlash
            </h2>
            <p className="text-sm text-ink-soft">{CATEGORY_INFO[item.category].label}</p>
          </div>

          <div className="grid gap-6 overflow-y-auto px-6 py-6">
            <FocalPointPicker
              src={publicUrl(item.path_sm)}
              x={focal.x}
              y={focal.y}
              aspect={CATEGORY_INFO[item.category].aspect}
              onChange={(x, y) => setFocal({ x, y })}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <label
                    htmlFor={`${baseId}-${f.key}`}
                    className="block text-sm font-semibold text-ink"
                  >
                    {f.label}
                  </label>
                  <input
                    id={`${baseId}-${f.key}`}
                    type="text"
                    value={form[f.key]}
                    maxLength={240}
                    onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                    className="admin-input mt-1.5"
                  />
                  {f.hint && (
                    <p className="mt-1 text-[12.5px] text-ink-soft">
                      {f.hint === 'title' || f.hint === 'caption'
                        ? (TEXT_HINTS[item.category] ?? DEFAULT_HINTS)[f.hint]
                        : f.hint}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-line px-6 py-4">
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
              <span>Bekor qilish</span>
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? (
                <LoaderCircle className="size-5 animate-spin" />
              ) : (
                <Save className="size-5" />
              )}
              <span>Saqlash</span>
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
