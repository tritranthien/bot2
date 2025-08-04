import { EmbedBuilder } from 'discord.js';
import { GlobalChat } from '../../models/global_chat.js';
import '../../utils/logger.js';
export default {
    name: 'gai',
    description: 'Trò chuyện AI trong chat toàn cục với các cuộc trò chuyện riêng biệt',
    async execute({ message, args, config, logModAction, sendEmbedMessage, client, model, gchatM }) {
        const subCommand = args[0] ? args[0].toLowerCase() : null;
        switch (subCommand) {
            case 'history':
                return await this.showGlobalChatList(message);
            case 'newchat.js':
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
            const userId = message.author.id;
            let processingMsg;
            const gChatModel = new GlobalChat();
            if (chatId) {
                if (!chatId.match(/^g\d+$/)) {
                    message.reply('❌ ID cuộc trò chuyện không hợp lệ. ID phải có định dạng "g" theo sau là một số, ví dụ: a1, a2, a3, ...');
                    return;
                }
                if ('send' in message.channel) {
                    processingMsg = await message.channel.send(`🗑️ Đang xóa cuộc trò chuyện ${chatId}...`);
                }
                try {
                    await gChatModel.deleteGlobalChatById(chatId);
                    await processingMsg?.delete().catch(() => { });
                    await message.reply(`✅ Đã xóa cuộc trò chuyện ${chatId}.`);
                    console.log(`User ${message.author.tag} (${userId}) đã xóa cuộc trò chuyện ${chatId}.`);
                }
                catch (error) {
                    await processingMsg?.delete().catch(() => { });
                    await message.reply(`❌ ${error.message}`);
                }
            }
            else {
                if ('send' in message.channel) {
                    processingMsg = await message.channel.send('🗑️ Đang xóa toàn bộ lịch sử trò chuyện...');
                }
                await gChatModel.deleteGlobalChatHistory();
                await gChatModel.createNewGlobalChat(userId);
                await processingMsg?.delete().catch(() => { });
                await message.reply('✅ Đã xóa tất cả lịch sử trò chuyện của bạn với AI. Một cuộc trò chuyện mới đã được tạo.');
                console.log(`User ${message.author.tag} (${userId}) đã xóa toàn bộ lịch sử trò chuyện AI.`);
                return;
            }
        }
        catch (error) {
            console.error(`Lỗi khi xóa lịch sử trò chuyện: ${error.message}`);
            message.reply('❌ Có lỗi xảy ra khi xóa lịch sử trò chuyện. Vui lòng thử lại sau.');
        }
    },
    async showGlobalChatList(message) {
        try {
            const globalChatM = new GlobalChat();
            const chatList = await globalChatM.getGlobalChatsWithMessageCounts();
            if (chatList.length === 0) {
                message.reply('Chưa có cuộc trò chuyện nào. 🪹');
                return;
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
                    name: `Chat ID: ${chat.chat_id}`,
                    value: `Số tin nhắn: ${chat?._count?.global_chat_messages || 0}`,
                    inline: false
                });
            }
            if ('send' in message.channel) {
                await message.channel.send({ embeds: [embed] });
                return;
            }
        }
        catch (error) {
            console.error(`❌ Lỗi khi xem danh sách chat: ${error.message}`);
            message.reply('❌ Có lỗi xảy ra khi lấy danh sách chat.');
        }
    },
    async startNewGlobalChat(message) {
        const senderId = message.author.id;
        try {
            const globalChatM = new GlobalChat();
            await globalChatM.createNewGlobalChat(senderId);
            await message.reply('Đã tạo cuộc trò chuyện mới. Bạn có thể bắt đầu trò chuyện với lệnh `!gai`.');
            console.log(`User ${message.author.tag} (${senderId}) đã tạo cuộc trò chuyện mới.`);
        }
        catch (error) {
            console.error(`Lỗi khi tạo cuộc trò chuyện mới: ${error.message}`);
            message.reply('Có lỗi xảy ra khi tạo cuộc trò chuyện mới. Vui lòng thử lại sau.');
        }
    },
    async continueGlobalChat(message, chatId) {
        if (!chatId || !chatId.startsWith('g')) {
            message.reply('💁 Vui lòng cung cấp Chat ID hợp lệ (ví dụ: g1, g2).');
            return;
        }
        try {
            const globalChatM = new GlobalChat();
            const chats = await globalChatM.getGlobalChats();
            const targetChat = chats.find(chat => chat.chat_id === chatId);
            if (!targetChat) {
                message.reply(`Không tìm thấy cuộc trò chuyện với ID "${chatId}". Vui lòng kiểm tra lại hoặc sử dụng lệnh \`!chats\` để xem danh sách cuộc trò chuyện của bạn.`);
                return;
            }
            await globalChatM.save({ id: targetChat.id, updated_at: new Date() });
            const messages = await globalChatM.getGlobalChatMessages(targetChat.id, 5);
            if (messages.length === 0) {
                message.reply(`Không tìm thấy tin nhắn trong chat ${chatId}. 🙈`);
                return;
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
                const uid = msg.role === 'user' ? msg.name : "";
                embed.addFields({
                    name: `${roleName} ${uid}`,
                    value: msg.content.substring(0, 200) + (msg.content.length > 200 ? '...' : ''),
                    inline: false
                });
            });
            if ('send' in message.channel) {
                await message.channel.send({ embeds: [embed] });
            }
            message.reply(`Đã chuyển đến chat ${chatId}. Bạn có thể tiếp tục trò chuyện. 💬`);
        }
        catch (error) {
            console.error(`❌ Lỗi khi tiếp tục chat: ${error.message}`);
            message.reply('❌ Có lỗi xảy ra khi tiếp tục chat.');
        }
    },
    async processGlobalChatMessage(message, args, model, sendEmbedMessage) {
        if (!args.length) {
            message.reply('Vui lòng nhập nội dung để trò chuyện với AI. 💬');
            return;
        }
        const userId = message.author.id;
        const userName = message.author.displayName;
        const prompt = args.join(' ');
        let processingMsg;
        try {
            const globalChatM = new GlobalChat();
            if ('send' in message.channel) {
                processingMsg = await message.channel.send('🤔 Đang xử lý 1...');
            }
            const currentChat = await globalChatM.getCurrentGlobalChat();
            let historyRows = await globalChatM.getGlobalChatMessages(currentChat.id, 5);
            let conversation = historyRows.map(row => ({
                role: row.role,
                parts: [{ text: row.content }]
            }));
            if (conversation.length === 0) {
                try {
                    const result = await model.generateContent(prompt);
                    const content = result.response.text();
                    await globalChatM.addGlobalChatMessage(userId, 'user', prompt, userName);
                    await globalChatM.addGlobalChatMessage(userId, 'model', content, userName);
                    await this.summarizeAndUpdateGlobalChatTitle(model);
                    await processingMsg?.delete();
                    await sendEmbedMessage(message.channel, message.author, content);
                }
                catch (error) {
                    console.log(`Lỗi khi gọi generateContent: ${error.message}`);
                    await processingMsg?.delete();
                    message.reply('Có lỗi xảy ra khi gọi AI. Vui lòng thử lại sau.');
                }
                return;
            }
            try {
                const chat = model.startChat({
                    history: conversation,
                    generationConfig: {
                        maxOutputTokens: 1000,
                    }
                });
                const result = await chat.sendMessage(prompt);
                const content = result.response.text();
                await globalChatM.addGlobalChatMessage(userId, 'user', prompt, userName);
                await globalChatM.addGlobalChatMessage(userId, 'model', content, userName);
                await this.summarizeAndUpdateGlobalChatTitle(model);
                await processingMsg?.delete();
                await sendEmbedMessage(message.channel, message.author, content);
                return;
            }
            catch (error) {
                console.error(`Lỗi khi gọi startChat: ${error.message}`);
                await processingMsg?.delete();
                message.reply('Có lỗi xảy ra khi gọi AI. Đang thử lại với cuộc trò chuyện mới...');
                try {
                    await globalChatM.createNewGlobalChat(userId);
                    const result = await model.generateContent(prompt);
                    const content = result.response.text();
                    await globalChatM.addGlobalChatMessage(userId, 'user', prompt, userName);
                    await globalChatM.addGlobalChatMessage(userId, 'model', content, userName);
                    await this.summarizeAndUpdateGlobalChatTitle(model);
                    await sendEmbedMessage(message.channel, message.author, content);
                    return;
                }
                catch (fallbackError) {
                    console.log(`Lỗi khi thử lại với generateContent: ${fallbackError.message}`);
                    message.reply('Có lỗi xảy ra khi gọi AI. Vui lòng thử lại sau.');
                }
            }
        }
        catch (error) {
            console.log(`❌ Lỗi trong chat toàn cục: ${error.message}`);
            message.reply('❌ Có lỗi xảy ra khi gọi AI. Vui lòng thử lại sau.');
        }
    },
    async summarizeAndUpdateGlobalChatTitle(model) {
        try {
            const globalChatM = new GlobalChat();
            const currentChat = await globalChatM.getCurrentGlobalChat();
            // Lấy 5 tin nhắn gần đây
            const messages = await globalChatM.getGlobalChatMessages(currentChat.id, 5);
            if (messages.length === 0) {
                return;
            }
            // Tạo context cho AI
            let context = messages.map(msg => `${msg.role === 'user' ? 'Người dùng' : 'AI'}: ${msg.content}`).reverse().join('\n');
            // Prompt để tóm tắt
            const prompt = `Dựa vào đoạn hội thoại sau, hãy tạo một tiêu đề ngắn gọn (dưới 50 ký tự) cho cuộc trò chuyện này:\n\n${context}\n\nTiêu đề:`;
            // Gọi AI để tóm tắt
            const result = await model.generateContent(prompt);
            let title = result.response.text().trim();
            // Đảm bảo tiêu đề không quá dài
            if (title.length > 50) {
                title = title.substring(0, 47) + '...';
            }
            // Thêm chat_id vào tiêu đề
            title = `[${currentChat.chat_id}] ${title}`;
            // Cập nhật tiêu đề
            await globalChatM.updateChatTitle(currentChat.id, title);
            console.log(`✅ Đã cập nhật tiêu đề cho cuộc trò chuyện ${currentChat.id}: ${title}`);
        }
        catch (error) {
            console.error('Lỗi khi tóm tắt cuộc trò chuyện:', error);
        }
    }
};
