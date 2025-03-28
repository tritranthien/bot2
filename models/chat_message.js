import { config } from "../../config.js";
const repoPath = config.repoPath || 'postgresql';
const ChatMessageRepo = await import(`../repo/${repoPath}/chat_message.js`);
import Base from "./base.js";
export class ChatMessage extends Base {
    constructor() {
        super();
        this.repo = new ChatMessageRepo();
    }
}