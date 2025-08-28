import { useTranslations } from 'next-intl';
import { SignInButton } from '@/components/auth/SignInButton';

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {t('subtitle')}
          </p>
          <p className="text-lg text-gray-700 mb-12 max-w-2xl mx-auto">
            {t('description')}
          </p>
          
          <div className="flex justify-center">
            <SignInButton />
          </div>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">
                {t('features.explore.title')}
              </h3>
              <p className="text-gray-600">
                {t('features.explore.description')}
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">
                {t('features.create.title')}
              </h3>
              <p className="text-gray-600">
                {t('features.create.description')}
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">
                {t('features.export.title')}
              </h3>
              <p className="text-gray-600">
                {t('features.export.description')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
