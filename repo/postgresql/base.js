import { PrismaClient } from "@prisma/client";
export class BaseRepo {
    prisma;
    tableName;
    constructor({tableName}) {
        this.prisma = new PrismaClient({datasourceUrl: process.env.DATABASE_URL});
        if (tableName) {
            this.tableName = tableName;
        }
        if (!this.prisma?.[tableName]) {
            throw new Error(`Table ${tableName} not found`);
        }
    }
    getTable() {
        return this.prisma?.[this.tableName];
    }
    setTableName(tableName) {
        this.tableName = tableName; 
        return this;
    }
    setPrisma(prisma) {
        this.prisma = prisma;
        return this; 
    }
    async save (row, where = null) {
        try {
          const upsertOptions = {
            update: row,
            create: row
          };
          if (where) {
            upsertOptions.where = where;
          } else {
            const id = row.id;
            if (id) {
              delete row.id;
              upsertOptions.where = { id };
            }
          }
          if (!upsertOptions.where) {
            return await this.getTable().create({ data: row });
          }
          const result = await this.getTable().upsert(upsertOptions);
          return result;
        } catch (error) {
          console.error('Save error:', error);
          return 0;
        }
      };
    async bulkSave (rows, existKey) {
        try {
          const createManyOptions = {
            data: rows,
            skipDuplicates: true
          };
          if (existKey) {
            createManyOptions.update = existKey; 
          }
          const result = await this.getTable().createMany(createManyOptions);
          return result;
        } catch (error) {
          console.error('Bulk save error:', error);
          return 0;
        }
    };
    async findUnique(id, select, include) {
        const findOptions = { };
        if(id){
          findOptions.where = { id };
        }
        if(select){
          findOptions.select = select;
        }
        if(include){
          findOptions.include = include
        }
        const row = await this.getTable().findUnique(findOptions);
        if (!row) {
          return null;
        }
        return row
      }
    
      async findFirst(where, select, include, orderBy) {
        const findOptions = { };
        if(where){
          findOptions.where = where;
        }
        if(select){
          findOptions.select = select;
        }
        if(include){
          findOptions.include = include;
        }
        if(orderBy){
          findOptions.orderBy = orderBy;
        }
        const row = await this.getTable().findFirst(findOptions);
        if (!row) {
          return null;
        }
        return row;
      }
    
      async delete(id) {
        try {
            await this.getTable().delete({ where: { id } });
        } catch {
            return true;
        }
        return true;
      }
    
      async deleteBy(where) {
        try {
            await this.getTable().delete({ where: where });
        } catch {
            return true;
        }
        return true;
      }
    
      async bulkDelete(ids) {
        await this.getTable().deleteMany({ where: { id: { in: ids } } } );
        return true;
      }
    
      async bulkDeleteBy(where) {
        await this.getTable().deleteMany({ where: where });
        return true;
      }
    
      async findMany(findOptions) {
        if(!findOptions){
          findOptions = {};
        }
        if(!findOptions?.where){
          delete findOptions.where;
        }
        if(!findOptions?.select){
          delete findOptions.select;
        }
        if(!findOptions?.include){
          delete findOptions.include;
        }
        if(!findOptions?.skip){
          delete findOptions.skip;
        }
        if(!findOptions?.take){
          delete findOptions.take;
        }
        if(!findOptions?.orderBy){
          findOptions.orderBy = [{ id: 'desc' }];
        }
        const rows = await this.getTable().findMany(findOptions);
        return rows;
      }
    
      async count(findOptions) {
        if(!findOptions){
          findOptions = {};
        }
        if(!findOptions?.where){
          delete findOptions.where;
        }
        return this.getTable().count(findOptions);
      }
    
      async findRaw(findOptions){
        return this.getTable().findRaw(findOptions);
      }
    
      async groupBy(groupByOptions){
        return this.getTable().groupBy(groupByOptions);
      }
}