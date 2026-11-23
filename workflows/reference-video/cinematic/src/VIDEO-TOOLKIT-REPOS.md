# Kho công cụ nguồn mở cho sản xuất video (18 repos)

Đọc tệp này trước khi thiết kế, lập kế hoạch, cắt ghép, dựng hình, xử lý âm thanh, tạo phụ đề hoặc xuất bất kỳ video mới nào trong dự án. Chọn đúng công cụ theo từng công đoạn thay vì viết lại từ đầu những gì các công cụ này đã xử lý tốt.

Luồng tổng thể: `Nguồn / Stream -> Bắt khoảnh khắc -> Cắt cảnh & transcript -> Khung hình dọc & bám chủ thể -> Xử lý âm thanh & phụ đề -> Dựng / Xuất bản`.

## Danh sách 18 repository

| # | Công cụ | Vai trò chính | Giai đoạn | Repository |
| --- | --- | --- | --- | --- |
| 01 | `yt-dlp` | Tải video/audio nguồn từ nhiều nền tảng | Thu thập nguồn | https://github.com/yt-dlp/yt-dlp |
| 02 | `OpenCut` | Biên tập clip trên timeline | Dựng & cắt ghép | https://github.com/OpenCut-app/OpenCut |
| 03 | `OpenCV` | Xây dựng logic crop, xử lý khung hình và bám đối tượng | Reframe & tracking | https://github.com/opencv/opencv |
| 04 | `OBS Studio` | Ghi hình gameplay, màn hình và webcam reaction | Thu thập nguồn | https://github.com/obsproject/obs-studio |
| 05 | `Clipper` | Biến highlight từ stream thành clip dọc (Reels/TikTok/Shorts) | Highlight & cắt dọc | https://github.com/guleriaakshit/clipper |
| 06 | `Hypeline` | Tìm khoảnh khắc cao trào dựa trên chat Twitch | Tìm khoảnh khắc | https://github.com/Angel-Casas/Hypeline |
| 07 | `AutoCut` | Cắt video trực tiếp bằng cách sửa transcript | Cắt theo lời nói | https://github.com/mli/autocut |
| 08 | `TransNet V2` | Phát hiện điểm cắt và chuyển cảnh tự động | Phân tích cảnh | https://github.com/soCzech/TransNetV2 |
| 09 | `Ultralytics YOLO` | Phát hiện người và vật thể để reframe thông minh | Reframe & tracking | https://github.com/ultralytics/ultralytics |
| 10 | `ByteTrack` | Theo dõi liên tục chủ thể xuyên suốt các khung hình | Reframe & tracking | https://github.com/FoundationVision/ByteTrack |
| 11 | `sherpa-onnx` | Nhận dạng giọng nói (ASR) chạy offline | Speech-to-text | https://github.com/k2-fsa/sherpa-onnx |
| 12 | `Captacity` | Tạo phụ đề động tự động cho video ngắn (Shorts/Reels) | Phụ đề | https://github.com/unconv/captacity |
| 13 | `VideoLingo` | Dịch, chia dòng và căn chỉnh phụ đề | Phụ đề & dịch thuật | https://github.com/Huanshere/VideoLingo |
| 14 | `RNNoise` | Lọc tạp âm nền cho micro | Xử lý âm thanh | https://github.com/xiph/rnnoise |
| 15 | `Pedalboard` | Nén (compress), EQ và limiter cho âm thanh bằng Python | Xử lý âm thanh | https://github.com/spotify/pedalboard |
| 16 | `Revideo` | Xây dựng mẫu dựng video tái sử dụng bằng TypeScript | Dựng video bằng code | https://github.com/midrender/revideo |
| 17 | `VidGear` | Thu nhận và xử lý luồng video bằng Python | Xử lý video Python | https://github.com/abhiTronix/vidgear |
| 18 | `HandBrake` | Nén và chuyển mã clip để xuất bản | Xuất bản & nén | https://github.com/HandBrake/HandBrake |

## Cách áp dụng trước mỗi tác vụ video

1. **Thu thập nguồn và ghi hình**: dùng `yt-dlp` cho nguồn trực tuyến (tôn trọng bản quyền/nguồn hợp lệ) và `OBS Studio` cho ghi màn hình, gameplay hoặc reaction.
2. **Tìm đoạn đắt và phân cảnh**: dùng `Hypeline` cho nguồn có chat stream, `TransNet V2` để tách shot/cắt cảnh tự động, `AutoCut` để bỏ đoạn thừa theo transcript, `Clipper` khi chuyển highlight thành clip dọc.
3. **Reframe 16:9 sang 9:16 và bám chủ thể**: kết hợp `Ultralytics YOLO` (nhận diện) + `ByteTrack` (theo dõi mượt xuyên khung hình) + `OpenCV` hoặc `VidGear` (crop/xử lý luồng).
4. **Giọng nói, âm thanh và phụ đề**: dùng `RNNoise` lọc nhiễu micro, `Pedalboard` xử lý EQ/compression/limiter, `sherpa-onnx` tách lời offline, `Captacity` cho phụ đề dọc kiểu Shorts, `VideoLingo` khi cần dịch và căn dòng phụ đề.
5. **Dựng và xuất bản**: chọn giữa Remotion (mặc định của các nhánh explainer hiện có trong `cinematic/`), `Revideo` (dựng bằng TypeScript tái sử dụng), hoặc `OpenCut` (timeline editor); dùng `HandBrake` khi cần nén tối ưu cho phát hành.
6. **Kiểm tra trước khi tích hợp**: trước khi cài hoặc dùng một repo trong danh sách cho batch mới, kiểm tra giấy phép, yêu cầu môi trường máy local và giữ nguyên các nhánh/quy trình đã ổn định trừ khi người dùng yêu cầu thay đổi.
