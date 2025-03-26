require('../utils/logger');

// Danh sách giờ gửi tin nhắn
const SEND_HOURS = [8, 10, 12, 14, 16, 18];
const ONE_DAY_MS = 86400000;

const MESSAGES = {
    12: (config) => `<@${config.sonId}>, đã 12h trưa rồi, nghỉ tay đi ăn cơm 🍚🥢 rồi chích điện tiếp thôi! ⚡⚡`,
    14: (config) => `<@${config.sonId}>, 2h chiều rồi, có đặt nước không? 🧃🚰`,
    18: () => '⏱️ Bây giờ là 6h chiều, coookkkkkkkkkk 🏡🏡🏡 🍳🍲🍜'
};

const sendChannelMessage = (client, config, message) => {
    const channel = client.channels.cache.get(config.aiChannel);
    channel?.send(message) || console.log('Không tìm thấy kênh. 🚫🚫🚫');
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
    console.log(`📌 Giờ tiếp theo được chọn: ${nextHour}, sẽ gửi sau ${Math.round(timeUntil / 60000)} phút`);

    return { nextHour, timeUntil };
};

const scheduleNextMessage = (client, config) => {
    const { nextHour, timeUntil } = getNextScheduleTime();
    console.log(`⚡ tiếp theo vào ${nextHour}:00 (${Math.round(timeUntil / 60000)} phút nữa 🤗)`);
    setTimeout(() => {
        console.log(`📢 Đang gửi tin nhắn cho ${nextHour}:00`);
        const specialMessage = MESSAGES[nextHour]?.(config);
        if (specialMessage) {
            sendChannelMessage(client, config, specialMessage);
        }

        sendChannelMessage(client, config,
            `<@${config.sonId}>, đã tới thời gian chích điện định kỳ, đưa cổ đây, <${config.camGif}> "rẹt rẹt rẹt ...⚡⚡⚡"`);
        
        console.log(`✅ Tin nhắn cho ${nextHour}:00 đã được gửi thành công!`);
        console.log(`⏳ Đang lên lịch cho lần gửi tiếp theo...`);
        
        scheduleNextMessage(client, config);
    }, timeUntil);
};

module.exports = { scheduleNextMessage };
