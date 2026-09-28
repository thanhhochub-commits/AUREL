# AUREL — GitHub Pages + Python Backend

## Kiến trúc

- Frontend: GitHub Pages — `https://thanhhochub-commits.github.io/AUREL/`
- Backend: Python `server.py` từ đúng Code Colab gốc.
- CORS chỉ cho phép frontend GitHub Pages gọi API theo mặc định.
- PDF/OCR/DATA16/Gemini vẫn chạy ở backend Python, không bị chuyển thành dữ liệu giả.

## Deploy backend

Repository đã có `render.yaml` và `Dockerfile`.

1. Vào Render.
2. New → Blueprint.
3. Kết nối repository `thanhhochub-commits/AUREL`.
4. Deploy.
5. Service mặc định có tên `aurel-thanhhochub-backend`.

Frontend đang dùng mặc định:

`https://aurel-thanhhochub-backend.onrender.com/`

Nếu Render cấp URL khác, mở website GitHub Pages với tham số:

`https://thanhhochub-commits.github.io/AUREL/?api=https://URL-BACKEND-CUA-BAN.onrender.com/`

AUREL sẽ lưu URL backend trong trình duyệt.

## Gemini

Trên Render → Environment, thêm `GEMINI_API_KEY` nếu muốn dùng Gemini mà không nhập khóa mỗi phiên.

## Gmail

Tùy chọn:
- `AUREL_GMAIL_USER`
- `AUREL_GMAIL_APP_PASSWORD`

Không commit khóa bí mật vào GitHub.

## Lưu ý về dữ liệu

Backend gốc là single-user/in-memory. Dữ liệu sẽ mất khi backend restart/redeploy và không phù hợp để nhiều người dùng công khai cùng lúc với dữ liệu nhạy cảm.
