import { Message } from "discord.js";
import { Order } from "../../models/order.js";
import { ExecuteParams, Command } from "./types.js";
import { formatVND, formatDate } from "../../utils/helpers.js";

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
                    replyMsg += "```" + "\n";
                    replyMsg += `┌──────────────┬──────────────┬──────────────┬──────────────┐\n`;
                    replyMsg += `│ Ngày order   │ Giá gốc      │ Giảm         │ Thành tiền   │\n`;
                    replyMsg += `├──────────────┼──────────────┼──────────────┼──────────────┤\n`;

                    const orders = groupedByDate[date];
                    orders.forEach((order, idx) => {
                        const orderDate = formatDate(order.order_date.$date || order.order_date);
                        const price = formatVND(order.item_price).padStart(12);
                        const discount = formatVND(order.voucher).padStart(12);
                        const totalAmount = formatVND(order.amount).padStart(12);

                        replyMsg += `│ ${orderDate.padEnd(12)} │ ${price} │ ${discount} │ ${totalAmount} │\n`;

                        if (idx < orders.length - 1)
                        replyMsg += `├──────────────┼──────────────┼──────────────┼──────────────┤\n`;

                        total += order.amount;
                    });

                    replyMsg += `└──────────────┴──────────────┴──────────────┴──────────────┘\n`;
                    replyMsg += "```" + "\n";
                }

                const firstDate = dates[0];
                const lastDate = dates[dates.length - 1];
                replyMsg += `🔹 **Tổng từ ngày ${formatDate(firstDate)} đến ${formatDate(lastDate)}: ${formatVND(total)}**\n\n`;

            }

            return message.reply(replyMsg.trim());
        } catch (err: any) {
            return message.reply("❌ Có lỗi khi tính tiền, liên hệ em Sơn đẹp trai nhé!!!");
        }
    },
} as Command;
