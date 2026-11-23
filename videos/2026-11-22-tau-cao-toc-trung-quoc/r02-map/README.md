# Bản đồ Bắc Kinh–Thiên Tân

Cảnh mới bắt đầu ở 0:17. Bản đồ đi từ toàn cảnh Trung Quốc vào khu vực
Bắc Kinh–Thiên Tân, đánh dấu ga Bắc Kinh Nam, Vũ Thanh và Thiên Tân.
Đường vàng minh họa hướng tuyến qua các ga. Nền địa hình và đường bờ
lấy từ ảnh Blue Marble của NASA. [NASA Worldview](https://worldview.earthdata.nasa.gov/?l=BlueMarble_ShadedRelief_Bathymetry)

Tọa độ ga và nguồn địa lý được ghi trong `map-sources.json`. Tuyến vẽ
theo vị trí các ga và đã được giản lược để đọc dễ hơn.
[Bắc Kinh Nam](https://en.wikipedia.org/wiki/Beijing_South_railway_station)
· [Vũ Thanh](https://www.openstreetmap.org/node/6712308732)
· [Thiên Tân](https://en.wikipedia.org/wiki/Tianjin_railway_station)

Dùng `python make_maps.py` để tải và ghép ảnh, `./render.ps1` để dựng
cảnh bản đồ và `python splice.py` để xuất toàn video. Tệp `qa.json` lưu
mốc cảnh, số khung hình và checksum của track âm thanh.
