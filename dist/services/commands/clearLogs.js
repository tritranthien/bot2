import { promises as fs } from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
function getTodayDate() {
    const now = new Date();
    return now.toISOString().split("T")[0]; // yyyy-mm-dd
}
export default {
    name: "clearlog",
    description: "Xoá log theo ngày hoặc toàn bộ log trong thư mục logs",
    async execute({ message, args }) {
        const logDir = path.join(__dirname, "../../../logs");
        try {
            const files = await fs.readdir(logDir);
            if (!files.length) {
                await message.reply("⚠️ Thư mục logs trống.");
                return;
            }
            // Xoá tất cả log
            if (args[0] === "all") {
                await Promise.all(files.map(file => fs.unlink(path.join(logDir, file))));
                await message.reply("✅ Đã xoá toàn bộ log.");
                return;
            }
            // Xác định tên file log cần xoá
            const filename = args[0] || `app-${getTodayDate()}.log`;
            const filePath = path.join(logDir, filename);
            try {
                await fs.unlink(filePath);
                await message.reply(`🗑️ Đã xoá file log \`${filename}\``);
            }
            catch (err) {
                if (err.code === "ENOENT") {
                    await message.reply(`⚠️ File log \`${filename}\` không tồn tại.`);
                }
                else {
                    console.error("Lỗi khi xoá log:", err);
                    await message.reply(`❌ Không thể xoá log: ${err.message}`);
                }
            }
        }
        catch (err) {
            console.error("Lỗi khi đọc thư mục logs:", err);
            await message.reply("❌ Không thể xoá log!");
        }
    }
};
