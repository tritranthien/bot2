# 🤖 Discord Bot

## 📌 Giới thiệu
Đây là một bot Discord được xây dựng bằng **discord.js**, sử dụng **Node.js** và có thể tích hợp với **AI**. Bot hỗ trợ các tính năng như xử lý lệnh, kết nối cơ sở dữ liệu, và các tiện ích khác (**Chích điện**).

## 🛠 Công nghệ sử dụng
- [Node.js](https://nodejs.org/) – Môi trường chạy JavaScript
- [discord.js](https://discord.js.org/) – Thư viện tương tác với Discord API
- [dotenv](https://www.npmjs.com/package/dotenv) – Quản lý biến môi trường
- [express](https://expressjs.com/) – Server web (nếu cần)
- [sqlite3](https://www.npmjs.com/package/sqlite3) – Lưu trữ dữ liệu cục bộ
- [pg](https://www.npmjs.com/package/pg) – PostgreSQL (nếu dùng cơ sở dữ liệu cloud)

## 📦 Cài đặt
### 1️⃣ Clone repo
```sh
git clone https://github.com/tritranthien/bot2.git
cd bot2
```
### 2️⃣ Cài đặt dependencies
```sh
npm install
```

### 3️⃣ Cấu hình môi trường
Tạo file `.env` và thêm thông tin cần thiết:
```env
AI_API_KEY=your-ai-api-key
DISCORD_TOKEN=your-bot-token
DATABASE_URL=your-database-url
```
🚨 **Lưu ý:** Không chia sẻ token công khai! Hãy đảm bảo `.env` có trong `.gitignore`.

### 4️⃣ Chạy bot
Chạy bot ở chế độ development (tự động reload khi thay đổi code):
```sh
npm run dev
```
Hoặc chạy ở chế độ production:
```sh
npm start
```

## 🚀 Tính năng chính
- 🤖 Tương tác với Discord bằng lệnh
- 🛠 Kết nối cơ sở dữ liệu
- 🔥 Hỗ trợ AI
- ⚡ Chích điện


