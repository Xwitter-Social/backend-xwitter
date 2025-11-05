import { config, parse } from 'dotenv';
import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';

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

export default (): void => {
  loadEnvFiles();

  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL not set. Define TEST_DATABASE_URL or DATABASE_URL in your environment.',
    );
  }

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL,
    },
  });
};
