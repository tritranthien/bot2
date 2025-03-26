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
    <h1 style="color: green; text-align: center;">Bot đang hoạt động tốt!</h1>
    <div style="text-align: center; font-size: 18px;">
        <label for="channelID">Nhập ID kênh:</label>
        <input type="text" id="channelID" placeholder="Nhập ID kênh spam-bot" 
            style="padding: 8px; margin: 5px; border-radius: 5px; border: 1px solid #ccc;">
        <button style="padding: 8px 12px; background-color: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Lưu
        </button>
    </div>
    <p style="text-align: center; font-size: 16px; margin-top: 10px;">
        <strong>ID kênh hiện tại:</strong> <span style="color: blue;">${currentChannelId || "Chưa có ID nào được lưu"}</span>
    </p>
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