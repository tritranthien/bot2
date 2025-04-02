import {BaseRepo} from "./base";
export class GlobalChatRepo extends BaseRepo {
    constructor() {
        super({ tableName: "global_chats" });
    }
}