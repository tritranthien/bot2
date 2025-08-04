import { BaseRepo } from "./base.js";
export class GlobalChatMessageRepo extends BaseRepo {
    constructor() {
        super({ tableName: "global_chat_messages" });
    }
}
