import { clearDatabase } from './utils/database';

jest.setTimeout(30000);

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await clearDatabase();
});
