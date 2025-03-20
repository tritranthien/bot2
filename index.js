require('dotenv').config();
const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("./server.js");

const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
// Khởi tạo client với các intents cần thiết
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration
  ]
});

// Cấu hình bot
const config = {
  prefix: '!',
  token: process.env.DISCORD_TOKEN, // Thay bằng token thực của bạn
  modLogChannel: 'mod-logs', // Kênh ghi nhật ký hoạt động quản lý
  mutedRole: 'Muted' // Tên role cho người bị mute
};
const SON_ID = '1349637201666768898';
const CAMGIF = 'a:campuchigif:1352142676056735764';
// Đối tượng lưu trữ cảnh cáo tạm thời
const warnings = new Collection();

// Khởi động bot
client.once('ready', () => {
  console.log(`Bot đã sẵn sàng! Đăng nhập với tên ${client.user.tag}`);
  client.user.setActivity('!help để xem lệnh', { type: 'WATCHING' });
  
  // Đảm bảo mỗi server có role Muted
  client.guilds.cache.forEach(guild => {
    let mutedRole = guild.roles.cache.find(role => role.name === config.mutedRole);
    if (!mutedRole) {
      try {
        guild.roles.create({
          name: config.mutedRole,
          permissions: []
        }).then(role => {
          console.log(`Đã tạo role ${role.name} cho server ${guild.name}`);
          
          // Thiết lập quyền cho role Muted trong mỗi kênh
          guild.channels.cache.forEach(channel => {
            channel.permissionOverwrites.create(role, {
              SendMessages: false,
              AddReactions: false,
              Speak: false
            });
          });
        });
      } catch (error) {
        console.error(`Không thể tạo role Muted cho server ${guild.name}: ${error}`);
      }
    }
  });
  setInterval(() => {
    const channel = client.channels.cache.get("1349638167812247578");
    if (channel) {
        channel.send(`<@1349637201666768898>, đã tới thời gian chích điện định kỳ, đưa cổ đây,<a:campuchigif:1352142676056735764> "rẹt rẹt rẹt ....."`);
    } else {
        console.log('Không tìm thấy kênh.');
    }
}, 5200000);
});

// Xử lý tin nhắn
client.on('messageCreate', async message => {
  // Bỏ qua tin nhắn từ bot và tin nhắn không bắt đầu bằng prefix
  if (message.author.bot || !message.content.startsWith(config.prefix)) return;
  
  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  
  // Kiểm tra quyền admin/mod
  const hasModPerms = message.member.permissions.has('ModerateMembers') || 
                     message.member.permissions.has('Administrator');
  
  // Danh sách lệnh
  switch (command) {
    case 'help':
      sendHelpMessage(message);
      break;
      
    case 'kick':
      if (!hasModPerms) return message.reply('Bạn không có quyền sử dụng lệnh này.');
      if (!args.length) return message.reply('Bạn cần tag người dùng cần kick.');
      kickUser(message, args);
      break;
      
    case 'ban':
      if (!hasModPerms) return message.reply('Bạn không có quyền sử dụng lệnh này.');
      if (!args.length) return message.reply('Bạn cần tag người dùng cần ban.');
      banUser(message, args);
      break;
      
    case 'warn':
      if (!hasModPerms) return message.reply('Bạn không có quyền sử dụng lệnh này.');
      if (!args.length) return message.reply('Bạn cần tag người dùng cần cảnh cáo.');
      warnUser(message, args);
      break;
      
    case 'mute':
      if (!hasModPerms) return message.reply('Bạn không có quyền sử dụng lệnh này.');
      if (!args.length) return message.reply('Bạn cần tag người dùng cần mute.');
      muteUser(message, args);
      break;
      
    case 'unmute':
      if (!hasModPerms) return message.reply('Bạn không có quyền sử dụng lệnh này.');
      if (!args.length) return message.reply('Bạn cần tag người dùng cần unmute.');
      unmuteUser(message, args);
      break;
      
    case 'purge':
      if (!hasModPerms) return message.reply('Bạn không có quyền sử dụng lệnh này.');
      if (!args.length) return message.reply('Bạn cần chỉ định số lượng tin nhắn cần xóa.');
      purgeMessages(message, args);
      break;
      
    case 'info':
      if (!args.length) {
        return message.reply('Bạn cần tag người dùng hoặc nhập ID để xem thông tin.');
      }
      getUserInfo(message, args);
      break;
    case 'campuchia':
      campuchia(message);
      break;
    case 'test1':
      message.reply('tôi còn sống!');
      break;
    case 'ai':
      if (!args.length) return message.reply('Bạn cần nhập nội dung để gọi AI.');
      try {
        const prompt = args.join(' ');
        const result = await model.generateContent(prompt);
        let content = result.response.text();
        const embedList = [];
        while (content.length > 0) {
            const part = content.substring(0, 2000); // Cắt thành từng phần 2000 ký tự
            content = content.substring(2000);

            const embed = new EmbedBuilder()
                .setColor("#ff0000")
                .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
                .setDescription(part);

            embedList.push(embed);
        }

        for (const embed of embedList) {
            await message.channel.send({ embeds: [embed] });
        }
        const fetchedMessage = await message.channel.messages.fetch(message.id).catch(() => null);
        if (fetchedMessage) {
            await message.delete();
        }
        // message.channel.send(result.response.text());
      } catch (error) {
        console.error(error);
        message.reply('Có lỗi xảy ra khi gọi AI.');
      }
      break;
    case 'clear':
      const fetchedMessages = await message.channel.messages.fetch({ limit: 100 });
      const botMessages = fetchedMessages.filter(msg => msg.author.id === client.user.id);
      message.channel.bulkDelete(botMessages, true).catch(err => console.error(err));
      message.channel.send('Đã xóa tất cả tin nhắn của bot!').then(msg => setTimeout(() => msg.delete(), 3000));
      break;
  }
});

// Ghi log khi thành viên tham gia server
client.on('guildMemberAdd', member => {
  const logChannel = member.guild.channels.cache.find(channel => channel.name === config.modLogChannel);
  if (logChannel) {
    logChannel.send(`📥 **${member.user.tag}** đã tham gia server. (ID: ${member.id})`);
  }
  
  // Có thể thêm tin nhắn chào mừng ở đây
  // member.guild.systemChannel?.send(`Chào mừng ${member} đến với server!`);
});

// Ghi log khi thành viên rời server
client.on('guildMemberRemove', member => {
  const logChannel = member.guild.channels.cache.find(channel => channel.name === config.modLogChannel);
  if (logChannel) {
    logChannel.send(`📤 **${member.user.tag}** đã rời server. (ID: ${member.id})`);
  }
});

// Hàm xử lý các lệnh
async function sendHelpMessage(message) {
  const helpText = `
**Lệnh Quản Lý Server**
\`${config.prefix}kick @user [lý do]\` - Kick người dùng
\`${config.prefix}ban @user [lý do]\` - Ban người dùng
\`${config.prefix}warn @user [lý do]\` - Cảnh cáo người dùng
\`${config.prefix}mute @user [thời gian] [lý do]\` - Mute người dùng (thời gian tính bằng phút)
\`${config.prefix}unmute @user\` - Unmute người dùng
\`${config.prefix}purge [số lượng]\` - Xóa số lượng tin nhắn chỉ định
\`${config.prefix}info @user\` - Xem thông tin người dùng
\`${config.prefix}campuchia @user\` - Chích điện người dùng
\`${config.prefix}ai [content]\` - Gọi AI
\`${config.prefix}clear\` - Xóa tất cả tin nhắn của bot
\`${config.prefix}test2\` - test
`;
  message.channel.send(helpText);
}

async function kickUser(message, args) {
  const member = message.mentions.members.first();
  if (!member) return message.reply('Không thể tìm thấy người dùng này.');
  
  if (!member.kickable) return message.reply('Tôi không thể kick người dùng này.');
  
  const reason = args.slice(1).join(' ') || 'Không có lý do';
  
  try {
    await member.kick(reason);
    message.channel.send(`✅ Đã kick **${member.user.tag}**. Lý do: ${reason}`);
    
    // Ghi log
    logModAction(message.guild, 'Kick', message.author, member.user, reason);
  } catch (error) {
    console.error(error);
    message.reply('Có lỗi xảy ra khi kick người dùng.');
  }
}

async function banUser(message, args) {
  const member = message.mentions.members.first();
  if (!member) return message.reply('Không thể tìm thấy người dùng này.');
  
  if (!member.bannable) return message.reply('Tôi không thể ban người dùng này.');
  
  const reason = args.slice(1).join(' ') || 'Không có lý do';
  
  try {
    await member.ban({ reason });
    message.channel.send(`🔨 Đã ban **${member.user.tag}**. Lý do: ${reason}`);
    
    // Ghi log
    logModAction(message.guild, 'Ban', message.author, member.user, reason);
  } catch (error) {
    console.error(error);
    message.reply('Có lỗi xảy ra khi ban người dùng.');
  }
}

async function warnUser(message, args) {
  const member = message.mentions.members.first();
  if (!member) return message.reply('Không thể tìm thấy người dùng này.');
  
  const reason = args.slice(1).join(' ') || 'Không có lý do';
  
  // Lưu cảnh cáo
  if (!warnings.has(member.id)) {
    warnings.set(member.id, []);
  }
  
  const userWarnings = warnings.get(member.id);
  userWarnings.push({
    moderator: message.author.id,
    reason,
    timestamp: Date.now()
  });
  
  message.channel.send(`⚠️ **${member.user.tag}** đã bị cảnh cáo. **Số cảnh cáo hiện tại:** ${userWarnings.length}. Lý do: ${reason}`);
  
  // Nếu đủ 3 cảnh cáo, tự động mute
  if (userWarnings.length >= 3) {
    const mutedRole = message.guild.roles.cache.find(role => role.name === config.mutedRole);
    if (mutedRole) {
      await member.roles.add(mutedRole);
      message.channel.send(`🔇 **${member.user.tag}** đã bị mute tự động do nhận 3 cảnh cáo.`);
      
      // Ghi log
      logModAction(message.guild, 'Auto-Mute', client.user, member.user, 'Nhận 3 cảnh cáo');
      
      // Reset cảnh cáo sau khi mute
      warnings.set(member.id, []);
    }
  }
  
  // Ghi log
  logModAction(message.guild, 'Cảnh cáo', message.author, member.user, reason);
}

async function muteUser(message, args) {
  const member = message.mentions.members.first();
  if (!member) return message.reply('Không thể tìm thấy người dùng này.');
  
  // Kiểm tra số phút
  const minutes = parseInt(args[1]);
  if (!minutes || isNaN(minutes)) return message.reply('Vui lòng nhập thời gian mute hợp lệ (phút).');
  
  const reason = args.slice(2).join(' ') || 'Không có lý do';
  
  const mutedRole = message.guild.roles.cache.find(role => role.name === config.mutedRole);
  if (!mutedRole) return message.reply('Không tìm thấy role Muted. Vui lòng tạo role này.');
  
  try {
    await member.roles.add(mutedRole);
    message.channel.send(`🔇 Đã mute **${member.user.tag}** trong **${minutes} phút**. Lý do: ${reason}`);
    
    // Ghi log
    logModAction(message.guild, 'Mute', message.author, member.user, `${minutes} phút. Lý do: ${reason}`);
    
    // Tự động unmute sau khoảng thời gian
    setTimeout(async () => {
      if (member.roles.cache.has(mutedRole.id)) {
        await member.roles.remove(mutedRole);
        message.channel.send(`🔊 **${member.user.tag}** đã được unmute tự động.`);
        
        // Ghi log
        logModAction(message.guild, 'Auto-Unmute', client.user, member.user, 'Hết thời gian mute');
      }
    }, minutes * 60000);
  } catch (error) {
    console.error(error);
    message.reply('Có lỗi xảy ra khi mute người dùng.');
  }
}

async function unmuteUser(message, args) {
  const member = message.mentions.members.first();
  if (!member) return message.reply('Không thể tìm thấy người dùng này.');
  
  const mutedRole = message.guild.roles.cache.find(role => role.name === config.mutedRole);
  if (!mutedRole) return message.reply('Không tìm thấy role Muted.');
  
  if (!member.roles.cache.has(mutedRole.id)) return message.reply('Người dùng này không bị mute.');
  
  try {
    await member.roles.remove(mutedRole);
    message.channel.send(`🔊 Đã unmute **${member.user.tag}**.`);
    
    // Ghi log
    logModAction(message.guild, 'Unmute', message.author, member.user, 'Đã được gỡ mute bởi người quản lý');
  } catch (error) {
    console.error(error);
    message.reply('Có lỗi xảy ra khi unmute người dùng.');
  }
}

async function purgeMessages(message, args) {
  const amount = parseInt(args[0]) + 1; // +1 để xóa luôn lệnh
  
  if (isNaN(amount)) {
    return message.reply('Vui lòng nhập một số hợp lệ.');
  }
  
  if (amount <= 1 || amount > 100) {
    return message.reply('Vui lòng nhập số từ 1 đến 99.');
  }
  
  try {
    const deleted = await message.channel.bulkDelete(amount, true);
    message.channel.send(`🗑️ Đã xóa ${deleted.size - 1} tin nhắn.`).then(msg => {
      setTimeout(() => msg.delete(), 5000);
    });
    
    // Ghi log
    logModAction(message.guild, 'Purge', message.author, null, `Đã xóa ${deleted.size - 1} tin nhắn trong kênh #${message.channel.name}`);
  } catch (error) {
    console.error(error);
    message.reply('Có lỗi xảy ra khi xóa tin nhắn hoặc tin nhắn quá cũ (>14 ngày).');
  }
}

async function campuchia(message) {
    const member = message.mentions.members.first();
    if (!member) return message.reply('Không thể tìm thấy người dùng này.');
    if (message.author.id === member.id) {
      return message.reply('Tự chích điện là không sao cả, mày xứng đáng bị chích điện.');
    }
    if (message.author.id === SON_ID) {
      return message.reply(`á à, mày còn đòi chích điện người khác à, mày giỏi quá <@${SON_ID}>, <a:campuchigif:1352142676056735764> "rẹt rẹt rẹt ......"`);
    }
    if (member.id !== SON_ID) {
      return message.reply(`xin lỗi, ở đây chúng tôi chỉ chích điện <@${SON_ID}>, đúng vậy, chích nó <a:campuchigif:1352142676056735764> "rẹt rẹt rẹt ......"`);
    }
    return message.reply(`á à, thằng này mày xứng đáng bị chích điện ${member} à, <a:campuchigif:1352142676056735764> hêy hêy, "rẹt rẹt rẹt ......"`);
}

async function getUserInfo(message, args) {
  let user;
  
  if (message.mentions.users.size) {
    user = message.mentions.users.first();
  } else if (args[0]) {
    try {
      user = await client.users.fetch(args[0]);
    } catch (error) {
      return message.reply('Không tìm thấy người dùng với ID này.');
    }
  }
  
  if (!user) return message.reply('Không thể tìm thấy người dùng.');
  
  const member = message.guild.members.cache.get(user.id);
  
  let infoText = `
**Thông tin người dùng: ${user.tag}**
ID: ${user.id}
Tạo tài khoản: ${new Date(user.createdAt).toLocaleString()}
Avatar: ${user.displayAvatarURL({ dynamic: true })}
`;

  if (member) {
    infoText += `
**Thông tin thành viên Server:**
Biệt danh: ${member.nickname || 'Không có'}
Tham gia server: ${new Date(member.joinedAt).toLocaleString()}
Vai trò: ${member.roles.cache.map(r => r.name).join(', ')}
`;
  }
  
  // Hiển thị cảnh cáo nếu có
  if (warnings.has(user.id)) {
    const userWarnings = warnings.get(user.id);
    infoText += `\n**Cảnh cáo:** ${userWarnings.length}`;
    
    userWarnings.forEach((warn, index) => {
      const moderator = client.users.cache.get(warn.moderator);
      infoText += `\n${index + 1}. Bởi: ${moderator ? moderator.tag : 'Unknown'} - ${new Date(warn.timestamp).toLocaleString()} - ${warn.reason}`;
    });
  }
  
  message.channel.send(infoText);
}

// Hàm ghi log hành động quản lý
function logModAction(guild, action, moderator, target, reason) {
  const logChannel = guild.channels.cache.find(channel => channel.name === config.modLogChannel);
  if (!logChannel) return;
  
  let logMessage = `**${action}** | ${new Date().toLocaleString()}\n`;
  logMessage += `**Người quản lý:** ${moderator.tag} (${moderator.id})\n`;
  
  if (target) {
    logMessage += `**Người dùng:** ${target.tag} (${target.id})\n`;
  }
  
  logMessage += `**Chi tiết:** ${reason}`;
  
  logChannel.send(logMessage);
}

// Đăng nhập với token bot
client.login(config.token);