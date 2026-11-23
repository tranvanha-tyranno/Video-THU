# Dựng hình cho video tài liệu và giải thích

Trước khi bắt đầu bất kỳ công đoạn tải nguồn, cắt ghép, reframe, âm thanh, phụ đề hay xuất bản nào, đọc trước [kho 18 repo công cụ video](VIDEO-TOOLKIT-REPOS.md).

Áp dụng mặc định cho các video tài liệu và giải thích mới của dự án. Lấy bản Tần Thủy Hoàng làm mẫu phối ảnh tư liệu với bản đồ và mặt cắt. Lấy bản tàu cao tốc làm mẫu mô phỏng kỹ thuật và canh thao tác theo lời. Kịch bản lăng mộ đã nhận phản hồi cần sửa nội dung.

## Duyệt nội dung trước khi dựng

1. Chọn một câu hỏi dẫn dắt cả tập. Viết câu trả lời dự kiến, rồi sắp các chương theo thứ tự người xem cần biết.
2. Liệt kê từng nhận định, nguồn mở được, dòng hoặc mục cần dò và giới hạn của bằng chứng. Ưu tiên báo cáo khảo cổ, cơ quan quản lý di tích, văn bản gốc và công trình nghiên cứu. Dùng bảng này khi người dùng muốn dò nội dung.
3. Gắn từng ý chính với thứ người xem sẽ thấy và hành động xảy ra khi lời đọc nhắc đến. Ghi rõ đoạn nào quay tư liệu, đoạn nào dùng mô phỏng và đoạn nào trình bày sử liệu. Với nội dung lịch sử, dùng cách nói như “Sử ký ghi”, “nhóm nghiên cứu đo được” và “mô phỏng vị trí” ngay tại ý tương ứng.
4. Dùng cấu trúc câu hỏi mở đầu, giới hạn tư liệu ngắn khi cần, bằng chứng theo từng chương, câu trả lời cuối và lời mời tương tác phù hợp. Một chương cần trả lời được câu hỏi của nó trước khi chuyển sang chương sau.

| Ý người xem cần kiểm tra | Nguồn và mục cần dò | Hình và hành động khớp lời | Phạm vi của bằng chứng |
| --- | --- | --- | --- |
| Gò lăng và hố binh mã là hai vị trí trong cùng quần thể | Hai điểm 441-001 và 441-002 trong [bản đồ UNESCO](https://whc.unesco.org/en/list/441/maps/) | Phóng từ Tây An tới khu lăng. Làm nổi từng điểm khi đọc tên | Đường bộ hiện đại hỗ trợ định vị. Điểm hố binh mã đại diện cho cụm hố |

Đọc thêm [quy trình nội dung của repo](../../CONTENT_FIRST.md) và [dàn ý kiểm chứng tập lăng Tần Thủy Hoàng](../../../../videos/2026-11-22-lang-tan-thuy-hoang/de-cuong-doi-chieu.md).

## Chọn loại hình theo từng ý

- **Ảnh và footage thật.** Dùng để cho thấy địa điểm, hiện vật hoặc thao tác đã được ghi lại. Xem ảnh ở đúng mức cắt dùng trong video. Lưu tác giả, trang nguồn, giấy phép và ghi công trên khung phù hợp. Chi tiết đang được nhắc tới cần hiện rõ.
- **Bản đồ động.** Bắt đầu bằng địa danh người xem nhận ra rồi phóng vào vùng cần giải thích. Giữ đường bộ, đường lân cận, hướng bắc và mốc địa phương khi chúng giúp người xem định vị. Dùng lớp riêng cho tuyến di chuyển, đường nối định vị và ranh giới. Chỉ gọi là tuyến hoặc ranh giới thực khi có hình học từ nguồn.
- **Mô phỏng kỹ thuật và mặt cắt.** Cho thấy vật thể, mốc cố định và sự thay đổi giữa các trạng thái. Dùng góc nhìn xiên để đọc chiều sâu, rồi chuyển sang mặt cắt hoặc góc nhìn gần khi cần thấy cấu tạo. Hiện nhãn “Mô phỏng” hoặc “Mặt cắt minh họa” cùng giới hạn về tỷ lệ, độ sâu hay chi tiết chưa xác minh khi thích hợp.
- **Biểu đồ và chữ.** Hiện số khi lời đọc nhắc tới, kèm đơn vị, phạm vi và nguồn. Giữ chữ đủ lâu để đọc. Mỗi cảnh có một điểm nhìn chính.

## Canh hình với lời đọc

Thu từng đoạn bằng giọng đã chọn cho dự án. Dùng thời lượng của bản thu đã xử lý tốc độ và đặt mốc theo cụm từ cho các hành động diễn ra bên trong đoạn. Ví dụ, khi lời đọc nói “hạ dầm”, dầm mới đi xuống. Khi lời đọc gọi tên một địa điểm, dấu trên bản đồ sáng đúng lúc đó. Đặt hiệu ứng âm thanh theo điểm chạm hoặc chuyển trạng thái có thể nhìn thấy.

Xem các đoạn chuyển động đại diện ở đầu, giữa và cuối trước khi xuất dài. So lời, hình và âm thanh ngay trước, tại và sau các mốc quan trọng. Kiểm tra khung xuất thật để phát hiện nhãn đè lên vật thể, hành động sai chiều hoặc sai pha. Dùng phép kiểm tra thời lượng, giải mã và âm thanh cho bản xuất cuối.

## Mã mẫu đang có trong src

| Mục đích | Mã để tham khảo |
| --- | --- |
| Phối ảnh có ghi công, dòng thời gian, bản đồ và mặt cắt di tích | [qin-entry.tsx](qin-entry.tsx), [qin-models.tsx](qin-models.tsx) |
| Đường bộ, mốc địa danh, tuyến ray và chuyển động theo vị trí | [road-map.tsx](china-rail/road-map.tsx) |
| Hình khối chiếu phối cảnh, mô phỏng cầu cạn, hầm và thao tác hạ dầm | [engineering.tsx](china-rail/engineering.tsx), [engineering-mesh.ts](china-rail/engineering-mesh.ts) |
| Tổ chức cảnh theo mốc nói chính xác | [documentary-entry.tsx](china-rail/documentary-entry.tsx), [action-cues.json](../../../../videos/2026-11-22-tau-cao-toc-trung-quoc/r07-synced/action-cues.json) |
