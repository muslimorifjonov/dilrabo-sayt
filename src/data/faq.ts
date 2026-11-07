import type { Localized } from '../config/site';

export interface FaqItem {
  q: Localized;
  a: Localized;
}

export const faq: FaqItem[] = [
  {
    q: { uz: 'Qanday yozilsam bo‘ladi?', ru: 'Как записаться?' },
    a: {
      uz: 'Instagram’da Direct’ga yozing yoki +998 97 723 26 26 raqamiga qo‘ng‘iroq qiling — qulay kun va vaqtni birga tanlaymiz.',
      ru: 'Напишите в Direct в Instagram или позвоните по номеру +998 97 723 26 26 — вместе подберём удобный день и время.',
    },
  },
  {
    q: { uz: 'Botoks natijasi qancha saqlanadi?', ru: 'Сколько держится эффект ботокса?' },
    a: {
      uz: 'Odatda 4–6 oy. Natija 3–5 kunda ko‘rina boshlaydi, to‘liq — taxminan 2 haftada.',
      ru: 'Обычно 4–6 месяцев. Эффект появляется через 3–5 дней, полностью — примерно через 2 недели.',
    },
  },
  {
    q: { uz: 'Muolajalar og‘riqlimi?', ru: 'Процедуры болезненные?' },
    a: {
      uz: 'Ko‘pchiligi yengil o‘tadi. In’eksiyalardan oldin kerak bo‘lsa og‘riqsizlantiruvchi krem qo‘llanadi.',
      ru: 'Большинство проходит комфортно. Перед инъекциями при необходимости наносится обезболивающий крем.',
    },
  },
  {
    q: {
      uz: 'Biorevitalizatsiya necha marta qilinadi?',
      ru: 'Сколько процедур биоревитализации нужно?',
    },
    a: {
      uz: 'Odatda kurs shaklida o‘tkaziladi. Aniq soni va oralig‘i teri holatiga qarab konsultatsiyada belgilanadi.',
      ru: 'Обычно проводится курсом. Точное количество и интервал определяются на консультации по состоянию кожи.',
    },
  },
  {
    q: { uz: 'Chistkani qanchada bir qilish kerak?', ru: 'Как часто делать чистку?' },
    a: {
      uz: 'Ko‘pincha 1–1,5 oyda bir marta. Teri turiga qarab aniq jadval tavsiya qilinadi.',
      ru: 'Чаще всего раз в 1–1,5 месяца. Точный график подбирается по типу кожи.',
    },
  },
  {
    q: {
      uz: 'Nega ba’zi narxlar «konsultatsiyada»?',
      ru: 'Почему некоторые цены «на консультации»?',
    },
    a: {
      uz: 'Mezoterapiya va biorevitalizatsiyada narx tanlangan preparatga bog‘liq. Teringizni ko‘rib, mosini tanlaymiz va narxni oldindan aytamiz.',
      ru: 'В мезотерапии и биоревитализации цена зависит от препарата. Мы оценим кожу, подберём подходящий и заранее назовём стоимость.',
    },
  },
  {
    q: {
      uz: 'Muolajadan keyin nimalarga e’tibor berish kerak?',
      ru: 'Что важно после процедуры?',
    },
    a: {
      uz: 'Odatda 1–2 kun sauna, sport va faol quyoshdan saqlanish, har kuni SPF 50 ishlatish tavsiya etiladi. Har bir muolajadan keyin aniq tavsiyalar beriladi.',
      ru: 'Обычно 1–2 дня стоит избегать сауны, спорта и активного солнца, ежедневно использовать SPF 50. После каждой процедуры даются точные рекомендации.',
    },
  },
];
