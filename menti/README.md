# Menti — jonli so'rovnoma platformasi

Mentimeter uslubidagi interaktiv taqdimotlar: so'rovnoma, so'z buluti, ochiq javob, shkala, viktorina (reyting bilan) va savol-javob. Natijalar real vaqtda yangilanadi.

**Stack:** Node.js + Vite (vanilla JS), Supabase (Postgres, Auth, Realtime), Netlify.

## Imkoniyatlar
- Taqdimotchi: ro'yxatdan o'tish/kirish, parolni tiklash, taqdimot yaratish/nusxalash/o'chirish/qidirish
- 6 xil slayd, avtomatik saqlash, tartibni o'zgartirish, namunaviy ko'rinish
- Taqdimot rejimi: jonli grafiklar, natijalarni yashirish, ovoz berishni yopish, tozalash, to'liq ekran, klaviatura (← → F H Esc)
- Viktorina: server vaqti bo'yicha taymer, tezlikka qarab ochko (500–1000), reyting
- Q&A: savol yuborish, like, "javob berildi" belgisi
- Ishtirokchilar soni (onlayn), QR kod, CSV eksport (Excel uchun)
- Ishtirokchi 6 xonali kod yoki QR orqali ro'yxatdan o'tmasdan kiradi (Supabase anonim sessiya)
- Yorug'/qorong'i mavzu, telefonga moslashgan

## Xavfsizlik
- Barcha jadvallarda RLS. Ishtirokchilar jadvallarga to'g'ridan-to'g'ri yozolmaydi, faqat tekshiruvli RPC funksiyalar orqali yozadi
- Bitta javob cheklovi DB darajasida (unique), viktorina javobi ochilmaguncha to'g'ri javob ishtirokchiga yuborilmaydi
- Ochkolar serverda hisoblanadi, vaqt server soatidan olinadi
- Q&A uchun rate-limit, CSV formula-injection himoyasi, ochiq redirect himoyasi

## O'rnatish

### 1. Supabase
1. [supabase.com](https://supabase.com) da yangi loyiha oching.
2. **SQL Editor** → [supabase/schema.sql](supabase/schema.sql) ni to'liq ishga tushiring.
3. **Authentication → Sign In / Providers** → **Allow anonymous sign-ins** ni yoqing (ishtirokchilar uchun shart).
4. **Authentication → URL Configuration** → Site URL: Netlify manzilingiz; Redirect URLs: `https://SIZNING-SAYT/**` va `http://localhost:5173/**`.
5. (Ixtiyoriy) Spamdan himoya uchun **Attack Protection** → CAPTCHA.

### 2. Lokal ishga tushirish
```bash
cd menti
cp .env.example .env   # Project Settings → API dagi URL va anon key
npm install
npm run dev            # http://localhost:5173
```

### 3. Netlify
- **New site → Import from Git** → shu repo
- **Base directory:** `menti` (build buyrug'i va `dist` netlify.toml'dan olinadi)
- **Environment variables:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

Qisqa havola: `https://SAYT/j/123456` ishtirokchini to'g'ridan-to'g'ri kodga olib boradi.

## Testlar
```bash
npm test          # natija hisoblash, CSV va xatolar (vitest)
npm run test:db   # SQL sxema, RLS va RPC'lar haqiqiy Postgres'da (PGlite)
```
> Windows: vitest'ni `C:\...` (katta harf) yo'lidan ishga tushiring, kichik `c:\` bilan modul ikki marta yuklanib qoladi.

## Tuzilma
```
menti/
├─ *.html                 sahifalar (index, auth, dashboard, edit, present, play)
├─ src/lib/               supabase, ui, results (sof logika), render (grafiklar)
├─ src/pages/             har sahifa logikasi
├─ supabase/schema.sql    jadvallar, RLS, RPC, realtime
└─ tests/                 vitest + PGlite DB testlari
```
