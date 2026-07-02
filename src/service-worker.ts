/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, prerendered, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE = `hitoiki-${version}`;
const ASSETS = [...build, ...files, ...prerendered];

// skipWaiting / clients.claim は使わない:
// 新バージョンは全タブが閉じられた後(=次回起動時)に有効化され、利用中に画面が変わらない
sw.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
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
