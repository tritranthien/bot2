import { Message } from "discord.js";
import { Order } from "../../models/order.js";
import { ExecuteParams, Command } from "./types.js";
import { formatDate } from "../../utils/helpers.js";

const OWNER_ID = "1349637201666768898";

export default {
    name: "paid",
    description: "Đánh dấu các đơn hàng là đã thanh toán đến thời điểm hiện tại.",
    async execute({ message, args }: ExecuteParams): Promise<Message | void> {
        try {
            if (message.author.id !== OWNER_ID) {
                return message.reply("⛔ Bạn không có quyền dùng lệnh này!");
            }

            const userName = args[0]?.trim();
            if (!userName) {
                return message.reply("⚠️ Hãy nhập tên user, ví dụ: `!paid anhtan`");
            }

            const orderModel = new Order();
            const today = new Date();
            today.setHours(23 - 7, 59, 59, 999);
            console.log(today);
            await orderModel.repo.deleteBy({
                user_name: userName,
                order_date: { $lte: today },
            });

            const formattedDate = formatDate(today.toISOString());
            const replyMsg = [
                `✅ **Đã thanh toán thành công!**`,
                `> 👤 User: **${userName}**`,
                `> 📅 Ngày: ${formattedDate}`,
            ].join("\n");

            return message.reply(replyMsg);
        } catch (err: any) {
            console.error(err);
            return message.reply("❌ Có lỗi khi cập nhật trạng thái thanh toán!");
        }
    },
} as Command;
