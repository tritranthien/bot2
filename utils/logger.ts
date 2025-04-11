import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const MAX_LOG_AGE_DAYS = 7;

function getLogFilePath(type: 'app' | 'error') {
    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return path.join(logDir, `${type}-${date}.log`);
}

function writeLogToFile(filePath: string, message: string) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(filePath, `[${timestamp}] ${message}\n`, 'utf8');
}

const originalLog = console.log;
console.log = (...args: any[]) => {
    const message = args.map(arg => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' ');
    writeLogToFile(getLogFilePath('app'), message);
    originalLog(...args);
};

const originalError = console.error;
console.error = (...args: any[]) => {
    const message = args.map(arg => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' ');
    writeLogToFile(getLogFilePath('error'), message);
    originalError(...args);
};

// 🧹 Xóa log cũ hơn 7 ngày
function deleteOldLogs() {
    const now = Date.now();
    const maxAgeMs = MAX_LOG_AGE_DAYS * 24 * 60 * 60 * 1000;

    fs.readdirSync(logDir).forEach(file => {
        const filePath = path.join(logDir, file);
        const stat = fs.statSync(filePath);
        const fileAge = now - stat.mtime.getTime();

        if (fileAge > maxAgeMs) {
            fs.unlinkSync(filePath);
            originalLog(`🗑️ Deleted old log: ${file}`);
        }
    });
}

// Gọi hàm xóa log ngay khi khởi động
deleteOldLogs();
