import { Options } from "discord.js";
import { config } from "../config.js";
const repoPath: string = config.repoPath || 'postgresql';
import Base from "./base.js";
import { FindOptions } from "../repo/postgresql/base.js";
const {SettingRepo} = await import(`../repo/${repoPath}/setting.js`);
export class Setting extends Base {
    constructor() {
        super(new SettingRepo());
    }
    async getSettings(keys?: String[]): Promise<Record<string, any>> {
        const options: FindOptions = {
            select: {
                key: true,
                value: true 
            }
        }
        if (keys) {
            options.where = {
                key: {
                    in: keys
               }}
            }
        const settings = await this.repo.findMany(options)
        return settings.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {});
    }
    async getSetting(key: string | undefined): Promise<any> {
        if (!key) {
            return null;
        }
        const setting = await this.repo.findFirst(
            {
                key: key
            },
            {
                key: true,
                value: true
            }
        )
        return setting?.value;
    }
}