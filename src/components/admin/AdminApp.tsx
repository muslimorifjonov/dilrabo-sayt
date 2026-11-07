import type { SupabaseClient } from '@supabase/supabase-js';
import { ExternalLink, LoaderCircle, LogOut, RotateCcw, Settings } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MEDIA_CATEGORIES, type AdminMediaItem, type MediaCategory } from '../../lib/media';
import { supabase } from '../../lib/supabase';
import {
  deleteMedia,
  DeleteError,
  isAdmin,
  listMedia,
  reorderMedia,
  updateMedia,
  type MediaPatch,
} from './api';
import CategoryTabs from './CategoryTabs';
import ConfirmDialog from './ConfirmDialog';
import { CATEGORY_INFO, errorText, loginToEmail, MSG } from './constants';
import EditDialog from './EditDialog';
import Login from './Login';
import MediaGrid from './MediaGrid';
import { ToastProvider, useToast } from './Toasts';
import Uploader from './Uploader';

export default function AdminApp() {
  if (!supabase) return <NotConfigured />;
  return (
    <ToastProvider>
      <AuthGate client={supabase} />
    </ToastProvider>
  );
}

function NotConfigured() {
  return (
    <main className="grid min-h-svh place-items-center px-5 py-12">
      <div className="card w-full max-w-[520px] p-7 sm:p-9">
        <span className="grid size-12 place-items-center rounded-full bg-blush-100 text-primary-hover">
          <Settings className="size-6" strokeWidth={1.5} />
        </span>
        <h1 className="mt-5 font-display text-[34px] leading-tight text-ink">
          Supabase sozlanmagan
        </h1>
        <p className="mt-3 text-[15px] text-ink-soft">
          Netlify → Site configuration → Environment variables bo‘limiga{' '}
          <code className="rounded bg-blush-100 px-1.5 py-0.5 text-ink">PUBLIC_SUPABASE_URL</code>{' '}
          va{' '}
          <code className="rounded bg-blush-100 px-1.5 py-0.5 text-ink">
            PUBLIC_SUPABASE_ANON_KEY
          </code>{' '}
          qiymatlarini kiriting va saytni qayta deploy qiling. Batafsil — README.md.
        </p>
      </div>
    </main>
  );
}

type Phase = 'loading' | 'signedOut' | 'ready';

function AuthGate({ client }: { client: SupabaseClient }) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const verify = useCallback(
    async (userId: string): Promise<boolean> => {
      try {
        const ok = await isAdmin(client, userId);
        if (!ok) {
          await client.auth.signOut();
          setError(MSG.notAdmin);
          setPhase('signedOut');
          return false;
        }
        setPhase('ready');
        return true;
      } catch (err) {
        setError(errorText(err));
        setPhase('signedOut');
        return false;
      }
    },
    [client],
  );

  useEffect(() => {
    let alive = true;
    void client.auth.getSession().then(({ data }) => {
      if (!alive) return;
      if (data.session) void verify(data.session.user.id);
      else setPhase('signedOut');
    });
    const { data: sub } = client.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setPhase('signedOut');
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [client, verify]);

  const login = async (loginName: string, password: string) => {
    setBusy(true);
    setError(null);
    try {
      const { data, error: authError } = await client.auth.signInWithPassword({
        email: loginToEmail(loginName),
        password,
      });
      if (authError || !data.user) {
        const status = authError?.status ?? 0;
        setError(status >= 400 && status < 500 ? MSG.wrongCredentials : errorText(authError));
        return;
      }
      await verify(data.user.id);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  if (phase === 'loading') {
    return (
      <main className="grid min-h-svh place-items-center" aria-busy="true">
        <LoaderCircle className="size-8 animate-spin text-primary" aria-label="Yuklanmoqda" />
      </main>
    );
  }
  if (phase === 'signedOut') return <Login onSubmit={login} error={error} busy={busy} />;
  return (
    <Dashboard
      client={client}
      onSignOut={async () => {
        await client.auth.signOut();
        setError(null);
        setPhase('signedOut');
      }}
    />
  );
}

function emptyCounts(): Record<MediaCategory, number> {
  return Object.fromEntries(MEDIA_CATEGORIES.map((c) => [c, 0])) as Record<MediaCategory, number>;
}

function Dashboard({
  client,
  onSignOut,
}: {
  client: SupabaseClient;
  onSignOut: () => Promise<void>;
}) {
  const toast = useToast();
  const [items, setItems] = useState<AdminMediaItem[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'error' | 'ok'>('loading');
  const [active, setActive] = useState<MediaCategory>('hero');
  const [editing, setEditing] = useState<AdminMediaItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<AdminMediaItem | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      setItems(await listMedia(client));
      setLoadState('ok');
    } catch (err) {
      console.warn('[admin] ro‘yxat xatosi', err);
      setLoadState('error');
    }
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const c = emptyCounts();
    for (const it of items) c[it.category]++;
    return c;
  }, [items]);

  const current = useMemo(
    () =>
      items
        .filter((i) => i.category === active)
        .sort((a, b) => a.sort_order - b.sort_order || b.created_at.localeCompare(a.created_at)),
    [items, active],
  );

  const info = CATEGORY_INFO[active];

  const replaceItem = (next: AdminMediaItem) =>
    setItems((list) => list.map((i) => (i.id === next.id ? next : i)));

  /** Yangi rasm qo‘shildi. Bitta slotli kategoriyada eskisi o‘chiriladi («Almashtirish»). */
  const onUploaded = async (item: AdminMediaItem) => {
    const olds = CATEGORY_INFO[item.category].single
      ? items.filter((i) => i.category === item.category && i.id !== item.id)
      : [];
    setItems((list) => [...list, item]);
    for (const old of olds) {
      try {
        await deleteMedia(client, old);
        setItems((list) => list.filter((i) => i.id !== old.id));
      } catch (err) {
        toast.error(
          err instanceof DeleteError && err.stage === 'files'
            ? MSG.deleteFileFailed
            : MSG.deleteRowFailed,
        );
      }
    }
  };

  const onToggle = async (item: AdminMediaItem) => {
    try {
      replaceItem(await updateMedia(client, item.id, { is_published: !item.is_published }));
      toast.success(MSG.saved);
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  const onSave = async (patch: MediaPatch) => {
    if (!editing) return;
    setSaving(true);
    try {
      replaceItem(await updateMedia(client, editing.id, patch));
      setEditing(null);
      toast.success(MSG.saved);
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteMedia(client, deleting);
      setItems((list) => list.filter((i) => i.id !== deleting.id));
      setDeleting(null);
      toast.success(MSG.deleted);
    } catch (err) {
      toast.error(
        err instanceof DeleteError && err.stage === 'files'
          ? MSG.deleteFileFailed
          : MSG.deleteRowFailed,
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  const onReorder = async (next: AdminMediaItem[]) => {
    const before = items;
    const orderMap = new Map(next.map((it, i) => [it.id, i + 1]));
    setItems((list) =>
      list.map((i) =>
        orderMap.has(i.id) ? { ...i, sort_order: orderMap.get(i.id) ?? i.sort_order } : i,
      ),
    );
    try {
      await reorderMedia(
        client,
        next.map((i) => i.id),
      );
      toast.success(MSG.saved);
    } catch (err) {
      setItems(before);
      toast.error(
        err instanceof Error && /network|fetch/i.test(err.message)
          ? MSG.network
          : MSG.reorderFailed,
      );
    }
  };

  return (
    <div className="min-h-svh pb-24">
      <header className="sticky top-0 z-40 border-b border-line bg-[rgba(251,247,244,0.9)] backdrop-blur-md">
        <div className="container-x flex h-16 items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <span className="logo-name text-[18px]">DILRABO</span>
            <span className="hidden text-[11px] font-bold tracking-[0.2em] text-primary sm:inline">
              ADMIN
            </span>
          </div>
          <div className="flex gap-2">
            <a
              href="/"
              target="_blank"
              rel="noopener"
              className="btn btn-secondary btn-sm px-3 sm:px-[18px]"
              aria-label="Saytni ochish (yangi oynada)"
            >
              <ExternalLink className="size-4" />
              <span className="hidden sm:inline">Saytni ochish</span>
            </a>
            <button
              type="button"
              className="btn btn-secondary btn-sm px-3 sm:px-[18px]"
              onClick={() => void onSignOut()}
              aria-label="Chiqish"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Chiqish</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container-x pt-6">
        <CategoryTabs active={active} counts={counts} onChange={setActive} />

        <section className="mt-6" aria-labelledby="cat-title">
          <h1
            id="cat-title"
            className="font-display text-[clamp(30px,4vw,42px)] leading-tight text-ink"
          >
            {info.label}
          </h1>
          <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">{info.hint}</p>

          <div className="mt-5">
            <Uploader
              key={active}
              client={client}
              category={active}
              hasExisting={current.length > 0}
              onUploaded={onUploaded}
            />
          </div>

          <div className="mt-8">
            {loadState === 'loading' && (
              <div className="grid place-items-center py-16">
                <LoaderCircle
                  className="size-7 animate-spin text-primary"
                  aria-label="Yuklanmoqda"
                />
              </div>
            )}
            {loadState === 'error' && (
              <div className="flex flex-col items-center gap-4 rounded-[22px] border border-line bg-white px-6 py-10 text-center">
                <p className="font-semibold text-ink">{MSG.network}</p>
                <button type="button" className="btn btn-primary" onClick={() => void load()}>
                  <RotateCcw className="size-5" />
                  <span>Qayta urinish</span>
                </button>
              </div>
            )}
            {loadState === 'ok' && (
              <MediaGrid
                items={current}
                sortable={!info.single && current.length > 1}
                onReorder={(next) => void onReorder(next)}
                onEdit={setEditing}
                onToggle={(it) => void onToggle(it)}
                onDelete={setDeleting}
              />
            )}
          </div>
        </section>
      </main>

      <EditDialog
        item={editing}
        busy={saving}
        onSave={(p) => void onSave(p)}
        onCancel={() => setEditing(null)}
      />
      <ConfirmDialog
        open={deleting !== null}
        busy={deleteBusy}
        onConfirm={() => void onConfirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
