import { promises as fs } from "fs";
import * as path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Command, ExecuteParams } from "./types.js";

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

function isValidDateFormat(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default {
  name: "logs",
  description: "Lấy file log theo ngày từ thư mục logs 📝",
  async execute({ message, args }: ExecuteParams): Promise<void> {
    let logFileName = args[0];
    let logFilePath = path.join(__dirname, "../../../logs/", logFileName + ".log");
    if (!logFileName) {
        const date = args[0] && isValidDateFormat(args[0]) ? args[0] : getTodayDate();
        const logType = (args[1] === 'error') ? 'error' : 'app';
        logFileName = `${logType}-${date}.log`;
        logFilePath = path.join(__dirname, "../../../logs", logFileName);
    }

    try {
      await fs.access(logFilePath); // check if file exists

      if ('send' in message.channel) {
        message.channel.send({
          content: `📝 Log **${logFileName}**:`,
          files: [logFilePath]
        });
      }
    } catch (error) {
      await message.reply(`❌ Không tìm thấy file log \`${logFileName}\`. Định dạng đúng: \`YYYY-MM-DD [app|error]\``);
    }
  }
} as Command;
