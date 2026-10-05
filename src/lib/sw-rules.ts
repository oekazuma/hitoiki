// このアプリのキャッシュ名。同じオリジン(oekazuma.github.io)には姉妹アプリのキャッシュもあるので、他所のものは触らない
export const ours = (key: string) => key.startsWith('hitoiki-');
export const stale = (key: string, current: string) => ours(key) && key !== current;
// SvelteKit はフォーカス復帰のたびに version.json で新版を確かめる。cache-first で返すと最初の応答を返し続けるので素通しする
export const passthrough = (pathname: string) => pathname.endsWith('/_app/version.json');
