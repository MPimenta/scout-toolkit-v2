'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquarePlus } from 'lucide-react';
import { useLocale } from '@/components/locale/LocaleProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const KINDS = [
  { value: 'incidente', key: 'report.kindIncident' },
  { value: 'conteudo', key: 'report.kindContent' },
  { value: 'ideia', key: 'report.kindIdea' },
] as const;

export function ReportLauncher() {
  const pathname = usePathname();
  const { locale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<(typeof KINDS)[number]['value']>('incidente');
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setKind('incidente');
    setMessage('');
    setContact('');
    setPending(false);
    setSuccess(false);
    setError(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          message,
          contact_email: contact || undefined,
          path: pathname || '/',
          locale,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
        }),
      });
      if (response.status === 429) {
        setError(t('report.rateLimit'));
        return;
      }
      if (!response.ok) {
        setError(t('report.error'));
        return;
      }
      setSuccess(true);
    } catch {
      setError(t('report.error'));
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      {!open ? (
        <Button
          type="button"
          className="fixed bottom-4 right-4 z-40 min-h-11 shadow-md"
          onClick={() => {
            reset();
            setOpen(true);
          }}
        >
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          {t('report.action')}
        </Button>
      ) : null}

      <Sheet
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) reset();
        }}
      >
        <SheetContent side="right" className="w-[min(100dvw,24rem)]">
          <SheetHeader>
            <SheetTitle>{t('report.title')}</SheetTitle>
            <SheetDescription>{t('report.lead')}</SheetDescription>
          </SheetHeader>
          {success ? (
            <p className="mt-6 text-sm" role="status">
              {t('report.success')}
            </p>
          ) : (
            <form className="mt-6 flex flex-col gap-4" onSubmit={submit}>
              <div className="space-y-2">
                <Label htmlFor="report-kind">{t('report.kind')}</Label>
                <select
                  id="report-kind"
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={kind}
                  onChange={(event) => setKind(event.target.value as typeof kind)}
                >
                  {KINDS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {t(item.key)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="report-message">{t('report.message')}</Label>
                <Textarea
                  id="report-message"
                  required
                  minLength={10}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={t('report.messageHint')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="report-contact">{t('report.contact')}</Label>
                <Input
                  id="report-contact"
                  type="email"
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" disabled={pending || message.trim().length < 10}>
                {pending ? t('report.sending') : t('report.submit')}
              </Button>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
