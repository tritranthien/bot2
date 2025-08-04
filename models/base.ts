import { FindOptions } from "../repo/mongodb/base.js";

export interface Repository {
  save(record: any, where?: any): Promise<any>;
  bulkSave(records: any[]): Promise<any>;
  findUnique(id: any, select?: any, include?: any): Promise<any>;
  findFirst(where?: any, select?: any, include?: any, orderBy?: any): Promise<any>;
  delete(id: any): Promise<any>;
  deleteBy(where: any): Promise<any>;
  bulkDelete(ids: any[]): Promise<any>;
  bulkDeleteBy(where: any): Promise<any>;
  findMany(findOptions: FindOptions): Promise<any[]>;
  count(findOptions: FindOptions): Promise<number>;
}

export default class Base {
    public repo: Repository;

    constructor(repo: Repository) {
        this.repo = repo;
    }

    async save(record: any, where: any = null): Promise<boolean | any> {
      if(!record || !this.repo){
        return false;
      }
      const saved = await this.repo.save(record, where);
      return saved;
    }
  
    async bulkSave(records: any[]): Promise<any> {
      const saved = await this.repo!.bulkSave(records);
      return saved;
    }
  
    async findUnique(id: any, select?: any, include?: any): Promise<any | null> {
      const row = await this.repo!.findUnique(id, select, include);
      if (!row) {
        return null;
      }
      return row;
    }
  
    async findFirst(where?: any, select?: any, include?: any, orderBy?: any): Promise<any | null> {
      const row = await this.repo!.findFirst(where, select, include, orderBy);
      if (!row) {
        return null;
      }
      return row;
    }
  
    async delete(id: any): Promise<any> {
      const deleted = await this.repo!.delete(id);
      return deleted;
    }
  
    async deleteBy(where: any): Promise<boolean> {
      const deleted = await this.repo!.deleteBy(where);
      return true;
    }
  
    async bulkDelete(ids: any[]): Promise<any> {
      const deleted = await this.repo!.bulkDelete(ids);
      return deleted;
    }
  
    async bulkDeleteBy(where: any): Promise<any> {
      const deleted = await this.repo!.bulkDeleteBy(where);
      return deleted;
    }
  
    async findMany(findOptions: any): Promise<any[]> {
      const rows = await this.repo!.findMany(findOptions);
      return Promise.all(rows.map((row) => row));
    }
  
    async count(findOptions: any): Promise<number> {
      const count = await this.repo!.count(findOptions);
      return count;
    }
}