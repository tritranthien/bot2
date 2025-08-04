import hackS from './hack.js'; // Import danh sách hackedUsers và usedNames
import { Setting } from '../../models/setting.js';
const usedNames = hackS.usedNames;
export default {
    name: 'unhack',
    description: 'Khôi phục biệt danh cũ sau khi bị hack! 🛠️',
    async execute({ message, args, config }) {
        const member = message.mentions.members?.first();
        if (!member) {
            console.log("[ERROR] Không tìm thấy user mention!");
            message.reply('❌ Bạn cần mention ai đó để unhack!');
            return;
        }
        console.log(`[INFO] Thực hiện unhack cho user: ${member.user.username} (${member.id})`);
        // Lấy biệt danh cũ
        const settingM = new Setting();
        const oldNickname = await settingM.getSetting(`hack-${member.id}`);
        if (!oldNickname) {
            console.log(`[WARN] ${member.user.username} chưa từng bị hack hoặc không có dữ liệu để khôi phục.`);
            message.reply(`❌ ${member} chưa từng bị hack hoặc không có dữ liệu để khôi phục.`);
            return;
        }
        console.log(`[DEBUG] Biệt danh cũ: ${oldNickname}`);
        // Thử khôi phục biệt danh
        try {
            await member.setNickname(oldNickname);
            if ('send' in message.channel) {
                message.channel.send(`✅ Biệt danh của ${member} đã được khôi phục thành **"${oldNickname}"**!`);
            }
            console.log(`[SUCCESS] Đã khôi phục biệt danh của ${member.user.username} thành: ${oldNickname}`);
            // Xóa khỏi danh sách hacked
            console.log(`[INFO] Xóa ${member.user.username} khỏi danh sách hackedUsers.`);
            // Xóa khỏi danh sách tên đã dùng
            const cleanedName = oldNickname.replace("💀 HACKED USER ", "").replace(" 💀", "");
            usedNames.delete(cleanedName);
            console.log(`[INFO] Xóa tên "${cleanedName}" khỏi danh sách usedNames.`);
        }
        catch (error) {
            console.error(`[ERROR] Không thể khôi phục biệt danh của ${member.user.username}:`, error);
            if ('send' in message.channel) {
                message.channel.send(`❌ Không thể khôi phục biệt danh của ${member} (Có thể bot không có quyền).`);
            }
        }
    },
};
