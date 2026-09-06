'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { mentionPrefix, type PublicReply, type ReactionKey } from '@/lib/ratings';
import { ReactionPicker } from './ReactionPicker';
import Link from 'next/link';

interface ReplyThreadProps {
  replies: PublicReply[];
  currentUserId?: string;
  canWrite: boolean;
  isPosting: boolean;
  onReply: (body: string, mentionUserId?: string | null) => Promise<void>;
  onEdit: (replyId: string, body: string) => Promise<void>;
  onDelete: (replyId: string) => Promise<void>;
  onReact: (replyId: string, key: ReactionKey) => Promise<void>;
}

export function ReplyThread({
  replies,
  currentUserId,
  canWrite,
  isPosting,
  onReply,
  onEdit,
  onDelete,
  onReact,
}: ReplyThreadProps) {
  const [body, setBody] = useState('');
  const [mentionUserId, setMentionUserId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');

  const startReplyTo = (reply: PublicReply) => {
    setMentionUserId(reply.userId);
    setBody(mentionPrefix(reply.userName));
  };

  const submit = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    await onReply(trimmed, mentionUserId);
    setBody('');
    setMentionUserId(null);
  };

  return (
    <div className="space-y-4 border-t border-border pt-4">
      {replies.map((reply) => (
        <div key={reply.id} className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt={reply.userName} />
            <AvatarFallback>{reply.userName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-foreground">{reply.userName}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(reply.createdAt).toLocaleDateString('pt-PT')}
              </span>
            </div>

            {editingId === reply.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editBody}
                  onChange={(event) => setEditBody(event.target.value)}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={async () => {
                      await onEdit(reply.id, editBody);
                      setEditingId(null);
                    }}
                  >
                    Guardar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{reply.body}</p>
            )}

            <ReactionPicker
              reactions={reply.reactions}
              myReaction={reply.myReaction}
              canWrite={canWrite}
              onReact={(key) => onReact(reply.id, key)}
            />

            <div className="flex gap-3 text-xs">
              {canWrite && (
                <button
                  type="button"
                  className="text-secondary hover:underline"
                  onClick={() => startReplyTo(reply)}
                >
                  Responder
                </button>
              )}
              {currentUserId === reply.userId && (
                <>
                  <button
                    type="button"
                    className="text-secondary hover:underline"
                    onClick={() => {
                      setEditingId(reply.id);
                      setEditBody(reply.body);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="text-destructive hover:underline"
                    onClick={() => onDelete(reply.id)}
                  >
                    Apagar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}

      {canWrite ? (
        <div className="space-y-2">
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Escreva uma resposta..."
            rows={2}
          />
          <Button size="sm" onClick={submit} disabled={!body.trim() || isPosting}>
            {isPosting ? 'A enviar...' : 'Enviar resposta'}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link href="/auth/signin" className="text-secondary hover:underline">
            Inicie sessão
          </Link>{' '}
          para responder
        </p>
      )}
    </div>
  );
}
