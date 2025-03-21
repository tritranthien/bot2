// utils/logger.js
module.exports = {
    log: (message) => {
        console.log(`[${new Date().toLocaleString()}] ${message}`);
    },
    error: (error) => {
        console.error(`[${new Date().toLocaleString()}] ERROR: ${error}`);
    },
};