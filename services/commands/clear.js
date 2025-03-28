// commands/clear.js
export default {
    name: 'clear',
    description: 'Clear bot messages. 🧹',
    async execute(message) {
        const fetchedMessages = await message.channel.messages.fetch({ limit: 100 });
        const botMessages = fetchedMessages.filter(msg => msg.author.id === message.client.user.id);
        message.channel.bulkDelete(botMessages, true).catch(console.error);
        message.channel.send('✅ Đã xóa tất cả tin nhắn của bot!').then(msg => setTimeout(() => msg.delete(), 3000));
    },
};