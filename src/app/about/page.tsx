'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocale } from '@/components/locale/LocaleProvider';

export default function AboutPage() {
  const { t } = useLocale();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{t('about.title')}</h1>
        <p className="text-muted-foreground">{t('about.lead')}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>{t('about.mission')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{t('about.missionBody')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('about.vision')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{t('about.visionBody')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('about.features')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1">
              <li>{t('about.feature1')}</li>
              <li>{t('about.feature2')}</li>
              <li>{t('about.feature3')}</li>
              <li>{t('about.feature4')}</li>
              <li>{t('about.feature5')}</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('about.tech')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{t('about.techBody')}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>{t('about.dev')}</CardTitle>
          <CardDescription>{t('about.devLead')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{t('about.devBody')}</p>
          <div className="mt-4">
            <a
              href="https://github.com/MPimenta/scout-toolkit-v2"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {t('about.github')}
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
