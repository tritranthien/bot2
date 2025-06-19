import { Agenda } from 'agenda';
import dotenv from 'dotenv';
dotenv.config();

const mongoConnectionString = process.env.MONGO_URI!;

export const agenda = new Agenda({
  db: { address: mongoConnectionString, collection: 'agendaJobs' },
});
