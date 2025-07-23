import { Agenda } from 'agenda';
import { defineMessageJob } from '../jobs/agenda/scheduleJobs.js';
import { Client } from 'discord.js';
import { Config } from '../../config.js';

const SEND_HOURS = [8, 9, 10, 12, 14, 16, 17, 18];
const toUtcHour = (vnHour: number) => (vnHour + 24 - 7) % 24;

export const scheduleDailyJobs = async (
  agenda: Agenda,
  client: Client,
  config: Config
) => {
  for (const vnHour of SEND_HOURS) {
    const utcHour = toUtcHour(vnHour);
    const name = `send scheduled message at ${vnHour}`;
    defineMessageJob(agenda, name, client, config, vnHour);
    await agenda.every(
      `0 ${utcHour} * * 1-5`,
      name,
      { hour: vnHour },
      { unique: { name } } as any,
    );
  }
  console.log('📆 Đã lên lịch gửi tin nhắn theo giờ Việt Nam bằng Agenda.');
};
