import type { Localized } from '../config/site';

export interface Service {
  name: Localized;
  text: Localized;
}

/**
 * Xizmatlar. Matnlarda «kafolat», «100%», «davolaydi» kabi va’dalar ishlatilmaydi.
 * «Akva ekzosoma» nomi — [[NOMINI TASDIQLASH]] (Instagramda «Аква Экзома»).
 */
export const services: Service[] = [
  {
    name: { uz: 'Mezoterapiya', ru: 'Мезотерапия' },
    text: {
      uz: 'Vitamin va faol moddalar teriga to‘g‘ridan-to‘g‘ri yetkaziladi: namlik, tiniqlik va tetiklik.',
      ru: 'Витамины и активные вещества доставляются прямо в кожу: увлажнение, сияние и свежесть.',
    },
  },
  {
    name: { uz: 'Botoks', ru: 'Ботокс' },
    text: {
      uz: 'Peshona, qosh orasi va ko‘z atrofidagi mimik ajinlarni yumshatishga yordam beradi.',
      ru: 'Помогает смягчить мимические морщины на лбу, между бровями и вокруг глаз.',
    },
  },
  {
    name: { uz: 'Biorevitalizatsiya', ru: 'Биоревитализация' },
    text: {
      uz: 'Terini chuqur namlaydi, elastikligini oshiradi va yuzga tabiiy yorqinlik beradi.',
      ru: 'Глубоко увлажняет кожу, повышает упругость и возвращает естественное сияние.',
    },
  },
  {
    name: { uz: 'Full face muolajalar', ru: 'Процедуры full face' },
    text: {
      uz: 'Yuzning bir nechta sohasini bir seansda kompleks parvarishlash.',
      ru: 'Комплексный уход за несколькими зонами лица за один сеанс.',
    },
  },
  {
    name: { uz: 'Akva-chistka', ru: 'Аква-чистка' },
    text: {
      uz: 'Poralarni yumshoq tozalaydi, qora nuqta va ortiqcha yog‘ni ketkazadi, terini namlaydi.',
      ru: 'Бережно очищает поры, удаляет чёрные точки и излишки себума, увлажняет кожу.',
    },
  },
  {
    name: { uz: 'Akva ekzosoma', ru: 'Аква-экзосомы' },
    text: {
      uz: 'Xira, quruq va charchagan teriga namlik va tiniqlik qaytaradi.',
      ru: 'Возвращает тусклой, сухой и уставшей коже увлажнение и свежесть.',
    },
  },
  {
    name: { uz: 'Professional chistka', ru: 'Профессиональная чистка' },
    text: {
      uz: 'Chuqur tozalash: yallig‘lanish va husnbuzarlar paydo bo‘lishini kamaytiradi.',
      ru: 'Глубокое очищение: уменьшает воспаления и появление высыпаний.',
    },
  },
  {
    name: { uz: 'Pilinglar', ru: 'Пилинги' },
    text: {
      uz: 'Teri rangini tekislaydi, dog‘ va notekisliklarni yumshatadi.',
      ru: 'Выравнивают тон, смягчают пятна и неровности кожи.',
    },
  },
  {
    name: { uz: 'Karboksiterapiya', ru: 'Карбокситерапия' },
    text: {
      uz: 'Teri «nafas oladi»: rang yorishadi, shish va charchoq belgilari kamayadi.',
      ru: 'Кожа «дышит»: тон светлеет, уходят отёчность и признаки усталости.',
    },
  },
  {
    name: { uz: 'LED-terapiya', ru: 'LED-терапия' },
    text: {
      uz: 'Yorug‘lik bilan parvarish: terini tinchlantiradi va boshqa muolajalar samarasini kuchaytiradi.',
      ru: 'Уход светом: успокаивает кожу и усиливает эффект других процедур.',
    },
  },
  {
    name: { uz: 'Dog‘larga qarshi kompleks', ru: 'Комплекс против пигментации' },
    text: {
      uz: 'Pigmentatsiyani kamaytirish va rangni bir xillashtirish uchun bosqichma-bosqich parvarish.',
      ru: 'Поэтапный уход для уменьшения пигментации и выравнивания тона.',
    },
  },
  {
    name: { uz: 'Yuz massaji', ru: 'Массаж лица' },
    text: {
      uz: 'Mushaklarni bo‘shashtiradi, qon aylanishini yaxshilaydi, yuzga tetiklik beradi.',
      ru: 'Расслабляет мышцы, улучшает микроциркуляцию, освежает лицо.',
    },
  },
];
