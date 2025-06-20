import { agenda } from '../../utils/agenda.js';

const SEND_HOURS = [8, 9, 10, 12, 14, 16, 18];

const toUtcHour = (vnHour: number) => (vnHour + 24 - 7) % 24;

export const scheduleDailyJobs = async () => {
  for (const vnHour of SEND_HOURS) {
    const utcHour = toUtcHour(vnHour);
    await agenda.every(`0 ${utcHour} * * 1-5`, `send scheduled message at ${vnHour}`, {
      hour: vnHour,
    });
  }
  console.log('📆 Đã lên lịch gửi tin nhắn theo giờ Việt Nam bằng Agenda.');
};
