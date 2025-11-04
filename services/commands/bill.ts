import { Message } from "discord.js";
import { Order } from "../../models/order.js";
import { ExecuteParams, Command } from "./types.js";

export default {
    name: "bill",
    description: "Tính tiền các đơn hàng chưa thanh toán. 💰",
    async execute({ message, args }: ExecuteParams): Promise<Message | void> {
        try {
            const name = args[0]?.trim() || null;
            const orderModel = new Order();

            // Nếu có name thì chỉ lấy user đó, ngược lại lấy tất cả
            const filter: any = { is_payment: false };
            if (name) filter.user_name = name;

            const orders = await orderModel.findOrders(filter);
            if (!orders?.length) {
                return message.reply(
                    name
                        ? `❌ Không có đơn nào chưa thanh toán của **${name}**`
                        : "❌ Không có đơn nào chưa thanh toán!"
                );
            }

            // Gom theo user
            const grouped = orders.reduce((acc: any, order: any) => {
                const user = order.user_name || "Unknown";
                if (!acc[user]) acc[user] = [];
                acc[user].push(order);
                return acc;
            }, {});

            let replyMsg = "";

            for (const [user, userOrders] of Object.entries(grouped)) {
                replyMsg += `💰 **Tính tiền cho ${user}:**\n`;

                // Gom theo ngày
                const groupedByDate = userOrders.reduce((acc: any, o: any) => {
                    const date = new Date(o.order_date).toISOString().slice(0, 10);
                    if (!acc[date]) acc[date] = [];
                    acc[date].push(o);
                    return acc;
                }, {});

                const dates = Object.keys(groupedByDate).sort();
                let total = 0;

                for (const date of dates) {
                    replyMsg += `📅 Ngày ${date}:\n`;

                    for (const order of groupedByDate[date]) {
                        const { _id, item_name, item_price, voucher = 0, amount } = order;
                        replyMsg += `> 🧾 (${_id}) ${item_name}: ${item_price} - ${voucher} = ${amount}\n`;
                        total += amount;
                    }
                }

                const firstDate = dates[0];
                const lastDate = dates[dates.length - 1];
                replyMsg += `\n🔹 **Tổng từ ngày ${firstDate} đến ${lastDate}: ${total.toLocaleString()}**\n\n`;
            }

            return message.reply(replyMsg.trim());
        } catch (err: any) {
            console.error("Bill command error:", err);
            return message.reply("❌ Có lỗi khi tính tiền, kiểm tra log đi!!!");
        }
    },
} as Command;
