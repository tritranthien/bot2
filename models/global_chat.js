import { config } from "../../config.js";
const repoPath = config.repoPath || 'postgresql';
const GlobalChatRepo = await import(`../repo/${repoPath}/global_chat.js`);
const GlobalChatMessageRepo = await import(`../repo/${repoPath}/global_chat_message.js`);
import Base from "./base.js";
export class GlobalChat extends Base {
    globalChatMessagesRepo;
    constructor() {
        super();
        this.repo = new GlobalChatRepo();
        this.globalChatMessagesRepo = new GlobalChatMessageRepo();
    }

    // Tạo global chat mới
    async createNewGlobalChat(senderId) {
        try {
            // Lấy sequence tiếp theo
            const sequenceResult = await this.repo.findFirst(
                {},
                { chat_sequence: true },
                null,
                { chat_sequence: 'desc' }
            );

            const sequence = sequenceResult 
                ? sequenceResult.chat_sequence + 1 
                : 1;
            const chatId = `g${sequence}`;

            const newChat = await this.repo.save(
                {},
                {
                    chat_sequence: sequence,
                    chat_id: chatId,
                    title: `Cuộc trò chuyện ${sequence}`,
                    creator_id: senderId
                }
            );

            console.log(`✅ Đã tạo global chat mới: ${chatId} (ID: ${newChat.id})`);

            return {
                id: newChat.id,
                chatId: newChat.chat_id,
                sequence: newChat.chat_sequence
            };
        } catch (error) {
            console.error('Lỗi khi tạo global chat:', error);
            throw error;
        }
    }

    // Lấy danh sách global chats
    async getGlobalChats() {
        try {
            return await this.repo.findMany({
                orderBy: { updated_at: 'desc' },
                select: {
                    id: true,
                    chat_id: true,
                    chat_sequence: true,
                    title: true,
                    updated_at: true
                }
            });
        } catch (error) {
            console.error('Lỗi khi lấy danh sách global chats:', error);
            throw error;
        }
    }

    // Lấy global chat hiện tại
    async getCurrentGlobalChat() {
        try {
            const currentChat = await this.repo.findFirst(
                {},
                {
                    id: true,
                    chat_id: true
                },
                null,
                { updated_at: 'desc' }
            );

            if (!currentChat) {
                // Nếu không có chat, tạo mới
                return this.createNewGlobalChat('system');
            }

            return currentChat;
        } catch (error) {
            console.error('Lỗi khi lấy global chat hiện tại:', error);
            throw error;
        }
    }

    // Thêm tin nhắn vào global chat
    async addGlobalChatMessage(userId, role, content, name = "") {
        try {
            const currentChat = await this.getCurrentGlobalChat();

            const message = await this.globalChatMessagesRepo.save(
                {},
                {
                    chat_id: currentChat.id,
                    user_id: userId,
                    role: role,
                    content: content,
                    name: name
                }
            );

            // Cập nhật thời gian của global chat
            await this.repo.save(
                { id: currentChat.id },
                { updated_at: new Date() }
            );

            return message.id;
        } catch (error) {
            console.error('Lỗi khi thêm tin nhắn:', error);
            throw error;
        }
    }

    // Lấy tin nhắn của global chat
    async getGlobalChatMessages(chatId, limit = 10) {
        try {
            const messages = await this.globalChatMessagesRepo.findMany({
                where: { chat_id: chatId },
                orderBy: { id: 'desc' },
                take: limit * 2,
                select: {
                    role: true,
                    content: true,
                    user_id: true,
                    name: true
                }
            });

            return messages.reverse();
        } catch (error) {
            console.error('Lỗi khi lấy tin nhắn:', error);
            throw error;
        }
    }

    // Xóa global chat
    async deleteGlobalChatById(chatId) {
        try {
            // Xóa tin nhắn trước
            await this.globalChatMessagesRepo.deleteBy({ chat_id: chatId });

            // Xóa chat
            await this.repo.delete(chatId);

            return { 
                success: true, 
                chatId: chatId 
            };
        } catch (error) {
            console.error('Lỗi khi xóa global chat:', error);
            throw error;
        }
    }

    // Xóa toàn bộ lịch sử global chat
    async deleteGlobalChatHistory() {
        try {
            // Xóa tin nhắn
            const messageDelete = await this.globalChatMessagesRepo.deleteAll();

            // Xóa chat
            const chatDelete = await this.repo.deleteAll();

            return {
                messagesDeleted: messageDelete.count > 0,
                chatsDeleted: chatDelete.count
            };
        } catch (error) {
            console.error('Lỗi khi xóa lịch sử global chat:', error);
            throw error;
        }
    }

    // Cập nhật tiêu đề global chat
    async updateChatTitle(chatId, title) {
        try {
            await this.repo.save(
                { id: chatId },
                { 
                    title, 
                    updated_at: new Date() 
                }
            );
            return true;
        } catch (error) {
            console.error('Lỗi khi cập nhật tiêu đề:', error);
            throw error;
        }
    }

    // Tóm tắt và cập nhật tiêu đề
    async summarizeAndUpdateGlobalChatTitle(userId, model) {
        try {
            const currentChat = await this.getCurrentGlobalChat();
            
            // Lấy 5 tin nhắn gần đây
            const messages = await this.getGlobalChatMessages(currentChat.id, 5);

            if (messages.length === 0) {
                return;
            }

            // Tạo context cho AI
            let context = messages.map(msg => 
                `${msg.role === 'user' ? 'Người dùng' : 'AI'}: ${msg.content}`
            ).reverse().join('\n');

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
            await this.updateChatTitle(currentChat.id, title);

            console.log(`✅ Đã cập nhật tiêu đề cho cuộc trò chuyện ${currentChat.id}: ${title}`);

        } catch (error) {
            console.error('Lỗi khi tóm tắt cuộc trò chuyện:', error);
        }
    }
}