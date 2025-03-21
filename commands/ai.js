// commands/ai.js
module.exports = {
    name: 'ai',
    description: 'Talk to the AI.',
    async execute(message, args, config, logModAction, sendEmbedMessage, client, model) {
        if (!args.length) {
            return message.reply('Bạn cần nhập nội dung để gọi AI.');
        }

        try {
            const prompt = args.join(' ');
            const result = await model.generateContent(prompt);
            const content = result.response.text();

            await sendEmbedMessage(message.channel, message.author, content);

            const fetchedMessage = await message.channel.messages.fetch(message.id).catch(() => null);
            if (fetchedMessage) {
                await message.delete();
            }
        } catch (error) {
            console.error(error);
            message.reply('Có lỗi xảy ra khi gọi AI.');
        }
    },
};