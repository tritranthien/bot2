// commands/chats.js
const db = require('../utils/database');
const logger = require('../utils/logger');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'chats',
    description: 'Liệt kê danh sách cuộc trò chuyện đã lưu của bạn.',
    
    async execute(message, args, config, logModAction, sendEmbedMessage, client, model) {
        let userId = message.author.id;
        let guildMember;
        const member = message.mentions.members.first();
        if (member) {
            userId = member.id;
            guildMember = message.guild.members.cache.get(member.id);
        }
        try {
            // Lấy danh sách cuộc trò chuyện của người dùng
            const chats = await db.getUserChats(userId);
            
            if (chats.length === 0) {
                return message.reply('Bạn chưa có cuộc trò chuyện nào.');
            }
            
            // Tạo embed để hiển thị danh sách
            const embed = new EmbedBuilder()
                .setTitle(`Danh sách cuộc trò chuyện của ${guildMember ? guildMember.displayName : 'bạn'}`)
                .setColor('#0099ff')
                .setDescription('Sử dụng lệnh `!newchat` để bắt đầu cuộc trò chuyện mới và `!clearai` để xóa tất cả lịch sử.')
                .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            
            // Thêm thông tin các cuộc trò chuyện
            chats.slice(0, 15).forEach((chat, index) => {
                const date = new Date(chat.updated_at).toLocaleDateString('vi-VN');
                const title = chat.title || `Cuộc trò chuyện ${chat.chat_id}`;
                
                // Đảm bảo hiển thị chat_id nếu không có trong tiêu đề
                const displayTitle = title.includes(chat.chat_id) ? title : `[${chat.chat_id}] ${title}`;
                
                embed.addFields({
                    name: `${index + 1}. ${displayTitle}`,
                    value: `Cập nhật: ${date}`,
                    inline: false
                });
            });
            
            // Gửi embed
            await message.channel.send({ embeds: [embed] });
            
        } catch (error) {
            logger.error(`Lỗi khi lấy danh sách cuộc trò chuyện: ${error.message}`);
            message.reply('Có lỗi xảy ra khi lấy danh sách cuộc trò chuyện. Vui lòng thử lại sau.');
        }
    },
};