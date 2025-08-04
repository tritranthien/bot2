// commands/chats.ts
import '../../utils/logger.js';
import { Bookmarks } from '../../models/bookmark.js';
export default {
    name: 'save',
    description: 'lưu tin nhắn reply. 📚',
    async execute({ message, args }) {
        if (message.author.bot)
            return;
        if (!message.reference)
            return;
        try {
            const replied = await message.channel.messages.fetch(message.reference.messageId);
            const tags = args
                .filter(arg => arg.startsWith('#'))
                .map(tag => tag.replace(/^#/, '').toLowerCase());
            const bookmarkM = new Bookmarks();
            const saveData = {
                guildId: message.guildId,
                channelId: message.channelId,
                messageId: replied.id,
                messageLink: `https://discord.com/channels/${message.guildId}/${message.channelId}/${replied.id}`,
                content: replied.content,
                attachments: replied.attachments.map(a => a.url),
                originalUserId: replied.author.id,
                originalUsername: replied.author.tag,
                savedByUserId: message.author.id,
                savedByUsername: message.author.tag,
                tags,
            };
            await bookmarkM.save(saveData);
            await message.reply(`✅ Đã lưu! ${tags.length ? `Tags: ${tags.join(', ')}` : ''}`);
        }
        catch (error) {
            console.error('❌ Lỗi khi lưu bookmark:', error);
            await message.reply('❌ Không thể lưu. Có lỗi xảy ra.');
        }
    },
};
