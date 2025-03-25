// commands/ai.js
if (process.env.APP_ENV == 'local') {
    const db = require('../utils/sddatabase3');
} else {
    const db = require('../utils/database');
}
require('../utils/logger');

module.exports = {
    name: 'ai',
    description: 'Talk to the AI with persistent conversation history using the current chat. 🤖',
    
    async execute(message, args, config, logModAction, sendEmbedMessage, client, model) {
        if (!args.length) {
            return message.reply('⚠️ Bạn cần nhập nội dung để gọi AI.');
        }

        let userId = message.author.id;
        const member = message.mentions.members.first();
        if (member) {
            userId = member.id;
            args.shift();
        }
        const prompt = args.join(' ');

        try {
            // Thông báo đang xử lý
            const processingMsg = await message.channel.send('🤔 Đang xử lý...');
            
            // Lấy lịch sử cuộc trò chuyện từ database (giới hạn 5 cặp tin nhắn gần nhất)
            let historyRows = await db.getCurrentChatHistory(userId, 5);
            
            // Chuyển đổi dữ liệu từ DB sang định dạng mà Gemini API yêu cầu
            let conversation = historyRows.map(row => ({
                role: row.role,
                parts: [{ text: row.content }]
            }));
            
            console.log(`🗣️ Lịch sử cuộc trò chuyện của ${userId}: ${JSON.stringify(conversation)}`);
            
            // Kiểm tra xem lịch sử có trống không
            if (conversation.length === 0) {
                // Nếu không có lịch sử, chỉ cần gửi prompt trực tiếp
                try {
                    const result = await model.generateContent(prompt);
                    const content = result.response.text();
                    
                    // Lưu cả câu hỏi và câu trả lời vào database
                    await db.addChatMessage(userId, 'user', prompt);
                    await db.addChatMessage(userId, 'model', content);
                    
                    // Tóm tắt và cập nhật tiêu đề cuộc trò chuyện
                    await db.summarizeAndUpdateChatTitle(userId, model);
                    
                    // Xóa thông báo đang xử lý
                    await processingMsg.delete();
                    
                    // Gửi câu trả lời cho người dùng
                    await sendEmbedMessage(message.channel, message.author, content);
                                        
                } catch (error) {
                    console.error(`❌ Lỗi khi gọi generateContent: ${error.message}`);
                    // Xóa thông báo đang xử lý
                    await processingMsg.delete();
                    message.reply('❌ Có lỗi xảy ra khi gọi AI. Vui lòng thử lại sau.');
                }
                return;
            }
            
            // Nếu có lịch sử, sử dụng startChat để duy trì ngữ cảnh
            try {
                // Tạo chat với lịch sử cuộc trò chuyện
                const chat = model.startChat({
                    history: conversation,
                    generationConfig: {
                        maxOutputTokens: 1000,
                    }
                });
                
                // Gửi prompt tới AI
                const result = await chat.sendMessage(prompt);
                const content = result.response.text();
                
                // Lưu tin nhắn của người dùng vào database
                await db.addChatMessage(userId, 'user', prompt);
                
                // Lưu câu trả lời của AI vào database
                await db.addChatMessage(userId, 'model', content);
                
                // Tóm tắt và cập nhật tiêu đề cuộc trò chuyện
                await db.summarizeAndUpdateChatTitle(userId, model);
                
                // Xóa thông báo đang xử lý
                await processingMsg.delete();
                
                // Gửi câu trả lời cho người dùng
                await sendEmbedMessage(message.channel, message.author, content);
                                
            } catch (error) {
                console.error(`❌ Lỗi khi gọi startChat: ${error.message}`);
                // Xóa thông báo đang xử lý
                await processingMsg.delete();
                
                // Thông báo lỗi cho người dùng
                message.reply('🔄 Đang thử lại với cuộc trò chuyện mới...');
                
                // Tạo một cuộc trò chuyện mới để bắt đầu lại
                try {
                    // Tạo chat mới
                    await db.createNewChat(userId);
                    
                    // Gọi AI với prompt
                    const result = await model.generateContent(prompt);
                    const content = result.response.text();
                    
                    // Lưu cả câu hỏi và câu trả lời vào database
                    await db.addChatMessage(userId, 'user', prompt);
                    await db.addChatMessage(userId, 'model', content);
                    
                    // Tóm tắt và cập nhật tiêu đề cuộc trò chuyện
                    await db.summarizeAndUpdateChatTitle(userId, model);
                    
                    // Gửi câu trả lời cho người dùng
                    await sendEmbedMessage(message.channel, message.author, content);
                    
                } catch (fallbackError) {
                    console.error(`❌ Lỗi khi thử lại với generateContent: ${fallbackError.message}`);
                    message.reply('❌ Có lỗi xảy ra khi gọi AI. Vui lòng thử lại sau.');
                }
            }
        } catch (error) {
            console.error(`❌ Lỗi chung khi gọi AI: ${error.message}`);
            message.reply('❌ Có lỗi xảy ra khi gọi AI. Vui lòng thử lại sau.');
        }
    },
};