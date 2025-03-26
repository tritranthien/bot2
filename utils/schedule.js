require('../utils/logger');

// Constant configurations
const SEND_HOURS = [8, 10, 12, 14, 16, 18];
const ONE_DAY_MS = 86400000;
const MESSAGES = {
    12: (config) => `<@${config.sonId}>, đã 12h trưa rồi, nghỉ tay đi ăn cơm  🍚🥢 rồi chích điện tiếp thôi! ⚡⚡`,
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
    const minutes = nowVN.getMinutes();

    let nextHour = SEND_HOURS.find(h => h > hours || (h === hours && minutes < 1));
    const nextDate = new Date(nowVN);
    
    if (!nextHour) {
        nextHour = SEND_HOURS[0]; // Nếu đã qua hết các giờ, chọn giờ đầu tiên ngày mai
        nextDate.setDate(nextDate.getDate() + 1);
    }

    nextDate.setHours(nextHour, 0, 0, 0);
    
    // Đảm bảo timeUntil luôn dương
    const timeUntil = Math.max(nextDate - nowVN, 1000);

    return { nextHour, timeUntil };
};

const scheduleNextMessage = (client, config) => {
    const nowVN = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    if ([0, 6].includes(nowVN.getDay())) {
        console.log("Hôm nay là cuối tuần, không gửi tin nhắn. 🎆🎆🎆");
        setTimeout(() => scheduleNextMessage(client, config), ONE_DAY_MS);
        return;
    }

    const { nextHour, timeUntil } = getNextScheduleTime();
    console.log(`⚡ Lần chích điện tiếp theo vào ${nextHour}:00 (${Math.round(timeUntil / 60000)} phút nữa 🤗)`);

    setTimeout(() => {
        const specialMessage = MESSAGES[nextHour]?.(config);
        if (specialMessage) {
            sendChannelMessage(client, config, specialMessage);
        }

        sendChannelMessage(client, config,
            `<@${config.sonId}>, đã tới thời gian chích điện định kỳ, đưa cổ đây, <${config.camGif}> "rẹt rẹt rẹt ...⚡⚡⚡"`);

        scheduleNextMessage(client, config);
    }, timeUntil);
};

module.exports = { scheduleNextMessage };
