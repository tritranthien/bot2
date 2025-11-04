import {BaseRepo} from "./base.js";
export class OrderRepo extends BaseRepo {
    constructor() {
        super({tableName: "orders"});
    }
}