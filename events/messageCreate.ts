import { Events, Message } from "discord.js";
import { Order } from "../models/order.js";
import { formatVND, formatDate } from "../utils/helpers.js";

export default {
  name: Events.MessageCreate,
  once: false,
  async execute(message: Message) {
    try {
      const content = message.content.trim();
      console.log(content);

      // Regex: $$ <username> <price>
      const match = content.match(/\$\$\s+(\S+)\s+(\d+(?:\.\d+)?)/);
      
      if (!match) {
        await message.reply("⚠️ Cú pháp sai rồi, phải là `$$ <tên_không_có_khoảng_trắng> <price>` nhé!");
        return;
      }

      const user_name = match[1];
      const price = parseFloat(match[2]);

      if (isNaN(price) || price <= 0) {
        await message.reply("❌ Số tiền không hợp lệ!");
        return;
      }

      // Lấy tin nhắn được forward (tin gốc)
      // const referenced = message.reference
      //   ? await message.fetchReference().catch(() => null)
      //   : null;

      // if (!referenced) {
      //   await message.reply("⚠️ !!!");
      //   return;
      // }

      // item_name = dòng có dấu '+'
      // const itemLine = referenced.content
      //   .split("\n")
      //   .find((l) => l.trim());
      // const item_name = itemLine
      //   ? itemLine.replace(/^\+\s*/, "").trim()
      //   : referenced.content.trim();

      const now = new Date();
      const formattedDate = now.toISOString().slice(0, 10);

      const order = new Order();
      await order.createOrder({
        user_name,
        item_name: formattedDate,
        item_price: price,
        amount: price,
        order_date: now,
      });

      await message.reply(
        [
          `✅ **Order saved!**`,
          `> 👤 User: **${user_name}**`,
          `> 💰 Price: ${formatVND(price)}`,
          `> 📅 Date: ${formatDate(formattedDate)}`,
        ].join("\n")
      );
    } catch (err) {
      console.error("Error in $$ forward handler:", err);
      await message.reply("❌ Có lỗi khi lưu order, kiểm tra log đi!");
    }
  },
};
