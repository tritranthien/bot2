import { config } from "../config.js";
const repoPath: string = config.repoPath || "mongodb";
import Base from "./base.js";
const { OrderRepo } = await import(`../repo/${repoPath}/order.js`);

/**
 * Order shape stored in DB
 */
export interface OrderData {
  id?: string;
  user_name: string;
  item_name: string;
  item_price: number;
  voucher?: number;
  amount?: number;
  order_date?: Date;
  is_payment?: boolean;
}

/**
 * Order model (repository wrapper + business helpers)
 */
export class Order extends Base {
  constructor() {
    super(new OrderRepo());
  }

  /**
   * Create a new order.
   * - If voucher provided, amount = max(0, item_price - voucher)
   * - Otherwise voucher = 0 and amount = item_price
   *
   * @param {OrderData} data
   * @returns {Promise<OrderData>}
   */
  async createOrder(data: OrderData): Promise<OrderData> {
    const item_price = Number(data.item_price ?? 0);
    const voucher = Number(data.voucher ?? 0);
    const amount = Math.max(0, item_price - voucher);

    const order = {
      user_name: data.user_name,
      item_name: data.item_name,
      item_price,
      voucher,
      amount,
      order_date: data.order_date ?? new Date(),
      is_payment: data.is_payment ?? false,
    };

    return await this.repo.save(order);
  }

  /**
   * Get all unpaid orders for a user, ordered by order_date ascending.
   *
   * @param user_name string
   * @returns Promise<OrderData[]>
   */
  async getUnpaidOrders(user_name: string): Promise<OrderData[]> {
    return await this.repo.findMany({
      where: { user_name, is_payment: false },
      orderBy: { order_date: "asc" },
    });
  }

  /**
   * Mark as paid all unpaid orders for user up to a given date (inclusive).
   *
   * @param user_name string
   * @param untilDate Date
   */
  async markAsPaidUntil(user_name: string, untilDate: Date): Promise<any> {
    const where = {
      user_name,
      order_date: { $lte: untilDate },
      is_payment: false,
    };
    return await this.repo.save({ is_payment: true }, where);
  }

  /**
   * Group unpaid orders by day (yyyy-mm-dd) for a user.
   * Returns an object where keys are date strings and value is array of orders.
   *
   * @param user_name string
   */
  async getUnpaidGroupedByDate(user_name: string): Promise<Record<string, OrderData[]>> {
    const orders = await this.getUnpaidOrders(user_name);
    const grouped: Record<string, OrderData[]> = {};
    for (const o of orders) {
      const d = new Date(o.order_date ?? new Date());
      const key = d.toISOString().slice(0, 10);
      grouped[key] = grouped[key] || [];
      grouped[key].push(o);
    }
    return grouped;
  }

  /**
   * Apply a voucher amount to all unpaid orders of a user for a specific date.
   *
   * Behavior:
   * - Finds unpaid orders for that date (order_date same day)
   * - For each order in ascending order_date (and id), reduces amount by voucherValue proportionally
   *   (here simple approach: subtract voucherValue from the earliest orders until voucher exhausted)
   *
   * NOTE: adjust this distribution logic if you want different behavior (e.g. distribute evenly).
   *
   * @param date Date (the day to apply voucher for)
   * @param voucherValue number (total discount to apply for that day)
   */
  async applyVoucherForDate(
    date: Date,
    voucherValue: number
  ): Promise<{ updated: number }> {
    const start = new Date(date);
    start.setHours(0 + 7, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23 + 7, 59, 59, 999);

    const orders = await this.repo.findMany({
      where: {
        is_payment: false,
        voucher: 0,
        order_date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { order_date: "asc" },
    });
    
    if (!orders.length) {
      return { updated: 0 };
    }

    let updated = 0;
    for (const order of orders) {
      const itemPrice = Number(order.item_price) || 0;
      const newAmount = Math.max(itemPrice - voucherValue, 0);

      await this.repo.save(
        {
          voucher: voucherValue,
          amount: newAmount,
        },
        { id: order.id }
      );

      updated++;
    }

    return { updated };
  }

  async findOrders(filter: Record<string, any> = {}): Promise<OrderData[]> {
    const where = { ...filter };
    if (where.order_date instanceof Date) {
      const start = new Date(where.order_date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(where.order_date);
      end.setHours(23, 59, 59, 999);
      where.order_date = { gte: start, lte: end };
    }

    const result = await this.repo.findMany({
      where,
      orderBy: { order_date: "asc" },
    });

    return result;
  }
}
