import "../utils/logger.js";
import { Client, TextChannel } from "discord.js";
import { Config, config as importedConfig } from "../config.js";
import { Setting } from "../models/setting.js";

type MessageFunction = (options: Record<string, any>) => string;

interface Messages {
    [key: number]: MessageFunction;
}

const settingM = new Setting();
const electricTargetKey = importedConfig.electricTargetKey || "";
const targetId = await settingM.getSetting(electricTargetKey);

const SEND_HOURS = [8, 9, 10, 12, 14, 16, 18];
const CHECK_INTERVAL_MS = 60 * 1000; // Check mỗi 1 phút

const MESSAGES: Messages = {
    9: () => `@everyone Điểm danh nào! 📝 Bấm "co" hoặc "có" nếu bạn có mặt!`,
    12: (options: Record<string, any>): string =>
        `<@${targetId}>, đã 12h trưa rồi, nghỉ tay đi ăn cơm 🍚🥢 rồi chích điện tiếp thôi! ⚡⚡`,
    14: (options: Record<string, any>): string =>
        `<@${targetId}>, 2h chiều rồi, có đặt nước không? 🧃🚰`,
    18: (): string => "⏱️ Bây giờ là 6h chiều, coookkkkkkkkkk 🏡🏡🏡 🍳🍲🍜",
};

export const sendChannelMessage = async (
    client: Client,
    config: Config,
    message: string,
): Promise<void> => {
    try {
        const channelId = config?.channeSpamSettingKey
            ? await settingM.getSetting(config.channeSpamSettingKey)
            : importedConfig.aiChannel;
        const channel = client.channels.cache.get(
            channelId || config.aiChannel,
        ) as TextChannel;

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

interface ScheduleTime {
    nextHour: number;
    timeUntil: number;
    nextDate: Date;
}

export const getNextScheduleTime = (): ScheduleTime => {
    const nowVN = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }),
    );
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

export const scheduleAttendance = async (client: Client, config: Config) => {
    const settingM = new Setting();
    const channelId =
        (await settingM.getSetting(
            config.channeSpamSettingKey || "channel_spam_bot",
        )) || config.aiChannel;
    const channel = client.channels.cache.get(
        channelId || config.aiChannel,
    ) as TextChannel;

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

    const message = await channel.send(
        `📋 **${formattedDate}**\n@everyone Điểm danh nào! 📝 Bấm **co** hoặc **có** nếu bạn có mặt! _(5 phút)_`,
    );

    const ATTENDANCE_WORDS = ["co", "có"];
    const filter = (response: { content: string }) =>
        ATTENDANCE_WORDS.includes(response.content.toLowerCase().trim());
    const collector = channel.createMessageCollector({
        filter,
        time: 5 * 60 * 1000,
    });

    const membersWhoReplied = new Map<string, string>(); // id -> displayName

    collector.on("collect", async (msg) => {
        if (!membersWhoReplied.has(msg.author.id)) {
            console.log(`${msg.author.tag} đã điểm danh!`);
            membersWhoReplied.set(msg.author.id, msg.author.displayName || msg.author.username);
            await msg.react("✅").catch(() => {});
        }
    });

    collector.on("end", async (collected, reason) => {
        const members = await message.guild.members.fetch();
        const humanMembers = members.filter((m) => !m.user.bot);
        const total = humanMembers.size;
        const presentCount = membersWhoReplied.size;

        const presentList = [...membersWhoReplied.values()].join(", ") || "_(không có ai)_";

        const membersNotReplied = humanMembers.filter(
            (member) => !membersWhoReplied.has(member.id),
        );

        if (membersNotReplied.size === 0) {
            channel.send(
                `✅ **Điểm danh kết thúc!**\n🎉 Tất cả **${total}/${total}** người đã có mặt!\n👥 Có mặt: ${presentList}`,
            );
        } else {
            const missingMentions = membersNotReplied.map((m) => `<@${m.id}>`).join(", ");
            channel.send(
                `⏰ **Điểm danh kết thúc!**\n` +
                `✅ Có mặt (${presentCount}/${total}): ${presentList}\n` +
                `⚡ Vắng mặt (${membersNotReplied.size}/${total}): ${missingMentions}\n\n` +
                `Nhớ Stand Up Daily nhé 📃`,
            );
        }
    });
};

export const scheduleNextMessage = async (
    client: Client,
    config: Config,
): Promise<void> => {
    const nowVN = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }),
    );
    const dayOfWeek = nowVN.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
        console.log("😴 Hôm nay là Thứ Bảy hoặc Chủ Nhật, không gửi tin nhắn.");
        return;
    }

    const settingM = new Setting();
    const sonId = await settingM.getSetting(
        config.electricTargetKey || "electric_target_id",
    );

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

    console.log(
        `⏳ Đợi ${Math.round(
            timeUntil / 60000,
        )} phút nữa để gửi tin nhắn vào ${nextHour}:00`
    );

    setTimeout(async () => {
        await sendMessageAtHour(client, config, nextHour, sonId);
        await scheduleNextMessage(client, config);
    }, timeUntil);
};

async function sendMessageAtHour(
    client: Client,
    config: Config,
    hour: number,
    sonId: string,
): Promise<void> {
    console.log(`📢 Đang gửi tin nhắn cho ${hour}:00`);
    if (hour === 9) {
        await scheduleAttendance(client, config);
    } else if (SEND_HOURS.includes(hour)) {
        const options: Record<string, any> = { sonId };
        const message =
            MESSAGES[hour]?.(options) ||
            `<@${sonId}>, đã tới thời gian chích điện định kỳ, đưa cổ đây! ⚡⚡⚡`;
        await sendChannelMessage(client, config, message);
    }
}
