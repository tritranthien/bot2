import {BaseRepo} from "./base";
export class GlobalChatMessageRepo extends BaseRepo {
    constructor() {
        super({tableName: "global_chat_messages"});
    }
}