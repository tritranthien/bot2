import { Message } from "discord.js";
import { Order } from "../../models/order.js";
import { ExecuteParams, Command } from "./types.js";

export default {
    name: "voucher",
    description: "Áp dụng voucher giảm giá cho các đơn trong ngày. 🎟",
    async execute({ message, args, config }: ExecuteParams): Promise<Message | void> {
        try {
            if (!args.length) {
                return message.reply("⚠️ Định dạng: `!voucher <amount> [yyyy-mm-dd]`");
            }

            const price = Number(args[0]);
            if (isNaN(price) || price <= 0) {
                return message.reply("❌ Nhập số hợp lệ đi cha nội (`!voucher 5000`)!!!");
            }

            const dateStr = args[1];
            const date = dateStr ? new Date(dateStr) : new Date();

            if (isNaN(date.getTime())) {
                return message.reply("❌ Nhập ngày sai định dạng (`yyyy-mm-dd`)!!!");
            }

            const userId = message.author.id;
            const orderModel = new Order();

            const result = await orderModel.applyVoucherForDate(userId, date, price);

            const formattedDate = date.toISOString().slice(0, 10);
            const msg = [
                `🎟 **Voucher applied successfully!**`,
                `> 👤 User: <@${userId}>`,
                `> 📅 Date: ${formattedDate}`,
                `> 💰 Voucher: ${price.toFixed(2)}`,
                `> 🧾 Updated orders: ${result.updated}`,
                `> 💸 Remaining (unused): ${result.remaining.toFixed(2)}`,
            ].join("\n");

            return message.reply(msg);
        } catch (err: any) {
            console.error("Voucher command error:", err);
            return message.reply("❌ Apply voucher lỗi rồi, check log đi!!!");
        }
    },
} as Command;
