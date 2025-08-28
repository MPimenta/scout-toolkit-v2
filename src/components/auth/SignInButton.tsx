'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { User, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function SignInButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <Button variant="outline" disabled>
        <User className="h-4 w-4 mr-2" />
        Carregando...
      </Button>
    );
  }

  if (session?.user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={session.user.image || ''} alt={session.user.name} />
              <AvatarFallback>
                {session.user.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline">{session.user.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{session.user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {session.user.email}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {session.user.role === 'admin' ? 'Administrador' : 'Utilizador'}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {session.user.role === 'admin' && (
            <DropdownMenuItem asChild>
              <a href="/admin">Painel de Administração</a>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <a href="/programs">Os Meus Programas</a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="h-4 w-4 mr-2" />
            Terminar Sessão
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button onClick={() => signIn('google')}>
      <User className="h-4 w-4 mr-2" />
      Iniciar Sessão
    </Button>
  );
}
