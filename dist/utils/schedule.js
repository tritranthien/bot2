import "../utils/logger.js";
import { config as importedConfig } from "../config.js";
import { Setting } from "../models/setting.js";
const settingM = new Setting();
const electricTargetKey = importedConfig.electricTargetKey || "";
const targetId = await settingM.getSetting(electricTargetKey);
const SEND_HOURS = [8, 9, 10, 12, 14, 16, 18];
const CHECK_INTERVAL_MS = 60 * 1000; // Check mỗi 1 phút
const MESSAGES = {
    9: () => `<@everyone, Điểm danh nào! 📝 Bấm "co" nếu bạn có mặt!`,
    12: (options) => `<@${targetId}>, đã 12h trưa rồi, nghỉ tay đi ăn cơm 🍚🥢 rồi chích điện tiếp thôi! ⚡⚡`,
    14: (options) => `<@${targetId}>, 2h chiều rồi, có đặt nước không? 🧃🚰`,
    18: () => "⏱️ Bây giờ là 6h chiều, coookkkkkkkkkk 🏡🏡🏡 🍳🍲🍜",
};
export const sendChannelMessage = async (client, config, message) => {
    try {
        const channelId = config?.channeSpamSettingKey
            ? await settingM.getSetting(config.channeSpamSettingKey)
            : importedConfig.aiChannel;
        const channel = client.channels.cache.get(channelId || config.aiChannel);
        if (!channel) {
            console.log("Không tìm thấy kênh. 🚫🚫🚫");
            return;
        }
        channel.send(message);
        console.log(`✅ Tin nhắn đã được gửi thành công!`);
    }
    catch (error) {
        console.error("Lỗi khi gửi tin nhắn:", error);
    }
};
export const getNextScheduleTime = () => {
    const nowVN = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const hours = nowVN.getHours();
    let nextHour = SEND_HOURS.find((h) => h > hours);
    const nextDate = new Date(nowVN);
    if (!nextHour) {
        nextHour = SEND_HOURS[0];
        nextDate.setDate(nextDate.getDate() + 1);
    }
    nextDate.setHours(nextHour, 0, 0, 0);
    let timeUntil = nextDate.getTime() - nowVN.getTime();
    if (timeUntil < 60000) {
        timeUntil = 60000;
    }
    console.log(`🕒 Thời gian hiện tại: ${nowVN}`);
    return { nextHour, timeUntil, nextDate };
};
export const scheduleAttendance = async (client, config) => {
    const settingM = new Setting();
    const channelId = (await settingM.getSetting(config.channeSpamSettingKey || "channel_spam_bot")) || config.aiChannel;
    const channel = client.channels.cache.get(channelId || config.aiChannel);
    const { nextDate } = getNextScheduleTime();
    // Format ngày tháng
    const day = String(nextDate.getDate()).padStart(2, "0");
    const month = String(nextDate.getMonth() + 1).padStart(2, "0");
    const year = nextDate.getFullYear();
    const formattedDate = `Ngày ${day}/${month}/${year}`;
    if (!channel) {
        console.log("Không tìm thấy kênh. 🚫🚫🚫");
        return;
    }
    const message = await channel.send(`${formattedDate}\n@everyone Điểm danh nào! 📝`);
    const filter = (response) => response.content.toLowerCase() === "co";
    const collector = channel.createMessageCollector({
        filter,
        time: 2 * 60 * 1000,
    });
    const membersWhoReplied = new Set();
    collector.on("collect", (message) => {
        console.log(`${message.author.tag} đã điểm danh!`);
        membersWhoReplied.add(message.author.id);
    });
    collector.on("end", async (collected, reason) => {
        if (reason === "time") {
            const members = await message.guild.members.fetch();
            const membersNotReplied = members.filter((member) => !membersWhoReplied.has(member.id) && !member.user.bot);
            if (membersNotReplied.size > 0) {
                const missingMembers = membersNotReplied
                    .map((member) => member.user.tag)
                    .join(", ");
                console.log("Missing members:", missingMembers);
                channel.send(`⏰ Đã hết thời gian điểm danh!`);
                channel.send(`⚠️ Danh sách những người vắng mặt sẽ bị chích điện ⚡: ${missingMembers} \n \n Nhớ Stand Up Daily nhé 📃`);
            }
            else {
                channel.send("🎉 Tất cả mọi người đã điểm danh!");
            }
        }
        else {
            channel.send("🎉 Cảm ơn các bạn đã điểm danh!");
        }
    });
};
export const scheduleNextMessage = async (client, config) => {
    const nowVN = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const dayOfWeek = nowVN.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        console.log("😴 Hôm nay là Thứ Bảy hoặc Chủ Nhật, không gửi tin nhắn.");
        return;
    }
    const settingM = new Setting();
    const sonId = await settingM.getSetting(config.electricTargetKey || "electric_target_id");
    const currentHour = nowVN.getHours();
    const currentMinute = nowVN.getMinutes();
    const nextHour = SEND_HOURS.find((h) => h > currentHour);
    if (!nextHour) {
        console.log("✅ Hôm nay đã gửi hết các giờ cần gửi rồi.");
        return;
    }
    const nextSendTime = new Date(nowVN);
    nextSendTime.setHours(nextHour, 0, 0, 0);
    const timeUntil = nextSendTime.getTime() - nowVN.getTime();
    console.log(`⏳ Đợi ${Math.round(timeUntil / 60000)} phút nữa để gửi tin nhắn vào ${nextHour}:00`);
    setTimeout(async () => {
        await sendMessageAtHour(client, config, nextHour, sonId);
        await scheduleNextMessage(client, config);
    }, timeUntil);
};
async function sendMessageAtHour(client, config, hour, sonId) {
    console.log(`📢 Đang gửi tin nhắn cho ${hour}:00`);
    if (hour === 9) {
        await scheduleAttendance(client, config);
    }
    else if (SEND_HOURS.includes(hour)) {
        const options = { sonId };
        const message = MESSAGES[hour]?.(options) ||
            `<@${sonId}>, đã tới thời gian chích điện định kỳ, đưa cổ đây! ⚡⚡⚡`;
        await sendChannelMessage(client, config, message);
    }
}
