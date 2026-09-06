'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface PublicEntry {
  id: string;
  position: number;
  start_time: string;
  end_time: string;
  entry_type: string;
  custom_title: string | null;
  custom_duration_minutes: number | null;
  activity_name: string | null;
  activity_duration: number | null;
}

interface PublicProgram {
  id: string;
  name: string;
  date: string | null;
  start_time: string;
  author_name: string;
  entries: PublicEntry[];
  summary: { entry_count: number; total_duration_minutes: number };
}

export default function PublicProgramPreviewPage() {
  const params = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [program, setProgram] = useState<PublicProgram | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    fetch(`/api/programs/public/${params.id}`)
      .then(async (response) => {
        if (response.status === 404) {
          setMissing(true);
          return null;
        }
        return response.json();
      })
      .then((data) => {
        if (data?.program) setProgram(data.program);
      });
  }, [params.id]);

  if (missing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">Programa não encontrado</h1>
      </div>
    );
  }

  if (!program) {
    return <div className="container mx-auto px-4 py-8">A carregar…</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{program.name}</h1>
      <p className="text-muted-foreground mb-6">
        Por {program.author_name}
        {program.date ? ` · ${new Date(program.date).toLocaleDateString('pt-PT')}` : ''}
        {` · ${program.start_time.slice(0, 5)}`}
        {` · ${program.summary.entry_count} entradas`}
        {` · ${program.summary.total_duration_minutes} min`}
      </p>

      <ol className="space-y-3 mb-8">
        {program.entries.map((entry) => (
          <li key={entry.id} className="border rounded-md p-3">
            <p className="font-medium">
              {entry.entry_type === 'activity'
                ? entry.activity_name
                : entry.custom_title}
            </p>
            <p className="text-sm text-muted-foreground">
              {entry.start_time.slice(0, 5)}–{entry.end_time.slice(0, 5)}
            </p>
          </li>
        ))}
      </ol>

      {session?.user ? (
        <form action={`/api/programs/public/${program.id}/copy`} method="post">
          <CopyButton programId={program.id} />
        </form>
      ) : (
        <Link className="text-primary underline" href={`/auth/signin?callbackUrl=/programs/public/${program.id}`}>
          Inicie sessão para usar como modelo
        </Link>
      )}
    </div>
  );
}

function CopyButton({ programId }: { programId: string }) {
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      className="bg-primary text-primary-foreground rounded-md px-4 py-2"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const response = await fetch(`/api/programs/public/${programId}/copy`, { method: 'POST' });
        const data = await response.json();
        if (response.ok && data.program?.id) {
          window.location.href = `/programs/${data.program.id}`;
        }
        setBusy(false);
      }}
    >
      {busy ? 'A copiar…' : 'Usar como modelo'}
    </button>
  );
}
