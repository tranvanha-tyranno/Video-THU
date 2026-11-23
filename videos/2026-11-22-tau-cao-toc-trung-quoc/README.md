# Vì sao tàu cao tốc Trung Quốc chạy được 350 km/h?

Bản thử tiếng Việt cho người xem phổ thông. Tuyến Bắc Kinh–Thiên Tân mở câu
chuyện. Ba cảnh chính lần lượt giải thích tuyến riêng, dữ liệu buồng lái và
cách lắp dầm đúc sẵn theo từng nhịp. Phần kết trả lời câu mở trước khi mời
bình luận và đăng ký kênh.

Hình là đồ họa chuyển động 2D tự dựng. Các minh họa tuyến đường, buồng lái và
thi công cầu được đơn giản hóa. Lời dẫn tổng hợp bằng Microsoft Edge TTS,
giọng Nam Minh, thiết lập tốc độ +12% lúc tổng hợp. Mốc cảnh lấy từ độ dài
bản thu thực tế theo từng đoạn. Phần miễn trừ trách nhiệm có cả lời đọc và
chữ trên màn hình.

## Tệp sử dụng

- Bản xuất `tau-cao-toc-trung-quoc.mp4`.
- [Kịch bản](script.json) và [timeline](timeline.json).
- [Mã dựng Remotion](../../workflows/reference-video/cinematic/src/china-rail/index.tsx).
- `audio/` chứa các bản thu theo cảnh và biên nhận. `public/narration.wav`
  chứa lời dẫn đã ghép theo khung hình.

Để dựng lại bằng PowerShell, cài phụ thuộc Python của nhánh reference-video
và chạy `npm ci` trong `workflows/reference-video/cinematic`. Từ thư mục
batch, chạy `python prepare_audio.py` để ghép các take đã lưu rồi chạy
`./render.ps1`.

## Nguồn nội dung

- Tuyến liên thành phố Bắc Kinh–Thiên Tân khai trương năm 2008. Đây là
  tuyến cao tốc đầu tiên ở Trung Quốc có tốc độ thiết kế 350 km/h.
  [Cổng Chính phủ Trung Quốc, 2023](https://english.www.gov.cn/news/202308/02/content_WS64c9c836c6d0868f4e8de506.html)
- Bán kính cong, hành lang riêng, cầu cạn, đường hầm, thiết bị nhận dữ liệu
  trên tàu và cách tiêu chuẩn hóa thi công được đối chiếu với các chương 4–5.
  [World Bank, China’s High-Speed Rail Development](https://documents1.worldbank.org/curated/en/933411559841476316/pdf/Chinas-High-Speed-Rail-Development.pdf)
- Quy đổi dùng trong cảnh mở là 350 ÷ 3,6 ≈ 97,22 mét mỗi giây.
