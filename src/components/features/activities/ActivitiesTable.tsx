'use client';

import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  ColumnDef,
  SortingState,
  flexRender,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';

interface EducationalGoal {
  id: string;
  title: Record<string, string> | string;
  code: string;
}

interface Sdg {
  id: string;
  number: number;
  name: Record<string, string> | string;
  icon_url: string;
}

interface ActivityType {
  id: string;
  name: Record<string, string> | string;
}

interface Activity {
  id: string;
  name: Record<string, string> | string;
  description: Record<string, string> | string;
  approximate_duration_minutes: number;
  group_size: string; // API returns string, not union type
  effort_level: string; // API returns string, not union type
  location: string; // API returns string, not union type
  age_group: string; // API returns string, not union type
  created_at: string;
  activity_type: ActivityType;
  educational_goals: EducationalGoal[];
  sdgs: Sdg[];
}

interface ActivitiesTableProps {
  activities: Activity[];
  onViewActivity?: (activity: Activity) => void;
  onEditActivity?: (activity: Activity) => void;
  onDeleteActivity?: (activity: Activity) => void;
}

// Helper function to get Portuguese text from JSONB
function getPortugueseText(jsonbField: Record<string, string> | string): string {
  if (!jsonbField) return '';
  if (typeof jsonbField === 'string') return jsonbField;
  if (jsonbField.pt) return jsonbField.pt;
  if (jsonbField.pt_PT) return jsonbField.pt_PT;
  if (jsonbField.pt_BR) return jsonbField.pt_BR;
  if (jsonbField.en) return jsonbField.en;
  if (jsonbField.en_US) return jsonbField.en_US;
  if (jsonbField.en_GB) return jsonbField.en_GB;
  const firstKey = Object.keys(jsonbField)[0];
  return firstKey ? jsonbField[firstKey] : '';
}

// Helper function to get group size display text
function getGroupSizeText(size: string): string {
  const sizeMap = {
    small: 'Pequeno (2-6)',
    medium: 'Médio (7-15)',
    large: 'Grande (16+)',
  };
  return sizeMap[size as keyof typeof sizeMap] || size;
}

// Helper function to get effort level display text
function getEffortLevelText(level: string): string {
  const levelMap = {
    low: 'Baixo',
    medium: 'Médio',
    high: 'Alto',
  };
  return levelMap[level as keyof typeof levelMap] || level;
}

// Helper function to get age group display text
function getAgeGroupText(ageGroup: string): string {
  const ageMap = {
    cub_scouts: 'Lobitos (6-10)',
    scouts: 'Escoteiros (10-14)',
    adventurers: 'Exploradores (14-17)',
    rovers: 'Caminheiros (17-21)',
    leaders: 'Dirigentes (21+)',
  };
  return ageMap[ageGroup as keyof typeof ageMap] || ageGroup;
}

// Helper function to get location display text
function getLocationText(location: string): string {
  const locationMap = {
    inside: 'Interior',
    outside: 'Exterior',
  };
  return locationMap[location as keyof typeof locationMap] || location;
}

export function ActivitiesTable({ 
  activities, 
  onViewActivity, 
  onEditActivity, 
  onDeleteActivity 
}: ActivitiesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo<ColumnDef<Activity>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nome',
        cell: ({ row }) => (
          <div className="font-medium">
            {getPortugueseText(row.original.name)}
          </div>
        ),
      },
      {
        accessorKey: 'activity_type.name',
        header: 'Tipo',
        cell: ({ row }) => (
          <Badge variant="secondary" className="text-xs">
            {getPortugueseText(row.original.activity_type.name)}
          </Badge>
        ),
      },
      {
        accessorKey: 'approximate_duration_minutes',
        header: 'Duração',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.approximate_duration_minutes} min
          </span>
        ),
      },
      {
        accessorKey: 'group_size',
        header: 'Grupo',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {getGroupSizeText(row.original.group_size)}
          </span>
        ),
      },
      {
        accessorKey: 'effort_level',
        header: 'Esforço',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {getEffortLevelText(row.original.effort_level)}
          </span>
        ),
      },
      {
        accessorKey: 'location',
        header: 'Local',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {getLocationText(row.original.location)}
          </span>
        ),
      },
      {
        accessorKey: 'age_group',
        header: 'Faixa Etária',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {getAgeGroupText(row.original.age_group)}
          </span>
        ),
      },
      {
        accessorKey: 'sdgs',
        header: 'ODS',
        cell: ({ row }) => (
          <div className="flex gap-1">
            {row.original.sdgs.slice(0, 3).map((sdg) => (
              <div
                key={sdg.id}
                className="w-6 h-6 rounded-md flex items-center justify-center shadow-sm border border-gray-200 bg-white overflow-hidden"
                title={`ODS ${sdg.number}: ${getPortugueseText(sdg.name)}`}
              >
                {sdg.icon_url ? (
                  <img
                    src={sdg.icon_url}
                    alt={`ODS ${sdg.number}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div
                    className="w-full h-full rounded-md flex items-center justify-center text-white text-xs font-bold"
                    style={{
                      backgroundColor: `hsl(${(sdg.number * 20) % 360}, 70%, 50%)`
                    }}
                  >
                    {sdg.number}
                  </div>
                )}
              </div>
            ))}
            {row.original.sdgs.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{row.original.sdgs.length - 3}
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'educational_goals',
        header: 'Objetivos',
        cell: ({ row }) => (
          <div className="flex gap-1">
            {row.original.educational_goals.slice(0, 2).map((goal) => (
              <Badge key={goal.id} variant="outline" className="text-xs">
                {getPortugueseText(goal.title)}
              </Badge>
            ))}
            {row.original.educational_goals.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{row.original.educational_goals.length - 2}
              </Badge>
            )}
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Ações',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Ações">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onViewActivity && (
                <DropdownMenuItem onClick={() => onViewActivity(row.original)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Detalhes
                </DropdownMenuItem>
              )}
              {onEditActivity && (
                <DropdownMenuItem onClick={() => onEditActivity(row.original)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              {onDeleteActivity && (
                <DropdownMenuItem 
                  onClick={() => onDeleteActivity(row.original)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [onViewActivity, onEditActivity, onDeleteActivity]
  );

  const table = useReactTable({
    data: activities,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  const exportToCSV = () => {
    const headers = [
      'Nome',
      'Tipo',
      'Duração (min)',
      'Tamanho do Grupo',
      'Nível de Esforço',
      'Localização',
      'Faixa Etária',
      'ODS',
      'Objetivos Educativos',
    ];

    const csvContent = [
      headers.join(','),
      ...activities.map(activity => [
        getPortugueseText(activity.name),
        getPortugueseText(activity.activity_type.name),
        activity.approximate_duration_minutes,
        getGroupSizeText(activity.group_size),
        getEffortLevelText(activity.effort_level),
        getLocationText(activity.location),
        getAgeGroupText(activity.age_group),
        activity.sdgs.map(sdg => `ODS ${sdg.number}`).join('; '),
        activity.educational_goals.map(goal => getPortugueseText(goal.title)).join('; '),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'atividades.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Vista em Tabela</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Pesquisar atividades..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div
                          className={`flex items-center gap-2 ${
                            header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                          }`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <span>
                              {{
                                asc: <ChevronUp className="h-4 w-4" />,
                                desc: <ChevronDown className="h-4 w-4" />,
                              }[header.column.getIsSorted() as string] ?? (
                                <ChevronsUpDown className="h-4 w-4" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Nenhuma atividade encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            Mostrando {table.getFilteredRowModel().rows.length} de {activities.length} atividades.
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Anterior
            </Button>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">
                Página {table.getState().pagination.pageIndex + 1} de{' '}
                {table.getPageCount()}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Próxima
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
