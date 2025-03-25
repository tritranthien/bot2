const { Pool } = require('pg');
const logger = require('./logger');

// Cấu hình kết nối PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    }
});

// Xử lý lỗi kết nối
pool.on('error', (err) => {
    logger.error('Unexpected error on idle client', err);
});

function initDb() {
    pool.connect((err, client, release) => {
        if (err) {
            logger.error(`Lỗi kết nối database: ${err.message}`);
            return;
        }

        const queries = `
            -- Bảng user_sequences để lưu trữ sequence cho mỗi user
            CREATE TABLE IF NOT EXISTS user_sequences (
                user_id TEXT PRIMARY KEY,
                last_sequence INTEGER DEFAULT 0
            );
            
            -- Bảng chats
            CREATE TABLE IF NOT EXISTS chats (
                id SERIAL PRIMARY KEY,
                user_id TEXT NOT NULL,
                chat_sequence INTEGER NOT NULL,
                chat_id TEXT NOT NULL,
                title TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, chat_sequence)
            );
            
            -- Bảng chat_messages
            CREATE TABLE IF NOT EXISTS chat_messages (
                id SERIAL PRIMARY KEY,
                user_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE
            );
        `;

        client.query(queries, (err) => {
            release();
            if (err) {
                logger.error('Lỗi khởi tạo cơ sở dữ liệu', err);
            } else {
                logger.log('Đã khởi tạo cơ sở dữ liệu');
            }
        });
    });
}

/**
 * Lấy và tăng sequence cho người dùng
 * @param {string} userId - ID của người dùng
 * @returns {Promise<number>} Sequence mới
 */
async function getNextSequence(userId) {
    const client = await pool.connect();
    try {
        // Kiểm tra và cập nhật sequence
        const result = await client.query(
            `INSERT INTO user_sequences (user_id, last_sequence) 
             VALUES ($1, 1) 
             ON CONFLICT (user_id) DO UPDATE 
             SET last_sequence = user_sequences.last_sequence + 1 
             RETURNING last_sequence`,
            [userId]
        );
        return result.rows[0].last_sequence;
    } finally {
        client.release();
    }
}

/**
 * Tạo cuộc trò chuyện mới cho người dùng
 * @param {string} userId - ID của người dùng
 * @returns {Promise<Object>} Thông tin cuộc trò chuyện mới
 */
async function createNewChat(userId) {
    const client = await pool.connect();
    try {
        // Lấy sequence tiếp theo
        const sequence = await getNextSequence(userId);
        
        // Tạo chat_id theo định dạng "a{sequence}"
        const chatId = `a${sequence}`;
        
        // Thêm cuộc trò chuyện mới vào database
        const result = await client.query(
            `INSERT INTO chats (user_id, chat_sequence, chat_id, title) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, chat_id`,
            [userId, sequence, chatId, `Cuộc trò chuyện ${sequence}`]
        );
        
        logger.log(`Đã tạo cuộc trò chuyện mới cho user ${userId}: ${chatId} (ID: ${result.rows[0].id})`);
        
        return {
            id: result.rows[0].id,
            chatId: result.rows[0].chat_id,
            sequence: sequence
        };
    } finally {
        client.release();
    }
}

/**
 * Lấy danh sách cuộc trò chuyện của người dùng
 * @param {string} userId - ID của người dùng
 * @returns {Promise<Array>} Danh sách cuộc trò chuyện
 */
async function getUserChats(userId) {
    const client = await pool.connect();
    try {
        const result = await client.query(
            'SELECT id, chat_id, chat_sequence, title, updated_at FROM chats WHERE user_id = $1 ORDER BY updated_at DESC',
            [userId]
        );
        return result.rows;
    } finally {
        client.release();
    }
}

/**
 * Cập nhật tiêu đề cuộc trò chuyện
 * @param {number} chatId - ID của cuộc trò chuyện
 * @param {string} title - Tiêu đề mới
 */
async function updateChatTitle(chatId, title) {
    const client = await pool.connect();
    try {
        await client.query(
            'UPDATE chats SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [title, chatId]
        );
        return true;
    } finally {
        client.release();
    }
}

/**
 * Xóa toàn bộ lịch sử trò chuyện AI của người dùng
 * @param {string} userId - ID của người dùng
 */
async function deleteUserChatHistory(userId) {
    const client = await pool.connect();
    try {
        // Bắt đầu transaction
        await client.query('BEGIN');

        // Xóa tất cả cuộc trò chuyện và tin nhắn
        const result = await client.query(
            'DELETE FROM chats WHERE user_id = $1 RETURNING id',
            [userId]
        );

        // Reset sequence cho người dùng
        await client.query(
            'UPDATE user_sequences SET last_sequence = 0 WHERE user_id = $1',
            [userId]
        );

        // Commit transaction
        await client.query('COMMIT');

        logger.log(`Đã xóa ${result.rowCount} cuộc trò chuyện và reset sequence của người dùng ${userId}`);

        return { 
            messagesDeleted: result.rowCount > 0, 
            chatsDeleted: result.rowCount 
        };
    } catch (error) {
        // Rollback transaction nếu có lỗi
        await client.query('ROLLBACK');
        logger.error(`Lỗi khi xóa lịch sử trò chuyện: ${error.message}`);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Xóa một cuộc trò chuyện cụ thể theo ID
 * @param {string} userId - ID của người dùng
 * @param {string} chatId - ID của cuộc trò chuyện (định dạng "a{sequence}")
 * @returns {Promise<Object>} Kết quả xóa
 */
async function deleteChatById(userId, chatId) {
    const client = await pool.connect();
    try {
        // Bắt đầu transaction
        await client.query('BEGIN');

        // Kiểm tra xem cuộc trò chuyện có tồn tại và thuộc về người dùng này không
        const checkResult = await client.query(
            'SELECT id FROM chats WHERE user_id = $1 AND chat_id = $2',
            [userId, chatId]
        );

        if (checkResult.rowCount === 0) {
            throw new Error('Không tìm thấy cuộc trò chuyện hoặc bạn không có quyền xóa nó');
        }

        const dbChatId = checkResult.rows[0].id;

        // Xóa tin nhắn trong cuộc trò chuyện
        await client.query('DELETE FROM chat_messages WHERE chat_id = $1', [dbChatId]);

        // Xóa cuộc trò chuyện
        await client.query('DELETE FROM chats WHERE id = $1', [dbChatId]);

        // Commit transaction
        await client.query('COMMIT');

        logger.log(`Đã xóa cuộc trò chuyện ${chatId} của người dùng ${userId}`);

        return { 
            success: true, 
            chatId: chatId 
        };
    } catch (error) {
        // Rollback transaction nếu có lỗi
        await client.query('ROLLBACK');
        logger.error(`Lỗi khi xóa cuộc trò chuyện: ${error.message}`);
        throw error;
    } finally {
        client.release();
    }
}

// Lấy ID cuộc trò chuyện hiện tại của người dùng
async function getCurrentChatId(userId) {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT id FROM chats 
             WHERE user_id = $1 
             ORDER BY updated_at DESC LIMIT 1`,
            [userId]
        );

        if (result.rowCount === 0) {
            // Nếu không có chat nào, tạo mới
            const newChat = await createNewChat(userId);
            return newChat.id;
        }

        return result.rows[0].id;
    } finally {
        client.release();
    }
}

// Lấy thông tin cuộc trò chuyện hiện tại của người dùng
async function getCurrentChat(userId) {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT id, chat_id FROM chats 
             WHERE user_id = $1 
             ORDER BY updated_at DESC LIMIT 1`,
            [userId]
        );

        if (result.rowCount === 0) {
            // Nếu không có cuộc trò chuyện nào, tạo mới
            const newChat = await createNewChat(userId);
            return {
                id: newChat.id,
                chat_id: newChat.chatId
            };
        }

        return result.rows[0];
    } finally {
        client.release();
    }
}

// Thêm tin nhắn vào một cuộc trò chuyện
async function addChatMessage(userId, role, content) {
    const client = await pool.connect();
    try {
        const chatId = await getCurrentChatId(userId);

        const result = await client.query(
            `INSERT INTO chat_messages (chat_id, user_id, role, content) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id`,
            [chatId, userId, role, content]
        );

        // Cập nhật thời gian cập nhật mới nhất của cuộc trò chuyện
        await client.query(
            `UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [chatId]
        );

        return result.rows[0].id;
    } finally {
        client.release();
    }
}

// Lấy tin nhắn của một cuộc trò chuyện cụ thể
async function getChatMessages(chatId, limit = 10) {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT role, content FROM chat_messages 
             WHERE chat_id = $1 
             ORDER BY id DESC LIMIT $2`,
            [chatId, limit * 2]
        );

        // Đảo ngược để có thứ tự thời gian đúng
        return result.rows.reverse();
    } finally {
        client.release();
    }
}

// Lấy lịch sử cuộc trò chuyện hiện tại của người dùng
async function getCurrentChatHistory(userId, limit = 10) {
    const chatId = await getCurrentChatId(userId);
    return await getChatMessages(chatId, limit);
}

// Cập nhật thời gian truy cập của cuộc trò chuyện
async function updateChatTime(userId, chatId) {
    const client = await pool.connect();
    try {
        await client.query(
            'UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2', 
            [chatId, userId]
        );
        logger.log(`Đã cập nhật thời gian truy cập cho cuộc trò chuyện ${chatId} của người dùng ${userId}`);
        return true;
    } finally {
        client.release();
    }
}

// Lấy tin nhắn từ cuộc trò chuyện
async function getMessagesFromChat(chatDbId, limit = 10) {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT role, content FROM chat_messages 
             WHERE chat_id = $1 
             ORDER BY id DESC LIMIT $2`,
            [chatDbId, limit * 2]
        );

        // Đảo ngược để có thứ tự thời gian đúng
        return result.rows.reverse();
    } finally {
        client.release();
    }
}

// Đóng kết nối database
function closeDb() {
    pool.end().then(() => {
        logger.log('Đã đóng kết nối database.');
    }).catch(err => {
        logger.error(`Lỗi đóng database: ${err.message}`);
    });
}

// Hàm tóm tắt và cập nhật tiêu đề cuộc trò chuyện
async function summarizeAndUpdateChatTitle(userId, model) {
    const client = await pool.connect();
    try {
        // Lấy cuộc trò chuyện hiện tại của người dùng
        const currentChat = await getCurrentChat(userId);
        
        // Lấy một số tin nhắn gần đây để tóm tắt
        const messagesResult = await client.query(
            'SELECT role, content FROM chat_messages WHERE chat_id = $1 ORDER BY timestamp DESC LIMIT 5', 
            [currentChat.id]
        );

        const messages = messagesResult.rows;
        
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
        await updateChatTitle(currentChat.id, title);
        
        logger.log(`Đã cập nhật tiêu đề cho cuộc trò chuyện ${currentChat.id}: ${title}`);
        
    } catch (error) {
        logger.error(`Lỗi khi tóm tắt cuộc trò chuyện: ${error.message}`);
    } finally {
        client.release();
    }
}

module.exports = {
    initDb,
    createNewChat,
    getCurrentChatId,
    getUserChats,
    addChatMessage,
    getCurrentChatHistory,
    summarizeAndUpdateChatTitle,
    closeDb,
    deleteUserChatHistory,
    getCurrentChat,
    deleteChatById,
    updateChatTime,
    getMessagesFromChat
};