// commands/help.js
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'help',
    description: 'Xem danh sách lệnh quản lý server. 📚',
    async execute(message, args, config) {
        const commandFiles = fs.readdirSync(path.resolve(__dirname)).filter(file => file.endsWith('.js')  && !file.startsWith('_') && file !== 'help.js');
        let helpText = `**Lệnh Quản Lý Server 📚 ${process.env.APP_ENV ?? ''}**\n`;

        for (const file of commandFiles) {
            const command = require(path.resolve(__dirname, file));
            helpText += `\`${config.prefix}${command.name}\` - ${command.description}\n`;
        }

        message.channel.send(helpText);
    },
};