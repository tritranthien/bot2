// commands/help.js
module.exports = {
    name: 'help',
    description: 'List all commands. ℹ️',
    async execute(message, args, config) {
        const helpText = `
  **Lệnh Quản Lý Server**
  \`${config.prefix}kick @user [lý do]\` - Kick người dùng
  \`${config.prefix}ban @user [lý do]\` - Ban người dùng
  \`${config.prefix}warn @user [lý do]\` - Cảnh cáo người dùng
  \`${config.prefix}mute @user [thời gian] [lý do]\` - Mute người dùng (thời gian tính bằng phút)
  \`${config.prefix}unmute @user\` - Unmute người dùng
  \`${config.prefix}purge [số lượng]\` - Xóa số lượng tin nhắn chỉ định 🧹
  \`${config.prefix}info @user\` - Xem thông tin người dùng ℹ️
  \`${config.prefix}campuchia @user\` - Chích điện người dùng ⚡
  \`${config.prefix}run @user\` - Chạy ngay đi 🏃‍➡️
  \`${config.prefix}ai [content]\` - Gọi AI 👧
  \`${config.prefix}clear\` - Xóa tất cả tin nhắn của bot 🧹
  \`${config.prefix}help\` - Xem danh sách lệnh 💁‍♂️
  `;
        message.channel.send(helpText);
    },
};