import { BaseRepo } from "./base.js";
export class UserRepo extends BaseRepo {
    constructor() {
        super({ tableName: "users" });
    }
}
