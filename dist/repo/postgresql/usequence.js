import { BaseRepo } from "./base.js";
export class UserSequenceRepo extends BaseRepo {
    constructor() {
        super({ tableName: "user_sequences" });
    }
}
