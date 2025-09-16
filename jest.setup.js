import { jest } from '@jest/globals';

// Set up Jest globals for ES modules
global.jest = jest;
global.describe = describe;
global.it = it;
global.test = test;
global.expect = expect;
global.beforeAll = beforeAll;
global.afterAll = afterAll;
global.beforeEach = beforeEach;
global.afterEach = afterEach;