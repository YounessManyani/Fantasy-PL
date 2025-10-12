import { readFileSync } from 'fs';
import { FixtureData } from '../../types';
import { createLogger } from '../../utils/logger.utils';

const logger = createLogger('FixtureLoader');

export interface IFixtureLoaderService {
  getFixtures(): FixtureData;
}

export class FixtureLoaderService implements IFixtureLoaderService {
  private fixtures: FixtureData;

  constructor(fdrPath: string) {
    logger.info('Loading fixture data', { path: fdrPath });
    const raw = readFileSync(fdrPath, 'utf8');
    this.fixtures = JSON.parse(raw);
    logger.info('Fixtures loaded successfully');
  }

  getFixtures(): FixtureData {
    return this.fixtures;
  }
}