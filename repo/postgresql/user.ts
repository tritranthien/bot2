import {BaseRepo} from "./base";
export class UserRepo extends BaseRepo {
    constructor() {
        super({tableName: "users"});
    }
}