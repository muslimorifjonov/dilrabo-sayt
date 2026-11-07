# Dilrabo Raximberdievna · Kosmetolog — sayt

Ikki tilli (UZ / RU) premium landing sayt va rasm yuklash uchun admin panel.

- **Ommaviy sayt:** `/` (o‘zbekcha) va `/ru/` (ruscha) — Astro, statik, React yuklanmaydi (~16 KB JS).
- **Admin panel:** `/admin/` — faqat rasm: yuklash, tartiblash, yashirish, tahrirlash, o‘chirish.
- **Stek:** Astro 7 · TypeScript (strict) · Tailwind CSS 4 · React 19 (faqat admin) · Supabase · Cloudflare R2 · Netlify.
- **Saqlash:** admin yuklagan rasmlar → **Cloudflare R2**; qolgan hammasi (rasm ro‘yxati, sarlavhalar, tartib, adminlar, kirish) → **Supabase**.

---

## 1. Kompyuterda ishga tushirish

Talab: **Node.js 22.23+** (tavsiya: 24 LTS).

```bash
npm install
cp .env.example .env      # Supabase kalitlarini yozing (pastga qarang)
npm run dev               # http://localhost:4321
```

| Buyruq           | Nima qiladi                                                 |
| ---------------- | ----------------------------------------------------------- |
| `npm run dev`    | Lokal server                                                |
| `npm run build`  | Production build → `dist/`                                  |
| `npm run check`  | `astro check` + `tsc --noEmit` + ESLint + Prettier (0 xato) |
| `npm run format` | Kodni Prettier bilan formatlash                             |
| `npm run assets` | favicon, OG rasm va zaxira portretlarni qayta yaratish      |

> `.env` bo‘lmasa ham sayt ishlaydi: rasmli bo‘limlar yashiriladi, portretlar uchun zaxira rasm chiqadi.

---

## 2. Supabase sozlash (bir marta)

1. **supabase.com** → **New project** (region: **Frankfurt `eu-central-1`**).
2. **SQL Editor** → `supabase/schema.sql` faylini to‘liq joylab → **Run**.
   Jadval, RLS siyosatlari, `media` storage bucket va tartiblash funksiyasi yaratiladi.
   Qayta ishga tushirish xavfsiz.
3. **Authentication → Users → Add user**: email + kuchli parol (**Auto Confirm** belgilansin).
   Email o‘rniga oddiy login ham bo‘ladi: `login@dilrabo.invalid` ko‘rinishida yarating
   (masalan `ism_familiya@dilrabo.invalid`) — admin panelda faqat `ism_familiya`
   yoziladi, domenni sayt o‘zi qo‘shadi. `.invalid` domeniga xat bormaydi, parol tiklab bo‘lmaydi.
   Foydalanuvchi **UUID**’sini nusxalab, SQL Editor’da:
   ```sql
   insert into public.admins (user_id) values ('UUID-NI-SHU-YERGA');
   ```
4. **Authentication → Sign In / Providers**: **«Allow new users to sign up» — o‘chiring.**
5. **Project Settings → API**: **Project URL** va **publishable (anon) key** ni nusxalang.

> ⚠️ **`service_role` kalitini hech qachon** saytga, repoga yoki Netlify’ga qo‘ymang.
> Saytga faqat **anon / publishable** kalit kerak — u RLS bilan himoyalangan.

---

## 3. Netlify’ga joylash

1. Loyihani GitHub’ga yuklang → **Netlify → Add new site → Import from Git** → repo’ni tanlang.
   Build sozlamalari `netlify.toml` dan avtomatik olinadi (`npm run build`, `dist`, Node 24).
2. **Site configuration → Environment variables**:
   - `PUBLIC_SUPABASE_URL` = Project URL
   - `PUBLIC_SUPABASE_ANON_KEY` = publishable (anon) key
3. **Deploys → Trigger deploy → Deploy site**.
4. **Cloudflare R2** kalitlarini qo‘shing (pastdagi 3.1-bo‘lim) — busiz admin rasmlari Supabase Storage’ga ketadi.
5. `https://<sayt>/admin/` → kirish → natijalar, mijozlar fikri, kabinet rasmlarini yuklang.
   Asosiy portret, «Men haqimda» rasmlari va 6 ta sertifikat saytga **doimiy joylangan** (pastga qarang) —
   admin’da shu kategoriyaga rasm yuklansa, u doimiysining o‘rniga chiqadi.

### 3.1. Cloudflare R2 (admin rasmlari ombori)

1. **Cloudflare → R2 → Create bucket** (masalan `dilrabo-media`).
2. Bucket → **Settings → Public access**: **Custom domain** ulang (tavsiya, masalan `media.dilrabo.uz`)
   yoki vaqtincha **r2.dev** subdomenini yoqing (r2.dev tezlik bilan cheklangan — doimiy ish uchun custom domen).
3. **R2 → Manage R2 API Tokens → Create API token**: ruxsat — **Object Read & Write**, faqat shu bucket.
   **Access Key ID** va **Secret Access Key** ni nusxalang (secret faqat bir marta ko‘rsatiladi).
4. **Netlify → Environment variables**:

   | O‘zgaruvchi            | Qiymat                                                          |
   | ---------------------- | --------------------------------------------------------------- |
   | `PUBLIC_R2_PUBLIC_URL` | bucket’ning ommaviy manzili, masalan `https://media.dilrabo.uz` |
   | `R2_ACCOUNT_ID`        | Cloudflare Account ID (R2 sahifasining o‘ng tomonida)           |
   | `R2_ACCESS_KEY_ID`     | API token’ning Access Key ID’si                                 |
   | `R2_SECRET_ACCESS_KEY` | API token’ning Secret Access Key’i                              |
   | `R2_BUCKET`            | bucket nomi, masalan `dilrabo-media`                            |

5. **Trigger deploy** (`PUBLIC_R2_PUBLIC_URL` build vaqtida o‘qiladi).

Qanday ishlaydi: admin rasmni brauzerda WebP’ga siqadi → `/api/media` (Netlify funksiyasi,
`netlify/functions/media.mts`) Supabase orqali **admin ekanini tekshiradi** → faylni R2’ga yozadi.
R2 kalitlari faqat serverda; brauzerga hech qachon chiqmaydi. Bazada yo‘l `r2:` prefiksi bilan saqlanadi —
avval Supabase Storage’ga yuklangan eski rasmlar ham ishlashda davom etadi (o‘chirish ham to‘g‘ri omborga boradi).
CORS sozlash shart emas (fayl brauzerdan emas, funksiyadan yuboriladi).

> ⚠️ `R2_*` kalitlarini **`PUBLIC_` prefiksisiz** yozing — aks holda ular sayt kodiga tushib qoladi.
> Lokal tekshiruv: `/api/media` faqat `netlify dev` bilan ishlaydi (`npm run dev` da funksiya yo‘q).

**Kunlik keepalive:** `netlify/functions/keepalive.mts` har kuni Supabase’ga bitta yengil so‘rov
yuboradi — bepul loyiha faolsizlikdan pauza qilinmaydi. Qo‘shimcha sozlash shart emas
(Netlify → Logs → Functions bo‘limida natijasi ko‘rinadi).

---

## 4. Domen

Domen kodda **bitta joyda** aniqlanadi (`astro.config.mjs`):
`SITE_URL` → bo‘lmasa Netlify’ning `URL` o‘zgaruvchisi → bo‘lmasa `https://dilrabocosmetolog.netlify.app`.

- **Bepul:** `*.netlify.app` — Netlify → Site configuration → **Change site name**.
- **Shaxsiy domen** (`.uz`, `.com` — yillik to‘lov): Netlify → Domain management → **Add a domain**.
  HTTPS avtomatik va bepul. Netlify `URL` ni o‘zi yangilaydi; xohlasangiz `SITE_URL` ni ham qo‘ying.
- Domen o‘zgargach **Redeploy** qiling — canonical, hreflang, sitemap, OG va `robots.txt` avtomatik yangilanadi.

---

## 5. Buyurtmachi to‘ldiradigan ma’lumotlar

Hammasi **`src/config/site.ts`** da (va narxlar — `src/data/prices.ts`). Bo‘sh qolsa — zaxira matn chiqadi
yoki element ko‘rsatilmaydi:

| Qiymat                          | Fayl / maydon                          | Bo‘sh bo‘lsa                       |
| ------------------------------- | -------------------------------------- | ---------------------------------- |
| Aniq manzil                     | `site.address.street`                  | «Toshkent»                         |
| Kabinet nomi / mo‘ljal binosi   | `site.address.cabinet`                 | qator ko‘rsatilmaydi               |
| Ish vaqti                       | `site.hours` (+ `openingHoursSchema`)  | «Oldindan yozilish orqali»         |
| Yandex / Google xarita havolasi | `site.maps.yandex`, `site.maps.google` | tugma ko‘rsatilmaydi               |
| Tajriba yili                    | `site.experienceYears`                 | «55.8K Instagram obunachi»         |
| Telegram                        | `site.telegram`                        | ko‘rsatilmaydi                     |
| Aksiya amaldami?                | `site.promo.active`                    | `false` → karta va tab yashiriladi |
| Narxlar                         | `src/data/prices.ts` → `price: 350000` | «Konsultatsiyada»                  |
| «Akva ekzosoma» nomi            | `src/data/services.ts`, `prices.ts`    | —                                  |

Barcha matnlar: `src/i18n/uz.ts` va `src/i18n/ru.ts` (ikkalasi bir xil tipga bo‘ysunadi —
bitta kalit yetishmasa build xato beradi). Sarlavhada `*so‘z*` — italic + brend rangi.

**Doimiy rasmlar (build vaqtida WebP’ga optimallashtiriladi):**

| Joy                              | Fayl                                                                  |
| -------------------------------- | --------------------------------------------------------------------- |
| Bosh sahifa (hero) portreti      | `src/assets/photos/hero-clinic.jpg`                                   |
| «Men haqimda» — asosiy rasm      | `src/assets/photos/about-portrait.jpg`                                |
| «Men haqimda» — «Ish jarayonida» | `src/assets/photos/at-work.jpg`                                       |
| Diplom va sertifikatlar          | `src/assets/certificates/*.jpg` + ro‘yxat: `src/data/certificates.ts` |

Rasmni almashtirish — faylni shu nom bilan almashtiring. Yangi sertifikat — rasmni
`src/assets/certificates/` ga qo‘shib, `src/data/certificates.ts` ga bitta yozuv qo‘shing
(yoki admin panel orqali yuklang — ular doimiylardan keyin chiqadi).
Admin’dagi «Asosiy portret» / «Men haqimda» rasmi yuklansa, doimiysining o‘rniga o‘sha ko‘rinadi.
`public/fallback/*.webp` endi ishlatilmaydi.

---

## 6. Admin panel — qisqa qo‘llanma

| Kategoriya              | Soni | Tavsiya                                                                             |
| ----------------------- | ---- | ----------------------------------------------------------------------------------- |
| Asosiy portret          | 1    | vertikal 4:5, ≥1200×1500, yuz markazda                                              |
| «Men haqimda» rasmi     | 1    | vertikal 4:5                                                                        |
| Sertifikatlar           | ko‘p | aniq o‘qiladigan, to‘g‘ri burchakdan                                                |
| Natijalar               | ko‘p | 4:5 yoki 1:1, faqat mijoz roziligi bilan                                            |
|                         |      | «Tahrirlash»: sarlavha — muolaja nomi, izoh — natija haqida (karta pastida chiqadi) |
| Mijozlar fikri          | ko‘p | telefon skrinshoti 9:16, ism/rasm yopilgan                                          |
| Kabinet va ish jarayoni | ko‘p | gorizontal 4:3                                                                      |
| Aksiya banneri          | 0–1  | 4:5 yoki 1:1                                                                        |

- JPG, PNG, WEBP, **HEIC** (iPhone) — har biri 25 MB gacha. Brauzerning o‘zida WebP’ga siqiladi
  (1920 px va 720 px), EXIF/GPS ma’lumotlari o‘chiriladi, burilish to‘g‘rilanadi.
- **Tahrirlash** → sarlavha/izoh/alt (UZ/RU) va **fokus nuqtasi** (rasmning eng muhim joyiga bosing).
- **Tartib:** kompyuterda sudrab tashlang, telefonda ↑ / ↓ tugmalari.
- Bo‘sh kategoriya bo‘limi va uning menyu havolasi saytda **avtomatik yashiriladi**
  (masalan, «Natijalar»ga rasm yuklanmaguncha bo‘lim ko‘rinmaydi; yuklangan zahoti chiqadi).
  Sertifikatlar bo‘limi doimiy hujjatlar tufayli har doim ko‘rinadi.
- O‘zgarishlar saytda darhol ko‘rinadi (rebuild kerak emas, sahifani yangilang).

---

## 7. Xavfsizlik tekshiruvi (deploydan keyin bir marta)

Anon kalit bilan yozish **rad etilishi** kerak (`URL` va `KEY` ni o‘zingiznikiga almashtiring):

```bash
URL=https://xxxx.supabase.co; KEY=anon-kalit

# Jadvalga yozish — 401/403 yoki RLS xatosi kutiladi
curl -s -X POST "$URL/rest/v1/media" -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" -d '{"category":"results","path_lg":"x","path_sm":"x","width":1,"height":1}'

# O‘chirish — hech narsa o‘chmasligi kerak
curl -s -X DELETE "$URL/rest/v1/media?id=neq.00000000-0000-0000-0000-000000000000" \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY" -H "Prefer: return=representation"   # → []

# Storage’ga yuklash — 400/403 kutiladi
curl -s -X POST "$URL/storage/v1/object/media/test.jpg" -H "apikey: $KEY" \
  -H "Authorization: Bearer $KEY" -H "Content-Type: image/jpeg" --data-binary "test"
```

---

## 8. Bepul tarif limitlari

- **Cloudflare R2 Free:** 10 GB ombor, chiqish trafigi **bepul** (egress to‘lovi yo‘q) — Instagram’dan katta oqim kelsa ham.
- **Supabase Free:** endi faqat ma’lumotlar bazasi va kirish uchun (R2 ulangan bo‘lsa rasm trafigi Supabase’ga tushmaydi).
  R2 ulanmagan bo‘lsa: ~1 GB fayl ombori, oyiga ~5 GB trafik.
  Rasmlar kichik (≈ 50–300 KB) va 1 yillik kesh bilan beriladi, lekin Instagram’dan katta trafik
  kelsa limitni **Supabase → Usage** bo‘limida kuzatib boring. Yetmasa — Pro tarif.
- **Netlify Free:** bunday landing uchun odatda yetarli.

---

## 9. Loyiha tuzilmasi

```
src/
  config/site.ts         ← barcha asosiy ma’lumotlar
  i18n/{uz,ru,types}.ts  ← matnlar (bir xil tip)
  data/                  ← xizmatlar, narxlar, savollar
  lib/                   ← media (fetch + kesh), image (brauzerda siqish), supabase, format
  scripts/               ← ommaviy sahifa skriptlari (vanilla TS) + lightbox
  components/            ← bo‘limlar; components/admin/ — React admin
  styles/global.css      ← dizayn tokenlari, komponentlar, animatsiyalar
src/assets/              ← doimiy portretlar va sertifikat rasmlari
supabase/schema.sql      ← ma’lumotlar bazasi, RLS, storage (eski rasmlar uchun)
netlify/functions/       ← media.mts (R2: yuklash/o‘chirish), keepalive (kunlik)
netlify/lib/sigv4.ts     ← R2 uchun AWS Signature V4 (tashqi kutubxonasiz)
```
