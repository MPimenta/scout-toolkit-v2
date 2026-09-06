import { ActivityEditorForm } from '@/components/features/activities/ActivityEditorForm';

export default function ProposeActivityPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Propor atividade</h1>
      <ActivityEditorForm action="/api/activities" submitLabel="Enviar proposta" redirectTo="/atividades/minhas" />
    </div>
  );
}
