const fs = require("fs");
const path = require("path");

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, "../logs");
!fs.existsSync(logDir) && fs.mkdirSync(logDir, { recursive: true });

// Log file path
const logFilePath = path.join(logDir, "app.log");

// Log writer function
const writeLog = (level, message) => {
    const logMessage = `[${level}] ${new Date().toISOString()} ${message}\n`;
    fs.appendFile(logFilePath, logMessage, err => err && console.error("Log write error:", err));
};

// Override console methods
const levels = {
    log: 'INFO',
    error: 'ERROR',
    warn: 'WARN'
};

Object.entries(levels).forEach(([method, level]) => {
    const original = console[method];
    console[method] = (...args) => {
        const message = args.map(arg =>
            typeof arg === "object" ? JSON.stringify(arg) : arg
        ).join(" ");
        
        writeLog(level, message);
        original.apply(console, args);
    };
});

// Function to delete log file
const deleteOldLogs = () => {
    fs.unlink(logFilePath, err => {
        if (err && err.code !== "ENOENT") console.error("❌ Error deleting log file 📁:", err);
        else console.log("📁 Old log file deleted successfully. ✅");
    });
};

const scheduleLogDeletion = () => {
    const now = new Date();
    const nextRun = new Date();

    // Đặt thời gian là 00:01 của ngày tiếp theo sau 3 ngày
    nextRun.setDate(now.getDate() + (now.getHours() >= 0 ? 3 : 4));
    nextRun.setHours(0, 1, 0, 0); // 00:01:00

    const delay = nextRun.getTime() - now.getTime();
    console.log(`📅 Next log deletion scheduled at: ${nextRun.toLocaleString()}`);

    setTimeout(() => {
        deleteOldLogs();
        setInterval(deleteOldLogs, 3 * 24 * 60 * 60 * 1000); // Xóa log mỗi 3 ngày
    }, delay);
};

// Start scheduled log deletion
scheduleLogDeletion();

module.exports = { writeLog };
