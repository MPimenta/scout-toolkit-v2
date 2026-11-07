'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocale } from '@/components/locale/LocaleProvider';
import { useFeature } from '@/components/providers/FeaturesProvider';

const CONTACT = 'geral@escoteiros.pt';

export default function PrivacyPage() {
  const { t } = useLocale();
  const tracking = useFeature('usage-tracking');
  const pwa = useFeature('pwa');
  const [optedOut, setOptedOut] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // The opt-out cookie is not readable by scripts, so the state starts unknown (shown as on).
    setOptedOut(false);
  }, []);

  const change = async (out: boolean) => {
    setFailed(false);
    try {
      const response = await fetch('/api/usage/opt-out', { method: out ? 'POST' : 'DELETE' });
      if (!response.ok) throw new Error('opt-out failed');
      setOptedOut(out);
    } catch {
      setFailed(true);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold">{t('privacy.title')}</h1>
        <p className="text-muted-foreground">{t('privacy.lead')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('privacy.accountTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{t('privacy.accountBody')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('privacy.usageTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tracking ? (
              <>
                <p>{t('privacy.usageIntro')}</p>
                <ul className="list-inside list-disc space-y-1">
                  <li>{t('privacy.eventSearch')}</li>
                  <li>{t('privacy.eventView')}</li>
                  <li>{t('privacy.eventProgram')}</li>
                </ul>
                {pwa && <p>{t('privacy.usageLaunch')}</p>}
                <p>{t('privacy.usageCookie')}</p>
                <p>{t('privacy.usageNever')}</p>
                <p>{t('privacy.usageWho')}</p>
                <p>{t('privacy.usagePurpose')}</p>
                <p>{t('privacy.usageRetention')}</p>
                <p>{t('privacy.usageShared')}</p>
              </>
            ) : (
              <p>{t('privacy.usageOff')}</p>
            )}
          </CardContent>
        </Card>

        {tracking && (
          <Card>
            <CardHeader>
              <CardTitle>{t('privacy.optOutTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>{t('privacy.optOutBody')}</p>
              <Button
                variant={optedOut ? 'outline' : 'default'}
                className="min-h-11"
                onClick={() => change(!optedOut)}
                aria-pressed={Boolean(optedOut)}
              >
                {optedOut ? t('privacy.optIn') : t('privacy.optOut')}
              </Button>
              {optedOut && <p role="status">{t('privacy.optedOut')}</p>}
              {failed && <p role="alert" className="text-destructive">{t('privacy.optOutFailed')}</p>}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t('privacy.rightsTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              {t('privacy.rightsBody')}{' '}
              <a className="link-emphasis" href={`mailto:${CONTACT}`}>
                {CONTACT}
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
