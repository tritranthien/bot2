import { promises as fs } from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);
function isValidDateFormat(date) {
    return /^\d{4}-\d{2}-\d{2}$/.test(date);
}
function getTodayDate() {
    return new Date().toISOString().slice(0, 10);
}
export default {
    name: "logs",
    description: "Lấy file log theo ngày từ thư mục logs 📝",
    async execute({ message, args }) {
        const inputDate = args[0];
        const logType = args[1] === "error" ? "error" : "app";
        let date;
        // 📌 Nếu nhập ngày, kiểm tra định dạng trước
        if (inputDate) {
            if (!isValidDateFormat(inputDate)) {
                await message.reply(`❌ Định dạng ngày không đúng. Vui lòng dùng dạng \`YYYY-MM-DD\`.`);
                return;
            }
            date = inputDate;
        }
        else {
            date = getTodayDate();
        }
        const logFileName = `${logType}-${date}.log`;
        const logFilePath = path.join(__dirname, "../../../logs", logFileName);
        try {
            await fs.access(logFilePath);
            if ("send" in message.channel) {
                await message.channel.send({
                    content: `📝 Log **${logFileName}**:`,
                    files: [logFilePath],
                });
            }
        }
        catch (error) {
            await message.reply(`❌ Không tìm thấy file log \`${logFileName}\` trong thư mục logs.`);
        }
    },
};
