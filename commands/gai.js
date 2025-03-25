const db = require('../utils/database.js');
const logger = require('../utils/logger');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'gai',
    description: 'Trò chuyện AI trong chat toàn cục với các cuộc trò chuyện riêng biệt',

    async execute(message, args, config, logModAction, sendEmbedMessage, client, model) {
        const subCommand = args[0] ? args[0].toLowerCase() : null;

        switch (subCommand) {
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
    async deleteGlobalChatHistory(message, chatId = null) {
        try {
            // Kiểm tra nếu có chatId được cung cấp
            if (chatId) {
                // Kiểm tra xem chatId có đúng định dạng không (a{số})
                if (!chatId.match(/^g\d+$/)) {
                    return message.reply('❌ ID cuộc trò chuyện không hợp lệ. ID phải có định dạng "g" theo sau là một số, ví dụ: a1, a2, a3, ...');
                }
                
                // Thông báo đang xử lý
                const processingMsg = await message.channel.send(`🗑️ Đang xóa cuộc trò chuyện ${chatId}...`);
                
                try {
                    // Xóa cuộc trò chuyện theo ID
                    await db.deleteGlobalChatById(userId, chatId);
                    
                    // Xóa thông báo đang xử lý
                    await processingMsg.delete().catch(() => {});
                    
                    // Gửi xác nhận
                    await message.reply(`✅ Đã xóa cuộc trò chuyện ${chatId}.`);
                    
                    // Ghi log
                    console.log(`User ${message.author.tag} (${userId}) đã xóa cuộc trò chuyện ${chatId}.`);
                } catch (error) {
                    // Xóa thông báo đang xử lý
                    await processingMsg.delete().catch(() => {});
                    
                    // Thông báo lỗi
                    await message.reply(`❌ ${error.message}`);
                }
            } else {
                // Xóa toàn bộ lịch sử trò chuyện
                // Thông báo đang xử lý
                const processingMsg = await message.channel.send('🗑️ Đang xóa toàn bộ lịch sử trò chuyện...');
                
                // Xóa lịch sử trò chuyện AI
                await db.deleteGlobalChatHistory();
                
                // Tạo một cuộc trò chuyện mới để người dùng có thể tiếp tục sử dụng
                await db.createNewGlobalChat(userId);
                
                // Xóa thông báo đang xử lý
                await processingMsg.delete().catch(() => {});
                
                // Gửi xác nhận
                await message.reply('✅ Đã xóa tất cả lịch sử trò chuyện của bạn với AI. Một cuộc trò chuyện mới đã được tạo.');
                
                // Ghi log
                console.log(`User ${message.author.tag} (${userId}) đã xóa toàn bộ lịch sử trò chuyện AI.`);
            }
        } catch (error) {
            console.error(`Lỗi khi xóa lịch sử trò chuyện: ${error.message}`);
            message.reply('❌ Có lỗi xảy ra khi xóa lịch sử trò chuyện. Vui lòng thử lại sau.');
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
            logger.error(`Lỗi khi xem danh sách chat: ${error.message}`);
            message.reply('Có lỗi xảy ra khi lấy danh sách chat.');
        }
    },

    async startNewGlobalChat(message) {
        const senderId = message.author.id;
        try {
            // Tạo một cuộc trò chuyện mới
            await db.createNewGlobalChat(senderId);
            
            // Gửi xác nhận
            await message.reply('Đã tạo cuộc trò chuyện mới. Bạn có thể bắt đầu trò chuyện với lệnh `!gai`.');
            
            // Ghi log
            console.log(`User ${message.author.tag} (${userId}) đã tạo cuộc trò chuyện mới.`);
            
            // LOẠI BỎ phần xóa lệnh của người dùng
            // const fetchedMessage = await message.channel.messages.fetch(message.id).catch(() => null);
            // if (fetchedMessage) {
            //     await message.delete();
            // }
        } catch (error) {
            console.error(`Lỗi khi tạo cuộc trò chuyện mới: ${error.message}`);
            message.reply('Có lỗi xảy ra khi tạo cuộc trò chuyện mới. Vui lòng thử lại sau.');
        }
    },

    async continueGlobalChat(message, chatId) {
        if (!chatId || !chatId.startsWith('g')) {
            return message.reply('Vui lòng cung cấp Chat ID hợp lệ (ví dụ: g1, g2).');
        }

        try {
            const chats = await db.getGlobalChats();
            const targetChat = chats.find(chat => chat.chat_id === chatId);
            
            if (!targetChat) {
                return message.reply(`Không tìm thấy cuộc trò chuyện với ID "${chatId}". Vui lòng kiểm tra lại hoặc sử dụng lệnh \`!chats\` để xem danh sách cuộc trò chuyện của bạn.`);
            }
            
            // Cập nhật thời gian truy cập để đặt cuộc trò chuyện này thành hiện tại
            await db.updateGlobalChatTime(targetChat.id);
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
            logger.error(`Lỗi khi tiếp tục chat: ${error.message}`);
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
            // Thông báo đang xử lý
            const processingMsg = await message.channel.send('🤔 Đang xử lý...');

            // Lấy lịch sử chat
            let historyRows = await db.getCurrentGlobalChatHistory(userId, 5);

            // Chuyển đổi dữ liệu từ DB sang định dạng Gemini API
            let conversation = historyRows.map(row => ({
                role: row.role,
                parts: [{ text: row.content }]
            }));

            // Bắt đầu chat với lịch sử
            if (conversation.length === 0) {
                // Nếu không có lịch sử, chỉ cần gửi prompt trực tiếp
                try {
                    const result = await model.generateContent(prompt);
                    const content = result.response.text();
                    
                    // Lưu cả câu hỏi và câu trả lời vào database
                    await db.addGlobalChatMessage(userId, 'user', prompt);
                    await db.addGlobalChatMessage(userId, 'model', content);
                    
                    // Tóm tắt và cập nhật tiêu đề cuộc trò chuyện
                    await db.summarizeAndUpdateGlobalChatTitle(userId, model);
                    
                    // Xóa thông báo đang xử lý
                    await processingMsg.delete();
                    
                    // Gửi câu trả lời cho người dùng
                    await sendEmbedMessage(message.channel, message.author, content);
                    
                    // LOẠI BỎ phần xóa lệnh của người dùng
                    // const fetchedMessage = await message.channel.messages.fetch(message.id).catch(() => null);
                    // if (fetchedMessage) {
                    //     await message.delete();
                    // }
                } catch (error) {
                    console.error(`Lỗi khi gọi generateContent: ${error.message}`);
                    // Xóa thông báo đang xử lý
                    await processingMsg.delete();
                    message.reply('Có lỗi xảy ra khi gọi AI. Vui lòng thử lại sau.');
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
                await db.addGlobalChatMessage(userId, 'user', prompt);
                
                // Lưu câu trả lời của AI vào database
                await db.addGlobalChatMessage(userId, 'model', content);
                
                // Tóm tắt và cập nhật tiêu đề cuộc trò chuyện
                await db.summarizeAndUpdateGlobalChatTitle(userId, model);
                
                // Xóa thông báo đang xử lý
                await processingMsg.delete();
                
                // Gửi câu trả lời cho người dùng
                await sendEmbedMessage(message.channel, message.author, content);
                
                // LOẠI BỎ phần xóa lệnh của người dùng
                // const fetchedMessage = await message.channel.messages.fetch(message.id).catch(() => null);
                // if (fetchedMessage) {
                //     await message.delete();
                // }
            } catch (error) {
                console.error(`Lỗi khi gọi startChat: ${error.message}`);
                // Xóa thông báo đang xử lý
                await processingMsg.delete();
                
                // Thông báo lỗi cho người dùng
                message.reply('Có lỗi xảy ra khi gọi AI. Đang thử lại với cuộc trò chuyện mới...');
                
                // Tạo một cuộc trò chuyện mới để bắt đầu lại
                try {
                    // Tạo chat mới
                    await db.createNewGlobalChat(userId);
                    
                    // Gọi AI với prompt
                    const result = await model.generateContent(prompt);
                    const content = result.response.text();
                    
                    // Lưu cả câu hỏi và câu trả lời vào database
                    await db.addGlobalChatMessage(userId, 'user', prompt);
                    await db.addGlobalChatMessage(userId, 'model', content);
                    
                    // Tóm tắt và cập nhật tiêu đề cuộc trò chuyện
                    await db.summarizeAndUpdateGlobalChatTitle(userId, model);
                    
                    // Gửi câu trả lời cho người dùng
                    await sendEmbedMessage(message.channel, message.author, content);
                } catch (fallbackError) {
                    console.error(`Lỗi khi thử lại với generateContent: ${fallbackError.message}`);
                    message.reply('Có lỗi xảy ra khi gọi AI. Vui lòng thử lại sau.');
                }
            }
        } catch (error) {
            console.error(`Lỗi chung khi gọi AI: ${error.message}`);
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
            logger.error(`Lỗi khi xem danh sách chat: ${error.message}`);
            message.reply('Có lỗi xảy ra khi lấy danh sách chat.');
        }
    },

};