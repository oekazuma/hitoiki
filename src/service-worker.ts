/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, prerendered, version } from '$service-worker';
import { stale } from './lib/sw-rules';

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE = `hitoiki-${version}`;

// skipWaiting / clients.claim は使わない:
// 新バージョンは全タブが閉じられた後(=次回起動時)に有効化され、利用中に画面が変わらない
sw.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // 1 ファイルの失敗で install 全体を落とさない。
      // build はハッシュ付きで URL が変わるので HTTP キャッシュのままでよく、
      // URL が変わらない files / prerendered だけ古い HTTP キャッシュを避けて取り直す
      Promise.allSettled([
        ...build.map((url) => cache.add(url)),
        ...[...files, ...prerendered].map((url) => cache.add(new Request(url, { cache: 'reload' })))
      ])
    )
  );
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => stale(key, CACHE)).map((key) => caches.delete(key))))
  );
});

// cache-first: オフラインでの確実な起動を最優先する
sw.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== sw.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ??
        fetch(event.request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
    )
  );
});
