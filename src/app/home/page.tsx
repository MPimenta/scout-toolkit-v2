'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Calendar, Users, BookOpen } from 'lucide-react';
import { useLocale } from '@/components/locale/LocaleProvider';

export default function HomePage() {
  const { t } = useLocale();

  return (
    <div className="flex flex-col gap-8">
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl">
            <span className="text-primary">{t('productName')}</span>
          </h1>
          <p className="mb-8 text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('home.lead')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/activities">{t('home.explore')}</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/programs">{t('home.createProgram')}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t('home.featuresTitle')}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Search className="h-8 w-8 text-primary mb-2" />
                <CardTitle>{t('home.activitiesTitle')}</CardTitle>
                <CardDescription>{t('home.activitiesBody')}</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Calendar className="h-8 w-8 text-primary mb-2" />
                <CardTitle>{t('home.programsTitle')}</CardTitle>
                <CardDescription>{t('home.programsBody')}</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>{t('home.collabTitle')}</CardTitle>
                <CardDescription>{t('home.collabBody')}</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <BookOpen className="h-8 w-8 text-primary mb-2" />
                <CardTitle>{t('home.resourcesTitle')}</CardTitle>
                <CardDescription>{t('home.resourcesBody')}</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{t('home.ctaTitle')}</h2>
          <p className="text-xl text-muted-foreground mb-8">{t('home.ctaLead')}</p>
          <Button asChild size="lg">
            <Link href="/activities">{t('home.ctaButton')}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
