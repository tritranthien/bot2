import { config } from "../../config.js";
const repoPath = config.repoPath || 'postgresql';
const SettingRepo = await import(`../repo/${repoPath}/setting.js`);
import Base from "./base.js";
export class Setting extends Base {
    constructor() {
        super();
        this.repo = new SettingRepo();
    }
}