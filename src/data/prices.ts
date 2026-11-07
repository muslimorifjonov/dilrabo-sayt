import type { Localized } from '../config/site';

export type PriceCategory = 'care' | 'injection';

export interface PriceRow {
  name: Localized;
  /** [[NARX]] — so‘mda, masalan 350000. null → «Konsultatsiyada». */
  price: number | null;
  /** true → «… so‘mdan» / «от …» */
  from?: boolean;
  /** Narx o‘rniga izoh (masalan «preparatga qarab») */
  note?: Localized;
  /** Ichki qatorlar (zonalar) */
  children?: PriceRow[];
}

export interface PriceItem extends PriceRow {
  category: PriceCategory;
}

const byPreparation: Localized = { uz: 'preparatga qarab', ru: 'зависит от препарата' };

/**
 * Narxlar ro‘yxati. Narxlarni buyurtmachi beradi — `price: null` joylariga raqam yozing.
 */
export const prices: PriceItem[] = [
  {
    category: 'care',
    name: { uz: 'Professional chistka', ru: 'Профессиональная чистка' },
    price: null,
  },
  { category: 'care', name: { uz: 'Akva-chistka', ru: 'Аква-чистка' }, price: null },
  { category: 'care', name: { uz: 'Akva ekzosoma', ru: 'Аква-экзосомы' }, price: null },
  { category: 'care', name: { uz: 'Pilinglar', ru: 'Пилинги' }, price: null, from: true },
  { category: 'care', name: { uz: 'Karboksiterapiya', ru: 'Карбокситерапия' }, price: null },
  { category: 'care', name: { uz: 'LED-terapiya', ru: 'LED-терапия' }, price: null },
  { category: 'care', name: { uz: 'Yuz massaji', ru: 'Массаж лица' }, price: null },
  {
    category: 'care',
    name: { uz: 'Dog‘larga qarshi kompleks', ru: 'Комплекс против пигментации' },
    price: null,
  },
  {
    category: 'injection',
    name: { uz: 'Mezoterapiya', ru: 'Мезотерапия' },
    price: null,
    note: byPreparation,
  },
  {
    category: 'injection',
    name: { uz: 'Biorevitalizatsiya', ru: 'Биоревитализация' },
    price: null,
    note: byPreparation,
  },
  {
    category: 'injection',
    name: { uz: 'Botoks', ru: 'Ботокс' },
    price: null,
    children: [
      {
        name: {
          uz: '1 zona (peshona, qosh orasi yoki ko‘z atrofi)',
          ru: '1 зона (лоб, межбровье или вокруг глаз)',
        },
        price: null,
      },
      { name: { uz: 'Butun yuz', ru: 'Всё лицо' }, price: null },
    ],
  },
  { category: 'injection', name: { uz: 'Full face', ru: 'Full face' }, price: null },
];
