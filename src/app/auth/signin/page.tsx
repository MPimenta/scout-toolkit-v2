import { SignInButton } from '@/components/SignInButton';
import { SignInPageCopy, SignInPageHint } from '@/components/auth/SignInPageCopy';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <SignInPageCopy />
        <div className="mt-8 space-y-6">
          <div className="text-center">
            <SignInButton />
          </div>
          <div className="text-center text-sm text-gray-600">
            <SignInPageHint />
          </div>
        </div>
      </div>
    </div>
  );
}

