import { config } from "../config";
const repoPath: string = config.repoPath || 'postgresql';
import Base, { Repository } from "./base.js";
const {GlobalChatMessageRepo} = await import(`../repo/${repoPath}/global_chat_message.js`);

export class GlobalChatMessage extends Base {
    constructor() {
        super(new GlobalChatMessageRepo());
    }
}