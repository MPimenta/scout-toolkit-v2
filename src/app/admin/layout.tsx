import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/utils';
import { getEffectiveRole } from '@/lib/auth/view-as';
import AdminForbiddenPage from './forbidden';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/admin');
  }

  if ((await getEffectiveRole(session.user.role)) !== 'admin') {
    return <AdminForbiddenPage />;
  }

  return children;
}
