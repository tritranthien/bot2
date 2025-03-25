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

module.exports = { writeLog };
