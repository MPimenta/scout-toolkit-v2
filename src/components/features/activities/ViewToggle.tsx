'use client';

import { Button } from '@/components/ui/button';
import { LayoutGrid, Table } from 'lucide-react';

export type ViewMode = 'tiles' | 'table';

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      <Button
        variant={currentView === 'tiles' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('tiles')}
        className="h-8 px-3"
      >
        <LayoutGrid className="h-4 w-4 mr-2" />
        Tiles
      </Button>
      <Button
        variant={currentView === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('table')}
        className="h-8 px-3"
      >
        <Table className="h-4 w-4 mr-2" />
        Tabela
      </Button>
    </div>
  );
}
