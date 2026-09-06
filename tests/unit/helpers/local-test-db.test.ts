import { afterEach, describe, expect, it } from 'vitest';
import { requireLocalTestDatabase } from '../../helpers/local-test-db';

describe('requireLocalTestDatabase', () => {
  const previous = process.env.SCOUT_HAS_LOCAL_TEST_DB;

  afterEach(() => {
    process.env.SCOUT_HAS_LOCAL_TEST_DB = previous;
  });

  it('throws when the local test database is not marked reachable', () => {
    process.env.SCOUT_HAS_LOCAL_TEST_DB = '';
    expect(() => requireLocalTestDatabase()).toThrow(/scout_toolkit_test is unreachable/);
  });

  it('does not throw when the probe marked the test database up', () => {
    process.env.SCOUT_HAS_LOCAL_TEST_DB = '1';
    expect(() => requireLocalTestDatabase()).not.toThrow();
  });
});
