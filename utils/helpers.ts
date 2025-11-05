import { ColorResolvable, EmbedBuilder } from 'discord.js';
import { Guild, GuildMember, TextChannel, User } from 'discord.js';
interface Config {
    modLogChannel: string;
}

export const logModAction = (
    guild: Guild, 
    action: string, 
    moderator: User, 
    target: User | null, 
    reason: string, 
    config: Config
): void => {
    const logChannel = guild.channels.cache.find(channel => channel.name === config.modLogChannel) as TextChannel;
    if (!logChannel) return;

    let logMessage = `**${action}** | ${new Date().toLocaleString()}\n`;
    logMessage += `**Người quản lý:** ${moderator.tag} (${moderator.id})\n`;

    if (target) {
        logMessage += `**Người dùng:** ${target.tag} (${target.id})\n`;
    }

    logMessage += `**Chi tiết:** ${reason}`;

    logChannel.send(logMessage);
};

export const sendEmbedMessage = async (
    channel: TextChannel, 
    author: User | GuildMember, 
    content: string, 
    color: ColorResolvable = "#ff0000"
): Promise<void> => {
    const embedList: EmbedBuilder[] = [];
    let remainingContent = content;

    while (remainingContent.length > 0) {
        const part = remainingContent.substring(0, 2000);
        remainingContent = remainingContent.substring(2000);
        const username = (author as GuildMember).user?.username ?? (author as User).username;
        const embed = new EmbedBuilder()
            .setColor(color)
            .setAuthor({ name: username, iconURL: author.displayAvatarURL() })
            .setDescription(part);

        embedList.push(embed);
    }

    for (const embed of embedList) {
        await channel.send({ embeds: [embed] });
    }
};

/**
 * Định dạng tiền tệ theo chuẩn Việt Nam.
 * @param value - số tiền
 * @returns Chuỗi ví dụ: "14.000đ"
 */
export function formatVND(value: number): string {
    if (isNaN(value)) return "0đ";
    return value.toLocaleString("vi-VN") + "đ";
}

/**
 * Định dạng ngày (dd/mm/yyyy)
 * @param dateString - chuỗi hoặc object Date
 * @returns Chuỗi ngày: "04/11/2025"
 */
export function formatDate(dateString: string | Date): string {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}