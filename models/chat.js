import { config } from "../../config.js";
const repoPath = config.repoPath || 'postgresql';
const ChatRepo = await import(`../repo/${repoPath}/chat.js`);
const ChatMessageRepo = await import(`../repo/${repoPath}/chat_message.js`);
import Base from "./base.js";
export class Chat extends Base {
    chatMessagesRepo;
    constructor() {
        super();
        this.repo = new ChatRepo();
        this.chatMessagesRepo = new ChatMessageRepo();
    }
    async getNextSequence(userId) {
        try {
            const userSequence = await this.repo.save(
                { user_id: userId },
                { last_sequence: { increment: 1 } }
            );
            return userSequence.last_sequence;
        } catch (error) {
            console.error('Lỗi khi lấy sequence:', error);
            throw error;
        }
    }

    // Tạo chat mới
    async createNewChat(userId) {
        try {
            const sequence = await this.getNextSequence(userId);
            const chatId = `a${sequence}`;

            const newChat = await this.repo.save(
                { user_id: userId },
                {
                    chat_sequence: sequence,
                    chat_id: chatId,
                    title: `Cuộc trò chuyện ${sequence}`
                }
            );

            console.log(`✅ Đã tạo cuộc trò chuyện mới cho user ${userId}: ${chatId} (ID: ${newChat.id})`);

            return {
                id: newChat.id,
                chatId: newChat.chat_id,
                sequence: sequence
            };
        } catch (error) {
            console.error('Lỗi khi tạo chat mới:', error);
            throw error;
        }
    }

    // Lấy danh sách chat của user
    async getUserChats(userId) {
        try {
            return await this.repo.findMany({
                where: { user_id: userId },
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
            console.error('Lỗi khi lấy danh sách chat:', error);
            throw error;
        }
    }

    // Lấy chat hiện tại của user
    async getCurrentChat(userId) {
        try {
            const currentChat = await this.repo.findFirst(
                { user_id: userId },
                {
                    id: true,
                    chat_id: true
                },
                null,
                { updated_at: 'desc' }
            );

            if (!currentChat) {
                // Nếu không có chat, tạo mới
                return this.createNewChat(userId);
            }

            return currentChat;
        } catch (error) {
            console.error('Lỗi khi lấy chat hiện tại:', error);
            throw error;
        }
    }

    // Thêm tin nhắn vào chat
    async addChatMessage(userId, role, content) {
        try {
            const currentChat = await this.getCurrentChat(userId);

            const message = await this.repo.upsert({
                data: {
                    chat_id: currentChat.id,
                    user_id: userId,
                    role: role,
                    content: content
                }
            });

            // Cập nhật thời gian của chat
            await this.repo.save({
                where: { id: currentChat.id },
                data: { updated_at: new Date() }
            });

            return message.id;
        } catch (error) {
            console.error('Lỗi khi thêm tin nhắn:', error);
            throw error;
        }
    }

    // Lấy tin nhắn của chat
    async getChatMessages(chatId, limit = 10) {
        try {
            const messages = await this.repo.findMany({
                where: { chat_id: chatId },
                orderBy: { id: 'desc' },
                take: limit * 2,
                select: {
                    role: true,
                    content: true
                }
            });

            return messages.reverse();
        } catch (error) {
            console.error('Lỗi khi lấy tin nhắn:', error);
            throw error;
        }
    }

    // Xóa chat
    async deleteChatById(userId, chatId) {
        try {
            // Tìm chat của user
            const chat = await this.repo.findFirst({ 
                user_id: userId,
                chat_id: chatId 
            });

            if (!chat) {
                throw new Error('Không tìm thấy chat hoặc bạn không có quyền xóa');
            }

            // Xóa tin nhắn trước
            await this.chatMessagesRepo.deleteBy({ chat_id: chat.id });

            // Xóa chat
            await this.repo.delete(chat.id);

            return { 
                success: true, 
                chatId: chatId 
            };
        } catch (error) {
            console.error('Lỗi khi xóa chat:', error);
            throw error;
        }
    }

    // Xóa toàn bộ lịch sử chat của user
    async deleteUserChatHistory(userId) {
        try {
            // Xóa tin nhắn
            const messageDelete = await this.chatMessagesRepo.deleteBy({ user_id: userId });

            // Xóa chat
            const chatDelete = await this.repo.deleteBy({ user_id: userId });

            // Reset sequence
            await this.repo.save(
                { user_id: userId },
                { last_sequence: 0 }
            );

            return {
                messagesDeleted: messageDelete.count > 0,
                chatsDeleted: chatDelete.count
            };
        } catch (error) {
            console.error('Lỗi khi xóa lịch sử chat:', error);
            throw error;
        }
    }
}