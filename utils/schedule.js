require('../utils/logger');

// Constant configurations
const SEND_HOURS = [8, 10, 12, 14, 16, 18];
const ONE_DAY_MS = 86400000;

const sendChannelMessage = (client, config, message) => {
    const channel = client.channels.cache.get(config.aiChannel);
    if (channel) {
        channel.send(message);
    } else {
        console.log('Không tìm thấy kênh. 🚫🚫🚫');
    }
};

const getNextScheduleTime = (now, hours) => {
    const nextHour = SEND_HOURS.find(h => h > hours) || SEND_HOURS[0];
    const nextDate = new Date(now);
    
    if (!SEND_HOURS.find(h => h > hours)) {
        nextDate.setDate(nextDate.getDate() + 1);
    }
    
    nextDate.setHours(nextHour, 0, 0, 0);
    return { nextHour, timeUntil: nextDate - Date.now() };
};

const scheduleNextMessage = (client, config) => {
    const now = new Date();
    const day = now.getDay();

    if (day === 0 || day === 6) {
        console.log("Hôm nay là cuối tuần, không gửi tin nhắn. 🎆🎆🎆");
        setTimeout(() => scheduleNextMessage(client, config), ONE_DAY_MS);
        return;
    }

    const { nextHour, timeUntil } = getNextScheduleTime(now, now.getHours());
    console.log(`⚡ Lần chích điện tiếp theo vào ${nextHour}:00 (${Math.round(timeUntil / 60000)} phút nữa 🤗)`);

    setTimeout(() => {
        const messages = {
            12: `<@${config.sonId}>, đã 12h trưa rồi, nghỉ tay đi ăn cơm  🍚🥢 rồi chích điện tiếp thôi! ⚡⚡`,
            14: `<@${config.sonId}>, 2h chiều rồi, có đặt nước không? 🧃🚰`,
            18: '6h chiều, coookkkkkkkkkk 🏡🏡🏡 🍳🍲🍜'
        };

        if (messages[nextHour]) {
            sendChannelMessage(client, config, messages[nextHour]);
        }

        sendChannelMessage(client, config,
            `<@${config.sonId}>, đã tới thời gian chích điện định kỳ, đưa cổ đây, <${config.camGif}> "rẹt rẹt rẹt ...⚡⚡⚡"`);
        
        scheduleNextMessage(client, config);
    }, timeUntil);
};

module.exports = { scheduleNextMessage };
