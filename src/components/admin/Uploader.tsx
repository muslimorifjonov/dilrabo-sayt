import type { SupabaseClient } from '@supabase/supabase-js';
import { CircleAlert, CircleCheck, ImagePlus, LoaderCircle, RotateCcw, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { ImageError, prepareImage, validateFile, type PreparedImage } from '../../lib/image';
import type { AdminMediaItem, MediaCategory } from '../../lib/media';
import { maxSortOrder, uploadPrepared } from './api';
import { CATEGORY_INFO, errorText, MSG } from './constants';
import { useToast } from './Toasts';

type JobStatus = 'queued' | 'preparing' | 'uploading' | 'done' | 'error';

interface Job {
  key: number;
  name: string;
  file: File;
  status: JobStatus;
  error?: string;
  prepared?: PreparedImage;
  sortOrder?: number;
}

interface Props {
  client: SupabaseClient;
  category: MediaCategory;
  hasExisting: boolean;
  onUploaded: (item: AdminMediaItem) => Promise<void> | void;
}

/** Oddiy semafor: bir vaqtda max N ta yuklash */
function semaphore(max: number) {
  let active = 0;
  const waiters: (() => void)[] = [];
  return {
    async acquire() {
      if (active < max) {
        active++;
        return;
      }
      await new Promise<void>((resolve) => waiters.push(resolve));
      active++;
    },
    release() {
      active--;
      waiters.shift()?.();
    },
  };
}

function imageErrorText(error: unknown): string {
  if (error instanceof ImageError) {
    if (error.code === 'not-image') return MSG.notImage;
    if (error.code === 'too-large') return MSG.tooLarge;
    return MSG.decodeFailed;
  }
  return MSG.decodeFailed;
}

export default function Uploader({ client, category, hasExisting, onUploaded }: Props) {
  const info = CATEGORY_INFO[category];
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const keyRef = useRef(1);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [dragging, setDragging] = useState(false);
  const busy = jobs.some(
    (j) => j.status === 'preparing' || j.status === 'uploading' || j.status === 'queued',
  );

  const patch = (key: number, p: Partial<Job>) =>
    setJobs((list) => list.map((j) => (j.key === key ? { ...j, ...p } : j)));

  const upload = async (job: Job, prepared: PreparedImage, sortOrder: number) => {
    patch(job.key, { status: 'uploading', prepared, sortOrder, error: undefined });
    try {
      const item = await uploadPrepared(client, category, prepared, sortOrder);
      patch(job.key, { status: 'done', prepared: undefined });
      await onUploaded(item);
      toast.success(MSG.added);
    } catch (error) {
      console.warn('[admin] yuklash xatosi', error);
      patch(job.key, { status: 'error', error: errorText(error) });
    }
  };

  const run = async (files: File[]) => {
    if (files.length === 0) return;
    const list = info.single ? files.slice(0, 1) : files;
    const newJobs: Job[] = list.map((file) => ({
      key: keyRef.current++,
      name: file.name || 'rasm',
      file,
      status: 'queued',
    }));

    // Avval tekshiruv: noto‘g‘ri fayllar darhol rad etiladi
    const valid: Job[] = [];
    for (const job of newJobs) {
      const invalid = validateFile(job.file);
      if (invalid === 'not-image') {
        job.status = 'error';
        job.error = MSG.notImage;
      } else if (invalid === 'too-large') {
        job.status = 'error';
        job.error = MSG.tooLarge;
      } else {
        valid.push(job);
      }
    }
    setJobs((prev) => [...prev.filter((j) => j.status !== 'done'), ...newJobs]);
    for (const job of newJobs) if (job.error) toast.error(`${job.name}: ${job.error}`);
    if (valid.length === 0) return;

    let order: number;
    try {
      order = await maxSortOrder(client, category);
    } catch (error) {
      const msg = errorText(error);
      valid.forEach((j) => patch(j.key, { status: 'error', error: msg }));
      toast.error(msg);
      return;
    }

    const sem = semaphore(2);
    const uploads: Promise<void>[] = [];
    // Fayllar ketma-ket tayyorlanadi (telefonda xotira to‘lmasin), yuklash — max 2 parallel
    for (const job of valid) {
      patch(job.key, { status: 'preparing' });
      let prepared: PreparedImage;
      try {
        prepared = await prepareImage(job.file);
      } catch (error) {
        const msg = imageErrorText(error);
        patch(job.key, { status: 'error', error: msg });
        toast.error(`${job.name}: ${msg}`);
        continue;
      }
      await sem.acquire();
      order += 1;
      const sortOrder = order;
      uploads.push(upload(job, prepared, sortOrder).finally(() => sem.release()));
    }
    await Promise.all(uploads);
  };

  const retry = (job: Job) => {
    if (job.prepared && job.sortOrder !== undefined) {
      void upload(job, job.prepared, job.sortOrder);
    } else {
      setJobs((list) => list.filter((j) => j.key !== job.key));
      void run([job.file]);
    }
  };

  const onInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    void run(files);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    void run(Array.from(e.dataTransfer.files));
  };

  const total = jobs.filter((j) => j.status !== 'error').length;
  const done = jobs.filter((j) => j.status === 'done').length;
  const uploadingIndex = done + 1;

  const statusText = (job: Job): string => {
    switch (job.status) {
      case 'queued':
        return 'Navbatda…';
      case 'preparing':
        return 'Tayyorlanmoqda…';
      case 'uploading':
        return `Yuklanmoqda… ${Math.min(uploadingIndex, total)}/${total}`;
      case 'done':
        return 'Saytga qo‘shildi';
      case 'error':
        return job.error ?? MSG.saveFailed;
    }
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`admin-drop relative flex flex-col items-center justify-center gap-3 rounded-[22px] border-2 border-dashed px-5 py-9 text-center transition-colors ${
          dragging ? 'border-primary bg-blush-100' : 'border-rose-300 bg-white'
        }`}
      >
        <span className="grid size-14 place-items-center rounded-full bg-blush-100 text-primary-hover">
          <ImagePlus className="size-7" strokeWidth={1.5} />
        </span>
        <p className="font-display text-[24px] leading-tight text-ink">
          {info.single && hasExisting
            ? 'Yangi rasm bilan almashtirish'
            : 'Rasmlarni shu yerga tashlang yoki tanlang'}
        </p>
        <p className="text-sm text-ink-soft">JPG, PNG, WEBP, HEIC · har biri 25 MB gacha</p>
        <button
          type="button"
          className="btn btn-primary mt-2"
          onClick={() => inputRef.current?.click()}
          disabled={busy && info.single}
        >
          <ImagePlus className="size-5" strokeWidth={1.75} />
          <span>{info.single && hasExisting ? 'Almashtirish' : 'Rasm tanlash'}</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple={!info.single}
          onChange={onInput}
          className="sr-only"
          tabIndex={-1}
          aria-label="Rasm fayllarini tanlash"
        />
      </div>

      {jobs.length > 0 && (
        <ul className="mt-4 grid gap-2" aria-live="polite">
          {jobs.map((job) => (
            <li
              key={job.key}
              className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3"
            >
              {job.status === 'done' ? (
                <CircleCheck className="size-5 flex-none text-primary" strokeWidth={1.75} />
              ) : job.status === 'error' ? (
                <CircleAlert className="size-5 flex-none text-primary-hover" strokeWidth={1.75} />
              ) : (
                <LoaderCircle className="size-5 flex-none animate-spin text-primary" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">{job.name}</span>
                <span className="block text-[13px] text-ink-soft">{statusText(job)}</span>
              </span>
              {job.status === 'error' &&
                job.error !== MSG.notImage &&
                job.error !== MSG.tooLarge && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => retry(job)}
                  >
                    <RotateCcw className="size-4" />
                    <span>Qayta urinish</span>
                  </button>
                )}
              {(job.status === 'error' || job.status === 'done') && (
                <button
                  type="button"
                  className="grid size-11 flex-none place-items-center rounded-full text-ink-soft hover:bg-blush-100"
                  onClick={() => setJobs((list) => list.filter((j) => j.key !== job.key))}
                  aria-label="Ro‘yxatdan olib tashlash"
                >
                  <X className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
