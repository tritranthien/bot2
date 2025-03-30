import { config } from "../config";
const repoPath: string = config.repoPath || 'postgresql';
import Base from "./base.js";

export class ChatMessage extends Base {
    constructor() { 
        super();
        this.init();
    }
    async init () {
        const {ChatMessageRepo} = await import(`../repo/${repoPath}/chat_message.js`);
        this.repo = new ChatMessageRepo();
    }
}