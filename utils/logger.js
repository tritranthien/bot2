const fs = require("fs");
const path = require("path");

// Constants
const LOG_DIR = path.join(__dirname, "../logs");
const LOG_FILE = path.join(LOG_DIR, "app.log");
const VN_OFFSET = 7 * 60 * 60 * 1000; // UTC+7
const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

// Ensure log directory exists
!fs.existsSync(LOG_DIR) && fs.mkdirSync(LOG_DIR, { recursive: true });

// Optimized log writer with buffering
const writeLog = (() => {
    const queue = [];
    let writeInProgress = false;

    const processQueue = () => {
        if (writeInProgress || queue.length === 0) return;
        writeInProgress = true;

        const batch = queue.join("");
        queue.length = 0;

        fs.appendFile(LOG_FILE, batch, err => {
            writeInProgress = false;
            if (err) console.error("Log write error:", err);
            processQueue();
        });
    };

    return (level, message) => {
        queue.push(`[${level}] ${new Date().toISOString()} ${message}\n`);
        processQueue();
    };
})();

// Console override with memoized stringification
const levels = { log: 'INFO', error: 'ERROR', warn: 'WARN' };

Object.entries(levels).forEach(([method, level]) => {
    const original = console[method];
    console[method] = (...args) => {
        const message = args.map(arg =>
            arg === null ? 'null' :
                arg === undefined ? 'undefined' :
                    typeof arg === "object" ? JSON.stringify(arg) : String(arg)
        ).join(" ");

        writeLog(level, message);
        original.apply(console, args);
    };
});

// Optimized log deletion scheduler
const scheduleLogDeletion = () => {
    const now = new Date();
    const nowVN = new Date(now.getTime() + VN_OFFSET);
    const nextRunVN = new Date(nowVN);

    nextRunVN.setDate(nowVN.getDate() + (nowVN.getHours() >= 0 ? 3 : 4));
    nextRunVN.setHours(0, 1, 0, 0);

    const nextRunUTC = new Date(nextRunVN.getTime() - VN_OFFSET);
    const delay = nextRunUTC.getTime() - now.getTime();

    console.log(`⏭️  Next log deletion (VN): ${nextRunVN.toLocaleString("vi-VN")}`);
    console.log(`⏭️  Next log deletion (UTC): ${nextRunUTC.toISOString()}`);

    const deleteAndSchedule = () => {
        fs.unlink(LOG_FILE, err => {
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

module.exports = { writeLog };