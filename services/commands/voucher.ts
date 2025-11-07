import { Message } from "discord.js";
import { Order } from "../../models/order.js";
import { ExecuteParams, Command } from "./types.js";
import { formatVND, formatDate } from "../../utils/helpers.js";

export default {
  name: "voucher",
  description: "Áp dụng voucher giảm giá cho các đơn trong ngày 🎟",
  async execute({ message, args }: ExecuteParams): Promise<Message | void> {
    try {
      if (!args.length) {
        return message.reply("⚠️ Định dạng: `!voucher <amount> [yyyy-mm-dd]`");
      }

      let price = Number(args[0]);
      if (isNaN(price) || price <= 0) {
        return message.reply("❌ Nhập số đàng hoàng đi (`!voucher 50` hoặc `!voucher 50000`)!");
      }

      if (price < 1000) {
        price *= 1000;
      }

      const dateStr = args[1];
      const date = dateStr ? new Date(dateStr) : new Date();
      if (isNaN(date.getTime())) {
        return message.reply("❌ Ngày sai định dạng rồi (`yyyy-mm-dd`)!");
      }

      const orderModel = new Order();
      const { updated } = await orderModel.applyVoucherForDate(date, price);

      if (updated === 0) {
        return message.reply(
          `❌ Không có đơn nào trong ngày ${formatDate(date)} để áp dụng voucher!`
        );
      }

      // ✅ Thông báo kết quả
      const msg = [
        `🎟 **Voucher applied successfully!**`,
        `> 📅 Date: ${formatDate(date)}`,
        `> 💰 Voucher: ${formatVND(price)}`,
        `> 🧾 Updated orders: ${updated}`,
      ].join("\n");

      return message.reply(msg);
    } catch (err: any) {
      console.error("Voucher command error:", err);
      return message.reply("❌ Apply voucher lỗi rồi, check log đi!!!");
    }
  },
} as Command;
