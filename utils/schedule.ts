import "../utils/logger.js";
import { Client, TextChannel } from "discord.js";
import { Config } from "../config";
import { Setting } from "../models/setting"

type MessageFunction = (config: Config) => string;

interface Messages {
    [key: number]: MessageFunction;
}

const SEND_HOURS: number[] = [8, 10, 12, 14, 16, 18];

const MESSAGES: Messages = {
    12: (config: Config): string => `<@${config.sonId}>, đã 12h trưa rồi, nghỉ tay đi ăn cơm 🍚🥢 rồi chích điện tiếp thôi! ⚡⚡`,
    14: (config: Config): string => `<@${config.sonId}>, 2h chiều rồi, có đặt nước không? 🧃🚰`,
    18: (): string => '⏱️ Bây giờ là 6h chiều, coookkkkkkkkkk 🏡🏡🏡 🍳🍲🍜'
};

export const sendChannelMessage = async (client: Client, config: Config, message: string): Promise<void> => {
    try {
        const settingM = new Setting();
        const channelId = await settingM.getSetting(config.channeSpamSettingKey);
        const channel = client.channels.cache.get(channelId || config.aiChannel) as TextChannel;

        if (!channel) {
            console.log("Không tìm thấy kênh. 🚫🚫🚫");
            return;
        }

        await channel.send(message);
    } catch (error) {
        console.error("Lỗi khi gửi tin nhắn:", error);
    }
};

interface ScheduleTime {
    nextHour: number;
    timeUntil: number;
}

export const getNextScheduleTime = (): ScheduleTime => {
    const nowVN = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const hours = nowVN.getHours();

    let nextHour = SEND_HOURS.find(h => h > hours);

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

    return { nextHour, timeUntil };
};

export const scheduleNextMessage = (client: Client, config: Config): void => {
    const nowVN = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const dayOfWeek = nowVN.getDay();

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

export { SEND_HOURS, MESSAGES };
