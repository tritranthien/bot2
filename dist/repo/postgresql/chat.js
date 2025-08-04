import { BaseRepo } from "./base.js";
export class ChatRepo extends BaseRepo {
    constructor() {
        super({ tableName: "chats" });
    }
}
