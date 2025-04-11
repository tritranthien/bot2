import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Bookmarks } from '../../models/bookmark.js';

export const data = new SlashCommandBuilder()
  .setName('tags')
  .setDescription('📂 Hiển thị các tag bạn đã sử dụng để lưu bookmark')
  .addBooleanOption(opt =>
    opt.setName('global')
      .setDescription('Lấy toàn bộ tag (mặc định: chỉ của bạn trong server)'));

export async function execute(interaction: ChatInputCommandInteraction) {
  const isGlobal = interaction.options.getBoolean('global') ?? false;
  const userId = interaction.user.id;
  const guildId = interaction.guildId;
    const bM = new Bookmarks();
  const bookmarks = await bM.findMany({
    where: isGlobal
      ? { guildId }
      : { savedByUserId: userId, guildId },
    select: { tags: true },
  });

  const allTags = Array.from(new Set(bookmarks.flatMap(b => b.tags))).filter(Boolean);

  const embed = new EmbedBuilder()
    .setTitle('📚 Danh sách Tag đã dùng')
    .setDescription(allTags.length ? allTags.map(t => `• \`${t}\``).join('\n') : 'Không có tag nào.')
    .setColor(0x00bfff)
    .setFooter({ text: isGlobal ? 'Toàn bộ trong server' : `Chỉ của bạn` });

  await interaction.reply({ embeds: [embed], ephemeral: false });
}
