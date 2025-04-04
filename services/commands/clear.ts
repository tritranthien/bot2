import { Message, Collection, Snowflake } from 'discord.js';
// commands/clear.js
import { Command, ExecuteParams } from './types.js';

const command: Command = {
    name: 'clear',
    description: 'Clear bot messages. 🧹',
    async execute({message}: ExecuteParams): Promise<void> {
        const fetchedMessages: Collection<Snowflake, Message> = await message.channel.messages.fetch({ limit: 100 });
        const botMessages: Collection<Snowflake, Message> = fetchedMessages.filter(msg => msg.author.id === message.client.user?.id);
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
