import {BaseRepo} from "./base.js";
export default class UserRepo extends BaseRepo {
    constructor() {
        super({tableName: "users"});
    }
}