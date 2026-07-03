/// <reference types="vitest/config" />
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit(), svelteTesting()],
  test: {
    projects: [
      {
        // ロジックと、matchMedia / PWA など制御が必要な DOM テスト(高速な happy-dom)
        extends: true,
        test: {
          name: 'unit',
          environment: 'happy-dom',
          setupFiles: ['./src/vitest-setup.ts'],
          include: ['src/**/*.test.ts'],
          exclude: ['src/**/*.browser.test.ts']
        }
      },
      {
        // ブラウザ依存が強く実ブラウザが忠実なテスト(Chromium)
        extends: true,
        // sveltekit の SSR 解決で svelte がサーバービルドに寄らないよう browser 条件を明示
        resolve: { conditions: ['browser'] },
        test: {
          name: 'browser',
          include: ['src/**/*.browser.test.ts'],
          setupFiles: ['vitest-browser-svelte'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }]
          }
        }
      }
    ]
  }
});
