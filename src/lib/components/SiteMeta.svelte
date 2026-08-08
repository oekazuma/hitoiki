<script lang="ts">
  import { JsonLd, MetaTags } from 'svelte-meta-tags';

  const SITE_URL = 'https://oekazuma.github.io/hitoiki/';
  const SITE_TITLE = 'ひといき';
  const SITE_DESCRIPTION = 'すって、はいて、ひといき。画面に合わせて呼吸するだけの、呼吸ガイドです。';
  const OGP_IMAGE = {
    url: `${SITE_URL}ogp.png`,
    width: 1280,
    height: 640,
    alt: 'ひといき — すって、はいて、ひといき。'
  };

  // 構造化データ(検索エンジン向け)。医療目的ではないため applicationCategory は
  // LifestyleApplication とする。値は上の定数を再利用し、重複を作らない。
  // @context は JsonLd コンポーネントが自動で付与する。
  const JSON_LD = {
    '@type': 'WebApplication',
    name: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Any',
    inLanguage: 'ja',
    isAccessibleForFree: true
  } as const;
</script>

<MetaTags
  title={SITE_TITLE}
  description={SITE_DESCRIPTION}
  canonical={SITE_URL}
  openGraph={{
    type: 'website',
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: SITE_TITLE,
    locale: 'ja_JP',
    images: [OGP_IMAGE]
  }}
  twitter={{
    cardType: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    image: OGP_IMAGE.url,
    imageAlt: OGP_IMAGE.alt
  }}
/>

<JsonLd schema={JSON_LD} />
