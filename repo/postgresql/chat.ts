import {BaseRepo} from "./base";
export class ChatRepo extends BaseRepo {
    constructor() {
        super({tableName: "chats"});
    }
}