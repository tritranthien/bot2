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

      // Regex: $$ <username> <price> <item_name...>
      const match = content.match(/^\$\$\s+(\S+)\s+(\d+(?:\.\d+)?)\s*(.*)$/);
      
      if (!match) {
        await message.reply("⚠️ Cú pháp sai rồi, phải là `$$ <tên_không_có_khoảng_trắng> <price> <tên_món>` nhé!");
        return;
      }

      const user_name = match[1];
      let price = parseFloat(match[2]);
      const item_name = match[3]?.trim() || "lười ghi tên món 😅";

      if (isNaN(price) || price <= 0) {
        await message.reply("❌ Số tiền không hợp lệ!");
        return;
      }

      if (price < 1000) {
        price = price * 1000;
      }


      const now = new Date();
      const formattedDate = now.toISOString().slice(0, 10);

      const order = new Order();
      await order.createOrder({
        user_name,
        item_name,
        item_price: price,
        amount: price,
        order_date: now,
      });

      await message.reply(
        [
          `✅ **Order saved!**`,
          `> 👤 User: **${user_name}**`,
          `> 🍽 Món: ${item_name}`,
          `> 💰 Price: ${formatVND(price)}`,
          `> 📅 Date: ${formatDate(formattedDate)}`,
        ].join("\n")
      );
    } catch (err) {
      console.error("Error in $$ handler:", err);
      await message.reply("❌ Có lỗi khi lưu order, kiểm tra log đi!");
    }
  },
};
