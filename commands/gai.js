const db = require('../utils/database.js');
require('../utils/logger');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'gai',
    description: 'Trò chuyện AI trong chat toàn cục với các cuộc trò chuyện riêng biệt',
    
    async execute(message, args, config, logModAction, sendEmbedMessage, client, model) {
        const subCommand = args[0] ? args[0].toLowerCase() : null;
        
        switch(subCommand) {
            case 'history':
                return await this.showGlobalChatList(message);
            
            case 'newchat':
                return await this.startNewGlobalChat(message);
            
            case 'continue':
                return await this.continueGlobalChat(message, args[1]);

            case 'deletehistory':
                return await this.deleteGlobalChatHistory(message, args[1]);

            default:
                return await this.processGlobalChatMessage(message, args, model, sendEmbedMessage);
        }
    },
    async deleteGlobalChatHistory(message, chatId) {
        try {
            if (!chatId) {
                // Xóa toàn bộ lịch sử
                await db.deleteGlobalChatHistory();
                return message.reply('Đã xóa toàn bộ lịch sử chat toàn cục.');
            }
    
            // Kiểm tra định dạng chatId
            if (!chatId.startsWith('g')) {
                return message.reply('Chat ID không hợp lệ. Vui lòng sử dụng định dạng gx (ví dụ: g1, g2).');
            }
    
            // Kiểm tra chatId có tồn tại
            const chatList = await db.getGlobalChatList();
            const existingChat = chatList.find(chat => chat.chatId === chatId);
    
            if (!existingChat) {
                return message.reply(`Không tìm thấy cuộc trò chuyện ${chatId}.`);
            }
    
            // Xóa lịch sử chat cụ thể
            await db.deleteGlobalChatHistory(chatId);
    
            message.reply(`Đã xóa lịch sử chat ${chatId} thành công.`);
    
        } catch (error) {
           console.error(`Lỗi khi xóa lịch sử global chat: ${error.message}`);
            message.reply('Có lỗi xảy ra khi xóa lịch sử chat.');
        }
    },
    async showGlobalChatList(message) {
        try {
            const chatList = await db.getGlobalChatList();
            
            if (chatList.length === 0) {
                return message.reply('Chưa có cuộc trò chuyện nào.');
            }
            
            const embed = new EmbedBuilder()
                .setTitle('Danh Sách Chat Toàn Cục')
                .setColor('#00FF00')
                .setDescription('Các cuộc trò chuyện hiện có:')
                .setFooter({ 
                    text: `Yêu cầu bởi ${message.author.tag}`, 
                    iconURL: message.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            for (const chat of chatList) {
                embed.addFields({
                    name: `Chat ID: ${chat.chatId}`, 
                    value: `Số tin nhắn: ${chat.messageCount}`,
                    inline: false
                });
            }
            
            await message.channel.send({ embeds: [embed] });
            
        } catch (error) {
           console.error(`Lỗi khi xem danh sách chat: ${error.message}`);
            message.reply('Có lỗi xảy ra khi lấy danh sách chat.');
        }
    },

    async startNewGlobalChat(message) {
        try {
            const newChat = await db.createNewGlobalChat();
            message.reply(`Đã tạo cuộc trò chuyện mới. Chat ID của bạn là: **${newChat.chatId}**`);
        } catch (error) {
           console.error(`Lỗi khi tạo chat mới: ${error.message}`);
            message.reply('Có lỗi xảy ra khi tạo chat mới.');
        }
    },

    async continueGlobalChat(message, chatId) {
        if (!chatId || !chatId.startsWith('g')) {
            return message.reply('Vui lòng cung cấp Chat ID hợp lệ (ví dụ: g1, g2).');
        }

        try {
            const messages = await db.getGlobalChatMessages(chatId, 5);
            
            if (messages.length === 0) {
                return message.reply(`Không tìm thấy tin nhắn trong chat ${chatId}.`);
            }
            
            const embed = new EmbedBuilder()
                .setTitle(`Tiếp tục Chat: ${chatId}`)
                .setColor('#0099ff')
                .setDescription('Các tin nhắn gần đây:')
                .setFooter({ 
                    text: `Yêu cầu bởi ${message.author.tag}`, 
                    iconURL: message.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            messages.forEach(msg => {
                const roleName = msg.role === 'user' ? '👤' : '🤖';
                embed.addFields({
                    name: `${roleName} ${msg.user_id}`, 
                    value: msg.content.substring(0, 200) + (msg.content.length > 200 ? '...' : ''),
                    inline: false
                });
            });
            
            await message.channel.send({ embeds: [embed] });
            message.reply(`Đã chuyển đến chat ${chatId}. Bạn có thể tiếp tục trò chuyện.`);
            
        } catch (error) {
           console.error(`Lỗi khi tiếp tục chat: ${error.message}`);
            message.reply('Có lỗi xảy ra khi tiếp tục chat.');
        }
    },

    async processGlobalChatMessage(message, args, model, sendEmbedMessage) {
        if (!args.length) {
            return message.reply('Vui lòng nhập nội dung để trò chuyện với AI.');
        }
    
        const userId = message.author.id;
        const prompt = args.join(' ');
    
        try {
            // Kiểm tra chat hiện tại
            let currentChat = await db.getLatestGlobalChat();
            
            // Nếu chưa có chat hoặc chat cuối đã có quá nhiều tin nhắn, tạo chat mới
            if (!currentChat || currentChat.messageCount > 50) {
                currentChat = await db.createNewGlobalChat();
            }
    
            // Thông báo đang xử lý
            const processingMsg = await message.channel.send('🤔 Đang xử lý...');
            
            // Lấy lịch sử chat
            let historyRows = await db.getGlobalChatMessages(currentChat.chatId, 5);
            
            // Chuyển đổi dữ liệu từ DB sang định dạng Gemini API
            let conversation = historyRows.map(row => ({
                role: row.role,
                parts: [{ text: row.content }]
            }));
            
            // Bắt đầu chat với lịch sử
            const chat = model.startChat({
                history: conversation,
                generationConfig: {
                    maxOutputTokens: 1000,
                }
            });
            
            // Gửi tin nhắn tới AI
            const result = await chat.sendMessage(prompt);
            const content = result.response.text();
            
            // Lưu tin nhắn người dùng và câu trả lời AI vào chat
            await db.addGlobalChatMessage(userId, 'user', prompt, currentChat.sequence);
            await db.addGlobalChatMessage('system', 'model', content, currentChat.sequence);
            
            // Xóa thông báo đang xử lý
            await processingMsg.delete();
            
            // Gửi phản hồi tới kênh
            await sendEmbedMessage(message.channel, message.author, content);
            
        } catch (error) {
           console.error(`Lỗi trong chat toàn cục: ${error.message}`);
            message.reply('Có lỗi xảy ra khi gọi AI. Vui lòng thử lại sau.');
        }
    },
    
    async showGlobalChatList(message) {
        try {
            const chatList = await db.getGlobalChatList();
            
            if (chatList.length === 0) {
                return message.reply('Chưa có cuộc trò chuyện nào.');
            }
            
            const embed = new EmbedBuilder()
                .setTitle('Danh Sách Chat Toàn Cục')
                .setColor('#00FF00')
                .setDescription('Các cuộc trò chuyện hiện có:')
                .setFooter({ 
                    text: `Yêu cầu bởi ${message.author.tag}`, 
                    iconURL: message.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            for (const chat of chatList) {
                embed.addFields({
                    name: `Chat ID: ${chat.chatId}`, 
                    value: `Số tin nhắn: ${chat.messageCount}\nTóm tắt: ${chat.summary}`,
                    inline: false
                });
            }
            
            await message.channel.send({ embeds: [embed] });
            
        } catch (error) {
           console.error(`Lỗi khi xem danh sách chat: ${error.message}`);
            message.reply('Có lỗi xảy ra khi lấy danh sách chat.');
        }
    },
    
};