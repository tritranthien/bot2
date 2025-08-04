import { ActionRowBuilder, EmbedBuilder, SlashCommandBuilder, StringSelectMenuBuilder } from 'discord.js';
import { Bookmarks } from '../../models/bookmark.js';
export const data = new SlashCommandBuilder()
    .setName('bookmarks2')
    .setDescription('📑 Xem lại những nội dung bạn đã lưu nhé');
export async function execute(interaction) {
    console.log('/bookmarks');
    try {
        await interaction.deferReply();
        const tag = interaction.options.getString('tag');
        const page = 1;
        const bM = new Bookmarks();
        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        // if (tag) {
        //   const bookmarks = await fetchBookmarks(userId, page, [tag]);
        //   if (bookmarks.length === 0) {
        //     return interaction.editReply({ content: '📭 Không có bookmark nào với tag này.' });
        //   }
        //   const paginationRow = buildPaginationButtons(page, tag);
        //   await interaction.editReply({
        //     content: `📄 Bookmarks - Trang ${page}`,
        //     components: [paginationRow]
        //   });
        //   for (const bookmark of bookmarks) {
        //     const embed = buildEmbedForBookmark(bookmark);
        //     const row = buildDeleteButtonRow(bookmark.id);
        //     await interaction.followUp({ embeds: [embed], components: [row] });
        //   }
        //   return;
        // }
        const tagRecords = await bM.findMany({
            where: { savedByUserId: userId, guildId },
            select: { tags: true },
        });
        const allTags = Array.from(new Set(tagRecords.flatMap(t => t.tags))).filter(Boolean);
        // if (allTags.length === 0) {
        //   return interaction.editReply({ content: '❌ Bạn chưa có tag nào để chọn.' });
        // }
        const select = new StringSelectMenuBuilder()
            .setCustomId('bookmarks:select-tag')
            .setPlaceholder('📂 Chọn tag để lọc')
            // .setMinValues(1)
            .setMaxValues(Math.min(allTags.length + 1, 25))
            .addOptions([
            {
                label: '📋 Tất cả',
                value: '__ALL__',
                description: 'Hiển thị toàn bộ bookmark',
            },
            ...allTags.map(tag => ({
                label: tag,
                value: tag,
            }))
        ]);
        console.log('🧪 Rendering select menu với tags:', select);
        const row = new ActionRowBuilder().addComponents(select);
        const embed = new EmbedBuilder()
            .setTitle('📑 Chọn tag để xem bookmark')
            .setDescription('Sử dụng dropdown bên dưới để lọc bookmark theo tag')
            .setColor(0x00bfff);
        await interaction.editReply({
            embeds: [embed],
            components: [row],
        });
        console.log('✅ Sent select menu successfully.');
    }
    catch (err) {
        console.error('❌ Lỗi khi xử lý lệnh /bookmarks:', err);
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: '❌ Đã xảy ra lỗi khi xử lý lệnh.' });
        }
        else {
            await interaction.reply({ content: '❌ Đã xảy ra lỗi khi xử lý lệnh.', ephemeral: true });
        }
    }
}
