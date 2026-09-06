import { ActivityEditorForm } from '@/components/features/activities/ActivityEditorForm';

export default function NewAdminActivityPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Nova atividade</h1>
      <ActivityEditorForm action="/api/admin/activities" submitLabel="Criar" />
    </div>
  );
}
