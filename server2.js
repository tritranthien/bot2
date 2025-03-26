const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

let db, getChannelId, saveChannelId;
if (process.env.APP_ENV === 'local') {
  ({ db, getChannelId, saveChannelId } = require("./utils/sddatabase3"));
} else {
  ({ db, getChannelId, saveChannelId } = require("./utils/database"));
}

app.use(express.json()); // Đọc dữ liệu JSON từ request body
app.use(express.urlencoded({ extended: true })); // Đọc dữ liệu từ form

// Giao diện nhập ID
app.get('/', async (req, res) => {
  const currentChannelId = await getChannelId(); // Lấy ID kênh từ DB
  res.send(`
      <h1>Bot đang hoạt động tốt!</h1>
      <h2>Nhập ID kênh</h2>
      <form action="/save" method="POST">
          <input type="text" name="channelID" placeholder="Nhập ID kênh spam-bot" required>
          <button type="submit">Lưu</button>
      </form>
      <h3>ID kênh hiện tại: ${currentChannelId || "Chưa có ID nào được lưu"}</h3>
  `);
});

// Xử lý lưu ID vào DB
app.post('/save', async (req, res) => {
  const { channelID } = req.body ?? {};
  if (!channelID) return res.send('❌ Vui lòng nhập ID hợp lệ!');

  saveChannelId(channelID);
  res.send(`✅ Đã lưu ID kênh: ${channelID}`);
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