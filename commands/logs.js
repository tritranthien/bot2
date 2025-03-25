const fs = require("fs").promises;
const path = require("path");

module.exports = {
    name: "logs",
    description: "Lấy file log mới nhất",
    async execute(message, args, config) {
        const logFilePath = path.join(__dirname, "../logs/app.log");

        try {
            // Check if file exists using async method
            await fs.access(logFilePath);
            
            // Send file log to Discord
            await message.channel.send({
                content: "📝 Đây là log mới nhất:",
                files: [logFilePath]
            });
        } catch (error) {
            await message.reply("Không tìm thấy file log nào. 😵");
        }
    }
};
