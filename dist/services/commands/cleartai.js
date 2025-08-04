// commands/clearai.ts
import '../../utils/logger.js';
export default {
    name: 'clearai',
    description: 'Xóa lịch sử trò chuyện AI của bạn. Bạn có thể xóa toàn bộ lịch sử hoặc một cuộc trò chuyện cụ thể bằng cách cung cấp ID. 🗑️',
    async execute({ message, args, chatM }) {
        const userId = message.author.id;
        try {
            // Kiểm tra nếu có chatId được cung cấp
            if (args.length > 0) {
                const chatId = args[0];
                // Kiểm tra xem chatId có đúng định dạng không (a{số})
                if (!chatId.match(/^a\d+$/)) {
                    message.reply('❌ ID cuộc trò chuyện không hợp lệ. ID phải có định dạng "a" theo sau là một số, ví dụ: a1, a2, a3, ...');
                    return;
                }
                // Thông báo đang xử lý
                let processingMsg;
                if ('send' in message.channel) {
                    processingMsg = await message.channel.send(`🗑️ Đang xóa cuộc trò chuyện ${chatId}...`);
                }
                try {
                    // Xóa cuộc trò chuyện theo ID
                    await chatM.deleteChatById(userId, chatId);
                    // Xóa thông báo đang xử lý
                    await processingMsg.delete().catch(() => { });
                    // Gửi xác nhận
                    await message.reply(`✅ Đã xóa cuộc trò chuyện ${chatId}.`);
                    // Ghi log
                    console.log(`User ${message.author.tag} (${userId}) đã xóa cuộc trò chuyện ${chatId}.`);
                }
                catch (error) {
                    // Xóa thông báo đang xử lý
                    await processingMsg.delete().catch(() => { });
                    // Thông báo lỗi
                    await message.reply(`❌ ${error.message}`);
                }
            }
            else {
                // Xóa toàn bộ lịch sử trò chuyện
                // Thông báo đang xử lý
                let processingMsg;
                if ('send' in message.channel) {
                    processingMsg = await message.channel.send('🗑️ Đang xóa toàn bộ lịch sử trò chuyện...');
                }
                // Xóa lịch sử trò chuyện AI
                await chatM.deleteUserChatHistory(userId);
                // Tạo một cuộc trò chuyện mới để người dùng có thể tiếp tục sử dụng
                await chatM.createNewChat(userId);
                // Xóa thông báo đang xử lý
                await processingMsg.delete().catch(() => { });
                // Gửi xác nhận
                await message.reply('✅ Đã xóa tất cả lịch sử trò chuyện của bạn với AI. Một cuộc trò chuyện mới đã được tạo.');
                // Ghi log
                console.log(`User ${message.author.tag} (${userId}) đã xóa toàn bộ lịch sử trò chuyện AI.`);
            }
        }
        catch (error) {
            console.error(`Lỗi khi xóa lịch sử trò chuyện: ${error.message}`);
            message.reply('❌ Có lỗi xảy ra khi xóa lịch sử trò chuyện. Vui lòng thử lại sau.');
        }
    },
};
