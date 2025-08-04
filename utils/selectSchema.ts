import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type DatabaseProvider = 'postgresql' | 'mysql' | 'mongodb';

interface ProviderSchemas {
  [key: string]: string;
}

function selectSchemaByProvider(): void {
  const databaseProvider = process.env.DATABASE_PROVIDER as DatabaseProvider || 'mongodb';
  console.log('databaseProvider',databaseProvider);
  
  const prismaDir = path.join(__dirname, '../prisma');
  const mainSchemaPath = path.join(prismaDir, 'schema.prisma');

  // Mapping các file schema
  const providerSchemas: ProviderSchemas = {
    'postgresql': 'postgresql.schema.prisma',
    'mysql': 'mysql.schema.prisma',
    'mongodb': 'mongodb.schema.prisma'
  };

  // Kiểm tra provider hợp lệ
  if (!providerSchemas[databaseProvider]) {
    console.error(`Unsupported database provider: ${databaseProvider}`);
    process.exit(1);
  }

  // Đường dẫn file schema tương ứng
  const sourceSchemaPath = path.join(prismaDir, providerSchemas[databaseProvider]);

  try {
    // Đọc nội dung file schema gốc
    // const baseSchema = fs.readFileSync(path.join(prismaDir, 'schema.prisma'), 'utf8');
    
    // Đọc nội dung file schema của provider
    const providerSchema = fs.readFileSync(sourceSchemaPath, 'utf8');

    // Kết hợp base schema với provider schema
    const combinedSchema = providerSchema;

    // Ghi vào file schema chính
    fs.writeFileSync(mainSchemaPath, combinedSchema);

    console.log(`Selected ${databaseProvider} schema successfully`);
  } catch (error) {
    console.error('Error selecting schema:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

selectSchemaByProvider();