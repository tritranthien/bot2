import { promises as fs } from "fs";
import * as path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Message } from 'discord.js';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

export default {
  name: "clearlog",
  description: "Xóa toàn bộ log trong thư mục logs",
  async execute(message: Message, args: string[]): Promise<Message> {
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
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return message.reply("⚠️ Không có thư mục logs để xóa.");
      }
      console.error("Lỗi khi xóa log:", error);
      return message.reply("❌ Lỗi khi xóa log!");
    }
  }
};