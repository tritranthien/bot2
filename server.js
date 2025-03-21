const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Thêm đoạn code này ở đầu file, trước khi khởi tạo bot Discord
app.get('/', (req, res) => {
  res.send('Bot đang hoạt động!');
});

app.listen(PORT, () => {
  console.log(`Server đang chạy trên port ${PORT}`);
});