import { useState } from 'react';
import { ArrowUpDown, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react';
import { useKanban } from '@/context/KanbanContext';
import { FilterBar } from './FilterBar';
import {
  calcularProgreso,
  colorDePrioridad,
  colorEstado,
  diasRestantes,
  estaVencida,
  filtrarTareas,
  formatearFecha,
  inicialDeTrabajador,
  labelEstado,
  labelPlazo,
  labelPrioridad,
  resolverTrabajador,
} from '@/lib/kanban-utils';
import type { Task } from '@/types';
import { cn } from '@/lib/utils';

type SortKey = 'titulo' | 'estado' | 'prioridad' | 'fechaFin' | 'progreso';

interface ListaViewProps {
  onAbrirTarea: (id: string) => void;
}

export function ListaView({ onAbrirTarea }: ListaViewProps) {
  const { data, filtros } = useKanban();
  const [sortKey, setSortKey] = useState<SortKey>('fechaFin');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const tareasFiltradas = filtrarTareas(data.tareas, filtros);

  const PRIORITY_ORDER = { urgente: 0, alta: 1, media: 2, baja: 3 };
  const STATE_ORDER = { 'en-progreso': 0, pendiente: 1, completado: 2 };

  const tareas = [...tareasFiltradas].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'titulo') cmp = a.titulo.localeCompare(b.titulo);
    else if (sortKey === 'estado') cmp = STATE_ORDER[a.estado] - STATE_ORDER[b.estado];
    else if (sortKey === 'prioridad') cmp = PRIORITY_ORDER[a.prioridad] - PRIORITY_ORDER[b.prioridad];
    else if (sortKey === 'fechaFin') cmp = a.fechaFin.localeCompare(b.fechaFin);
    else if (sortKey === 'progreso') cmp = calcularProgreso(a) - calcularProgreso(b);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="size-3 opacity-40" />;
    return sortDir === 'asc' ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />;
  }

  return (
    <div className="flex flex-col h-full">
      <FilterBar />
      <div className="flex-1 overflow-auto p-6">
        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left font-medium text-muted-foreground px-4 py-3 w-[35%]">
                  <button
                    onClick={() => toggleSort('titulo')}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Tarea <SortIcon col="titulo" />
                  </button>
                </th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">
                  <button
                    onClick={() => toggleSort('estado')}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Estado <SortIcon col="estado" />
                  </button>
                </th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">
                  <button
                    onClick={() => toggleSort('prioridad')}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Prioridad <SortIcon col="prioridad" />
                  </button>
                </th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">
                  Asignados
                </th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">
                  <button
                    onClick={() => toggleSort('progreso')}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Avance <SortIcon col="progreso" />
                  </button>
                </th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">
                  <button
                    onClick={() => toggleSort('fechaFin')}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Vence <SortIcon col="fechaFin" />
                  </button>
                </th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden xl:table-cell">
                  Plazo
                </th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden xl:table-cell">
                  Subtareas
                </th>
              </tr>
            </thead>
            <tbody>
              {tareas.map((tarea) => (
                <FilaTarea
                  key={tarea.id}
                  tarea={tarea}
                  onClick={() => onAbrirTarea(tarea.id)}
                  trabajadores={data.trabajadores}
                />
              ))}
              {tareas.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-muted-foreground py-12 text-sm">
                    No hay tareas que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3 px-1">
          {tareas.length} de {data.tareas.length} tareas
        </p>
      </div>
    </div>
  );
}

function FilaTarea({
  tarea,
  onClick,
  trabajadores,
}: {
  tarea: Task;
  onClick: () => void;
  trabajadores: import('@/types').Worker[];
}) {
  const progreso = calcularProgreso(tarea);
  const vencida = estaVencida(tarea);
  const dias = diasRestantes(tarea.fechaFin);
  const completadas = tarea.microtareas.filter((m) => m.completada).length;

  return (
    <tr
      onClick={onClick}
      className={cn(
        'border-b last:border-0 cursor-pointer hover:bg-muted/40 transition-colors',
        vencida && 'bg-red-50/40 dark:bg-red-950/10'
      )}
    >
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <span className="font-medium line-clamp-1 hover:text-primary transition-colors">
            {vencida && <AlertTriangle className="size-3 text-red-500 inline mr-1" />}
            {tarea.titulo}
          </span>
          {tarea.etiquetas.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tarea.etiquetas.slice(0, 3).map((e) => (
                <span key={e} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  {e}
                </span>
              ))}
            </div>
          )}
        </div>
      </td>

      <td className="px-4 py-3">
        <span className={cn('text-xs font-medium px-2 py-1 rounded-full', colorEstado(tarea.estado))}>
          {labelEstado(tarea.estado)}
        </span>
      </td>

      <td className="px-4 py-3">
        <span className={cn('text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded', colorDePrioridad(tarea.prioridad))}>
          {labelPrioridad(tarea.prioridad)}
        </span>
      </td>

      <td className="px-4 py-3 hidden lg:table-cell">
        <div className="flex -space-x-1.5">
          {tarea.asignados.slice(0, 3).map((id) => {
            const w = resolverTrabajador(id, trabajadores);
            if (!w) return null;
            return (
              <div
                key={id}
                title={w.nombre}
                className="size-6 rounded-full text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-card"
                style={{ backgroundColor: w.color }}
              >
                {inicialDeTrabajador(w)}
              </div>
            );
          })}
          {tarea.asignados.length > 3 && (
            <div className="size-6 rounded-full text-[10px] font-bold bg-muted text-muted-foreground flex items-center justify-center ring-2 ring-card">
              +{tarea.asignados.length - 3}
            </div>
          )}
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                progreso === 100 ? 'bg-emerald-500' : progreso > 0 ? 'bg-primary' : 'bg-slate-300'
              )}
              style={{ width: `${progreso}%` }}
            />
          </div>
          <span className="text-xs font-medium tabular-nums">{progreso}%</span>
        </div>
      </td>

      <td className="px-4 py-3">
        <span className={cn(
          'text-xs',
          vencida ? 'text-red-500 font-medium' : dias !== null && dias <= 2 ? 'text-orange-500' : 'text-muted-foreground'
        )}>
          {formatearFecha(tarea.fechaFin)}
        </span>
      </td>

      <td className="px-4 py-3 hidden xl:table-cell text-xs text-muted-foreground">
        {labelPlazo(tarea.plazo)}
      </td>

      <td className="px-4 py-3 hidden xl:table-cell text-xs text-muted-foreground">
        {tarea.microtareas.length > 0 ? `${completadas}/${tarea.microtareas.length}` : '—'}
      </td>
    </tr>
  );
}
