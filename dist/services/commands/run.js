export default {
    name: 'run',
    description: 'Chạy ngay điiiii! 🏃‍➡️',
    async execute({ message, args, config }) {
        const member = message.mentions.members?.first();
        if (!member) {
            return message.reply('Please mention a member!');
        }
        if (message.author.id === member.id) {
            return message.reply(`${member} said: CHẠY THÔIIIIIIIII 🏃‍➡️🏃‍➡️🏃‍➡️`);
        }
        return message.reply(`Chạy đi ${member}, chạy điiiiii  🏃‍➡️🏃‍➡️🏃‍➡️`);
    },
};
