// commands/continuechat.js
const db = require('../utils/database');
require('../utils/logger');

module.exports = {
    name: 'continuechat',
    description: 'Tiếp tục một cuộc trò chuyện AI đã lưu, cú pháp: `!continuechat <chatId>`',
    
    async execute(message, args, config, logModAction, sendEmbedMessage, client, model) {
        let userId = message.author.id;
        let chatId;
        // Kiểm tra xem người dùng đã cung cấp ID cuộc trò chuyện chưa
        if (!args[0]) {
            return message.reply('Vui lòng cung cấp ID cuộc trò chuyện (ví dụ: a1, a2, ...). Sử dụng lệnh `!chats` để xem danh sách cuộc trò chuyện của bạn.');
        }
        chatId = args[0];
        const member = message.mentions.members.first();
        if (member) {
            userId = member.id;
            if (!args[1]) {
                return message.reply('Vui lòng cung cấp ID cuộc trò chuyện (ví dụ: a1, a2, ...). Sử dụng lệnh `!chats hoặc !chats @orderUser` để xem danh sách cuộc trò chuyện của bạn. Nếu sử dụng @orderUser, hãy cung cấp ID cuộc trò chuyện của họ.');
            }
            chatId = args[1];
        }
    
        try {
            // Tìm kiếm cuộc trò chuyện trong cơ sở dữ liệu
            const chats = await db.getUserChats(userId);
            const targetChat = chats.find(chat => chat.chat_id === chatId);
            
            if (!targetChat) {
                return message.reply(`Không tìm thấy cuộc trò chuyện với ID "${chatId}". Vui lòng kiểm tra lại hoặc sử dụng lệnh \`!chats\` để xem danh sách cuộc trò chuyện của bạn.`);
            }
            
            // Cập nhật thời gian truy cập để đặt cuộc trò chuyện này thành hiện tại
            await db.updateChatTime(userId, targetChat.id);
            
            // Lấy tin nhắn gần đây từ cuộc trò chuyện
            const recentMessages = await db.getMessagesFromChat(targetChat.id, 5);
            let messagePreview = "";
            
            if (recentMessages && recentMessages.length > 0) {
                messagePreview = recentMessages.map(msg => 
                    `${msg.role === 'user' ? '👤 Bạn' : '🤖 AI'}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`
                ).join('\n');
            } else {
                messagePreview = "(Chưa có tin nhắn)";
            }
            
            // Gửi xác nhận
            await message.reply(`Đã chuyển đến cuộc trò chuyện: **${targetChat.title || chatId}**\n\nCác tin nhắn gần đây:\n${messagePreview}\n\nBạn có thể tiếp tục trò chuyện với lệnh \`!ai\`.`);
            
            // Ghi log
            console.log(`User ${message.author.tag} (${userId}) đã tiếp tục cuộc trò chuyện ${chatId}`);
            
        } catch (error) {
            console.error(`Lỗi khi tiếp tục cuộc trò chuyện: ${error.message}`);
            message.reply('Có lỗi xảy ra khi chuyển cuộc trò chuyện. Vui lòng thử lại sau.');
        }
    },
};