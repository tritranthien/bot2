import { BaseRepo } from "./base.js";
export class SettingRepo extends BaseRepo {
    constructor() {
        super({ tableName: "settings" });
    }
}
