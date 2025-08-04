import { BaseRepo } from "./base.js";
export class ChatMessageRepo extends BaseRepo {
    constructor() {
        super({ tableName: "chat_messages" });
    }
}
