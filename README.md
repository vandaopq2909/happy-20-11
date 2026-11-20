# ĐÓA HOA TRI ÂN (BLOOM OF GRATITUDE)

> **Tri ân người thầy – Người truyền lửa võ đạo.**
> Một món quà kỹ thuật số dành tặng thầy **Nguyễn Xuân Hải Âu** — Karate Sensei, Cố vấn CLB Võ thuật HUIT — nhân ngày Nhà giáo Việt Nam **20/11/2026**.

Website là một câu chuyện tương tác gồm 6 màn, được thiết kế mobile-first cho iPhone 11 (414 × 896) và 390 × 844, có animation hoa nở, cánh hoa rơi, hộp quà 3D, album polaroid, phong thư mở, hiệu ứng typewriter và nhạc nền YouTube.

---

## 1. Chạy dự án

Yêu cầu: **Node.js ≥ 20.19** (khuyến nghị Node 22) và **pnpm 11** (hoặc npm).

```bash
cd bloom-of-gratitude
pnpm install
pnpm dev
```

Mở địa chỉ Vite in ra (thường là `http://localhost:5173`).

Build bản production:

```bash
pnpm build
pnpm preview
```

Thư mục deploy là `dist/`. Đây là static site, không cần backend.

> Lần đầu chạy trên máy mới, pnpm có thể hỏi về build script của `esbuild`. File `pnpm-workspace.yaml` đã khai báo `onlyBuiltDependencies: [esbuild]`; nếu prompt vẫn xuất hiện, chọn cho phép `esbuild`.

---

## 2. Hình ảnh & âm thanh

Bộ ảnh thật do CLB Võ thuật HUIT cung cấp đã được đưa vào website:

- **1 ảnh chân dung thầy** tại `assets/images/teacher/sensei-portrait.webp` — dùng cho Scene 3 và ảnh đầu album.
- **11 ảnh hoạt động** tại `assets/images/gallery/`; album dùng tổng cộng **12 ảnh** (bao gồm ảnh chân dung).
- Ảnh được tối ưu sang WebP, cạnh dài tối đa 1800 px. **Ảnh gốc** được lưu riêng trong `source-photos/` và không đưa vào bản deploy.
- Album chia thành **4 nhóm × 3 ảnh**: Chân dung · Đời thường · Cùng CLB · Kỷ niệm.
- Caption, alt text và nhóm ảnh đã được viết lại theo đúng nội dung từng bức ảnh.
- Nhạc nền chính stream từ YouTube: **“Người Gieo Mầm Xanh” — Hứa Kim Tuyền x Hoàng Dũng**, video `sj_UDyfoo-A`. Bài hát không được tải xuống hay đóng gói trong project.
- `assets/audio/background-music.mp3` chỉ là **nhạc dự phòng** (piano tổng hợp từ đầu) khi YouTube API/embed bị chặn hoặc thiết bị offline.

> Ảnh gốc được giữ tại `source-photos/` để có thể tạo lại WebP khi cần. Không xoá thư mục này nếu muốn lưu bản gốc.

---

## 3. Thay ảnh chân dung thầy

Ảnh hiện tại đã là ảnh thật và `isPlaceholder` đang là `false`, nên nhãn “ẢNH MINH HOẠ” tự ẩn.

Nếu muốn thay ảnh khác:

1. Chọn ảnh chân dung dọc (gợi ý 2:3 hoặc 4:5), lưu bản gốc vào `source-photos/`.
2. Tạo WebP và ghi đè:
   `assets/images/teacher/sensei-portrait.webp`
3. Trong `src/data/config.js`, cập nhật:
   - `recipient.portrait.alt` → mô tả ảnh mới.
   - `recipient.portrait.filename`.
   - Giữ `isPlaceholder: false`.
4. Nếu đổi tên file, cập nhật `recipient.portrait.src` và ảnh trong `scripts/generate-og.mjs` (nếu tạo lại ảnh chia sẻ).

Ảnh được hiển thị bằng `object-fit: cover`; tinh chỉnh `object-position` tại `.portrait__img` trong `src/styles/main.css` nếu cần.

---

## 4. Thay ảnh album

1. Lưu ảnh gốc vào `source-photos/`.
2. Tạo WebP cho website trong `assets/images/gallery/` (có thể dùng cạnh dài 1200–1800 px).
3. Mở `src/data/gallery.js` và sửa object tương ứng trong `galleryPhotos`:
   ```js
   {
     id: 'ten-anh',
     group: 'portrait', // portrait | offmat | together | moments
     src: '/assets/images/gallery/ten-anh.webp',
     alt: 'Mô tả ngắn cho trình đọc màn hình',
     caption: 'Câu chuyện của bức ảnh...',
     credit: 'Ảnh: CLB Võ thuật HUIT',
     position: '50% 50%', // object-position khi crop vuông trên card
   }
   ```
4. Ảnh được lazy-load (`loading="lazy"`), vuốt để chuyển, bấm để mở lightbox.

Album hiện có **12 ảnh, 4 nhóm**:

| Nhóm | Tên | Ảnh |
| --- | --- | --- |
| 01 | The Sensei · Chân dung người thầy | `01-sensei-portrait`, `02-sensei-dojo`, `03-sensei-beach` |
| 02 | Off the Mat · Thầy ngoài sàn tập | `04-sensei-sharing`, `05-sensei-smile`, `06-sensei-sideline` |
| 03 | With the Club · Thầy và CLB | `07-club-event`, `08-club-competition`, `09-club-medals` |
| 04 | Club Moments · Kỷ niệm HUIT | `10-club-night`, `11-club-celebration`, `12-club-rain` |

Card album dùng khung vuông để cân bằng ảnh dọc và ảnh ngang; **lightbox hiển thị trọn ảnh gốc**. Nếu ảnh bị cắt mặt/người ở card, chỉnh `position` của ảnh đó (ví dụ `50% 30%`).

---

## 5. Nhạc nền YouTube

Nhạc nền chính được phát qua **YouTube IFrame Player API** (ẩn player, chỉ phát audio). Cấu hình nằm trong `src/data/config.js`:

```js
audio: {
  youtubeId: 'sj_UDyfoo-A',
  title: 'Người Gieo Mầm Xanh — Hứa Kim Tuyền x Hoàng Dũng',
  volume: 0.38,
  src: '/assets/audio/background-music.mp3', // fallback
}
```

- Đổi bài khác: thay `youtubeId` bằng ID video YouTube được phép nhúng, cập nhật `title`.
- **Không autoplay**: player được nạp sẵn nhưng chỉ `playVideo()` sau thao tác thật của người dùng — bấm **MỞ MÓN QUÀ**, nút nhạc, hoặc chuyển màn. Đây là cách cần thiết cho Safari iOS; nút mở quà được prime ngay ở `pointerdown` để không mất user-activation.
- Nếu YouTube API/embed bị chặn, trình phát tự chuyển sang file `assets/audio/background-music.mp3` (piano dự phòng). Có thể thay file này bằng MP3 khác.
- Video phải cho phép nhúng; quảng cáo/giới hạn vùng có thể do phía YouTube.
- Việc dùng YouTube kéo theo request/cookie của YouTube khi khách mở trang.

**Không autoplay** và nhạc chỉ bắt đầu sau tương tác — yêu cầu bắt buộc của Safari iOS.

---

## 6. Sửa nội dung

Hầu hết nội dung nằm ở `src/data/config.js`:

- Tên thầy, chức danh, CLB, trường.
- Ngày 20/11/2026.
- Câu quote, lời chúc cuối.
- Nội dung lá thư: `letter.greeting`, `letter.paragraphs`, `letter.closing`.
- Ảnh, nhạc, âm lượng.

Một số tiêu đề/chương được viết trực tiếp trong `index.html` (ví dụ `CHAPTER 02 · THE GARDEN`) để dễ kiểm soát thiết kế. Có thể sửa tại đó nếu cần.

Sau khi thay đổi nội dung, nên kiểm tra lại chiều cao màn hình 390 × 844; nếu chữ dài, các scene đều cho phép cuộn trong vùng nội dung.

---

## 7. Cấu trúc

```
bloom-of-gratitude/
├── index.html
├── package.json
├── vite.config.js
├── pnpm-workspace.yaml
├── README.md
├── THIRD_PARTY_NOTICES.md
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Pages build + deploy
├── public/
│   ├── favicon.svg
│   ├── site.webmanifest
│   └── .nojekyll
├── src/
│   ├── main.js                 # boot, scene manager, transition, theme
│   ├── utils.js
│   ├── styles/
│   │   ├── fonts.css           # Be Vietnam Pro + Playfair Display (self-host)
│   │   ├── main.css
│   │   ├── animations.css
│   │   └── responsive.css
│   ├── scenes/
│   │   ├── intro.js
│   │   ├── gift-three.js       # hộp quà Three.js (lazy-loaded)
│   │   ├── flowers.js
│   │   ├── sensei.js
│   │   ├── memories.js
│   │   ├── letter.js
│   │   └── ending.js
│   ├── components/
│   │   ├── music-player.js
│   │   ├── particle-system.js
│   │   ├── petal-system.js
│   │   ├── navigation.js
│   │   └── lightbox.js
│   └── data/
│       ├── assets.js           # resolve assets theo BASE_URL (GitHub Pages)
│       ├── config.js
│       └── gallery.js
├── assets/
│   ├── images/
│   │   ├── teacher/
│   │   ├── gallery/
│   │   ├── backgrounds/        # og-cover.jpg + .webp
│   │   └── flowers/
│   ├── audio/
│   │   └── background-music.mp3
│   ├── fonts/                  # woff2, self-hosted
│   └── models/
├── source-photos/              # ảnh gốc CLB cung cấp (không deploy)
└── scripts/
    ├── generate-art.mjs        # công cụ tạo tranh minh hoạ dự phòng (không bắt buộc)
    ├── generate_audio.py       # tạo lại nhạc piano
    ├── generate-og.mjs         # tạo ảnh chia sẻ 1200×630
    ├── qa.mjs                  # QA Chromium mobile + chụp screenshot
    ├── qa-edge.mjs             # reduced-motion, WebGL fallback, audio
    └── qa-webkit.mjs           # QA engine WebKit (Safari) + chụp screenshot
```

`assets/` nằm ngoài `public/` để người gửi dễ thay ảnh/nhạc. Một Vite plugin nhỏ trong `vite.config.js` copy nguyên thư mục này vào `dist/assets/` khi build.

---

## 8. Công nghệ

- **Vite 7** + HTML/CSS/JavaScript ES modules.
- **GSAP** cho timeline, chuyển cảnh, reveal chữ.
- **Three.js** cho hộp quà 3D (lazy import; tự fallback nếu WebGL không khả dụng).
- **Swiper** cho album coverflow.
- **YouTube IFrame Player API** cho nhạc nền chính; **Howler.js** cho file dự phòng.
- **Canvas 2D** cho cánh hoa, đom đóm, hiệu ứng kết thúc.
- Font **Be Vietnam Pro** + **Playfair Display** self-host, hỗ trợ tiếng Việt.
- Không backend, không database, không tracking.

---

## 9. Trải nghiệm & điều khiển

- 6 scene: Mở quà → Hoa nở → Người thầy → Album 12 ảnh (thầy & CLB) → Lá thư → Lời chúc cuối.
- Nút chuyển màn, nút quay lại, thanh tiến trình 6 điểm.
- Vuốt ngang để chuyển scene (trừ album/lightbox/letter reader), phím ←/→ trên desktop.
- Nút nhạc cố định + thanh âm lượng.
- Album: vuốt, nút trước/sau, chọn nhóm ảnh, lightbox có vuốt và bàn phím.
- Lá thư: tự động mở phong thư chầm chậm sau khi vào scene; chạm vùng tối bên ngoài tờ giấy (hoặc nút **Đóng**, phím `Esc`) để đóng thư; chạm vào phong thư hoặc nút **ĐỌC LẠI LÁ THƯ** để mở lại. Nội dung có typewriter và nút **“Hiện toàn bộ”** để đọc ngay.
- Kết thúc: **“XEM LẠI HÀNH TRÌNH”** reset toàn bộ trải nghiệm về Scene 1.
- `prefers-reduced-motion` được tôn trọng; hiệu ứng canvas/particle tự giảm hoặc dừng trên thiết bị yếu.

---

## 10. Responsive & Safari iOS

Đã áp dụng:

- `viewport-fit=cover`, `env(safe-area-inset-*)` cho tai thỏ và thanh home.
- `100vh` → `100svh` → `100dvh` fallback.
- Mobile-first, breakpoint 320 / 375 / 390 / 414 / 430 / 768 / 1024 / desktop.
- Không có horizontal scrollbar; kiểm tra bằng script QA.
- Vùng nội dung tự cuộn khi màn hình thấp; không khóa nội dung sau animation.
- Không phụ thuộc hover; nút tối thiểu 44–54 px.
- Ảnh WebP, `alt`, lazy-load.
- Ba nút điều khiển cố định có nền kính và vùng chạm rõ ràng.

**Lưu ý Safari:** QA tự động chạy trên **Chromium headless** và **Playwright WebKit 27.2** (engine Safari), không phải iPhone thật. Safe-area/tai thỏ và hành vi thanh địa chỉ Safari vẫn nên được xác nhận trên máy thật. Trước khi gửi, nên mở thử trên iPhone thật và kiểm tra:

1. Nhấn “MỞ MÓN QUÀ” lần đầu — nhạc có phát và fade-in không.
2. Xoay ngang / vuốt địa chỉ thanh Safari — bố cục có nhảy không.
3. Cuộn lá thư, bấm “Hiện toàn bộ”, mở lightbox.
4. Bật **Reduce Motion** trong Accessibility Settings và mở lại.

Các điểm đã xử lý riêng cho iOS: nhạc không autoplay, `-webkit-overflow-scrolling: touch`, `-webkit-backdrop-filter`, không dùng hover để hiện nội dung, canvas DPR cap 2, WebGL fallback.

---

## 11. Kiểm thử

```bash
# Terminal 1
pnpm build
pnpm preview

# Terminal 2
pnpm qa
pnpm qa:edge      # reduced motion, WebGL fallback, audio, keyboard
pnpm qa:webkit    # Safari engine (WebKit) ở 414×896 và 390×844
```

Lần đầu chạy QA WebKit, cài browser engine:

```bash
node node_modules/playwright-core/cli.js install webkit
```

`pnpm qa` dùng `playwright-core` + Chrome/Edge cài sẵn trên máy, chạy các bước:

- Mở trang ở **414 × 896** và **390 × 844**, deviceScaleFactor 2 (Chromium).
- Chụp screenshot từng màn vào `qa-artifacts/`.
- Mở quà, chuyển scene, mở lightbox, kiểm tra lá thư tự mở, đóng bằng vùng ngoài, mở lại bằng phong thư, skip typewriter, restart.
- Kiểm tra `console.error`, request lỗi, tràn ngang.
- Kiểm tra WebGL và trạng thái nhạc.
- Chạy lại toàn bộ luồng chính trên **WebKit** (engine Safari) ở cả hai viewport.

Kết quả lần kiểm thử gần nhất:

- Chromium và WebKit: không có lỗi console / page error, không có request lỗi.
- Không có tràn ngang; cả 6 scene có `scrollHeight === clientHeight` ở 390 × 844 và 414 × 896.
- Album: đủ **12 ảnh thật, 4 nhóm**; chapter 2 × 2 hiển thị đầy đủ trên mobile; lightbox mở đúng ảnh và hiển thị trọn khung.
- Ảnh chân dung thật hiển thị đúng trong Scene 3; nhãn “ẢNH MINH HOẠ” đã ẩn.
- Build tĩnh đã được kiểm tra khi phục vụ dưới sub-path kiểu GitHub Pages (`/repo/`) trên cả Chromium và WebKit: không có request nội bộ nào thất bại.
- WebGL khả dụng; fallback hoạt động khi WebGL bị tắt.
- Reduced motion: nội dung vẫn hiện đầy đủ, lá thư tự mở và hiện ngay.
- Lá thư: tự mở sau khi vào scene; đóng được bằng click vùng ngoài/nút Đóng; mở lại được bằng phong thư; không tự bật lại sau khi đã đóng.
- Nhạc YouTube bắt đầu sau tương tác, tắt/bật và đổi âm lượng được; đã kiểm tra trên Chromium và WebKit. File MP3 dự phòng giải mã 95 giây.
- Build production thành công (`pnpm build`).

Nếu muốn kiểm tra thủ công:

1. Mở DevTools → Responsive → 414 × 896 và 390 × 844.
2. Kiểm tra `document.documentElement.scrollWidth === clientWidth`.
3. Thử bật/tắt nhạc, kéo volume, vuốt album.
4. Bật `prefers-reduced-motion: reduce` trong Rendering panel.

---

## 12. Tạo lại asset (tuỳ chọn)

Các script tạo tranh/nhạc dùng để tạo asset gốc; **không cần chạy** nếu chỉ thay ảnh/nhạc.

```bash
pnpm art          # node scripts/generate-art.mjs  (cần Chrome/Edge + playwright-core)
pnpm audio        # python scripts/generate_audio.py (cần numpy + lameenc)
pnpm og           # node scripts/generate-og.mjs
```

- `pnpm art` là công cụ dự phòng: render tranh minh hoạ từ SVG sang PNG; sau đó chạy `python scripts/convert_webp.py` để chuyển sang WebP. Website hiện tại đang dùng ảnh thật, không dùng các file minh hoạ do công cụ này tạo.
- `pnpm audio` tổng hợp bản piano 95 giây. Cần cài `lameenc`:
  ```bash
  python -m pip install numpy lameenc
  ```
- `pnpm og` cần preview server đang chạy ở `http://127.0.0.1:4173`.

---

## 13. Deploy lên GitHub Pages

Repo đã được chuẩn bị sẵn cho GitHub Pages project site (`https://<user>.github.io/<repo>/`):

- `vite.config.js` dùng build base tương đối `./`, nên asset, font, ảnh, nhạc và favicon đều chạy đúng dưới sub-path.
- `src/data/assets.js` resolve ảnh/nhạc theo `import.meta.env.BASE_URL`.
- `.github/workflows/deploy.yml` build bằng Node 22 + pnpm 11 và deploy artifact `dist/`.
- `public/.nojekyll` được copy vào bản build.

### Các bước push & deploy

1. Repo hiện tại: [`vandaopq2909/happy-20-11`](https://github.com/vandaopq2909/happy-20-11), nhánh `main`. **Không** commit `node_modules/`, `dist/`, `qa-artifacts/` (đã có trong `.gitignore`).
2. Commit và push các thay đổi deploy:
   ```bash
   cd bloom-of-gratitude
   git add .
   git commit -m "Prepare GitHub Pages deployment"
   git push origin main
   ```
3. Vào **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Push một commit mới (hoặc chạy workflow **Deploy to GitHub Pages** thủ công ở tab Actions).
5. Workflow sẽ in URL public. Với repo hiện tại:
   - `https://vandaopq2909.github.io/happy-20-11/`
   - Nếu đổi tên repo, workflow vẫn tự tính lại URL theo `GITHUB_REPOSITORY`.

Workflow tự tính `SITE_URL` và truyền vào build để điền `canonical`, `og:url`, `og:image` đúng đường dẫn.

### Custom domain

1. Cấu hình custom domain trong **Settings → Pages**.
2. Tạo repository variable **Settings → Secrets and variables → Actions → Variables**:
   - Name: `SITE_URL`
   - Value: `https://domain-cua-ban.example/` (có dấu `/` cuối cũng được).
3. Chạy lại workflow. Nếu không có biến này, workflow dùng URL GitHub Pages tự động.

### Build/deploy thủ công ở host khác

```bash
SITE_URL="https://your-domain.example/" pnpm build
```

Sau đó upload toàn bộ `dist/` lên host static. Nếu không truyền `SITE_URL`, canonical/OG sẽ dùng `http://localhost:5173/` (chỉ phù hợp để xem local).

Lưu ý: nhạc nền cần Internet để tải YouTube; trang không cần backend.

> Thư mục `dist/` trong file ZIP chỉ để xem trước/local. Khi push lên GitHub, workflow sẽ tự build lại và ghi `SITE_URL` đúng với repo của bạn; không cần commit `dist/`.

Cấu hình máy chủ cần trả đúng MIME:
- `.webp` → `image/webp`
- `.mp3` → `audio/mpeg`
- `.woff2` → `font/woff2`
- `.webmanifest` → `application/manifest+json` (GitHub Pages tự xử lý)

---

## 14. Ghi công & bản quyền

- Ý tưởng, nội dung và lời chúc: **CLB Võ thuật HUIT**.
- Ảnh thật: CLB Võ thuật HUIT cung cấp, lưu gốc tại `source-photos/` và bản WebP tại `assets/images/`.
- Nội dung gửi tặng: **KARATE HUIT** — CLB Võ thuật HUIT, Bộ môn Karate.
- Phát triển giao diện: **Dev by Mèo Con**.
- Nhạc nền chính: **“Người Gieo Mầm Xanh” — Hứa Kim Tuyền x Hoàng Dũng**, phát qua YouTube embed; bản quyền thuộc tác giả/chủ sở hữu, không được đóng gói lại trong project.
- Nhạc dự phòng piano và OG card: tạo riêng cho dự án, có thể thay thế.
- Font **Be Vietnam Pro**, **Playfair Display**: Google Fonts, giấy phép **SIL Open Font License 1.1**, đã self-host trong `assets/fonts/`.
- Thư viện: GSAP, Three.js, Swiper, Howler.js (giấy phép tương ứng của từng dự án).
- Danh sách giấy phép đầy đủ: `THIRD_PARTY_NOTICES.md` và `assets/fonts/OFL-*.txt`.

> Món quà nhỏ này được làm để nói lời cảm ơn. Bộ ảnh thật của thầy và CLB đã được cập nhật; nhạc nền có thể thay bằng bản yêu thích trước khi gửi.
