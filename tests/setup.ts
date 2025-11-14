import '@testing-library/jest-dom';
import { mocks } from './mocks';

// Mock browser-specific APIs for the jsdom environment
mocks.forEach((mock) => mock());
