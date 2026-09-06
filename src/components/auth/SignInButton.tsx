'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogIn, LogOut, User } from 'lucide-react';
import { useLocale } from '@/components/locale/LocaleProvider';
import { useViewAs } from '@/components/auth/ViewAsProvider';

export function SignInButton() {
  const { data: session, status } = useSession();
  const { t } = useLocale();
  const { storedIsAdmin, viewingAsMember, setViewingAsMember } = useViewAs();

  if (status === 'loading') {
    return (
      <Button variant="ghost" size="sm" disabled>
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </Button>
    );
  }

  if (session?.user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-8 w-8 rounded-full"
            aria-label={session.user.name || session.user.email}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{session.user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {session.user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {storedIsAdmin ? (
            <DropdownMenuItem
              onClick={() => setViewingAsMember(!viewingAsMember)}
            >
              <span>{viewingAsMember ? t('admin.backToAdmin') : t('admin.viewAsMember')}</span>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>{t('auth.signOut')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button onClick={() => signIn('orgo')} size="sm">
      <LogIn className="mr-2 h-4 w-4" />
      {t('auth.enter')}
    </Button>
  );
}
