import { Bookmarks } from '../../models/bookmark.js';
export async function execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub !== 'delete')
        return;
    const id = interaction.options.getString('id');
    const userId = interaction.user.id;
    const bM = new Bookmarks();
    if (id) {
        const deleted = await bM.deleteBy({ id });
        return interaction.reply({ content: deleted ? '🗑 Đã xoá bookmark.' : '🚫 Không tìm thấy.', ephemeral: true });
    }
    else {
        await bM.deleteBy({ savedByUserId: userId });
        return interaction.reply({ content: '🧹 Đã xoá toàn bộ bookmark của bạn.', ephemeral: true });
    }
}
