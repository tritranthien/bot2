const logger = require('../utils/logger');

const scheduleNextMessage = (client, config) => {
    const now = new Date();
    const day = now.getDay(); // 0 = Chủ Nhật, 6 = Thứ Bảy
    const hours = now.getHours();

    if (day === 0 || day === 6) {
        logger.log("Hôm nay là cuối tuần, không gửi tin nhắn.");
        setTimeout(() => scheduleNextMessage(client, config), 86400000); // Chờ đến ngày mai
        return;
    }

    // Danh sách giờ cần gửi tin nhắn
    const sendHours = [8, 10, 12, 14, 16, 18];

    let nextHour = sendHours.find(h => h > hours);
    
    if (nextHour === undefined) {
        nextHour = sendHours[0];
        now.setDate(now.getDate() + 1);
    }

    now.setHours(nextHour, 0, 0, 0);
    const timeUntilNextMessage = now - Date.now();

    logger.log(`Lần gửi tin tiếp theo vào ${nextHour}:00 (${Math.round(timeUntilNextMessage / 60000)} phút nữa)`);

    setTimeout(() => {
        sendScheduledMessage(client, config);
        scheduleNextMessage(client, config);
    }, timeUntilNextMessage);
};

const sendScheduledMessage = (client, config) => {
    const channel = client.channels.cache.get(config.aiChannel);
    if (channel) {
        channel.send(`<@${config.sonId}>, đã tới thời gian chích điện định kỳ, đưa cổ đây, <${config.camGif}> "rẹt rẹt rẹt ....."`);
    } else {
        logger.log('Không tìm thấy kênh.');
    }
};

module.exports = {
    scheduleNextMessage,
    sendScheduledMessage
};
