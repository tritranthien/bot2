import { config } from "../../config.js";
const repoPath = config.repoPath || 'postgresql';
const GlobalChatMessageRepo = await import(`../repo/${repoPath}/global_chat_message.js`);
import Base from "./base.js";
export class GlobalChatMessage extends Base {
    constructor() {
        super();
        this.repo = new GlobalChatMessageRepo();
    }
}