import { PrismaClient } from "@prisma/client";

export interface FindOptions {
  where?: Record<string, any>;
  select?: Record<string, any>;
  include?: Record<string, any>;
  skip?: number;
  take?: number;
  orderBy?: Record<string, any> | Array<Record<string, any>>;
  _count?: Record<string, any>;
}

export class BaseRepo {
    private prisma: PrismaClient;
    private tableName: string;

    constructor({ tableName }: { tableName: string}) {
        this.prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
        this.tableName = tableName;
        if (!this.prisma[this.tableName as keyof PrismaClient]) {
            throw new Error(`Table ${tableName} not found`);
        }
    }

    getTable(): any {
        return this.prisma[this.tableName as keyof PrismaClient];
    }

    setTableName(tableName: string): this {
        this.tableName = tableName;
        return this;
    }

    setPrisma(prisma: PrismaClient): this {
        this.prisma = prisma;
        return this;
    }

    async save<T extends Record<string, any>>(row: T, where: Record<string, any> | null = null): Promise<T | 0> {
        try {
            const upsertOptions: {
                update: T;
                create: T;
                where?: Record<string, any>;
            } = {
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
            return await this.getTable().update({
                data: row,
                where: upsertOptions.where
            });
        } catch (error) {
            console.error('Save error:', error);
            return 0;
        }
    }

    async bulkSave<T extends Record<string, any>>(rows: T[], existKey?: Record<string, any>): Promise<{ count: number } | 0> {
        try {
            const createManyOptions: {
                data: T[];
                skipDuplicates: boolean;
                update?: Record<string, any>;
            } = {
                data: rows,
                skipDuplicates: true
            };

            if (existKey) {
                createManyOptions.update = existKey;
            }
            return await this.getTable().createMany(createManyOptions);
        } catch (error) {
            console.error('Bulk save error:', error);
            return 0;
        }
    }

    async findUnique<T>(
        id?: string | number,
        select?: Record<string, any>,
        include?: Record<string, any>
    ): Promise<T | null> {
        const findOptions: FindOptions = {};
        if (id) {
            findOptions.where = { id };
        }
        if (select) {
            findOptions.select = select;
        }
        if (include) {
            findOptions.include = include;
        }
        const row = await this.getTable().findUnique(findOptions);
        return row || null;
    }

    async findFirst<T>(
        where?: Record<string, any>,
        select?: Record<string, any>,
        include?: Record<string, any>,
        orderBy?: Record<string, any>
    ): Promise<T | null> {
        const findOptions: FindOptions = {};
        if (where) {
            findOptions.where = where;
        }
        if (select) {
            findOptions.select = select;
        }
        if (include) {
            findOptions.include = include;
        }
        if (orderBy) {
            findOptions.orderBy = orderBy;
        }
        const row = await this.getTable().findFirst(findOptions);
        return row || null;
    }

    async delete(id: string | number): Promise<boolean> {
        try {
            await this.getTable().delete({ where: { id } });
        } catch {
            return true;
        }
        return true;
    }

    async deleteBy(where: Record<string, any>): Promise<boolean> {
        try {
            await this.getTable().delete({ where });
        } catch {
            return true;
        }
        return true;
    }

    async bulkDelete(ids: Array<string | number>): Promise<boolean> {
        await this.getTable().deleteMany({ where: { id: { in: ids } } });
        return true;
    }

    async bulkDeleteBy(where: Record<string, any>): Promise<boolean> {
        await this.getTable().deleteMany({ where });
        return true;
    }

    async findMany<T>(findOptions?: FindOptions): Promise<T[]> {
        if (!findOptions) {
            findOptions = {};
        }
        if (!findOptions?.where) {
            delete findOptions.where;
        }
        if (!findOptions?.select) {
            delete findOptions.select;
        }
        if (!findOptions?.include) {
            delete findOptions.include;
        }
        if (!findOptions?.skip) {
            delete findOptions.skip;
        }
        if (!findOptions?.take) {
            delete findOptions.take;
        }
        if (!findOptions?.orderBy) {
            findOptions.orderBy = [{ id: 'desc' }];
        }
        return await this.getTable().findMany(findOptions);
    }

    async count(findOptions?: Pick<FindOptions, 'where'>): Promise<number> {
        if (!findOptions) {
            findOptions = {};
        }
        if (!findOptions?.where) {
            delete findOptions.where;
        }
        return this.getTable().count(findOptions);
    }

    async findRaw<T>(findOptions: Record<string, any>): Promise<T> {
        return this.getTable().findRaw(findOptions);
    }

    async groupBy<T>(groupByOptions: Record<string, any>): Promise<T> {
        return this.getTable().groupBy(groupByOptions);
    }
}