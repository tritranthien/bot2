import { config } from "../config";
const repoPath: string = config.repoPath || 'postgresql';
import Base from "./base.js";

export class GlobalChatMessage extends Base {
    constructor() {
        super();
    }
    async init () {
        const {GlobalChatMessageRepo} = await import(`../repo/${repoPath}/global_chat_message.js`);
        this.repo = new GlobalChatMessageRepo(); 
    }
}