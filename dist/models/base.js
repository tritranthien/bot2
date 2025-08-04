export default class Base {
    constructor(repo) {
        this.repo = repo;
    }
    async save(record, where = null) {
        if (!record || !this.repo) {
            return false;
        }
        const saved = await this.repo.save(record, where);
        return saved;
    }
    async bulkSave(records) {
        const saved = await this.repo.bulkSave(records);
        return saved;
    }
    async findUnique(id, select, include) {
        const row = await this.repo.findUnique(id, select, include);
        if (!row) {
            return null;
        }
        return row;
    }
    async findFirst(where, select, include, orderBy) {
        const row = await this.repo.findFirst(where, select, include, orderBy);
        if (!row) {
            return null;
        }
        return row;
    }
    async delete(id) {
        const deleted = await this.repo.delete(id);
        return deleted;
    }
    async deleteBy(where) {
        const deleted = await this.repo.deleteBy(where);
        return true;
    }
    async bulkDelete(ids) {
        const deleted = await this.repo.bulkDelete(ids);
        return deleted;
    }
    async bulkDeleteBy(where) {
        const deleted = await this.repo.bulkDeleteBy(where);
        return deleted;
    }
    async findMany(findOptions) {
        const rows = await this.repo.findMany(findOptions);
        return Promise.all(rows.map((row) => row));
    }
    async count(findOptions) {
        const count = await this.repo.count(findOptions);
        return count;
    }
}
