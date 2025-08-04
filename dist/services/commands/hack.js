import { Setting } from '../../models/setting.js';
const hackedUsers = new Map(); // Lưu biệt danh cũ của user
const usedNames = new Set(); // Lưu các tên đã được sử dụng
const randomNames = [
    "KevinMitnick", "AnonymousX", "LulzSec", "SnowdenX", "MafiaBoy",
    "DarkDante", "CyberPunk2077", "RootkitMaster", "ZeroCool", "AcidBurn",
    "GlitchKing", "WallHackGod", "AimbotX", "ESP_Legend", "LagSwitchMaster",
    "NoClipNinja", "SpeedHackLord", "GhostModePro", "CyberCheatX", "BugAbuser",
    "LelouchX", "LightYagami", "Hackerman", "ShiroCode", "EvilGenius",
    "OverlordRoot", "TokyoPhantom", "NeonH4cker", "SAO_Glitch", "DeathNote1337"
];
function getUniqueRandomName() {
    let availableNames = randomNames.filter(name => !usedNames.has(name));
    if (availableNames.length === 0) {
        console.log("📃 Danh sách tên đã hết, reset lại...");
        usedNames.clear(); // Reset nếu hết tên
        availableNames = [...randomNames];
    }
    const randomName = availableNames[Math.floor(Math.random() * availableNames.length)];
    usedNames.add(randomName);
    console.log(`🕵️ Chọn tên: ${randomName}`);
    return randomName;
}
async function sendLoadingBar(message) {
    const progressBar = [
        "⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 0%", "🟩⬜⬜⬜⬜⬜⬜⬜⬜⬜ 10%", "🟩🟩⬜⬜⬜⬜⬜⬜⬜⬜ 20%",
        "🟩🟩🟩⬜⬜⬜⬜⬜⬜⬜ 30%", "🟩🟩🟩🟩⬜⬜⬜⬜⬜⬜ 40%", "🟩🟩🟩🟩🟩⬜⬜⬜⬜⬜ 50%",
        "🟩🟩🟩🟩🟩🟩⬜⬜⬜⬜ 60%", "🟩🟩🟩🟩🟩🟩🟩⬜⬜⬜ 70%", "🟩🟩🟩🟩🟩🟩🟩🟩⬜⬜ 80%",
        "🟩🟩🟩🟩🟩🟩🟩🟩🟩⬜ 90%", "🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩 100%"
    ];
    let msg;
    if ('send' in message.channel) {
        msg = await message.channel.send(`📥 Downloading sensitive data... ${progressBar[0]}`);
    }
    for (let i = 1; i < progressBar.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        await msg?.edit(`📥 Downloading sensitive data... ${progressBar[i]}`);
    }
}
export default {
    name: 'hack',
    description: 'Hacker Mode! 😈💻',
    async execute({ message, args, config }) {
        const member = message.mentions.members?.first() || message.member;
        if (!member) {
            message.reply("❌ Bạn cần mention một user!");
            return;
        }
        if (member.id === message.client.user?.id) {
            message.reply("🚫 Bạn không thể hack tôi đâu! Tôi là AI bất khả xâm phạm! 🤖🔥");
            return;
        }
        if (!member.manageable) {
            message.reply(`⚠️ Không thể hack ${member} này, người này là chúa trời đã tạo ra tôi! .`);
            return;
        }
        console.log(`[INFO] Đang hack user: ${member.user.username} (${member.id})`);
        hackedUsers.set(member.id, member.nickname || member.user.username);
        const randomName = getUniqueRandomName();
        const hackedNickname = `💀 HACKED USER ${randomName} 💀`;
        const hackingMessages = [
            "[ACCESS GRANTED] 🔓",
            `📡 Đang xâm nhập vào hệ thống của ${member.user.username}...`,
            "💀 Injecting backdoor...",
            "🔥 Kích hoạt virus AI...",
            "💣 Đang gửi toàn bộ mật khẩu lên Dark Web...",
            `✅ Hack thành công! ${member}, giờ đã thuộc về chúng ta! 😈`
        ];
        for (const msg of hackingMessages) {
            if ('send' in message.channel) {
                await message.channel.send(msg);
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        await sendLoadingBar(message);
        const userInfo = `📜 **Thông tin đã lấy được của ${member}:**  \n` +
            `🔹 **Tên hiển thị:** ${member.displayName}  \n` +
            `🔹 **Tên tài khoản:** ${member.user.username}  \n` +
            `🔹 **ID:** ${member.id}  \n` +
            `🔹 **Ngày tham gia Discord:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:F>  \n` +
            `🔹 **Ngày vào server:** <t:${Math.floor(member.joinedTimestamp ?? Date.now() / 1000)}:F>  \n` +
            `🔹 **Vai trò:** ${member.roles.cache.map(role => role.name).join(", ")}`;
        if ('send' in message.channel) {
            await message.channel.send(userInfo);
        }
        try {
            const oldNickname = member.nickname || member.user.username;
            const SettingM = new Setting();
            await SettingM.save({
                key: `hack-${member.id}`,
                value: oldNickname
            });
            await member.setNickname(hackedNickname);
            if ('send' in message.channel) {
                message.channel.send(`🛠️ Biệt danh của **${member}** đã bị thay đổi từ **"${oldNickname}"** thành **"${hackedNickname}"**!`);
            }
        }
        catch (error) {
            console.error(`❌ Không thể đổi biệt danh của ${member.user.username}:`, error);
            if ('send' in message.channel) {
                message.channel.send(`❌ Không thể đổi biệt danh của ${member} (Có thể bot không có quyền).`);
            }
        }
    },
    hackedUsers,
    usedNames
};
