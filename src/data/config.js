import { assetUrl } from './assets.js';

/**
 * ĐÓA HOA TRI ÂN — central content configuration.
 *
 * Everything you may want to personalise lives here (and in gallery.js).
 * The real portrait lives at assets/images/teacher/sensei-portrait.webp.
 * Replace it and update `portrait.filename` / `portrait.alt` when needed.
 */
export const siteConfig = {
  title: 'ĐÓA HOA TRI ÂN',
  subtitle: 'A SPECIAL GIFT FOR OUR KARATE SENSEI',
  tagline: 'Tri ân người thầy – Người truyền lửa võ đạo.',
  language: 'vi',
  occasion: {
    name: "Ngày Nhà giáo Việt Nam",
    nameEn: "Vietnamese Teachers' Day",
    displayDate: '20 · 11 · 2026',
    shortDate: '20 · 11',
    year: '2026',
    isoDate: '2026-11-20',
  },
  recipient: {
    fullName: 'Nguyễn Xuân Hải Âu',
    displayName: 'NGUYỄN XUÂN HẢI ÂU',
    title: 'KARATE SENSEI',
    role: 'Cố vấn CLB Võ thuật HUIT',
    job: 'Giảng viên Giáo dục thể chất – HUIT',
    martialArt: 'Karate',
    club: 'CLB Võ thuật HUIT',
    school: 'Trường Đại học Công Thương TP.HCM',
    quote: 'Người truyền cảm hứng, bản lĩnh và tinh thần võ đạo.',
    portrait: {
      src: assetUrl('assets/images/teacher/sensei-portrait.webp'),
      alt: 'Thầy Nguyễn Xuân Hải Âu trong áo polo vàng, cầm huy chương và giơ ngón cái trên sàn tập',
      filename: 'sensei-portrait.webp',
      isPlaceholder: false,
      placeholderLabel: 'ẢNH MINH HOẠ',
    },
  },
  sender: {
    club: 'KARATE HUIT',
    school: 'HUIT',
    signature: 'CLB VÕ THUẬT HUIT - BỘ MÔN KARATE.',
  },
  audio: {
    // Official YouTube stream: Người Gieo Mầm Xanh — Hứa Kim Tuyền x Hoàng Dũng
    youtubeId: 'sj_UDyfoo-A',
    title: 'Người Gieo Mầm Xanh — Hứa Kim Tuyền x Hoàng Dũng',
    volume: 0.38,
    // Offline / blocked-embed fallback. The primary source is always YouTube.
    src: assetUrl('assets/audio/background-music.mp3'),
    fallbackTitle: 'Piano dự phòng — Đóa Hoa Tri Ân',
  },
  letter: {
    eyebrow: 'A LETTER, SEALED WITH GRATITUDE',
    greeting: 'Kính gửi thầy Nguyễn Xuân Hải Âu!',
    paragraphs: [
      'Nhân ngày Nhà giáo Việt Nam 20/11, chúng em xin gửi đến thầy những lời chúc tốt đẹp và sự tri ân chân thành nhất.',
      'Cảm ơn thầy đã luôn đồng hành, hướng dẫn và truyền cảm hứng cho các thế hệ sinh viên HUIT.',
      'Cảm ơn thầy vì đã góp phần xây dựng một môi trường nơi chúng em không chỉ học võ, mà còn học cách kỷ luật, kiên trì, tôn trọng và vượt qua giới hạn của bản thân.',
      'Đặc biệt, cảm ơn thầy đã luôn dành sự quan tâm và đồng hành cùng KARATE HUIT trên hành trình phát triển.',
      'Chúc thầy luôn mạnh khỏe, hạnh phúc, giữ mãi ngọn lửa nhiệt huyết và tiếp tục truyền cảm hứng đến nhiều thế hệ sinh viên.',
      'Chúng em xin chân thành cảm ơn thầy!',
    ],
    signature: 'CLB VÕ THUẬT HUIT\n- BỘ MÔN KARATE.',
    closing: 'CLB VÕ THUẬT HUIT - BỘ MÔN KARATE.',
    stamp: 'KARATE HUIT · 20.11.2026',
  },
  ending: {
    kicker: 'WITH LOVE & RESPECT',
    quote: 'Mãi giữ ngọn lửa đam mê và nhiệt huyết với nghề!',
    signoff: 'KARATE HUIT',
  },
  scenes: [
    { id: 'intro', label: 'Mở món quà', short: 'Mở quà' },
    { id: 'flowers', label: 'Hoa nở', short: 'Hoa nở' },
    { id: 'sensei', label: 'Người thầy', short: 'Người thầy' },
    { id: 'memories', label: 'Khoảnh khắc', short: 'Khoảnh khắc' },
    { id: 'letter', label: 'Lá thư', short: 'Lá thư' },
    { id: 'ending', label: 'Lời chúc cuối', short: 'Lời chúc' },
  ],
};

export default siteConfig;
