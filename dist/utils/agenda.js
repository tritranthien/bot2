import { Agenda } from 'agenda';
import dotenv from 'dotenv';
dotenv.config();
const mongoConnectionString = process.env.DATABASE_URL;
export const agenda = new Agenda({
    db: { address: mongoConnectionString, collection: 'agendaJobs' },
});
agenda.on('start', (job) => {
    console.log(`🚀 [Agenda] Job bắt đầu: ${job.attrs.name}`);
});
agenda.on('complete', (job) => {
    console.log(`✅ [Agenda] Job hoàn tất: ${job.attrs.name}`);
});
agenda.on('fail', (err, job) => {
    console.error(`❌ [Agenda] Job thất bại: ${job.attrs.name}`, err);
});
