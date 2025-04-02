require('../utils/logger');
let db, getChannelId, saveChannelId;

if (process.env.APP_ENV === 'local') {
  ({ db, getChannelId, saveChannelId } = require("./sddatabase3"));
} else {
  ({ db, getChannelId, saveChannelId } = require("./database"));
}

// Danh sách giờ gửi tin nhắn
const SEND_HOURS = [8, 9, 10, 12, 14, 16, 18];

const MESSAGES = {
    9: () => `<@everyone, Điểm danh nào! 📝 Bấm "co" nếu bạn có mặt!`,
    12: (config) => `<@${config.sonId}>, đã 12h trưa rồi, nghỉ tay đi ăn cơm 🍚🥢 rồi chích điện tiếp thôi! ⚡⚡`,
    14: (config) => `<@${config.sonId}>, 2h chiều rồi, có đặt nước không? 🧃🚰`,
    18: () => '⏱️ Bây giờ là 6h chiều, REPORT rồi coookkkk thôi mấy thằng nhókkkk 🏡🏡🏡 🍳🍲🍜',
};

const sendChannelMessage = async (client, config, message) => {
    try {
        const channelId = await getChannelId();
        const channel = client.channels.cache.get(channelId || config.aiChannel);
        console.log("Kênh:", channelId);
        if (!channel) {
            console.log("Không tìm thấy kênh. 🚫🚫🚫");
            return;
        }

        channel.send(message);
        console.log(`✅ Tin nhắn đã được gửi thành công!`);
    } catch (error) {
        console.error("Lỗi khi gửi tin nhắn:", error);
    }
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

    return { nextHour, timeUntil, nextDate };
};

const scheduleAttendance = async (client, config) => {
    const channelId = await getChannelId();
    const channel = client.channels.cache.get(channelId || config.aiChannel);

    const { nextDate } = getNextScheduleTime();

    // Format ngày tháng
    const day = String(nextDate.getDate()).padStart(2, '0');
    const month = String(nextDate.getMonth() + 1).padStart(2, '0');
    const year = nextDate.getFullYear();
    const formattedDate = `Ngày ${day}/${month}/${year}`;

    if (!channel) {
        console.log("Không tìm thấy kênh. 🚫🚫🚫");
        return;
    }

    const message = await channel.send(`${formattedDate}\n@everyone Điểm danh nào! 📝`);

    const filter = (response) => response.content.toLowerCase() === 'co';
    const collector = channel.createMessageCollector({ filter, time: 2 * 60 * 1000 });

    const membersWhoReplied = new Set();

    collector.on('collect', (message) => {
        console.log(`${message.author.tag} đã điểm danh!`);
        membersWhoReplied.add(message.author.id);
    });

    collector.on('end', async (collected, reason) => {
        if (reason === 'time') {
            const members = await message.guild.members.fetch();
            const membersNotReplied = members.filter(member => 
                !membersWhoReplied.has(member.id) && !member.user.bot
            );

            if (membersNotReplied.size > 0) {
                const missingMembers = membersNotReplied.map(member => member.user.tag).join(', ');
                channel.send(`⚠️ Danh sách những người vắng mặt sẽ bị chích điện ⚡: ${missingMembers}`);
                channel.send(`Nhớ Stand Up Daily nhé 📃`);
            } else {
                channel.send('🎉 Tất cả mọi người đã điểm danh!');
            }
        } else {
            channel.send('🎉 Cảm ơn các bạn đã điểm danh!');
        }
    });
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

        if (nextHour === 9) {
            scheduleAttendance(client, config);
        } else if (SEND_HOURS.includes(nextHour)) {
            const message = MESSAGES[nextHour]?.(config) || 
            `<@${config.sonId}>, đã tới thời gian chích điện định kỳ, đưa cổ đây, <${config.camGif}> "rẹt rẹt rẹt ...⚡⚡⚡"`;
            sendChannelMessage(client, config, message);
        }

        console.log(`⏳ Đang lên lịch cho lần gửi tiếp theo...`);

        scheduleNextMessage(client, config);
    }, timeUntil);
};

module.exports = { scheduleNextMessage, scheduleAttendance };