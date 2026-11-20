import { assetUrl } from './assets.js';

/**
 * ALBUM DATA — add, remove or reorder photographs here.
 *
 * Ảnh thật do CLB Võ thuật HUIT cung cấp. Ảnh gốc được lưu trong
 * source-photos/; bản tối ưu WebP nằm trong assets/images/gallery/.
 */
export const galleryGroups = [
  {
    id: 'portrait',
    label: 'The Sensei',
    vi: 'Chân dung người thầy',
    tab: 'Chân dung',
    number: '01',
    description: 'Chân dung và những khoảnh khắc riêng của thầy.',
  },
  {
    id: 'offmat',
    label: 'Off the Mat',
    vi: 'Thầy ngoài sàn tập',
    tab: 'Đời thường',
    number: '02',
    description: 'Thầy gần gũi, giản dị trong những khoảnh khắc đời thường.',
  },
  {
    id: 'together',
    label: 'With the Club',
    vi: 'Thầy và CLB',
    tab: 'Cùng CLB',
    number: '03',
    description: 'Thầy cùng các thế hệ thành viên CLB Võ thuật HUIT.',
  },
  {
    id: 'moments',
    label: 'Club Moments',
    vi: 'Kỷ niệm HUIT',
    tab: 'Kỷ niệm',
    number: '04',
    description: 'Những buổi sinh hoạt và kỷ niệm chung của cả CLB.',
  },
];

export const galleryPhotos = [
  {
    id: 'sensei-portrait',
    group: 'portrait',
    src: assetUrl('assets/images/gallery/01-sensei-portrait.webp'),
    alt: 'Thầy Nguyễn Xuân Hải Âu mặc áo polo vàng, cầm huy chương và giơ ngón cái.',
    caption: 'Thầy Nguyễn Xuân Hải Âu với tấm huy chương trên tay — nụ cười hiền và ánh mắt tự hào của người thầy.',
    credit: 'Ảnh: CLB Võ thuật HUIT',
    position: '50% 32%',
  },
  {
    id: 'sensei-dojo',
    group: 'portrait',
    src: assetUrl('assets/images/gallery/02-sensei-dojo.webp'),
    alt: 'Thầy trong võ phục Karate trắng và đai đen, tay cầm găng tập màu hồng và xanh, đứng trên thảm xanh.',
    caption: 'Một buổi tối trên sàn tập, thầy trong võ phục trắng, bên những đôi găng tập.',
    credit: 'Ảnh: CLB Võ thuật HUIT',
    position: '50% 30%',
  },
  {
    id: 'sensei-beach',
    group: 'portrait',
    src: assetUrl('assets/images/gallery/03-sensei-beach.webp'),
    alt: 'Thầy chân trần trên bãi biển lúc hoàng hôn, mặc áo polo đỏ và quần short.',
    caption: 'Ngoài sàn tập, thầy giản dị và gần gũi bên biển lúc hoàng hôn.',
    credit: 'Ảnh: CLB Võ thuật HUIT',
    position: '50% 36%',
  },
  {
    id: 'sensei-sharing',
    group: 'offmat',
    src: assetUrl('assets/images/gallery/04-sensei-sharing.webp'),
    alt: 'Thầy mặc áo sơ mi trắng, cầm micro phát biểu trước các bạn sinh viên.',
    caption: 'Thầy chia sẻ tại một buổi giao lưu, với micro trên tay và ánh mắt hướng về các bạn sinh viên.',
    credit: 'Ảnh: CLB Võ thuật HUIT',
    position: '50% 28%',
  },
  {
    id: 'sensei-smile',
    group: 'offmat',
    src: assetUrl('assets/images/gallery/05-sensei-smile.webp'),
    alt: 'Thầy mặc áo polo vàng, ngồi xổm và giơ tay tạo dáng trước ống kính.',
    caption: 'Một khoảnh khắc thật đời thường: nụ cười và cái giơ tay quen thuộc của thầy.',
    credit: 'Ảnh: CLB Võ thuật HUIT',
    position: '50% 38%',
  },
  {
    id: 'sensei-sideline',
    group: 'offmat',
    src: assetUrl('assets/images/gallery/06-sensei-sideline.webp'),
    alt: 'Thầy mặc áo sơ mi trắng, ngồi trên ghế inox và nhìn về phía sân tập.',
    caption: 'Thầy ngồi bên sân tập, theo dõi từng động tác của học trò.',
    credit: 'Ảnh: CLB Võ thuật HUIT',
    position: '50% 34%',
  },
  {
    id: 'club-event',
    group: 'together',
    src: assetUrl('assets/images/gallery/07-club-event.webp'),
    alt: 'Thầy và đông đảo thành viên CLB HUIT chụp ảnh tập thể trước băng rôn sự kiện.',
    caption: 'Tập thể CLB Võ thuật HUIT cùng thầy tại một sự kiện của thành phố.',
    credit: 'Ảnh: CLB Võ thuật HUIT',
    position: '50% 46%',
  },
  {
    id: 'club-competition',
    group: 'together',
    src: assetUrl('assets/images/gallery/08-club-competition.webp'),
    alt: 'Thầy và đội tuyển Karate HUIT trong võ phục trắng trước băng rôn Kỳ thi thăng đẳng quốc gia môn Karate.',
    caption: 'Đội tuyển CLB tại Kỳ thi thăng đẳng quốc gia môn Karate năm 2025.',
    credit: 'Ảnh: CLB Võ thuật HUIT',
    position: '50% 40%',
  },
  {
    id: 'club-medals',
    group: 'together',
    src: assetUrl('assets/images/gallery/09-club-medals.webp'),
    alt: 'Thầy và thành viên CLB cầm cờ, huy chương và băng rôn Karate HUIT tại một trung tâm thương mại.',
    caption: 'Những tấm huy chương và lá cờ CLB — thành quả của cả một tập thể.',
    credit: 'Ảnh: CLB Võ thuật HUIT',
    position: '50% 50%',
  },
  {
    id: 'club-night',
    group: 'moments',
    src: assetUrl('assets/images/gallery/10-club-night.webp'),
    alt: 'Thầy mặc áo vàng, ngồi giữa các thành viên CLB trong buổi sinh hoạt tối.',
    caption: 'Một buổi tối sinh hoạt CLB, thầy ngồi giữa các thành viên.',
    credit: 'Ảnh: CLB Võ thuật HUIT',
    position: '50% 58%',
  },
  {
    id: 'club-celebration',
    group: 'moments',
    src: assetUrl('assets/images/gallery/11-club-celebration.webp'),
    alt: 'Thầy mặc áo đỏ, đứng giữa các thành viên CLB, mọi người cầm bánh và hoa.',
    caption: 'Cả CLB quây quần bên chiếc bánh và những bó hoa.',
    credit: 'Ảnh: CLB Võ thuật HUIT',
    position: '50% 50%',
  },
  {
    id: 'club-rain',
    group: 'moments',
    src: assetUrl('assets/images/gallery/12-club-rain.webp'),
    alt: 'Thầy và CLB chụp ảnh tập thể dưới trời mưa, trên mặt sân ướt.',
    caption: 'Một kỷ niệm đáng nhớ dưới cơn mưa — vẫn đủ ấm bởi tình thầy trò.',
    credit: 'Ảnh: CLB Võ thuật HUIT',
    position: '50% 52%',
  },
];

export const getPhotosByGroup = (groupId) =>
  galleryPhotos.filter((photo) => photo.group === groupId);

export const getGroup = (groupId) =>
  galleryGroups.find((group) => group.id === groupId) ?? galleryGroups[0];

export const galleryMeta = {
  eyebrow: 'CHAPTER 04 · OUR SENSEI & OUR CLUB',
  title: 'Thầy & CLB HUIT',
  subtitle: '12 khoảnh khắc của thầy và CLB Võ thuật HUIT.',
  note: 'Ảnh: CLB Võ thuật HUIT.',
};
