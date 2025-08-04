import { Setting } from "../../../models/setting.js";
import { scheduleAttendance, sendChannelMessage, } from "../../../utils/schedule.js";
// 📩 Nội dung theo từng khung giờ
const MESSAGES = {
    9: () => `<@everyone>, Điểm danh nào! 📝 Bấm "co" nếu bạn có mặt!`,
    12: ({ targetId }) => `<@${targetId}>, đã 12h trưa rồi, nghỉ tay đi ăn cơm 🍚🥢 rồi chích điện tiếp thôi! ⚡⚡`,
    14: ({ targetId }) => `<@${targetId}>, 2h chiều rồi, có đặt nước không? 🧃🚰`,
    18: () => "⏱️ Bây giờ là 6h chiều, coookkkkkkkkkk 🏡🏡🏡 🍳🍲🍜",
};
export const defineMessageJob = (agenda, name, client, config, hour) => {
    agenda.define(name, async () => {
        const settingM = new Setting();
        const targetId = (await settingM.getSetting(config.electricTargetKey)) || "defaultTarget";
        const nowVN = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
        const weekday = nowVN.getDay();
        const currentHour = nowVN.getHours();
        console.log(`🚀 Running job: ${name} at ${currentHour}h`);
        if (weekday === 0 || weekday === 6)
            return;
        if (currentHour !== hour)
            return;
        const message = MESSAGES[hour]
            ? MESSAGES[hour]({ targetId })
            : `<@${targetId}>, tới giờ chích điện định kỳ ⚡⚡⚡`;
        if (hour === 9) {
            await scheduleAttendance(client, config);
        }
        else {
            await sendChannelMessage(client, config, message);
        }
    });
};
