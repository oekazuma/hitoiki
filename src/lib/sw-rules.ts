// このアプリのキャッシュ名。同じオリジン(oekazuma.github.io)には姉妹アプリのキャッシュもあるので、他所のものは触らない
export const ours = (key: string) => key.startsWith('hitoiki-');
export const stale = (key: string, current: string) => ours(key) && key !== current;
