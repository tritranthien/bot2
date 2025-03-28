// utils/database.js
import * as sqlite from 'sqlite3';
const sqlite3 = sqlite.verbose();
import * as path from 'path';
import './logger.js';

// Kết nối tới database
const dbPath = path.join(__dirname, '../data/bot.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error(`❌ Lỗi kết nối database: ${err.message}`);
        return;
    }
    console.log('✅ Đã kết nối tới SQLite database.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT
    )`, (err) => {
        if (err) {
            console.error("❌ Lỗi khi tạo bảng settings:", err.message);
        } else {
            console.log("✅ Bảng 'settings' đã sẵn sàng.");
        }
    });
});

function initDb() {
    db.serialize(() => {
        // Bảng user_sequences để lưu trữ sequence cho mỗi user
        db.run(`CREATE TABLE IF NOT EXISTS user_sequences (
            user_id TEXT PRIMARY KEY,
            last_sequence INTEGER DEFAULT 0
        )`);
        
        // Bảng chats (cập nhật hoặc giữ nguyên nếu đã có)
        db.run(`CREATE TABLE IF NOT EXISTS chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            chat_sequence INTEGER NOT NULL,
            chat_id TEXT NOT NULL,
            title TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, chat_sequence)
        )`);
        
        // Bảng messages (giữ nguyên)
        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id INTEGER,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            chat_id INTEGER NOT NULL
        )`);
        
        console.log('✅ Đã khởi tạo cơ sở dữ liệu');
    });
}

/**
 * Lấy và tăng sequence cho người dùng
 * @param {string} userId - ID của người dùng
 * @returns {Promise<number>} Sequence mới
 */
async function getNextSequence(userId) {
    return new Promise((resolve, reject) => {
        // Kiểm tra xem user đã có trong bảng sequences chưa
        db.get('SELECT last_sequence FROM user_sequences WHERE user_id = ?', [userId], (err, row) => {
            if (err) {
                return reject(err);
            }
            
            if (row) {
                // Nếu đã có, tăng sequence lên 1
                const newSequence = row.last_sequence + 1;
                db.run('UPDATE user_sequences SET last_sequence = ? WHERE user_id = ?', 
                    [newSequence, userId], (updateErr) => {
                    if (updateErr) {
                        return reject(updateErr);
                    }
                    resolve(newSequence);
                });
            } else {
                // Nếu chưa có, tạo mới với sequence = 1
                db.run('INSERT INTO user_sequences (user_id, last_sequence) VALUES (?, ?)', 
                    [userId, 1], (insertErr) => {
                    if (insertErr) {
                        return reject(insertErr);
                    }
                    resolve(1);
                });
            }
        });
    });
}

/**
 * Tạo cuộc trò chuyện mới cho người dùng
 * @param {string} userId - ID của người dùng
 * @returns {Promise<number>} ID của cuộc trò chuyện mới
 */
async function createNewChat(userId) {
    return new Promise(async (resolve, reject) => {
        try {
            // Lấy sequence tiếp theo cho user này
            const sequence = await getNextSequence(userId);
            
            // Tạo chat_id theo định dạng "a{sequence}"
            const chatId = `a${sequence}`;
            
            // Thêm cuộc trò chuyện mới vào database
            db.run('INSERT INTO chats (user_id, chat_sequence, chat_id, title) VALUES (?, ?, ?, ?)', 
                [userId, sequence, chatId, `Cuộc trò chuyện ${sequence}`], function(err) {
                if (err) {
                    return reject(err);
                }
                
                // Trả về ID của cuộc trò chuyện mới
                resolve({
                    id: this.lastID,
                    chatId: chatId,
                    sequence: sequence
                });
                
                console.log(`💬 Đã tạo cuộc trò chuyện mới cho user ${userId}: ${chatId} (ID: ${this.lastID})`);
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Lấy danh sách cuộc trò chuyện của người dùng
 * @param {string} userId - ID của người dùng
 * @returns {Promise<Array>} Danh sách cuộc trò chuyện
 */
async function getUserChats(userId) {
    return new Promise((resolve, reject) => {
        db.all('SELECT id, chat_id, chat_sequence, title, updated_at FROM chats WHERE user_id = ? ORDER BY updated_at DESC', 
            [userId], (err, rows) => {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
}

/**
 * Cập nhật tiêu đề cuộc trò chuyện
 * @param {number} chatId - ID của cuộc trò chuyện
 * @param {string} title - Tiêu đề mới
 */
async function updateChatTitle(chatId, title) {
    return new Promise((resolve, reject) => {
        db.run('UPDATE chats SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
            [title, chatId], (err) => {
            if (err) {
                return reject(err);
            }
            resolve(true);
        });
    });
}

/**
 * Tóm tắt và cập nhật tiêu đề cuộc trò chuyện
 * @param {string} userId - ID của người dùng
 * @param {object} model - Model AI để tóm tắt
 */
async function summarizeAndUpdateChatTitle(userId, model) {
    try {
        // Lấy cuộc trò chuyện hiện tại của người dùng
        const currentChat = await getCurrentChat(userId);
        if (!currentChat) {
            throw new Error('Không tìm thấy cuộc trò chuyện hiện tại');
        }
        
        // Lấy một số tin nhắn gần đây để tóm tắt - Sửa từ 'messages' thành 'chat_messages'
        const messages = await new Promise((resolve, reject) => {
            db.all(
                'SELECT role, content FROM chat_messages WHERE chat_id = ? ORDER BY timestamp DESC LIMIT 5', 
                [currentChat.id], 
                (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(rows);
                }
            );
        });
        
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
        
        console.log(`Đã cập nhật tiêu đề cho cuộc trò chuyện ${currentChat.id}: ${title}`);
        
    } catch (error) {
        console.error(`Lỗi khi tóm tắt cuộc trò chuyện: ${error.message}`);
        // Tiếp tục mà không làm gì nếu tóm tắt thất bại
    }
}

/**
 * Xóa toàn bộ lịch sử trò chuyện AI của người dùng, reset sequence
 * @param {string} userId - ID của người dùng
 */
async function deleteUserChatHistory(userId) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Lấy danh sách các chat_id của người dùng
            db.all('SELECT id FROM chats WHERE user_id = ?', [userId], (err, rows) => {
                if (err) {
                    console.error(`Lỗi khi lấy danh sách chat ID: ${err.message}`);
                    return reject(err);
                }
                
                // Nếu không có cuộc trò chuyện nào, reset sequence và trả về kết quả trống
                if (rows.length === 0) {
                    // Reset sequence cho người dùng
                    db.run('UPDATE user_sequences SET last_sequence = 0 WHERE user_id = ?', [userId], (seqErr) => {
                        if (seqErr) {
                            console.error(`Lỗi khi reset sequence: ${seqErr.message}`);
                        }
                        return resolve({ messagesDeleted: 0, chatsDeleted: 0 });
                    });
                    return;
                }
                
                // Lấy tất cả chat_id để xóa tin nhắn
                const chatIds = rows.map(row => row.id);
                
                // Bắt đầu transaction để đảm bảo tính toàn vẹn dữ liệu
                db.run('BEGIN TRANSACTION', (transErr) => {
                    if (transErr) {
                        console.error(`Lỗi khi bắt đầu transaction: ${transErr.message}`);
                        return reject(transErr);
                    }
                    
                    // Xóa tất cả tin nhắn trong các cuộc trò chuyện
                    const placeholders = chatIds.map(() => '?').join(',');
                    db.run(`DELETE FROM messages WHERE chat_id IN (${placeholders})`, chatIds, (messagesErr) => {
                        if (messagesErr) {
                            // Nếu có lỗi, rollback transaction
                            db.run('ROLLBACK', () => {
                                console.error(`Lỗi khi xóa tin nhắn: ${messagesErr.message}`);
                                reject(messagesErr);
                            });
                            return;
                        }
                        
                        // Xóa tất cả cuộc trò chuyện
                        db.run('DELETE FROM chats WHERE user_id = ?', [userId], (chatsErr) => {
                            if (chatsErr) {
                                // Nếu có lỗi, rollback transaction
                                db.run('ROLLBACK', () => {
                                    console.error(`Lỗi khi xóa cuộc trò chuyện: ${chatsErr.message}`);
                                    reject(chatsErr);
                                });
                                return;
                            }
                            
                            // Reset sequence cho người dùng
                            db.run('UPDATE user_sequences SET last_sequence = 0 WHERE user_id = ?', [userId], (seqErr) => {
                                if (seqErr) {
                                    // Nếu có lỗi, rollback transaction
                                    db.run('ROLLBACK', () => {
                                        console.error(`Lỗi khi reset sequence: ${seqErr.message}`);
                                        reject(seqErr);
                                    });
                                    return;
                                }
                                
                                // Hoàn thành transaction
                                db.run('COMMIT', (commitErr) => {
                                    if (commitErr) {
                                        console.error(`Lỗi khi commit transaction: ${commitErr.message}`);
                                        return reject(commitErr);
                                    }
                                    
                                    // Trả về kết quả thành công
                                    resolve({ 
                                        messagesDeleted: chatIds.length > 0 ? true : false, 
                                        chatsDeleted: rows.length 
                                    });
                                    console.log(`Đã xóa ${rows.length} cuộc trò chuyện và reset sequence của người dùng ${userId}`);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

/**
 * Xóa một cuộc trò chuyện cụ thể theo ID
 * @param {string} userId - ID của người dùng
 * @param {string} chatId - ID của cuộc trò chuyện (định dạng "a{sequence}")
 * @returns {Promise<Object>} Kết quả xóa
 */
async function deleteChatById(userId, chatId) {
    return new Promise((resolve, reject) => {
        // Kiểm tra xem cuộc trò chuyện có tồn tại và thuộc về người dùng này không
        db.get('SELECT id FROM chats WHERE user_id = ? AND chat_id = ?', [userId, chatId], (err, row) => {
            if (err) {
                console.error(`Lỗi khi kiểm tra cuộc trò chuyện: ${err.message}`);
                return reject(err);
            }
            
            if (!row) {
                return reject(new Error('Không tìm thấy cuộc trò chuyện hoặc bạn không có quyền xóa nó'));
            }
            
            const dbChatId = row.id;
            
            // Bắt đầu transaction
            db.run('BEGIN TRANSACTION', (transErr) => {
                if (transErr) {
                    console.error(`Lỗi khi bắt đầu transaction: ${transErr.message}`);
                    return reject(transErr);
                }
                
                // Xóa tất cả tin nhắn trong cuộc trò chuyện
                db.run('DELETE FROM chat_messages WHERE chat_id = ?', [dbChatId], (messagesErr) => {
                    if (messagesErr) {
                        // Nếu có lỗi, rollback transaction
                        db.run('ROLLBACK', () => {
                            console.error(`Lỗi khi xóa tin nhắn: ${messagesErr.message}`);
                            reject(messagesErr);
                        });
                        return;
                    }
                    
                    // Xóa cuộc trò chuyện
                    db.run('DELETE FROM chats WHERE id = ?', [dbChatId], (chatErr) => {
                        if (chatErr) {
                            // Nếu có lỗi, rollback transaction
                            db.run('ROLLBACK', () => {
                                console.error(`Lỗi khi xóa cuộc trò chuyện: ${chatErr.message}`);
                                reject(chatErr);
                            });
                            return;
                        }
                        
                        // Hoàn thành transaction
                        db.run('COMMIT', (commitErr) => {
                            if (commitErr) {
                                console.error(`Lỗi khi commit transaction: ${commitErr.message}`);
                                return reject(commitErr);
                            }
                            
                            // Trả về kết quả thành công
                            resolve({ 
                                success: true, 
                                chatId: chatId
                            });
                            console.log(`Đã xóa cuộc trò chuyện ${chatId} của người dùng ${userId}`);
                        });
                    });
                });
            });
        });
    });
}

// Lấy ID cuộc trò chuyện hiện tại của người dùng
const getCurrentChatId = (userId) => {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT id FROM chats 
             WHERE user_id = ? 
             ORDER BY updated_at DESC LIMIT 1`,
            [userId],
            async (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (!row) {
                    // Nếu không có chat nào, tạo mới
                    try {
                        const newChatId = await createNewChat(userId);
                        resolve(newChatId);
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    resolve(row.id);
                }
            }
        );
    });
};
// Lấy thông tin cuộc trò chuyện hiện tại của người dùng
const getCurrentChat = async (userId) => {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT id, chat_id FROM chats 
             WHERE user_id = ? 
             ORDER BY updated_at DESC LIMIT 1`,
            [userId],
            async (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (!row) {
                    // Nếu không có cuộc trò chuyện nào, tạo mới
                    try {
                        const newChat = await createNewChat(userId);
                        resolve({
                            id: newChat.id,
                            chat_id: newChat.chatId
                        });
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    resolve(row);
                }
            }
        );
    });
};

// Thêm tin nhắn vào một cuộc trò chuyện
const addChatMessage = async (userId, role, content) => {
    try {
        const chatId = await getCurrentChatId(userId);
        
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO chat_messages (chat_id, user_id, role, content) VALUES (?, ?, ?, ?)`,
                [chatId, userId, role, content], // Added userId parameter
                function(err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    // Cập nhật thời gian cập nhật mới nhất của cuộc trò chuyện
                    db.run(
                        `UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                        [chatId]
                    );
                    
                    resolve(this.lastID);
                }
            );
        });
    } catch (error) {
        throw error;
    }
};


// Lấy tin nhắn của một cuộc trò chuyện cụ thể
const getChatMessages = (chatId, limit = 10) => {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT role, content FROM chat_messages 
             WHERE chat_id = ? 
             ORDER BY id DESC LIMIT ?`,
            [chatId, limit * 2], // Nhân đôi vì mỗi lượt tương tác có 2 tin nhắn
            (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                // Đảo ngược để có thứ tự thời gian đúng
                resolve(rows.reverse());
            }
        );
    });
};

// Lấy lịch sử cuộc trò chuyện hiện tại của người dùng
const getCurrentChatHistory = async (userId, limit = 10) => {
    try {
        const chatId = await getCurrentChatId(userId);
        return await getChatMessages(chatId, limit);
    } catch (error) {
        throw error;
    }
};

// Đóng kết nối database khi thoát
const closeDb = () => {
    db.close((err) => {
        if (err) {
            console.error(`Lỗi đóng database: ${err.message}`);
            return;
        }
        console.log('Đã đóng kết nối database.');
    });
};

/**
 * Xóa toàn bộ lịch sử trò chuyện AI của người dùng
 * @param {string} userId - ID của người dùng
 */
/**
 * Cập nhật thời gian truy cập của cuộc trò chuyện để đặt nó thành cuộc trò chuyện hiện tại
 * @param {string} userId - ID của người dùng
 * @param {number} chatId - ID của cuộc trò chuyện trong database
 * @returns {Promise<boolean>} Kết quả cập nhật
 */
async function updateChatTime(userId, chatId) {
    return new Promise((resolve, reject) => {
        db.run('UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?', 
            [chatId, userId], (err) => {
            if (err) {
                console.error(`Lỗi khi cập nhật thời gian trò chuyện: ${err.message}`);
                return reject(err);
            }
            resolve(true);
            console.log(`Đã cập nhật thời gian truy cập cho cuộc trò chuyện ${chatId} của người dùng ${userId}`);
        });
    });
}
async function getMessagesFromChat(chatDbId, limit = 10) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT role, content FROM chat_messages 
             WHERE chat_id = ? 
             ORDER BY id DESC LIMIT ?`,
            [chatDbId, limit * 2], // Nhân đôi vì mỗi lượt tương tác có 2 tin nhắn
            (err, rows) => {
                if (err) {
                    console.error(`Lỗi khi lấy tin nhắn từ cuộc trò chuyện: ${err.message}`);
                    reject(err);
                    return;
                }
                
                // Đảo ngược để có thứ tự thời gian đúng
                resolve(rows.reverse());
            }
        );
    });
}

const saveChannelId = async (channelId) => {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO settings (key, value) 
             VALUES ('channel-spam-bot', ?) 
             ON CONFLICT(key) DO UPDATE SET value = ?;`, // Cập nhật giá trị trực tiếp
            [channelId, channelId], // Thêm giá trị cho UPDATE
            function (err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(true);
            }
        );
    });
};

const getChannelId = () => {
    return new Promise((resolve, reject) => {
        db.get("SELECT value FROM settings WHERE key = 'channel-spam-bot'", [], (err, row) => {
            if (err) {
                console.error("❌ Lỗi khi lấy Channel ID:", err);
                reject(err);
            } else {
                resolve(row ? row.value : null);
            }
        });
    });
};

export default {
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
    getMessagesFromChat,
    saveChannelId,
    getChannelId
};
