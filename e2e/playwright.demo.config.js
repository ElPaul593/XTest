import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config.js';

export default defineConfig({
  ...baseConfig,
  use: {
    ...baseConfig.use,
    launchOptions: { slowMo: 650 }
  }
});
