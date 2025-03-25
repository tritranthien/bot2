const fs = require("fs").promises;
const path = require("path");

module.exports = {
    name: "clearlog",
    description: "Xóa toàn bộ log trong thư mục logs",
    async execute(message, args) {

        const logDir = path.join(__dirname, "../logs");

        try {
            const files = await fs.readdir(logDir);
            console.error("Không tìm thấy file ⚠️:", files);
            if (!files.length) {
                return message.reply("⚠️ Thư mục logs trống.");
            }

            await Promise.all(
                files.map(file => fs.unlink(path.join(logDir, file)))
            );

            return message.reply("✅ Đã xóa toàn bộ log trong thư mục logs.");
        } catch (error) {
            if (error.code === 'ENOENT') {
                return message.reply("⚠️ Không có thư mục logs để xóa.");
            }
            console.error("Lỗi khi xóa log:", error);
            return message.reply("❌ Lỗi khi xóa log!");
        }
    }
};
