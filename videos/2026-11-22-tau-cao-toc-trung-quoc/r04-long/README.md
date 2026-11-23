# Tàu cao tốc Trung Quốc · Bản 5 phút

Bản dựng 1920 × 1080, 24 fps. Lời dẫn dùng preset Nhật Phong local của project, tổng hợp bằng VieNeu-TTS trên CPU và điều chỉnh nhịp bằng FFmpeg để khớp thời lượng 5 phút.

## Bản đồ và hình ảnh

- Bản đồ vệ tinh định vị Bắc Kinh và Thiên Tân, rồi đi vào từng ga, hướng đông nam, vịnh Bột Hải, mũi tên Bắc và thước tỷ lệ khoảng 20 km. Đường vàng biểu diễn hướng tuyến khái quát qua các ga. [Hồ sơ nền bản đồ](../r02-map/map-sources.json)
- Chiều dài 116,55 km và tốc độ thiết kế 350 km/h lấy từ hồ sơ dự án. Phép tính gần 20 phút giả định tàu giữ nguyên tốc độ suốt tuyến. [Cục Đường sắt Quốc gia Trung Quốc](https://www.nra.gov.cn/ztzl/hy/kjcx/kjxm/201605/t20160526_198454.shtml)
- Bán kính cong, hệ thống tín hiệu và cách tổ chức thi công tham khảo các chương 4–5. Đồ thị tốc độ, đường hầm, buồng lái và lắp dầm đều là minh họa. [World Bank, China’s High-Speed Rail Development](https://documents.worldbank.org/curated/en/933411559841476316/pdf/Chinas-High-Speed-Rail-Development.pdf)
- Cảnh mở dùng ảnh tàu CR400AF tại Thượng Hải của MNXANL, có cắt khung và phủ chữ. [Ảnh gốc](https://commons.wikimedia.org/wiki/File:201806_CR400AF-2016_operates_as_G6_Departs_from_Shanghai_Station.jpg) · [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

## Âm thanh

Thư viện có 18 bản HQ MP3 preview từ Freesound, mỗi bản có giấy phép CC0, đường dẫn và SHA-256. Tiếng tàu và sân ga là âm minh họa. Bản phối dùng lời dẫn và hiệu ứng theo cảnh. [Nguồn âm](sfx/download-receipts.json) · [Mốc hiệu ứng](cues.json)

## Dựng lại

Từ repo, dùng môi trường VieNeu đã cài để chạy `voice.py` với preset và cache model local. Chạy theo thứ tự `python assemble.py`, `./render.ps1` và `python finalize.py` từ thư mục bản dựng. [Kịch bản](script.json) · [Mốc chương](timing.json) · [Kiểm tra bản xuất](qa.json)
