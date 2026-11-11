'use client';

import { useState, useMemo } from 'react';
import { useLocale } from '@/components/locale/LocaleProvider';
import { enumLabel, enumLabelList } from '@/lib/locale/labels';
import { activityKindLabel } from '@/lib/activities/kind-label';
import { DivisionPill } from '@/components/ui/DivisionPill';
import { AGE_GROUP_VALUES } from '@/lib/activities/category-values';
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
import { formatDuration } from '@/lib/activities/duration-range';

/**
 * Interface for educational goal data
 */
interface EducationalGoal {
  id: string;
  age_groups?: string[];
  title: string;
  code: string;
}

/**
 * Interface for SDG data
 */
interface Sdg {
  id: string;
  number: number;
  name: string;
  icon_url: string;
}

/**
 * Interface for activity data
 */
interface Activity {
  id: string;
  name: string;
  description: string;
  approximate_duration_minutes: number;
  duration_min_minutes?: number | null;
  duration_max_minutes?: number | null;
  group_sizes: string[]; // API returns strings, not union types
  effort_level: string; // API returns string, not union type
  locations: string[];
  age_groups: string[];
  created_at: string;
  format?: { id: string; code: string; name: string } | null;
  focus?: { id: string; code: string; name: string } | null;
  secondary_focus?: { id: string; code: string; name: string } | null;
  educational_goals: EducationalGoal[];
  sdgs: Sdg[];
}

/**
 * Props for the ActivitiesTable component
 */
interface ActivitiesTableProps {
  activities: Activity[];
  onViewActivity?: (activity: Activity) => void;
  onEditActivity?: (activity: Activity) => void;
  onDeleteActivity?: (activity: Activity) => void;
}

/**
 * Helper function to get group size display text
 * @param size - The group size value
 * @returns The display text for the group size
 */

/**
 * ActivitiesTable component for displaying a list of activities in a table format
 * @param props - The component props
 * @returns The rendered activities table
 */
export function ActivitiesTable({ 
  activities, 
  onViewActivity, 
  onEditActivity, 
  onDeleteActivity 
}: ActivitiesTableProps) {
  const { t } = useLocale();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo<ColumnDef<Activity>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('activities.csvName'),
        cell: ({ row }) => (
          <div className="font-bold">
            {row.original.name}
          </div>
        ),
      },
      {
        id: 'format',
        accessorFn: (row) => row.format?.name ?? '',
        header: t('activities.csvFormat'),
        cell: ({ row }) =>
          row.original.format ? (
            <Badge variant="secondary" className="text-xs">
              {row.original.format.name}
            </Badge>
          ) : null,
      },
      {
        id: 'focus',
        accessorFn: (row) => row.focus?.name ?? '',
        header: t('activities.csvFocus'),
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.focus?.name ?? ''}</span>,
      },
      {
        accessorKey: 'approximate_duration_minutes',
        header: t('activities.colDuration'),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDuration(row.original.approximate_duration_minutes, row.original.duration_min_minutes, row.original.duration_max_minutes)}
          </span>
        ),
      },
      {
        id: 'group_sizes',
        accessorFn: (row) => row.group_sizes.join(', '),
        header: t('activities.colGroup'),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {enumLabelList(t, 'groupSize', row.original.group_sizes)}
          </span>
        ),
      },
      {
        accessorKey: 'effort_level',
        header: t('activities.colEffort'),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {enumLabel(t, 'effort', row.original.effort_level)}
          </span>
        ),
      },
      {
        id: 'locations',
        accessorFn: (row) => row.locations.join(', '),
        header: t('activities.colLocation'),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {enumLabelList(t, 'location', row.original.locations)}
          </span>
        ),
      },
      {
        id: 'age_groups',
        accessorFn: (row) => row.age_groups.join(', '),
        header: t('filters.age'),
        cell: ({ row }) => (
          <span className="flex flex-wrap gap-1">
            {AGE_GROUP_VALUES.filter((value) => row.original.age_groups.includes(value)).map((value) => (
              <DivisionPill
                key={value}
                ageGroup={value}
                code={t(`enums.ageGroupShort.${value}`)}
                accessibleName={enumLabel(t, 'ageGroup', value)}
              />
            ))}
          </span>
        ),
      },
      {
        accessorKey: 'sdgs',
        header: t('activities.csvSdg'),
        cell: ({ row }) => (
          <div className="flex gap-1">
            {row.original.sdgs.slice(0, 3).map((sdg) => (
              <div
                key={sdg.id}
                className="w-6 h-6 rounded-md flex items-center justify-center shadow-sm border border-border bg-white overflow-hidden"
                title={t('activities.sdgTitle', { number: sdg.number, name: sdg.name })}
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
        header: t('activities.goalsShort'),
        cell: ({ row }) => (
          <div className="flex gap-1">
            {row.original.educational_goals.slice(0, 2).map((goal) => (
              <Badge key={goal.id} variant="outline" className="text-xs">
                {goal.title}
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
        header: t('activities.actions'),
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" aria-label={t('activities.actions')}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onViewActivity && (
                <DropdownMenuItem onClick={() => onViewActivity(row.original)}>
                  <Eye className="mr-2 h-4 w-4" />
                  {t('activities.viewDetails')}
                </DropdownMenuItem>
              )}
              {onEditActivity && (
                <DropdownMenuItem onClick={() => onEditActivity(row.original)}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t('common.edit')}
                </DropdownMenuItem>
              )}
              {onDeleteActivity && (
                <DropdownMenuItem 
                  onClick={() => onDeleteActivity(row.original)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('common.delete')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [onViewActivity, onEditActivity, onDeleteActivity, t]
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
      t('activities.csvName'),
      t('activities.csvFormat'),
      t('activities.csvFocus'),
      t('activities.csvDuration'),
      t('filters.groupSize'),
      t('filters.effort'),
      t('filters.location'),
      t('filters.age'),
      t('activities.csvSdg'),
      t('activities.goals'),
    ];

    const csvContent = [
      headers.join(','),
      ...activities.map(activity => [
        activity.name,
        activity.format?.name ?? '',
        activity.focus?.name ?? '',
        activity.approximate_duration_minutes,
        enumLabelList(t, 'groupSize', activity.group_sizes).replace(/, /g, '; '),
        enumLabel(t, 'effort', activity.effort_level),
        enumLabelList(t, 'location', activity.locations).replace(/, /g, '; '),
        enumLabelList(t, 'ageGroup', activity.age_groups).replace(/, /g, '; '),
        activity.sdgs.map(sdg => t('activities.sdgPrefix', { number: sdg.number })).join('; '),
        activity.educational_goals.map(goal => goal.title).join('; '),
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
          <CardTitle>{t('activities.tableView')}</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder={t('activities.search')}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              {t('activities.exportCsv')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="md:hidden space-y-3">
          {activities.map((activity) => (
            <button
              key={activity.id}
              type="button"
              className="w-full text-left border rounded-md p-3 min-h-11"
              onClick={() => onViewActivity?.(activity)}
            >
              <p className="font-bold">{activity.name}</p>
              <p className="text-sm text-muted-foreground">
                {[activityKindLabel(activity), `${activity.approximate_duration_minutes} ${t('common.minutes')}`, enumLabelList(t, 'location', activity.locations)].filter(Boolean).join(' · ')} {t('common.minutes')} · {enumLabelList(t, 'location', activity.locations)}
              </p>
            </button>
          ))}
        </div>
        <div className="hidden md:block rounded-md border">
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
                    {t('activities.noneFound')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {t('activities.showing', { from: table.getFilteredRowModel().rows.length, total: activities.length })}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              {t('common.previous')}
            </Button>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold">
                {t('activities.pageOf', {
                  current: table.getState().pagination.pageIndex + 1,
                  total: table.getPageCount(),
                })}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
