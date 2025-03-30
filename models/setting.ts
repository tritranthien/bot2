import { config } from "../config";
const repoPath: string = config.repoPath || 'postgresql';
import Base from "./base.js";

export class Setting extends Base {
    constructor() {
        super();
    }
    async init() {
        const { SettingRepo } = await import(`../repo/${repoPath}/setting.js`);
        this.repo = new SettingRepo();
    }
}