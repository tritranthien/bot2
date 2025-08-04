import { config } from "../config.js";
const repoPath = config.repoPath || 'mongodb';
import Base from "./base.js";
const { BaseRepo } = await import(`../repo/${repoPath}/base.js`);
export class Bookmarks extends Base {
    constructor() {
        super(new BaseRepo({ tableName: "bookmarks" }));
    }
}
