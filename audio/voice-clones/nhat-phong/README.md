# Nhật Phong · Bản clone local

`final6.mp4` có cùng SHA-256 với [bản r06 trong repo](../../../videos/2026-11-14-o-banh-mi-va-lam-phat/r06/final.mp4). Mẫu dài 6,70 giây được cắt từ [file lời dẫn riêng](../../../videos/2026-11-14-o-banh-mi-va-lam-phat/audio/01-to-bang-gia.mp3). Mốc cắt và checksum nằm trong [hồ sơ nguồn](nguon-mau.json).

- [Mẫu gốc](mau-goc.wav)
- [Mẫu đọc mới](mau-clone.wav), mono 48 kHz, 7,12 giây.
- [Preset VieNeu-TTS](voice-preset.json), ID `nhat-phong-local`.

Từ thư mục gốc của repo, dùng môi trường VieNeu đã tạo và preset đã lưu.

```powershell
$env:HF_HOME = Join-Path (Get-Location) '.cache/vieneu-models'
$env:HF_HUB_OFFLINE = '1'
& './.cache/vieneu-clone-venv/Scripts/python.exe' -X utf8 -B audio/voice-clones/nhat-phong/run.py --text 'Câu tiếng Việt cần đọc.' --output output/nhat-phong-moi.wav
```

Đã nạp lại preset bằng VieNeu-TTS 3.8.5 v3 Turbo trên CPU/ONNX và tạo thêm một câu với chế độ offline. Nhận dạng giọng nói trên mẫu nghe cho ra “đường dài” ở chỗ kịch bản ghi “đường ray”. Độ giống giọng cần đánh giá bằng nghe đối chiếu.
