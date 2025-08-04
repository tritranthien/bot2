import { BaseController } from "./Base.controller.js";
import { Setting } from '../models/setting.js';
export class SettingController extends BaseController {
    async index(req, res) {
        const setting = new Setting();
        const allSetitngs = await setting.getSettings();
        res.render('pages/settings', { settings: allSetitngs });
    }
    async save(req, res) {
        try {
            const { id, key, value } = req.body;
            const setting = new Setting();
            const saveOptions = {};
            if (id) {
                saveOptions['id'] = id;
            }
            if (key) {
                saveOptions['key'] = key;
            }
            if (value) {
                saveOptions['value'] = value;
            }
            const saved = await setting.save(saveOptions, { key });
            if (saved) {
                res.json({ ok: true, message: 'Setting saved successfully' });
                return;
            }
            res.status(500).json({ message: 'Failed to save setting' });
        }
        catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
