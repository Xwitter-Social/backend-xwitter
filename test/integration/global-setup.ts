import { config, parse } from 'dotenv';
import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

function loadEnvFiles(): void {
  const projectRoot = resolve(__dirname, '../../');
  const baseEnvPath = resolve(projectRoot, '.env');
  const testEnvPath = resolve(projectRoot, '.env.test');

  if (existsSync(baseEnvPath)) {
    config({ path: baseEnvPath });
  }

  if (existsSync(testEnvPath)) {
    const parsed = parse(readFileSync(testEnvPath));
    Object.entries(parsed).forEach(([key, value]) => {
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    });
  }
}

async function resetSchemaIfNeeded(databaseUrl: string): Promise<void> {
  let adminClient: PrismaClient | null = null;

  try {
    const url = new URL(databaseUrl);
    const schema = url.searchParams.get('schema');

    if (!schema || schema === 'public') {
      return;
    }

    const adminUrl = new URL(databaseUrl);
    adminUrl.searchParams.delete('schema');

    adminClient = new PrismaClient({
      datasources: {
        db: {
          url: adminUrl.toString(),
        },
      },
    });

    await adminClient.$connect();
    await adminClient.$executeRawUnsafe(
      `DROP SCHEMA IF EXISTS "${schema}" CASCADE`,
    );
    await adminClient.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
  } catch (error) {
    throw new Error(
      `Não foi possível preparar o schema dedicado para os testes de integração. Verifique as credenciais de acesso. Detalhes: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    if (adminClient) {
      await adminClient.$disconnect();
    }
  }
}

export default async (): Promise<void> => {
  loadEnvFiles();

  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL not set. Define TEST_DATABASE_URL or DATABASE_URL in your environment.',
    );
  }

  await resetSchemaIfNeeded(process.env.DATABASE_URL);

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL,
    },
  });
};
