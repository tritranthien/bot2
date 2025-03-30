import { BaseRepo } from "./base";

export class ChatMessageRepo extends BaseRepo {
    constructor() {
        super({ tableName: "chat_messages" });
    }
}