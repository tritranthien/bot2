import {BaseRepo} from "./base.js";
export default class SettingRepo extends BaseRepo {
    constructor() {
        super({tableName: "settings"});
    }
}