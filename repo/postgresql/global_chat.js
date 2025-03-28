import {BaseRepo} from "./base.js";
export default class ChatRepo extends BaseRepo {
    constructor() {
        super({tableName: "global_chats"});
    }
}