import { NewsChannel, TextChannel } from 'discord.js';
import { Chat as ChatModel } from '../../models/chat.js';
import '../../utils/logger.js';
export default {
    name: 'ai',
    description: 'Talk to the AI with persistent conversation history using the current chat. 🤖',
    async execute({ message, args, config, logModAction, sendEmbedMessage, client, model, chatM }) {
        if (!args.length) {
            message.reply('⚠️ Bạn cần nhập nội dung để gọi AI.');
            return;
        }
        let userId = message.author.id;
        const member = message.mentions.members?.first();
        if (member) {
            userId = member.id;
            args.shift();
        }
        const prompt = args.join(' ');
        try {
            let processingMsg;
            if (message.channel instanceof TextChannel || message.channel instanceof NewsChannel) {
                processingMsg = await message.channel.send('🤔 Đang xử lý...');
            }
            let historyRows = await chatM.getUserChatHistory(userId, 5);
            let conversation = historyRows.map(row => ({
                role: row.role,
                parts: [{ text: row.content }]
            }));
            console.log(`🗣️ Lịch sử cuộc trò chuyện của ${userId}: ${JSON.stringify(conversation)}`);
            if (conversation.length === 0) {
                try {
                    const result = await model.generateContent(prompt);
                    const content = result.response.text();
                    await chatM.addChatMessage(userId, 'user', prompt);
                    await chatM.addChatMessage(userId, 'model', content);
                    await this.summarizeAndUpdateChatTitle(userId, model);
                    await processingMsg?.delete();
                    await sendEmbedMessage(message.channel, message.author, content);
                }
                catch (error) {
                    console.error(`❌ Lỗi khi gọi generateContent: ${error.message}`);
                    await processingMsg?.delete();
                    message.reply('❌ Có lỗi xảy ra khi gọi AI. Vui lòng thử lại sau.');
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
                await chatM.addChatMessage(userId, 'user', prompt);
                await chatM.addChatMessage(userId, 'model', content);
                await this.summarizeAndUpdateChatTitle(userId, model);
                await processingMsg?.delete();
                await sendEmbedMessage(message.channel, message.author, content);
            }
            catch (error) {
                console.error(`❌ Lỗi khi gọi startChat: ${error.message}`);
                await processingMsg?.delete();
                message.reply('🔄 Đang thử lại với cuộc trò chuyện mới...');
                try {
                    await chatM.createNewChat(userId);
                    const result = await model.generateContent(prompt);
                    const content = result.response.text();
                    await chatM.addChatMessage(userId, 'user', prompt);
                    await chatM.addChatMessage(userId, 'model', content);
                    await this.summarizeAndUpdateChatTitle(userId, model);
                    await sendEmbedMessage(message.channel, message.author, content);
                }
                catch (fallbackError) {
                    console.error(`❌ Lỗi khi thử lại với generateContent: ${fallbackError.message}`);
                    message.reply('❌ Có lỗi xảy ra khi gọi AI. Vui lòng thử lại sau.');
                }
            }
        }
        catch (error) {
            console.error(`❌ Lỗi chung khi gọi AI: ${error.message}`);
            message.reply('❌ Có lỗi xảy ra khi gọi AI. Vui lòng thử lại sau.');
        }
    },
    async summarizeAndUpdateChatTitle(userId, model) {
        try {
            const currentChat = await (new ChatModel()).getCurrentChat(userId);
            const messages = await (new ChatModel()).getChatMessages(currentChat.id, 5);
            if (messages.length === 0) {
                return;
            }
            let context = messages.map(msg => `${msg.role === 'user' ? 'Người dùng' : 'AI'}: ${msg.content}`).reverse().join('\n');
            const prompt = `Dựa vào đoạn hội thoại sau, hãy tạo một tiêu đề ngắn gọn (dưới 50 ký tự) cho cuộc trò chuyện này:\n\n${context}\n\nTiêu đề:`;
            const result = await model.generateContent(prompt);
            let title = result.response.text().trim();
            if (title.length > 50) {
                title = title.substring(0, 47) + '...';
            }
            title = `[${currentChat.chat_id}] ${title}`;
            await (new ChatModel()).save({ title }, { id: currentChat.id });
            console.log(`✅ Đã cập nhật tiêu đề cho cuộc trò chuyện ${currentChat.id}: ${title}`);
        }
        catch (error) {
            console.error(`❌ Lỗi khi tóm tắt cuộc trò chuyện: ${error.message}`);
        }
    }
};
