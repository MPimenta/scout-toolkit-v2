'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { VIEW_AS_COOKIE, VIEW_AS_MEMBER, resolveEffectiveRole } from '@/lib/auth/view-as-cookie';

type ViewAsContextValue = {
  storedIsAdmin: boolean;
  viewingAsMember: boolean;
  effectiveIsAdmin: boolean;
  setViewingAsMember: (on: boolean) => void;
};

const ViewAsContext = createContext<ViewAsContextValue | null>(null);

function writeViewAsCookie(on: boolean) {
  document.cookie = on
    ? `${VIEW_AS_COOKIE}=${VIEW_AS_MEMBER}; path=/; SameSite=Lax`
    : `${VIEW_AS_COOKIE}=; path=/; SameSite=Lax; max-age=0`;
}

export function ViewAsProvider({
  initialViewAs,
  children,
}: {
  initialViewAs?: string | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [viewAs, setViewAs] = useState(initialViewAs === VIEW_AS_MEMBER ? VIEW_AS_MEMBER : null);
  const storedIsAdmin = session?.user?.role === 'admin';

  const setViewingAsMember = useCallback((on: boolean) => {
    writeViewAsCookie(on);
    setViewAs(on ? VIEW_AS_MEMBER : null);
    router.refresh();
  }, [router]);

  const value = useMemo<ViewAsContextValue>(() => {
    const effectiveIsAdmin = resolveEffectiveRole(session?.user?.role, viewAs) === 'admin';
    return {
      storedIsAdmin,
      viewingAsMember: storedIsAdmin && viewAs === VIEW_AS_MEMBER,
      effectiveIsAdmin,
      setViewingAsMember,
    };
  }, [session?.user?.role, storedIsAdmin, viewAs, setViewingAsMember]);

  return <ViewAsContext.Provider value={value}>{children}</ViewAsContext.Provider>;
}

export function useViewAs() {
  return useContext(ViewAsContext) ?? {
    storedIsAdmin: false,
    viewingAsMember: false,
    effectiveIsAdmin: false,
    setViewingAsMember: () => undefined,
  };
}
