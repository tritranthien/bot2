import { scheduleAttendance } from "../../utils/schedule.js";
const command = {
    name: 'diemdanh',
    description: 'Điểm danh quân số 📃',
    async execute({ message, args, config }) {
        try {
            await scheduleAttendance(message.client, config);
        }
        catch (error) {
            console.error('Lỗi khi thực hiện điểm danh:', error);
            message.reply("Đã xảy ra lỗi khi điểm danh. Vui lòng thử lại sau.");
        }
    },
};
export default command;
