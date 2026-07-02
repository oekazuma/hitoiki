import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    paths: {
      // GitHub Pages のサブパス配信用。CI では BASE_PATH=/<リポジトリ名> を渡す
      base: process.env.BASE_PATH ?? ''
    }
  }
};

export default config;
