import * as fs from 'fs';
import * as path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

// Constants
const LOG_DIR: string = path.join(__dirname, "../logs");
const LOG_FILE: string = path.join(LOG_DIR, "app.log");
const VN_OFFSET: number = 7 * 60 * 60 * 1000; // UTC+7
const THREE_DAYS: number = 3 * 24 * 60 * 60 * 1000;

// Ensure log directory exists
!fs.existsSync(LOG_DIR) && fs.mkdirSync(LOG_DIR, { recursive: true });

// Optimized log writer with buffering
export const writeLog = (() => {
    const queue: string[] = [];
    let writeInProgress: boolean = false;

    const processQueue = (): void => {
        if (writeInProgress || queue.length === 0) return;
        writeInProgress = true;

        const batch: string = queue.join("");
        queue.length = 0;

        fs.appendFile(LOG_FILE, batch, (err: NodeJS.ErrnoException | null) => {
            writeInProgress = false;
            if (err) console.error("Log write error:", err);
            processQueue();
        });
    };

    return (level: string, message: string): void => {
        queue.push(`[${level}] ${new Date().toISOString()} ${message}\n`);
        processQueue();
    };
})();

// Console override with memoized stringification
const levels: Record<string, string> = { log: 'INFO', error: 'ERROR', warn: 'WARN' };

// Object.entries(levels).forEach(([method, level]) => {
//     const original = console[method];
//     console[method] = (...args) => {
//         const message = args.map(arg =>
//             arg === null ? 'null' :
//                 arg === undefined ? 'undefined' :
//                     typeof arg === "object" ? JSON.stringify(arg) : String(arg)
//         ).join(" ");

//         writeLog(level, message);
//         original.apply(console, args);
//     };
// });

// Optimized log deletion scheduler
const scheduleLogDeletion = (): void => {
    const now: Date = new Date();
    const nowVN: Date = new Date(now.getTime() + VN_OFFSET);
    const nextRunVN: Date = new Date(nowVN);

    nextRunVN.setDate(nowVN.getDate() + (nowVN.getHours() >= 0 ? 3 : 4));
    nextRunVN.setHours(0, 1, 0, 0);

    const nextRunUTC: Date = new Date(nextRunVN.getTime() - VN_OFFSET);
    const delay: number = nextRunUTC.getTime() - now.getTime();

    console.log(`⏭️ Next log deletion (VN): ${nextRunVN.toLocaleString("vi-VN")}`);
    console.log(`⏭️ Next log deletion (UTC): ${nextRunUTC.toISOString()}`);

    const deleteAndSchedule = (): void => {
        fs.unlink(LOG_FILE, (err: NodeJS.ErrnoException | null) => {
            if (err && err.code !== "ENOENT") console.error("❌ Error deleting log file: 📁", err);
            else console.log("✅ Old log file deleted successfully.");
        });
    };

    setTimeout(() => {
        deleteAndSchedule();
        setInterval(deleteAndSchedule, THREE_DAYS);
    }, delay);
};

scheduleLogDeletion();