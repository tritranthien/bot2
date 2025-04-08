import { Client, GatewayIntentBits, TextChannel, ChannelType } from "discord.js";
import dotenv from "dotenv";
import { Config, config as importedConfig } from "../config.js";
import { Setting } from "../models/setting.js"

dotenv.config();
const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

const notifyDeploy = async () => {
    const settingM = new Setting();
    const channelId = importedConfig?.channeSpamSettingKey ? await settingM.getSetting(importedConfig.channeSpamSettingKey) : importedConfig.aiChannel;
    const token = process.env.DISCORD_TOKEN;

    if (!token || !channelId) {
        console.error("⚠️ Missing DISCORD_TOKEN or CHANNEL_ID.");
        return;
    }

    await client.login(token);

    client.once("ready", async () => {
        const url = process.env.APP_URL || null;
        if (process.env.APP_ENV === 'production' && url) {
            try {
                const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
                const channel = await client.channels.fetch(channelId);
                // Kiểm tra chính xác kiểu kênh
                if (!channel || channel.type !== ChannelType.GuildText) {
                    console.error("❌ Channel không hợp lệ hoặc không phải là TextChannel.");
                    return;
                }
                const textChannel = channel as TextChannel;
                await textChannel.send(`✅ **Server đã deploy thành công!** 🚀 🕒 ${now}`);
                console.log(`✅ **Server đã deploy thành công!** ${now}`);
            } catch (err) {
                console.error("❌ Lỗi khi gửi thông báo:", err);
            } finally {
                client.destroy();
            }
        }
    });
};

notifyDeploy();
