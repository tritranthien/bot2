import { EmbedBuilder } from 'discord.js';

export const logModAction = (guild, action, moderator, target, reason, config) => {
    const logChannel = guild.channels.cache.find(channel => channel.name === config.modLogChannel);
    if (!logChannel) return;

    let logMessage = `**${action}** | ${new Date().toLocaleString()}\n`;
    logMessage += `**Người quản lý:** ${moderator.tag} (${moderator.id})\n`;

    if (target) {
        logMessage += `**Người dùng:** ${target.tag} (${target.id})\n`;
    }

    logMessage += `**Chi tiết:** ${reason}`;

    logChannel.send(logMessage);
};

export const sendEmbedMessage = async (channel, author, content, color = "#ff0000") => {
    const embedList = [];
    while (content.length > 0) {
        const part = content.substring(0, 2000);
        content = content.substring(2000);

        const embed = new EmbedBuilder()
            .setColor(color)
            .setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
            .setDescription(part);

        embedList.push(embed);
    }

    for (const embed of embedList) {
        await channel.send({ embeds: [embed] });
    }
};