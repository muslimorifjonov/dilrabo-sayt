import { Eye, EyeOff, LoaderCircle, LogIn } from 'lucide-react';
import { useId, useState, type SubmitEvent } from 'react';

interface Props {
  onSubmit: (email: string, password: string) => Promise<void>;
  error: string | null;
  busy: boolean;
}

export default function Login({ onSubmit, error, busy }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const emailId = useId();
  const passId = useId();
  const errId = useId();

  const submit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    void onSubmit(email.trim(), password);
  };

  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden px-5 py-12">
      <div
        className="blob"
        style={{ width: 560, height: 560, left: -200, top: -160 }}
        aria-hidden="true"
      />
      <form
        onSubmit={submit}
        className="card relative z-10 w-full max-w-[420px] p-7 sm:p-9"
        aria-describedby={error ? errId : undefined}
        noValidate
      >
        <p className="logo-name">DILRABO</p>
        <h1 className="mt-6 font-display text-[40px] leading-none text-ink">Admin panel</h1>
        <p className="mt-3 text-[15px] text-ink-soft">Rasmlarni boshqarish uchun tizimga kiring.</p>

        <label htmlFor={emailId} className="mt-8 block text-sm font-semibold text-ink">
          Login
        </label>
        <input
          id={emailId}
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="admin-input mt-2"
        />

        <label htmlFor={passId} className="mt-5 block text-sm font-semibold text-ink">
          Parol
        </label>
        <div className="relative mt-2">
          <input
            id={passId}
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="admin-input pr-14"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-xl text-ink-soft hover:text-primary-hover"
            aria-label={show ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
          >
            {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>

        {error && (
          <p
            id={errId}
            role="alert"
            className="mt-5 rounded-xl border border-rose-300 bg-blush-100 px-4 py-3 text-sm font-semibold text-ink"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary mt-7 w-full"
          disabled={busy || !email || !password}
        >
          {busy ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            <LogIn className="size-5" strokeWidth={1.75} />
          )}
          <span>Kirish</span>
        </button>
      </form>
    </main>
  );
}
