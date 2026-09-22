import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { isLocale, LOCALE_COOKIE } from './locale';
import { routing } from './routing';
import { APP_TIME_ZONE } from './config';

export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : routing.defaultLocale;

  return {
    locale,
    timeZone: APP_TIME_ZONE,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
