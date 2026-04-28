import { Client } from "discord.js";
import { Setting } from "../../../models/setting.js";
import { Config } from "../../../config.js";
import {
  scheduleAttendance,
  sendChannelMessage,
} from "../../../utils/schedule.js";
import { Agenda } from "agenda";

// 📩 Nội dung theo từng khung giờ
const MESSAGES: { [key: number]: (options: { targetId: string }) => string } = {
  9: () => `<@everyone>, Điểm danh nào! 📝 Bấm "co" nếu bạn có mặt!`,
  12: ({ targetId }) =>
    `<@${targetId}>, đã 12h trưa rồi, nghỉ tay đi ăn cơm 🍚🥢 rồi chích điện tiếp thôi! ⚡⚡`,
  14: ({ targetId }) => `<@${targetId}>, 2h chiều rồi, có đặt nước không? 🧃🚰`,
  18: () => "⏱️ Bây giờ là 6h chiều, coookkkkkkkkkk 🏡🏡🏡 🍳🍲🍜",
};

export const defineMessageJob = (
  agenda: Agenda,
  name: string,
  client: Client,
  config: Config,
  hour: number
) => {
  agenda.define(name, async () => {
    const settingM = new Setting();
    const targetId =
      (await settingM.getSetting(config.electricTargetKey)) || "defaultTarget";

    const nowVN = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
    );
    const weekday = nowVN.getDay();
    const currentHour = nowVN.getHours();

    console.log(`🚀 Running job: ${name} at ${currentHour}h`);
    if (weekday === 0 || weekday === 6) return;
    if (currentHour !== hour) return;

    const message =  MESSAGES[hour]({ targetId });

    if (hour === 9) {
      await scheduleAttendance(client, config);
    } else {
      await sendChannelMessage(client, config, message);
    }
  });
};

