# PBL3 - UniStay Da Nang 🏡🎓

Chào mừng bạn đến với **UniStay Da Nang**! Đây là một nền tảng tìm kiếm, cho thuê chỗ ở và tìm bạn ở ghép dành riêng cho sinh viên tại khu vực Đà Nẵng, giúp kết nối sinh viên với các chủ trọ uy tín một cách nhanh chóng, an toàn và tiện lợi.

## 🌟 Tính năng nổi bật

- **Phân quyền đa dạng**: Hỗ trợ nhiều vai trò bao gồm Admin, Student (Sinh viên), Host (Chủ trọ) và User.
- **Tìm kiếm thông minh & Bản đồ**: Tích hợp bản đồ trực quan giúp sinh viên tìm kiếm phòng trọ, căn hộ, nhà nguyên căn xung quanh các trường đại học tại Đà Nẵng.
- **Tìm bạn ở ghép (Roommate)**: Đăng tin và lọc tìm bạn ở ghép dựa trên các tiêu chí (giới tính, thói quen, mức giá, ưu tiên tiện ích...).
- **Quản lý & Đánh giá**: Cho phép sinh viên gửi yêu cầu thuê phòng, đánh giá (Rating) chủ trọ, bình luận tin đăng, và tính năng báo cáo (Report) vi phạm.
- **Tích hợp AI**: Ứng dụng Google Generative AI (Gemini) giúp phân tích, gợi ý hoặc hỗ trợ quản trị nội dung.
- **Hệ thống thời gian thực & Xử lý nền**: Sử dụng BullMQ & Redis để xử lý các tác vụ nền như gửi email, thông báo...

## 🚀 Công nghệ sử dụng

Dự án được xây dựng theo mô hình **Monorepo** phân chia rõ ràng giữa Frontend và Backend, sử dụng các công nghệ hiện đại nhất:

### Frontend

- **Framework/Library**: React 19, Vite, TypeScript
- **UI/Styling**: Tailwind CSS, Shadcn UI (Radix), Framer Motion, Ant Design
- **State Management & Fetching**: Zustand, React Query (@tanstack/react-query), Axios
- **Khác**: Leaflet (Bản đồ), i18next (Đa ngôn ngữ), React Hook Form & Zod, Jest (Testing)

### Backend

- **Core**: Node.js, Express.js, TypeScript
- **Database & ORM**: PostgreSQL, Prisma ORM
- **Authentication**: JWT, Bcrypt
- **Queue & AI**: BullMQ (với Redis), Google Generative AI
- **Khác**: Nodemailer (Gửi mail), Joi (Validation), Helmet & Cors

### DevOps & Tools

- Docker & Docker Compose
- GitHub Actions (CI/CD)
- Husky, ESLint, Prettier, Lint-staged

## 📁 Cấu trúc thư mục

```text
PBL3-UniStay-Da-Nang/
├── backend/       # Chứa mã nguồn API Server (Express + Prisma)
├── frontend/      # Chứa mã nguồn Client (React + Vite)
├── .github/       # CI/CD Workflows tự động triển khai Frontend & Backend
└── README.md      # Tài liệu giới thiệu dự án
```

## 🛠 Hướng dẫn cài đặt và chạy dự án (Local)

### Yêu cầu hệ thống

- **Node.js** (Phiên bản 18+ trở lên)
- **Docker & Docker Compose** (Để chạy Database & Redis cục bộ)
- **Git**

### 1. Khởi chạy Backend

Mở terminal và đi tới thư mục `backend`:

```bash
cd backend
```

- Copy file environment và cài đặt các gói phụ thuộc:

```bash
cp .env.example .env
npm install
```

- Khởi động cơ sở dữ liệu (PostgreSQL & Redis) qua Docker:

```bash
docker-compose up -d
```

_(Lưu ý: Nếu có cấu hình `docker-compose.yml` riêng để chạy db và redis, sử dụng cấu hình đó, ví dụ: `docker compose up -d db redis`)_

- Chạy Migration và khởi tạo dữ liệu mẫu (Seed):

```bash
npx prisma migrate deploy
npm run seed:local
```

- Khởi chạy server development:

```bash
npm run dev
```

### 2. Khởi chạy Frontend

Mở một terminal khác và đi tới thư mục `frontend`:

```bash
cd frontend
```

- Copy file environment và cài đặt các gói phụ thuộc:

```bash
cp .env.example .env
npm install  # hoặc yarn install / pnpm install
```

- Khởi chạy ứng dụng:

```bash
npm run dev
```

Giao diện frontend sẽ chạy tại cổng mặc định của Vite (thường là `http://localhost:5173`).

---

## 🔑 Tài khoản Test nội bộ (Seeded Data)

Hệ thống cung cấp sẵn các tài khoản sau sau khi chạy lệnh `npm run seed:local`:

- **Sinh viên**: `student.test@unistay.local` / Mật khẩu: `Test@123456`
- **Chủ trọ**: `host.test@unistay.local` / Mật khẩu: `Test@123456`
- **Quản trị viên**: `admin.test@unistay.local` / Mật khẩu: `Test@123456`

## 🤝 Đóng góp (Contributing)

Chúng tôi hoan nghênh mọi đóng góp để hoàn thiện UniStay Da Nang. Vui lòng tạo các Issue hoặc Pull Request trên repository để thảo luận về những tính năng hoặc bản sửa lỗi mà bạn muốn thực hiện.

> _Được phát triển với ❤️ cho cộng đồng sinh viên Đà Nẵng!_
