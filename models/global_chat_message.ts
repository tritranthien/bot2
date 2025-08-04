import { config } from "../config.js";
const repoPath: string = config.repoPath || 'mongodb';
import Base, { Repository } from "./base.js";
const {GlobalChatMessageRepo} = await import(`../repo/${repoPath}/global_chat_message.js`);

export class GlobalChatMessage extends Base {
    constructor() {
        super(new GlobalChatMessageRepo());
    }
}