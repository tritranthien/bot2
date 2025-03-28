import {BaseRepo} from "./base.js";
export default class ChatMessageRepo extends BaseRepo {
    constructor() {
        super({tableName: "chat_messages"});
    }
}