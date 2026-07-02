import '@testing-library/jest-dom/vitest';

// jsdom は matchMedia を実装していない(svelte/reactivity の MediaQuery が使う)
// テスト側から `matchingQueries` に対象クエリを追加すると matches: true を返す(既定では何もマッチしない)
export const matchingQueries = new Set<string>();

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      get matches() {
        return matchingQueries.has(query);
      },
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false
    }) as MediaQueryList;
}

// jsdom は requestAnimationFrame を提供しない構成がある
if (typeof globalThis.requestAnimationFrame === 'undefined') {
  globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 16)) as unknown as typeof requestAnimationFrame;
  globalThis.cancelAnimationFrame = ((id: number) => clearTimeout(id)) as unknown as typeof cancelAnimationFrame;
}

// jsdom の <dialog> は showModal 未実装のバージョンがある
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}
