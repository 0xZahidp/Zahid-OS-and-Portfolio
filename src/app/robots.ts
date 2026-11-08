import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const isNoIndexEnv =
    process.env.SITE_NOINDEX === 'true' ||
    (Boolean(process.env.VERCEL_ENV) && process.env.VERCEL_ENV !== 'production');

  if (isNoIndexEnv) {
    return {
      rules: [
        {
          userAgent: '*',
          disallow: '/',
        },
      ],
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/auth/'],
      },
    ],
  };
}

