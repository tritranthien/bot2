const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Thêm đoạn code này ở đầu file, trước khi khởi tạo bot Discord
app.get('/', (req, res) => {
  res.send('Bot đang hoạt động tốt!');
});

app.listen(PORT, () => {
  console.log(`🖥️ Server đang chạy trên port: ${PORT}`);
});
function keepAlive() {
  const url = process.env.APP_URL;
  fetch(url)
    .then(res => console.log(`✅ Ping thành công lúc: ${new Date().toISOString()}`))
    .catch(err => console.error(`❌ Ping thất bại: ${err}`));
}

setInterval(keepAlive, 12 * 60 * 1000);