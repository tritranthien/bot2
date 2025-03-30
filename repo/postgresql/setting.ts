import {BaseRepo} from "./base";
export class SettingRepo extends BaseRepo {
    constructor() {
        super({tableName: "settings"});
    }
}