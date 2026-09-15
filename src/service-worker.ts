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
    caches.open(CACHE).then(async (cache) => {
      // 殻 HTML とハッシュ付き JS/CSS は版が揃わないと起動しない。
      // デプロイ直後は CDN が古い HTML を返しつつ古い JS は 404 になり得るので、
      // 1 件でも失敗したら install ごと失敗させて前の版のキャッシュを残す
      await cache.addAll([...build, ...prerendered.map((url) => new Request(url, { cache: 'reload' }))]);
      // 画像やフォントは 1 件の失敗で全体を捨てない。残りは使われたときに fetch ハンドラが入れる
      await Promise.allSettled(files.map((url) => cache.add(new Request(url, { cache: 'reload' }))));
    })
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
