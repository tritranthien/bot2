import { config } from "../config.js";
const repoPath: string = config.repoPath || 'postgresql';
import Base from "./base.js";
const {BaseRepo} = await import(`../repo/${repoPath}/base.js`);

export class Bookmarks extends Base {
    constructor() {
        super(new BaseRepo({tableName: "bookmarks"}));
    }
}