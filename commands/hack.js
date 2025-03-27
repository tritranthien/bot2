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
        console.log("[INFO] Danh sách tên đã hết, reset lại...");
        usedNames.clear(); // Reset nếu hết tên
        availableNames = [...randomNames];
    }

    const randomName = availableNames[Math.floor(Math.random() * availableNames.length)];
    usedNames.add(randomName);
    console.log(`[DEBUG] Chọn tên: ${randomName}`);
    return randomName;
}

async function sendLoadingBar(message) {
    const progressBar = [
        "⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 0%", "🟩⬜⬜⬜⬜⬜⬜⬜⬜⬜ 10%", "🟩🟩⬜⬜⬜⬜⬜⬜⬜⬜ 20%",
        "🟩🟩🟩⬜⬜⬜⬜⬜⬜⬜ 30%", "🟩🟩🟩🟩⬜⬜⬜⬜⬜⬜ 40%", "🟩🟩🟩🟩🟩⬜⬜⬜⬜⬜ 50%",
        "🟩🟩🟩🟩🟩🟩⬜⬜⬜⬜ 60%", "🟩🟩🟩🟩🟩🟩🟩⬜⬜⬜ 70%", "🟩🟩🟩🟩🟩🟩🟩🟩⬜⬜ 80%",
        "🟩🟩🟩🟩🟩🟩🟩🟩🟩⬜ 90%", "🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩 100%"
    ];

    let msg = await message.channel.send(`📥 Downloading sensitive data... ${progressBar[0]}`);
    for (let i = 1; i < progressBar.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 400));
        await msg.edit(`📥 Downloading sensitive data... ${progressBar[i]}`);
    }
}

module.exports = {
    name: 'hack',
    description: 'Hacker Mode! 😈💻',
    async execute(message, args, config) {
        const member = message.mentions.members.first() || message.member;

        if (!member) {
            return message.reply("❌ Bạn cần mention một user!");
        }

        if (member.id === message.client.user.id) {
            return message.reply("🚫 Bạn không thể hack tôi đâu! Tôi là AI bất khả xâm phạm! 🤖🔥");
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

        // Gửi từng tin nhắn hack với delay
        for (const msg of hackingMessages) {
            await message.channel.send(msg);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Chạy loading bar xong mới gửi thông tin user
        await sendLoadingBar(message);

        // Gửi thông tin người dùng sau khi loading xong
        const userInfo = `📜 **Thông tin đã lấy được của ${member}:**  \n` +
            `🔹 **Tên hiển thị:** ${member.displayName}  \n` +
            `🔹 **Tên tài khoản:** ${member.user.username}  \n` +
            `🔹 **ID:** ${member.id}  \n` +
            `🔹 **Ngày tham gia Discord:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:F>  \n` +
            `🔹 **Ngày vào server:** <t:${Math.floor(member.joinedTimestamp / 1000)}:F>  \n` +
            `🔹 **Vai trò:** ${member.roles.cache.map(role => role.name).join(", ")}`;

        await message.channel.send(userInfo);

        // Đổi biệt danh sau khi hack xong
        try {
            const oldNickname = member.nickname || member.user.username; // Lấy biệt danh cũ
            await member.setNickname(hackedNickname);
            message.channel.send(`🛠️ Biệt danh của **${member}** đã bị thay đổi từ **"${oldNickname}"** thành **"${hackedNickname}"**!`);
        } catch (error) {
            console.error(`[ERROR] Không thể đổi biệt danh của ${member.user.username}:`, error);
            message.channel.send(`❌ Không thể đổi biệt danh của ${member} (Có thể bot không có quyền).`);
        }
    },
    hackedUsers,
    usedNames
};
