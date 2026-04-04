# 📅 Workshift Management System

<p align="center">
  <b>Quản lý phân ca & đăng ký lịch làm việc đa nhóm</b><br/>
  <sub>Frontend React · Backend Node.js · Cơ sở dữ liệu MongoDB</sub>
</p>

<p align="center">
  <a href="#tech-stack">Tech stack</a> ·
  <a href="#architecture">Kiến trúc</a> ·
  <a href="#quick-start">Cài đặt</a> ·
  <a href="#docs">Tài liệu</a>
</p>

---

| | |
|:---|:---|
| **Phiên bản README** | 1.2 |
| **Cập nhật** | 2026-03 |
| **Monorepo** | `workshift-system` |

## 🏷️ Trạng thái & nhãn công nghệ

<p align="left">
  <img src="https://img.shields.io/badge/Status-Đang%20phát%20triển-success?style=for-the-badge" alt="Status"/>
  <img src="https://img.shields.io/badge/License-Nội%20bộ-lightgrey?style=for-the-badge" alt="License"/>
</p>

**Backend**

<p align="left">
  <img src="https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express"/>
  <img src="https://img.shields.io/badge/Mongoose-ODM-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="Mongoose"/>
  <img src="https://img.shields.io/badge/Zod-4.x-3E67B1?style=for-the-badge" alt="Zod"/>
  <img src="https://img.shields.io/badge/JWT-HMAC%20%28access%20%2B%20refresh%29-yellow?style=for-the-badge" alt="JWT"/>
</p>

**Frontend**

<p align="left">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/React_Router-6-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white" alt="React Router"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/fetch-API-0366D6?style=for-the-badge&logo=javascript&logoColor=white" alt="fetch"/>
</p>

**Cơ sở dữ liệu & công cụ**

<p align="left">
  <img src="https://img.shields.io/badge/MongoDB-Atlas%20%7C%20Local-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/npm-packages-CB3837?style=for-the-badge&logo=npm&logoColor=white" alt="npm"/>
</p>

---

## 📌 Giới thiệu

**Workshift Management System** phục vụ cửa hàng / chuỗi (F&B và tương tự) cần quản lý ca làm việc thời vụ theo nhiều **group** (quán). Một người dùng có thể thuộc nhiều group với vai trò khác nhau; dữ liệu nghiệp vụ được tách theo `groupId`.

- **API REST** thống nhất prefix **`/api/v1`** (client gọi qua `workshift-frontend/src/api/apiClient.js`).
- **Xác thực** JWT stateless (access + refresh, hai secret độc lập).
- **Hợp đồng JSON** (thành công / lỗi / phân trang) được mô tả trong rule parity trong repo.

---

## ✨ Phạm vi nghiệp vụ (tóm tắt)

| Nhóm | Ví dụ chức năng |
|------|------------------|
| 👔 **Quản lý / Manager** | Nhóm, vị trí, ca mẫu, ca làm việc, nhu cầu nhân sự, duyệt đăng ký, báo cáo, lương (theo spec) |
| 👷 **Nhân viên / Member** | Lịch rảnh, xem & đăng ký ca, lịch cá nhân, yêu cầu đổi ca (theo spec) |
| 🛡️ **Quản trị hệ thống** | Dashboard admin, người dùng/nhóm, metrics, audit (theo roadmap trong `docs/tasks.md`) |

Chi tiết mã nghiệp vụ **B01–B26**: xem **`docs/spec.md`** và **`docs/tasks.md`**.

---

<a id="tech-stack"></a>

## 🛠️ Công nghệ & Tech stack

| Lớp | Công nghệ |
|-----|-----------|
| Runtime | Node.js 20+ |
| Backend | Express 5, TypeScript, Mongoose, Zod, `jsonwebtoken`, `bcryptjs`, `helmet`, `cors` |
| Frontend | React 19, Vite 7, React Router 6, Tailwind CSS 3, gọi API bằng `fetch` |
| Database | MongoDB (local hoặc Atlas) |
| Dev backend | `ts-node-dev`, `typescript`, script `rotate-secrets` cho JWT |

---

<a id="architecture"></a>

## 🏗️ Kiến trúc repo

| Thành phần | Vị trí | Vai trò |
|------------|--------|---------|
| Backend (triển khai) | `workshift-backend/` | REST `/api/v1`, Express, TypeScript, Mongoose, JWT hai secret, Zod |
| Frontend | `workshift-frontend/` | SPA, `apiClient` + `features/**/*Api.js` |
| Tài liệu trên Git | `README.md`, `docs/tasks.md`, `docs/spec.md` | Hướng dẫn, roadmap, đặc tả B01–B26 |
| Tài liệu / rule chỉ local | `docs/internal/`, `.cursor/rules/` | Kế hoạch Cursor, handoff Java→Node, bảng parity API — **không push** (xem `.gitignore`) |
| Mã Java tham chiếu (local) | `workshift-backend-j/`, (tuỳ chọn) `workshift-frontend-j/` | Đối chiếu khi port; **không push** |

---

## 📁 Cấu trúc thư mục (rút gọn)

```
workshift-system/
├── workshift-backend/
│   ├── src/                 # app, routes, controllers, services, models, …
│   ├── scripts/             # rotate-jwt-secrets.cjs
│   ├── .env.example
│   └── package.json
├── workshift-frontend/
│   └── src/
│       ├── api/             # apiClient.js
│       └── features/        # *Api.js theo module
├── docs/
│   ├── tasks.md
│   └── spec.md
└── README.md
```

*(Tuỳ máy dev: `docs/internal/`, `.cursor/`, thư mục Java `*-j/` tham chiếu — **không** có trên remote, xem `.gitignore`.)*

---

<a id="quick-start"></a>

## 🚀 Cài đặt nhanh

### Yêu cầu

- Node.js **20+**
- **MongoDB** (local hoặc Atlas)

### Backend

```bash
cd workshift-backend
npm install
copy .env.example .env
```

Điền `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET` (hai secret **khác nhau**). Hoặc:

```bash
npm run rotate-secrets
```

```bash
npm run dev
```

- Mặc định **port 8080**
- Health: `GET /api/health`
- API: `GET/POST/...` dưới **`/api/v1`**

### Frontend

```bash
cd workshift-frontend
npm install
```

Tạo `.env`:

```properties
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

```bash
npm run dev
```

Trình duyệt thường: **http://localhost:5173** (Vite).

---

## ⚙️ Biến môi trường

### `workshift-backend/.env`

| Biến | Bắt buộc | Ý nghĩa |
|------|:--------:|---------|
| `MONGODB_URI` | ✓ | Chuỗi kết nối MongoDB |
| `JWT_SECRET` | ✓ | Ký / verify access token (HMAC) |
| `JWT_REFRESH_SECRET` | ✓ | Ký / verify refresh token — **khác** `JWT_SECRET` |
| `PORT` | | Cổng HTTP (mặc định `8080`) |
| `JWT_ISSUER` | | Issuer (mặc định `workshift-backend`) |
| `JWT_EXPIRES_IN_SECONDS` | | TTL access (giây) |
| `JWT_REFRESH_EXPIRES_IN_SECONDS` | | TTL refresh (giây) |

### `workshift-frontend/.env`

| Biến | Ý nghĩa |
|------|---------|
| `VITE_API_BASE_URL` | Base URL **đã gồm** suffix `/api/v1` |

---
## 🚀 Deploy Docker lên Render

Repo này có sẵn:
- `workshift-backend/Dockerfile` (build TypeScript -> `dist/`, chạy `npm start`)
- `workshift-frontend/Dockerfile` (build React/Vite -> `dist/`, serve bằng Nginx)
- `.github/workflows/deploy.yml` (build & push Docker image lên Docker Hub, sau đó kích hoạt Render qua webhook nếu bạn cấu hình)

### 1. Tạo Docker Hub repos
- Tạo ít nhất 2 repo: `workshift-backend` và `workshift-frontend` (tag sử dụng: `latest`).

### 2. Tạo Render Web Service (2 service)
#### Backend
- Runtime: Docker
- Image: `<DOCKERHUB_USERNAME>/workshift-backend:latest`
- Env (bắt buộc):
  - `PORT` = `8080`
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `JWT_REFRESH_SECRET`
- Env (khuyến nghị):
  - `CORS_ORIGINS="https://<frontend-domain>"` (hoặc `CORS_ORIGINS="*"` để mở rộng nhanh)
- Health: `GET /api/health`

#### Frontend
- Runtime: Docker
- Image: `<DOCKERHUB_USERNAME>/workshift-frontend:latest`
- Không cần env runtime (frontend đã được build sẵn base API).

### 3. Cấu hình GitHub Secrets cho workflow
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `VITE_API_BASE_URL` = `<backend-public-url>/api/v1` (không kèm trailing `/`)
- `RENDER_BACKEND_HOOK_URL` (optional) + `RENDER_FRONTEND_HOOK_URL` (optional)
  - Nếu có, workflow sẽ `POST {}` để Render rebuild service sau khi push image.

### 4. Deploy
- `git push` vào `main` hoặc `develop` để workflow chạy.

---

## 🔌 API (ví dụ)

| Method | Endpoint | Ghi chú |
|--------|----------|---------|
| `POST` | `/api/v1/auth/register` | Đăng ký |
| `POST` | `/api/v1/auth/login` | `usernameOrEmail`, `password` → `token`, `refreshToken`, `userId`, … |

Route đang mở: xem thư mục `workshift-backend/src/routes/`. Bảng parity chi tiết (nếu cần) có thể duy trì local trong **`.cursor/rules/workshift-node-express-parity.vi.mdc`** — không bắt buộc trên Git.

---

## 🧪 Kiểm thử

| Package | Lệnh | Ghi chú |
|---------|------|---------|
| `workshift-backend` | `npm test` | Placeholder — có thể bổ sung Jest/Vitest sau |

---

## 🤝 Git & đóng góp (gợi ý)

- Nhánh chính: `develop` · Feature: `feature/<tên>`
- Merge qua MR/PR, có review
- **Không** commit file `.env` chứa secret (đã có trong `.gitignore`)

---

## 🐛 Xử lý sự cố

| Hiện tượng | Hướng xử lý |
|------------|-------------|
| Không gọi được API | Backend đang chạy đúng `PORT`; `VITE_API_BASE_URL` = `http://host:port/api/v1`; CORS dev (`localhost:5173`) |
| 401 sau đổi secret | Đăng nhập lại (token cũ hết hiệu lực) |
| Lỗi kết nối DB | Kiểm tra `MONGODB_URI` và dịch vụ MongoDB |

---

<a id="docs"></a>

## 📚 Tài liệu

**Đồng bộ trên Git (mọi người clone đều có):**

| Tài liệu | Nội dung |
|----------|----------|
| `README.md` (file này) | Cài đặt, kiến trúc, ví dụ API, biến môi trường |
| `docs/tasks.md` | Roadmap theo giai đoạn, phân nhiệm vụ B01–B26 |
| `docs/spec.md` | Đặc tả nghiệp vụ, mô hình dữ liệu |

**Chỉ trên máy dev** (đã ignore, không push): thư mục **`docs/internal/`** (kế hoạch Cursor, handoff Java→Node, `ui-flows`), **`workshift-backend-j/`** (mã Spring tham chiếu), và **`.cursor/rules/`** (bảng route parity mở rộng). Dùng để Cursor đọc và chuyển đổi dần; khi thay đổi hành vi API cần thống nhất team, cập nhật **`docs/spec.md`** / **`README.md`** / **`docs/tasks.md`** rồi mới push.

---

## 📄 License

Dự án **nội bộ** — không phân phối lại khi chưa được phép.
