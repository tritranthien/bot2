import { config } from "../config.js";
const repoPath = config.repoPath || 'postgresql';
import Base from "./base.js";
const { GlobalChatMessageRepo } = await import(`../repo/${repoPath}/global_chat_message.js`);
export class GlobalChatMessage extends Base {
    constructor() {
        super(new GlobalChatMessageRepo());
    }
}
