import { config } from "../config";
const repoPath: string = config.repoPath || 'postgresql';
import Base from "./base.js";
const {SettingRepo} = await import(`../repo/${repoPath}/setting.js`);

export class Setting extends Base {
    constructor() {
        super(new SettingRepo());
    }
    async getSettings(): Promise<Record<string, any>> {
        const settings = await this.repo.findMany({
            select: {
                key: true,
                value: true 
            }
        })
        return settings.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {});
    }
    async getSetting(key: string) {
        const setting = await this.repo.findFirst({
            where: {
                key: key
            },
            select: {
                key: true,
                value: true
            }
        })
        return setting?.value;
    }
}