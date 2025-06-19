
import { agenda } from '../../utils/agenda.js';

const SEND_HOURS = [8, 9, 10, 12, 14, 16, 18];
export const scheduleDailyJobs = async () => {
  for (const hour of SEND_HOURS) {
    await agenda.every(`0 ${hour} * * 1-5`, 'send scheduled message'); // thứ 2 - 6 lúc hour:00
  }

  console.log('📆 Đã lên lịch gửi tin nhắn theo giờ bằng Agenda.');
};
