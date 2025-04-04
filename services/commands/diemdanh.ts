import { scheduleAttendance } from "../../utils/schedule.js";
import { Message } from "discord.js";
import { Config } from "../../config.js";

interface Command {
    name: string;
    description: string;
    execute: (message: Message, args: string[], config: Config) => Promise<void>;
}

const command: Command = {
    name: 'diemdanh',
    description: 'Điểm danh quân số 📃',
    async execute(message: Message, args: string[], config: Config): Promise<void> {
        try {
            await scheduleAttendance(message.client, config);
        } catch (error) {
            console.error('Lỗi khi thực hiện điểm danh:', error);
            message.reply("Đã xảy ra lỗi khi điểm danh. Vui lòng thử lại sau.");
        }
    },
};

export default command;
