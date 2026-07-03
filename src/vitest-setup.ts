import '@testing-library/jest-dom/vitest';

// svelte/reactivity の MediaQuery が使う matchMedia を、テストから制御できるものに差し替える。
// happy-dom は matchMedia を持つが常に matches:false を返すため、テスト側で
// `matchingQueries` に対象クエリを追加すると matches:true を返すよう常に上書きする。
export const matchingQueries = new Set<string>();

if (typeof window !== 'undefined') {
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

// requestAnimationFrame を提供しない環境向けのフォールバック
if (typeof globalThis.requestAnimationFrame === 'undefined') {
  globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 16)) as unknown as typeof requestAnimationFrame;
  globalThis.cancelAnimationFrame = ((id: number) => clearTimeout(id)) as unknown as typeof cancelAnimationFrame;
}

// <dialog> の showModal を持たない環境向けのフォールバック
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}
