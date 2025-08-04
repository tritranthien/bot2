const command = {
    name: 'clear',
    description: 'Clear bot messages. 🧹',
    async execute({ message }) {
        const fetchedMessages = await message.channel.messages.fetch({ limit: 100 });
        const botMessages = fetchedMessages.filter(msg => msg.author.id === message.client.user?.id);
        if ('bulkDelete' in message.channel) {
            await message.channel.bulkDelete(botMessages, true).catch(console.error);
        }
        if ('send' in message.channel) {
            const response = await message.channel.send('✅ Đã xóa tất cả tin nhắn của bot!');
            setTimeout(() => response.delete(), 3000);
        }
    },
};
export default command;
