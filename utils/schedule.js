require('../utils/logger');
if (process.env.APP_ENV == 'local') {
    const { db, getChannelId } = require("./sddatabase3");
} else {
    const { db, getChannelId } = require("./database");
}

// Danh sách giờ gửi tin nhắn
const SEND_HOURS = [8, 10, 12, 14, 16, 18];

const MESSAGES = {
    12: (config) => `<@${config.sonId}>, đã 12h trưa rồi, nghỉ tay đi ăn cơm 🍚🥢 rồi chích điện tiếp thôi! ⚡⚡`,
    14: (config) => `<@${config.sonId}>, 2h chiều rồi, có đặt nước không? 🧃🚰`,
    18: () => '⏱️ Bây giờ là 6h chiều, coookkkkkkkkkk 🏡🏡🏡 🍳🍲🍜'
};

const sendChannelMessage = (client, config, message) => {
    getChannelId()
        .then((channelId) => {
            const channel = channelId
                ? client.channels.cache.get(channelId) // Lấy từ DB
                : client.channels.cache.get(config.aiChannel); // Dùng fallback
            if (channel) {
                channel.send(message);
            } else {
                console.log("Không tìm thấy kênh. 🚫🚫🚫");
            }
        })
        .catch((error) => console.error("Lỗi khi lấy Channel ID:", error));
};

const getNextScheduleTime = () => {
    const nowVN = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const hours = nowVN.getHours();

    let nextHour = SEND_HOURS.find(h => h > hours);

    const nextDate = new Date(nowVN);

    if (!nextHour) {
        nextHour = SEND_HOURS[0]; // Chuyển sang ngày mai nếu đã hết giờ
        nextDate.setDate(nextDate.getDate() + 1);
    }

    nextDate.setHours(nextHour, 0, 0, 0);

    let timeUntil = nextDate - nowVN;

    if (timeUntil < 60000) {
        timeUntil = 60000; // Đặt tối thiểu là 1 phút
    }

    console.log(`🕒 Thời gian hiện tại: ${nowVN}`);

    return { nextHour, timeUntil };
};

const scheduleNextMessage = (client, config) => {
    const nowVN = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const dayOfWeek = nowVN.getDay(); // 0 là Chủ Nhật, 6 là Thứ Bảy

    if (dayOfWeek === 0 || dayOfWeek === 6) {
        console.log('😴 Hôm nay là Thứ Bảy hoặc Chủ Nhật, không lên lịch gửi tin nhắn.');
        return;
    }

    const { nextHour, timeUntil } = getNextScheduleTime();
    console.log(`⚡ tiếp theo vào ${nextHour}:00 (${Math.round(timeUntil / 60000)} phút nữa 🤗)`);
    setTimeout(() => {
        console.log(`📢 Đang gửi tin nhắn cho ${nextHour}:00`);
        const specialMessage = MESSAGES[nextHour]?.(config);
        if (specialMessage) {
            sendChannelMessage(client, config, specialMessage);
        } else if (SEND_HOURS.includes(nextHour)) {
            sendChannelMessage(client, config,
                `<@${config.sonId}>, đã tới thời gian chích điện định kỳ, đưa cổ đây, <${config.camGif}> "rẹt rẹt rẹt ...⚡⚡⚡"`);
        }

        console.log(`✅ Tin nhắn cho ${nextHour}:00 đã được gửi thành công!`);
        console.log(`⏳ Đang lên lịch cho lần gửi tiếp theo...`);

        scheduleNextMessage(client, config);
    }, timeUntil);
};

module.exports = { scheduleNextMessage };