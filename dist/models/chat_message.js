import { config } from "../config.js";
const repoPath = config.repoPath || 'postgresql';
import Base from "./base.js";
const { ChatMessageRepo } = await import(`../repo/${repoPath}/chat_message.js`);
export class ChatMessage extends Base {
    constructor() {
        super(new ChatMessageRepo());
    }
}
