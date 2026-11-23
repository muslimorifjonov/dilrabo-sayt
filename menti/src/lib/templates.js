// Tayyor shablonlar: bir bosishda to'liq taqdimot.
export const TEMPLATES = [
  {
    id: 'blank', icon: '✨', title: "Bo'sh taqdimot", desc: 'Noldan, o\'zingiz xohlagandek',
    slides: [{ type: 'poll', question: 'Bugungi kayfiyatingiz qanday?', options: ['Ajoyib 😄', 'Yaxshi 🙂', "O'rtacha 😐", 'Charchadim 😴'], settings: { multiple: false } }],
  },
  {
    id: 'debate', icon: '💬', title: 'Talabalar bilan bahs-munozara',
    desc: "Javoblar anonim. To'g'ri yoki noto'g'ri javob yo'q: so'z buluti, shkala, so'rovnoma va erkin fikrlar",
    slides: [
      // ---- 1–3. So'z bulutlari ----
      { type: 'wordcloud', question: "Talabalik hayotingizni bitta so'z bilan aytib bera olasizmi?", settings: { max_words: 1 } },
      { type: 'wordcloud', question: "Siz uchun muvaffaqiyat nima? Bir-ikki so'z bilan yozing.", settings: { max_words: 2 } },
      { type: 'wordcloud', question: "\"Sun'iy intellekt\" deganda xayolingizga birinchi nima keladi?", settings: { max_words: 1 } },

      // ---- 4. Fikrlarga munosabat ----
      { type: 'scale', question: "Qanchalik qo'shilasiz? Rostini ayting 🙂",
        options: ["Diplomdan ko'ra amaliy ko'nikma muhimroq", 'Imtihonda ChatGPT ishlatishga ruxsat berish kerak', 'Onlayn dars oddiy darsdan yaxshiroq',
          "O'qib turib ishlash o'qishga xalaqit beradi", "Ijtimoiy tarmoqlar foydadan ko'ra ko'proq zarar keltiradi"],
        settings: { min: 1, max: 5, min_label: "Umuman qo'shilmayman", max_label: "To'liq qo'shilaman" } },

      // ---- 5–8. So'rovnomalar ----
      { type: 'poll', question: "Sizningcha hayotda qaysi biri ko'proq yordam beradi?",
        options: ['Bilim', 'Mehnatsevarlik', 'Tanish-bilish', 'Omad'], settings: { multiple: false } },
      { type: 'poll', question: 'Universitetni bitirgach nima qilmoqchisiz?',
        options: ['Ishga kiraman', "Magistraturada o'qishni davom ettiraman", "O'z ishimni boshlayman", 'Chet elga ketaman', "Hali o'ylab ko'rmadim"], settings: { multiple: false } },
      { type: 'poll', question: "Halol ayting, kuningizning ko'p qismi nimaga ketadi?",
        options: ['Telefon', "O'qish", 'Ish', "Do'stlar", 'Sport'], settings: { multiple: false } },
      { type: 'poll', question: "Sizningcha talabalarni qanday baholash adolatli bo'lardi?",
        options: ['Faqat imtihon bilan', 'Faqat loyiha va amaliy ishlar bilan', 'Ikkalasi aralash', "Umuman baho qo'ymaslik kerak"], settings: { multiple: false } },

      // ---- 9–10. Muhimlik bo'yicha tartib (shkala: o'rtacha ball bo'yicha tartiblanadi) ----
      { type: 'scale', question: "Ish tanlayotganda nimaga ko'proq qaraysiz? Har birining muhimligini baholang.",
        options: ['Maosh', 'Ishning qiziqligi', 'Jamoa', "O'sish imkoniyati", 'Uyga yaqinligi'],
        settings: { min: 1, max: 5, min_label: 'Muhim emas', max_label: 'Eng muhim' } },
      { type: 'scale', question: "Yaxshi o'qituvchida eng birinchi nima bo'lishi kerak? Har birini baholang.",
        options: ["Bilimli bo'lishi", "Adolatli bo'lishi", 'Tushunarli tushuntirishi', 'Talabani eshita olishi', "Talabchan bo'lishi"],
        settings: { min: 1, max: 5, min_label: 'Muhim emas', max_label: 'Eng muhim' } },

      // ---- 11–17. Erkin fikrlar ----
      { type: 'open', question: "Universitetda bitta narsani o'zgartirish imkoningiz bo'lsa, nimani o'zgartirardingiz? Nega?", settings: { max_entries: 2 } },
      { type: 'open', question: "\"Baho bilimni to'g'ri ko'rsatadi\" degan gapga qo'shilasizmi? Fikringizni yozing.", settings: { max_entries: 2 } },
      { type: 'open', question: "AI qaysi kasblarni yo'q qilishi mumkin, qaysilarini yangidan paydo qiladi deb o'ylaysiz?", settings: { max_entries: 2 } },
      { type: 'open', question: "Kasb tanlashda ota-onaning so'zi qanchalik muhim bo'lishi kerak?", settings: { max_entries: 2 } },
      { type: 'open', question: 'Muvaffaqiyatli bo\'lish uchun universitetni bitirish shartmi?', settings: { max_entries: 2 } },
      { type: 'open', question: 'Hayotingizda olgan eng yaxshi maslahat qaysi bo\'lgan?', settings: { max_entries: 2 } },
      { type: 'open', question: "10 yildan keyin o'zingizni qayerda, nima qilayotgan holda ko'rasiz?", settings: { max_entries: 2 } },

      // ---- 18. Hayotdagi ustuvorliklar (100 ball o'rniga: har birini 0–10 baholash) ----
      { type: 'scale', question: 'Hayotingizda nimaga qancha ahamiyat berasiz? Har birini baholang.',
        options: ["O'qish", 'Ish', 'Oila', "Sog'liq", "Do'stlar", 'Hobbi'],
        settings: { min: 0, max: 10, min_label: 'Ahamiyatsiz', max_label: 'Juda muhim' } },

      // ---- 19–20. Yakun ----
      { type: 'open', question: "Bugungi suhbatdan o'zingiz uchun nima olib ketdingiz?", settings: { max_entries: 2 } },
      { type: 'wordcloud', question: "Bugungi darsni bir so'z bilan baholang.", settings: { max_words: 1 } },
    ],
  },
  {
    id: 'lesson', icon: '🎓', title: "Maxsus fanlarni o'qitish metodikasi",
    desc: "Dars viktorinasi: so'rovnoma, viktorina, so'z buluti, baholash va savol-javob",
    slides: [
      // ---- 1. Kirish: kayfiyat ----
      { type: 'wordcloud', question: "Assalomu alaykum! Bugungi kayfiyatingizni bitta so'z yoki emoji bilan ifodalang 😊", settings: { max_words: 1 } },

      // ---- 2. So'rovnomalar (1–5) ----
      { type: 'poll', question: "Sizningcha, maxsus fanlarni o'qitishda eng samarali interaktiv metod qaysi?",
        options: ['Keys-stadi', 'Aqliy hujum', 'Klaster', 'Loyiha metodi', 'Zigzag (Jigsaw)'], settings: { multiple: false } },
      { type: 'poll', question: "Dars samaradorligiga eng ko'p ta'sir qiluvchi omil nima?",
        options: ["O'qituvchining pedagogik mahorati", "Zamonaviy o'quv vositalari", 'Talabalar motivatsiyasi', "Mazmunning amaliyot bilan bog'liqligi"], settings: { multiple: false } },
      { type: 'poll', question: "Maxsus fanlarda nazariya va amaliyot nisbati qanday bo'lishi kerak?",
        options: ["Nazariya ko'proq (70/30)", 'Teng (50/50)', "Amaliyot ko'proq (30/70)", 'Mavzuga qarab moslashuvchan'], settings: { multiple: false } },
      { type: 'poll', question: "Qaysi baholash shakli talaba bilimini eng aniq ko'rsatadi?",
        options: ['Yozma ish', "Og'zaki so'rov", 'Test', 'Amaliy topshiriq yoki loyiha', 'Portfolio'], settings: { multiple: false } },
      { type: 'poll', question: "Kasbiy kompetensiyani shakllantirishda qaysi bosqich eng muhim?",
        options: ['Nazariy bilim berish', "Laboratoriya mashg'ulotlari", 'Ishlab chiqarish amaliyoti', "Mustaqil ta'lim"], settings: { multiple: false } },

      // ---- 3. Qiziqarli so'z buluti ----
      { type: 'wordcloud', question: "Tasavvur qiling: metodika bir taom bo'lsa, u qaysi taom bo'lardi? 🍲😄", settings: { max_words: 1 } },

      // ---- 4. Viktorina (1–5) ----
      { type: 'quiz', question: '"BBB" jadvali qanday ma\'noni anglatadi?',
        options: ['Bilaman – Bilishni xohlayman – Bilib oldim', 'Bilim – Baho – Bahs', 'Boshlash – Bajarish – Baholash', 'Bilim – Bilish – Bilimdonlik'], settings: { correct: 0, time_limit: 25 } },
      { type: 'quiz', question: "B. Blum taksonomiyasining (2001-yilgi qayta ko'rilgan) eng yuqori darajasi qaysi?",
        options: ['Eslab qolish', 'Tahlil qilish', 'Baholash', 'Yaratish'], settings: { correct: 3, time_limit: 25 } },
      { type: 'quiz', question: '"Keys-stadi" metodining asosi nima?',
        options: ["Ma'ruzani yozib olish", 'Real vaziyatni tahlil qilib yechim topish', 'Test savollariga javob berish', "Matnni yod olish"], settings: { correct: 1, time_limit: 25 } },
      { type: 'quiz', question: '"Aqliy hujum" metodining asosiy qoidasi qaysi?',
        options: ["G'oyalar dastlab tanqid qilinmaydi", 'Faqat to\'g\'ri javob qabul qilinadi', "Faqat a'lochi talabalar gapiradi", "G'oyalar faqat yozma topshiriladi"], settings: { correct: 0, time_limit: 20 } },
      { type: 'quiz', question: "Pedagogik texnologiyaning asosiy belgisi nima?",
        options: ["O'qituvchining tajribasiga tayanish", 'Darslikni to\'liq o\'qib berish', 'Oldindan loyihalangan, kafolatlangan natija', "Faqat kompyuterdan foydalanish"], settings: { correct: 2, time_limit: 25 } },

      // ---- 5. So'rovnomalar (6–10) ----
      { type: 'poll', question: "Qaysi mashg'ulot turi sizga ko'proq yoqadi?",
        options: ["Ma'ruza", "Amaliy mashg'ulot", 'Seminar-munozara', 'Laboratoriya', 'Sayyor dars (ekskursiya)'], settings: { multiple: false } },
      { type: 'poll', question: "Mustaqil ta'limni tashkil etishning eng samarali shakli qaysi?",
        options: ['Referat', 'Keys yechish', 'Loyiha ishi', 'Taqdimot tayyorlash', 'Elektron test'], settings: { multiple: false } },
      { type: 'poll', question: 'Talaba motivatsiyasini nima oshiradi? (bir nechtasini tanlashingiz mumkin)',
        options: ["Rag'batlantirish va ballar", 'Hayotiy misollar', "O'yin va musobaqa elementlari", 'Individual yondashuv', 'Kelajakdagi kasb bilan bog\'lash'], settings: { multiple: true } },
      { type: 'poll', question: "Maxsus fan darslarida raqamli texnologiyalar qanchalik kerak?",
        options: ['Har bir darsda', "Ko'pchilik darslarda", "Ba'zan, zarur bo'lganda", 'An\'anaviy usul yetarli'], settings: { multiple: false } },
      { type: 'poll', question: "Kelajakda o'qituvchi sifatida qaysi metodni birinchi qo'llaysiz?",
        options: ['Keys-stadi', 'Aqliy hujum', 'Klaster', 'BBB jadvali', 'FSMU', 'Venn diagrammasi'], settings: { multiple: false } },

      // ---- 6. Talabalarning erkin javoblari ----
      { type: 'open', question: "Maxsus fanni qiziqarli o'tish uchun o'z g'oyangizni yozing 💡", settings: { max_entries: 2 } },

      // ---- 7. Viktorina (6–10) ----
      { type: 'quiz', question: 'Ya. A. Komenskiy qaysi tamoyilni "didaktikaning oltin qoidasi" deb atagan?',
        options: ["Ko'rgazmalilik", 'Ilmiylik', 'Izchillik', 'Onglilik va faollik'], settings: { correct: 0, time_limit: 20 } },
      { type: 'quiz', question: '"Ta\'lim to\'g\'risida"gi O\'zbekiston Respublikasi Qonunining amaldagi tahriri qachon qabul qilingan?',
        options: ['1997-yil 29-avgust', '2017-yil 7-fevral', '2020-yil 23-sentabr', '2023-yil 1-may'], settings: { correct: 2, time_limit: 20 } },
      { type: 'quiz', question: '"Klaster" metodi nimani anglatadi?',
        options: ["Fikrlarni tarmoqlanuvchi sxemada bog'lash", 'Guruhlarga bo\'lib musobaqa o\'tkazish', 'Matnni qisqartirib yozish', "Savol-javob o'tkazish"], settings: { correct: 0, time_limit: 20 } },
      { type: 'quiz', question: '"FSMU" texnologiyasi qanday kengaytiriladi?',
        options: ['Fan – Savol – Mavzu – Usul', 'Fikr – Sabab – Misol – Umumlashtirish', 'Fikr – Savol – Maqsad – Uslub', 'Faktor – Sinov – Metod – Ulush'], settings: { correct: 1, time_limit: 25 } },
      { type: 'quiz', question: '"Venn diagrammasi" darsda nima uchun qo\'llaniladi?',
        options: ['Vaqtni rejalashtirish uchun', 'Tushunchalarning umumiy va farqli jihatlarini taqqoslash', 'Baholarni hisoblash uchun', "Uy vazifasini tekshirish uchun"], settings: { correct: 1, time_limit: 20 } },

      // ---- 8. Qiziqarli so'z buluti ----
      { type: 'wordcloud', question: "Ideal o'qituvchini 3 ta so'z bilan ta'riflang ✨", settings: { max_words: 3 } },

      // ---- 9. Baholash shkalalari ----
      { type: 'scale', question: "O'z metodik kompetensiyangizni baholang",
        options: ['Interaktiv metodlarni bilish', 'Dars ishlanmasini tuzish', 'Raqamli vositalardan foydalanish', 'Baholash mezonlarini ishlab chiqish'],
        settings: { min: 1, max: 5, min_label: "Boshlang'ich", max_label: 'Mukammal' } },
      { type: 'scale', question: 'Bugungi darsni baholang',
        options: ['Mavzuning tushunarliligi', 'Amaliy ahamiyati', 'Interaktivlik darajasi', 'Umumiy taassurot'],
        settings: { min: 1, max: 10, min_label: 'Past', max_label: "A'lo" } },

      // ---- 10. Yakun ----
      { type: 'wordcloud', question: "Bugungi darsdan o'zingiz bilan nimani olib ketyapsiz? Bitta so'z bilan 🎒", settings: { max_words: 1 } },
      { type: 'qa', question: "Maxsus fanlarni o'qitish metodikasi bo'yicha savollaringiz" },
    ],
  },
  {
    id: 'iq', icon: '🧠', title: 'IQ va mantiqiy fikrlash',
    desc: "20 ta mantiqiy savol, so'rovnoma, so'z buluti va baholash",
    slides: [
      { type: 'wordcloud', question: "Aqlli inson deganda ko'z oldingizga nima keladi? Bitta so'z bilan 🧠", settings: { max_words: 1 } },
      { type: 'poll', question: "Sizningcha, IQ (aql koeffitsiyenti) tug'ma beriladimi yoki rivojlantiriladimi?",
        options: ["Ko'proq tug'ma", "Ko'proq rivojlantiriladi", 'Ikkalasi teng', 'Bilmayman'], settings: { multiple: false } },
      { type: 'poll', question: 'Mantiqiy fikrlashni qaysi mashg\'ulot eng yaxshi rivojlantiradi?',
        options: ['Shaxmat', 'Matematik masalalar', 'Kitob o\'qish', 'Boshqotirmalar', 'Dasturlash'], settings: { multiple: false } },

      // 20 ta IQ savoli
      { type: 'quiz', question: 'Ketma-ketlikni davom ettiring: 2, 4, 8, 16, ?', options: ['24', '30', '32', '64'], settings: { correct: 2, time_limit: 30 } },
      { type: 'quiz', question: 'Ketma-ketlikni davom ettiring: 3, 6, 11, 18, 27, ?', options: ['36', '38', '39', '40'], settings: { correct: 1, time_limit: 40 } },
      { type: 'quiz', question: 'Ketma-ketlikni davom ettiring: 1, 1, 2, 3, 5, 8, ?', options: ['13', '11', '12', '15'], settings: { correct: 0, time_limit: 30 } },
      { type: 'quiz', question: "Qaysi so'z ortiqcha?", options: ['Olma', 'Nok', 'Sabzi', "O'rik"], settings: { correct: 2, time_limit: 20 } },
      { type: 'quiz', question: "Barcha A lar B, barcha B lar esa C. Qaysi xulosa to'g'ri?",
        options: ['Barcha A lar C', 'Barcha C lar A', "Ba'zi A lar C emas", 'Xulosa chiqarib bo\'lmaydi'], settings: { correct: 0, time_limit: 30 } },
      { type: 'quiz', question: 'Soat 3:15 da soat va minut millari orasidagi burchak necha gradus?', options: ['0°', '7,5°', '15°', '22,5°'], settings: { correct: 1, time_limit: 45 } },
      { type: 'quiz', question: '5 ta stanok 5 ta detalni 5 daqiqada yasaydi. 100 ta stanok 100 ta detalni necha daqiqada yasaydi?',
        options: ['100', '20', '1', '5'], settings: { correct: 3, time_limit: 40 } },
      { type: 'quiz', question: "Ko'ldagi nilufarlar har kuni 2 barobar ko'payadi va 48 kunda ko'lni to'liq qoplaydi. Ko'lning yarmini necha kunda qoplaydi?",
        options: ['24', '46', '47', '36'], settings: { correct: 2, time_limit: 40 } },
      { type: 'quiz', question: "Ko'ylak va shim birga 110 ming so'm. Ko'ylak shimdan 100 ming so'm qimmat. Shim necha pul?",
        options: ["10 ming so'm", "5 ming so'm", "1 ming so'm", "15 ming so'm"], settings: { correct: 1, time_limit: 40 } },
      { type: 'quiz', question: 'Qaysi son ortiqcha: 2, 3, 5, 9, 11?', options: ['3', '5', '9', '11'], settings: { correct: 2, time_limit: 30 } },
      { type: 'quiz', question: 'Kitob : O\'qish = Qoshiq : ?', options: ['Oshxona', 'Ovqatlanish', 'Vilka', 'Choy'], settings: { correct: 1, time_limit: 20 } },
      { type: 'quiz', question: 'Ketma-ketlikni davom ettiring: 7, 10, 8, 11, 9, 12, ?', options: ['10', '13', '11', '14'], settings: { correct: 0, time_limit: 35 } },
      { type: 'quiz', question: 'Qaysi shakl ortiqcha?', options: ['Kvadrat', 'Romb', "To'g'ri to'rtburchak", 'Uchburchak'], settings: { correct: 3, time_limit: 20 } },
      { type: 'quiz', question: 'Poyezd 60 km/soat tezlikda 2 soat 30 daqiqa yurdi. U qancha masofani bosib o\'tdi?',
        options: ['120 km', '140 km', '150 km', '180 km'], settings: { correct: 2, time_limit: 30 } },
      { type: 'quiz', question: 'Ketma-ketlikni davom ettiring: 1, 4, 9, 16, 25, ?', options: ['30', '35', '49', '36'], settings: { correct: 3, time_limit: 25 } },
      { type: 'quiz', question: "Anvar qatorda boshidan ham, oxiridan ham 10-o'rinda turibdi. Qatorda nechta o'quvchi bor?",
        options: ['19', '20', '21', '18'], settings: { correct: 0, time_limit: 30 } },
      { type: 'quiz', question: "Indinga shanba bo'lsa, kecha qaysi kun edi?", options: ['Seshanba', 'Chorshanba', 'Payshanba', 'Juma'], settings: { correct: 1, time_limit: 35 } },
      { type: 'quiz', question: 'Ketma-ketlikni davom ettiring: 2, 6, 12, 20, 30, ?', options: ['36', '40', '44', '42'], settings: { correct: 3, time_limit: 40 } },
      { type: 'quiz', question: "Fermerning 17 ta qo'yi bor edi. 9 tasidan boshqa hammasi qochib ketdi. Nechta qo'y qoldi?",
        options: ['8', '9', '17', '0'], settings: { correct: 1, time_limit: 25 } },
      { type: 'quiz', question: "Bir qutida 3 ta qizil va 3 ta ko'k paypoq bor. Qorong'ida bir xil rangli juftlik olish uchun kamida nechta paypoq olish kerak?",
        options: ['2', '3', '4', '6'], settings: { correct: 1, time_limit: 40 } },

      { type: 'wordcloud', question: "Qaysi savol eng qiyin bo'ldi? Bitta so'z bilan ifodalang 😅", settings: { max_words: 1 } },
      { type: 'poll', question: "Qaysi turdagi savollar sizga osonroq bo'ldi?",
        options: ['Sonli ketma-ketliklar', "So'z va o'xshatishlar", 'Mantiqiy xulosalar', 'Hayotiy masalalar'], settings: { multiple: false } },
      { type: 'scale', question: "O'zingizni baholang", options: ['Mantiqiy fikrlash', 'Tez hisoblash', 'Diqqat va e\'tiborlilik', "Qiyin masaladan qo'rqmaslik"],
        settings: { min: 1, max: 5, min_label: 'Past', max_label: 'Yuqori' } },
      { type: 'qa', question: 'Javoblar bo\'yicha savollaringiz' },
    ],
  },
  {
    id: 'psychology', icon: '🧩', title: 'Psixologiya asoslari',
    desc: "So'rovnoma, viktorina, so'z buluti, baholash va savol-javob",
    slides: [
      { type: 'wordcloud', question: "Hozirgi his-tuyg'uingizni bitta so'z bilan ifodalang 💭", settings: { max_words: 1 } },

      { type: 'poll', question: 'Stressni yengishda sizga nima ko\'proq yordam beradi?',
        options: ['Sport', 'Musiqa', "Do'stlar bilan suhbat", 'Uyqu va dam olish', 'Sevimli mashg\'ulot'], settings: { multiple: false } },
      { type: 'poll', question: "O'zingizni qaysi temperamentga yaqin deb bilasiz?", options: ['Sangvinik', 'Xolerik', 'Flegmatik', 'Melanxolik'], settings: { multiple: false } },
      { type: 'poll', question: "Qaysi o'rganish uslubi sizga ko'proq mos?",
        options: ["Ko'rish orqali (vizual)", 'Eshitish orqali (audial)', 'Harakat orqali (kinestetik)', 'Aralash'], settings: { multiple: false } },
      { type: 'poll', question: 'Motivatsiyangizni nima ko\'proq oshiradi?', options: ["Maqtov va e'tirof", "Moddiy rag'bat", 'Shaxsiy maqsad', 'Qiziqish'], settings: { multiple: false } },
      { type: 'poll', question: 'Muloqotda eng muhim ko\'nikma qaysi?', options: ['Tinglay olish', 'Aniq gapira olish', 'Empatiya', 'Ishontira olish'], settings: { multiple: false } },

      { type: 'wordcloud', question: "Agar fe'l-atvoringiz ob-havo bo'lsa, u qanday bo'lardi? ⛅", settings: { max_words: 1 } },

      { type: 'quiz', question: 'Ehtiyojlar piramidasi nazariyasining muallifi kim?', options: ['Z. Freyd', 'A. Maslou', 'I. Pavlov', 'J. Piaje'], settings: { correct: 1, time_limit: 20 } },
      { type: 'quiz', question: 'Psixoanaliz yo\'nalishining asoschisi kim?', options: ['K. Yung', 'B. Skinner', 'Z. Freyd', 'L. Vigotskiy'], settings: { correct: 2, time_limit: 20 } },
      { type: 'quiz', question: 'Shartli refleks ta\'limotini kim yaratgan?', options: ['I. P. Pavlov', 'V. Vundt', 'A. Adler', 'K. Rodjers'], settings: { correct: 0, time_limit: 20 } },
      { type: 'quiz', question: 'Maslou piramidasining eng yuqori pog\'onasi qaysi?',
        options: ['Fiziologik ehtiyojlar', 'Xavfsizlik', 'Hurmat va e\'tirof', "O'zini namoyon qilish (aktuallashtirish)"], settings: { correct: 3, time_limit: 25 } },
      { type: 'quiz', question: 'Xolerik temperamentga qaysi xususiyat xos?',
        options: ['Sokin va shoshilmaydigan', "Tez qo'zg'aluvchan va g'ayratli", "Ta'sirchan va tez xafa bo'ladigan", 'Quvnoq va muvozanatli'], settings: { correct: 1, time_limit: 25 } },

      { type: 'poll', question: 'Qaror qabul qilishda ko\'proq nimaga tayanasiz?', options: ['Mantiq', 'Sezgi (intuitsiya)', 'Boshqalar maslahati', 'Shaxsiy tajriba'], settings: { multiple: false } },
      { type: 'poll', question: 'Kun davomida qachon eng samarali ishlaysiz?', options: ['Erta tongda', 'Kunduzi', 'Kechqurun', 'Tunda'], settings: { multiple: false } },
      { type: 'poll', question: 'Kelishmovchilik paytida odatda nima qilasiz?',
        options: ['Murosaga kelaman', 'Hamkorlikda yechim izlayman', "O'z fikrimda turaman", 'Bahsdan qochaman', 'Yon beraman'], settings: { multiple: false } },
      { type: 'poll', question: 'Ijtimoiy tarmoqlar kayfiyatingizga qanday ta\'sir qiladi?', options: ['Ijobiy', 'Salbiy', 'Neytral', 'Vaziyatga qarab'], settings: { multiple: false } },
      { type: 'poll', question: "Psixologdan yordam so'rash haqida nima deysiz?",
        options: ['Bu kuchlilik belgisi', "Faqat og'ir holatda kerak", 'Noqulay his qilaman', "Bu haqda o'ylamaganman"], settings: { multiple: false } },

      { type: 'open', question: "Stressdan qutulishning o'zingiz sinab ko'rgan usulini bo'lishing 🌿", settings: { max_entries: 2 } },

      { type: 'quiz', question: "J. Piaje nazariyasida bolaning kognitiv rivojlanishi nechta bosqichdan iborat?", options: ['3', '4', '5', '6'], settings: { correct: 1, time_limit: 20 } },
      { type: 'quiz', question: "J. Miller (1956) bo'yicha qisqa muddatli xotira hajmi taxminan qancha?",
        options: ['3 ± 1 element', '7 ± 2 element', '12 ± 3 element', 'Cheklanmagan'], settings: { correct: 1, time_limit: 25 } },
      { type: 'quiz', question: '"Emotsional intellekt" tushunchasini keng ommalashtirgan olim kim?', options: ['D. Goulman', 'A. Maslou', 'E. Erikson', 'G. Gardner'], settings: { correct: 0, time_limit: 20 } },
      { type: 'quiz', question: 'L. S. Vigotskiyning "yaqin rivojlanish zonasi" nimani anglatadi?',
        options: ['Bolaning yashash muhiti', "Kattalar yordamida bajara oladigan, ammo hali mustaqil uddalay olmaydigan ishlar", 'Bolaning tengdoshlari doirasi', 'Maktabgacha davr'], settings: { correct: 1, time_limit: 30 } },
      { type: 'quiz', question: 'Inson xulq-atvori va psixik jarayonlarini o\'rganadigan fan qaysi?', options: ['Sotsiologiya', 'Fiziologiya', 'Falsafa', 'Psixologiya'], settings: { correct: 3, time_limit: 15 } },

      { type: 'wordcloud', question: "Baxtni 3 ta so'z bilan ta'riflang 🌈", settings: { max_words: 3 } },
      { type: 'scale', question: "O'zingizni baholang", options: ['Stressga chidamlilik', 'Empatiya', "O'z-o'zini nazorat qilish", 'Muloqot qobiliyati'],
        settings: { min: 1, max: 5, min_label: 'Past', max_label: 'Yuqori' } },
      { type: 'scale', question: 'Bugungi mashg\'ulotni baholang', options: ['Mavzuning qiziqarliligi', 'Foydaliligi', 'Interaktivlik darajasi'],
        settings: { min: 1, max: 10, min_label: 'Past', max_label: "A'lo" } },
      { type: 'qa', question: 'Psixologiya bo\'yicha savollaringiz' },
    ],
  },
  {
    id: 'meeting', icon: '💼', title: "Jamoa yig'ilishi", desc: 'Fikrlar, ovoz berish va savollar',
    slides: [
      { type: 'poll', question: 'Qaysi vazifani birinchi bajaramiz?', options: ['Yangi funksiya', 'Xatolarni tuzatish', 'Hujjatlar', 'Dizayn'], settings: { multiple: false } },
      { type: 'open', question: 'Jamoa ishini yaxshilash uchun bitta taklif', settings: { max_entries: 2 } },
      { type: 'scale', question: "Haftani baholang", options: ['Samaradorlik', 'Hamkorlik', 'Kayfiyat'], settings: { min: 1, max: 10, min_label: 'Past', max_label: 'Yuqori' } },
      { type: 'qa', question: 'Rahbariyatga savollar' },
    ],
  },
  {
    id: 'event', icon: '🎤', title: 'Tadbir va konferensiya', desc: 'Auditoriya bilan jonli muloqot',
    slides: [
      { type: 'poll', question: 'Qayerdan keldingiz?', options: ['Toshkent', 'Viloyatlar', 'Xorij'], settings: { multiple: false } },
      { type: 'wordcloud', question: 'Bugungi tadbirdan nimani kutyapsiz?', settings: { max_words: 3 } },
      { type: 'qa', question: "Ma'ruzachiga savollar" },
      { type: 'scale', question: 'Tadbirni baholang', options: ['Mazmun', 'Tashkilot'], settings: { min: 1, max: 5, min_label: 'Yomon', max_label: "A'lo" } },
    ],
  },
  {
    id: 'icebreaker', icon: '🧊', title: 'Muz yorar', desc: "Tanishuv, kulgu va kayfiyat: «bu yoki u», qiziq faktlar, so'z buluti",
    slides: [
      // ---- Isinish ----
      { type: 'wordcloud', question: "Salom! 👋 O'zingizni bitta so'z bilan ta'riflang", settings: { max_words: 1 } },
      { type: 'scale', question: 'Batareyangiz necha foiz? 🔋', options: ['Energiya', 'Kayfiyat', 'Yangi odamlar bilan tanishishga tayyorlik'],
        settings: { min: 1, max: 10, min_label: '0% 🪫', max_label: '100% 🔋' } },

      // ---- «Bu yoki u» ----
      { type: 'poll', question: 'Choy yoki qahva? ☕🍵', options: ['☕ Qahva', '🍵 Choy', '🥤 Ikkalasi ham emas'], settings: { multiple: false } },
      { type: 'poll', question: "Tog' yoki dengiz? 🏔️🌊", options: ["🏔️ Tog'", '🌊 Dengiz', "🏜️ Cho'l sarguzashti", '🏙️ Katta shahar'], settings: { multiple: false } },
      { type: 'poll', question: 'Siz kimsiz: erta turuvchi yoki tungi boyo\'g\'li? 🐓🦉',
        options: ['🐓 Erta turuvchi', "🦉 Tungi boyo'g'li", '😴 Ikkalasi ham emas, uyquchiman'], settings: { multiple: false } },
      { type: 'poll', question: 'Bir kunga super kuch berilsa, qaysi birini tanlaysiz? 🦸',
        options: ["👻 Ko'rinmas bo'lish", '🕊️ Ucha olish', "🧠 Fikrlarni o'qish", "⏸️ Vaqtni to'xtatish", '✨ Teleportatsiya'], settings: { multiple: false } },
      { type: 'poll', question: "Mehmonga borganda dasturxonda birinchi nimani qidirasiz? 😋",
        options: ['🍚 Osh', '🥟 Manti', '🥐 Somsa', "🍜 Lag'mon", '🍢 Shashlik', '🍰 Shirinlik'], settings: { multiple: false } },
      { type: 'poll', question: 'Vaqt mashinasi bor. Qayerga borasiz? ⏳',
        options: ["🏛️ Qadimgi davrga", "👶 O'z bolaligimga", '🚀 100 yil keyingi kelajakka', "🙂 Hech qayerga, hozir yaxshi"], settings: { multiple: false } },
      { type: 'poll', question: "Ideal dam olish kuni qanday o'tadi?",
        options: ['🛋️ Uyda, serial bilan', "🧳 Sayohatda", "👨‍👩‍👧 Oila va do'stlar bilan", '📚 Kitob bilan', '⚽ Sportda'], settings: { multiple: false } },

      // ---- Qiziq faktlar viktorinasi ----
      { type: 'quiz', question: 'Qaysi jonzotning 3 ta yuragi bor? 🤔', options: ['Kit', 'Sakkizoyoq', 'Fil', 'Toshbaqa'], settings: { correct: 1, time_limit: 20 } },
      { type: 'quiz', question: 'Qaysi oziq-ovqat to\'g\'ri saqlansa, ming yillar davomida buzilmaydi?', options: ['Non', 'Pishloq', 'Asal', 'Shokolad'], settings: { correct: 2, time_limit: 20 } },
      { type: 'quiz', question: 'Quruqlikdagi eng tez hayvon qaysi? 🏃', options: ['Sher', 'Ot', 'Gepard', 'Kiyik'], settings: { correct: 2, time_limit: 15 } },
      { type: 'quiz', question: 'Inson tanasidagi eng katta organ qaysi?', options: ['Jigar', 'Teri', "O'pka", 'Miya'], settings: { correct: 1, time_limit: 20 } },
      { type: 'quiz', question: 'Qaysi sayyorada bir kun bir yildan uzunroq davom etadi? 🪐', options: ['Venera', 'Mars', 'Yupiter', 'Merkuriy'], settings: { correct: 0, time_limit: 25 } },
      { type: 'quiz', question: 'Flamingolar nima uchun pushti rangda? 🦩',
        options: ["Tug'ma rangi shunday", 'Quyoshda kuyib qolgani uchun', "Yeydigan ozuqasidagi pigment tufayli", 'Suv rangini aks ettirgani uchun'], settings: { correct: 2, time_limit: 25 } },

      // ---- Tanishuv ----
      { type: 'wordcloud', question: 'Bolaligingizda kim bo\'lishni orzu qilgansiz? 🚀', settings: { max_words: 1 } },
      { type: 'open', question: "Siz haqingizdagi qiziq fakt (anonim!). Boshqalar topa olarmikan? 🕵️", settings: { max_entries: 1 } },
      { type: 'wordcloud', question: 'Sizni nima eng ko\'p kuldiradi? 😂', settings: { max_words: 2 } },
      { type: 'open', question: "Bu yil o'rgangan eng qiziq narsangiz? 💡", settings: { max_entries: 1 } },
      { type: 'wordcloud', question: "Hozir dunyoning istalgan joyida bo'lishingiz mumkin bo'lsa, qayerda bo'lardingiz? 🌍", settings: { max_words: 1 } },

      // ---- Yakun ----
      { type: 'wordcloud', question: 'Bugungi kun uchun hammaga bitta tilak ✨', settings: { max_words: 2 } },
      { type: 'qa', question: 'Jamoaga yoki menga savolingiz bormi? (anonim) 🙋' },
    ],
  },
];
