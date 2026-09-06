import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/utils';
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

  if (session.user.role !== 'admin') {
    return <AdminForbiddenPage />;
  }

  return children;
}
