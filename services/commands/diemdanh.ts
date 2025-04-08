import { scheduleAttendance } from "../../utils/schedule.js";
import { Message } from "discord.js";
import { Config } from "../../config.js";
import { ExecuteParams, Command } from "./types.js";

const command: Command = {
    name: 'diemdanh',
    description: 'Điểm danh quân số 📃',
    async execute({message, args, config}: ExecuteParams): Promise<void> {
        try {
            await scheduleAttendance(message.client, config);
        } catch (error) {
            console.error('Lỗi khi thực hiện điểm danh:', error);
            message.reply("Đã xảy ra lỗi khi điểm danh. Vui lòng thử lại sau.");
        }
    },
};

export default command;
