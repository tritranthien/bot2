import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Bookmarks } from '../../models/bookmark.js';

export const data = new SlashCommandBuilder()
  .setName('bookmark')
  .setDescription('📌 Lưu nội dung từ tin nhắn')
  .addSubcommand(sub =>
    sub.setName('add')
      .setDescription('Lưu 1 tin nhắn bằng link')
      .addStringOption(opt =>
        opt.setName('link')
          .setDescription('Link tin nhắn gốc')
          .setRequired(true))
      .addStringOption(opt =>
        opt.setName('tags')
          .setDescription('Thêm tag (cách nhau bằng dấu cách)')
          .setRequired(false))
  ).addSubcommand(sub =>
    sub.setName('delete')
      .setDescription('Xoá tất cả bookmark hoặc 1 cái cụ thể')
      .addStringOption(opt =>
        opt.setName('id')
          .setDescription('ID của bookmark (tuỳ chọn, nếu không sẽ xoá hết)'))
  );;

export async function execute(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand();
  if (sub !== 'add') return;

  const link = interaction.options.getString('link', true);
  const rawTags = interaction.options.getString('tags') || '';
  const tags = rawTags.split(/\s+/).filter(Boolean);

  const match = link.match(/https:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/);
  if (!match) return interaction.reply({ content: '❌ Link không hợp lệ.', ephemeral: true });

  const [, guildId, channelId, messageId] = match;
  const channel = await interaction.client.channels.fetch(channelId);
  if (!channel?.isTextBased()) return interaction.reply({ content: '❌ Không tìm thấy kênh.', ephemeral: true });

  const msg = await channel.messages.fetch(messageId);
  if (!msg) return interaction.reply({ content: '❌ Không tìm thấy tin nhắn.', ephemeral: true });
    const bM = new Bookmarks();
  await bM.save({
    guildId,
    channelId,
    messageId,
    messageLink: link,
    content: msg.content,
    attachments: msg.attachments.map(a => a.url),
    originalUserId: msg.author.id,
    originalUsername: msg.author.tag,
    savedByUserId: interaction.user.id,
    savedByUsername: interaction.user.tag,
    tags,
  });

  const embed = new EmbedBuilder()
    .setTitle('✅ Đã lưu bookmark!')
    .setDescription(`[Xem tin nhắn](${link})`)
    .addFields({ name: 'Tác giả', value: msg.author.tag }, { name: 'Tag', value: tags.join(', ') || 'Không có' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
