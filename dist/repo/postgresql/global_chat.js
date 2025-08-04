import { BaseRepo } from "./base.js";
export class GlobalChatRepo extends BaseRepo {
    constructor() {
        super({ tableName: "global_chats" });
    }
}
