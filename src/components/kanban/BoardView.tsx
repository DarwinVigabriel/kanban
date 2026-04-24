import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Kanban, KanbanBoard, KanbanColumn, KanbanItem, KanbanOverlay } from '@/components/ui/kanban';
import { TaskCard } from './TaskCard';
import { FilterBar } from './FilterBar';
import { useKanban } from '@/context/KanbanContext';
import { calcularProgreso, filtrarTareas, labelEstado } from '@/lib/kanban-utils';
import type { Task, TaskState } from '@/types';
import { cn } from '@/lib/utils';

interface BoardViewProps {
  onAbrirTarea: (id: string) => void;
  onNuevaTarea: () => void;
}

const COLUMNAS: { id: TaskState; label: string; color: string }[] = [
  { id: 'pendiente', label: 'Pendiente', color: 'text-slate-500' },
  { id: 'en-progreso', label: 'En Progreso', color: 'text-blue-500' },
  { id: 'completado', label: 'Completado', color: 'text-emerald-500' },
];

export function BoardView({ onAbrirTarea, onNuevaTarea }: BoardViewProps) {
  const { data, filtros, reordenarTareas } = useKanban();
  const [activeId, setActiveId] = useState<string | null>(null);

  const tareasFiltradas = filtrarTareas(data.tareas, filtros);

  // Record<TaskState, Task[]> para DiceUI
  const columnasRecord = COLUMNAS.reduce(
    (acc, col) => {
      acc[col.id] = tareasFiltradas.filter((t) => t.estado === col.id);
      return acc;
    },
    {} as Record<TaskState, Task[]>
  );

  function handleValueChange(nuevoRecord: Record<TaskState, Task[]>) {
    // Mapa de id → nuevo estado según la posición en el record
    const nuevoEstadoPorId = new Map<string, TaskState>();
    for (const [estado, tareas] of Object.entries(nuevoRecord) as [TaskState, Task[]][]) {
      for (const tarea of tareas) nuevoEstadoPorId.set(tarea.id, estado);
    }

    // Reconstruir el array global en el nuevo orden, aplicando el estado en una sola pasada
    const ordenFiltradas = Object.values(nuevoRecord).flat().map((t) => t.id);
    const tareasNoFiltradas = data.tareas.filter((t) => !tareasFiltradas.some((f) => f.id === t.id));

    const reordenadas: Task[] = [
      ...ordenFiltradas.map((id) => {
        const t = data.tareas.find((t) => t.id === id);
        if (!t) return null;
        const nuevoEstado = nuevoEstadoPorId.get(id)!;
        if (t.estado === nuevoEstado) return t;
        // Aplicar nuevo estado (misma lógica que moverTarea en el contexto)
        const actualizada: Task = { ...t, estado: nuevoEstado };
        if (nuevoEstado === 'completado') {
          actualizada.microtareas = t.microtareas.map((m) => ({ ...m, completada: true }));
          actualizada.progreso = 100;
        } else {
          actualizada.progreso = calcularProgreso(actualizada);
        }
        return actualizada;
      }).filter((t): t is Task => t !== null),
      ...tareasNoFiltradas,
    ];

    reordenarTareas(reordenadas);
  }

  const activeTarea = activeId ? data.tareas.find((t) => t.id === activeId) : null;

  return (
    <div className="flex flex-col h-full">
      <FilterBar />
      <div className="flex-1 overflow-auto p-6">
        <Kanban
          value={columnasRecord}
          onValueChange={handleValueChange}
          getItemValue={(t: Task) => t.id}
          onDragStart={(e) => setActiveId(e.active.id as string)}
          onDragEnd={() => setActiveId(null)}
          onDragCancel={() => setActiveId(null)}
        >
          <KanbanBoard className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {COLUMNAS.map((col) => {
              const tareas = columnasRecord[col.id];
              return (
                <KanbanColumn
                  key={col.id}
                  value={col.id}
                  className="flex flex-col bg-muted/40 rounded-2xl p-3 gap-2 min-h-[200px]"
                >
                  <div className="flex items-center justify-between px-1 mb-1">
                    <div className="flex items-center gap-2">
                      <span className={cn('font-semibold text-sm', col.color)}>
                        {labelEstado(col.id)}
                      </span>
                      <span className="size-5 rounded-full bg-muted text-muted-foreground text-xs font-semibold flex items-center justify-center">
                        {tareas.length}
                      </span>
                    </div>
                    <button
                      onClick={onNuevaTarea}
                      className="size-6 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    {tareas.map((tarea) => (
                      <KanbanItem
                        key={tarea.id}
                        value={tarea.id}
                        asHandle
                        className={cn('rounded-xl', activeId === tarea.id && 'opacity-50')}
                      >
                        <TaskCard
                          tarea={tarea}
                          onClick={() => onAbrirTarea(tarea.id)}
                        />
                      </KanbanItem>
                    ))}
                  </div>

                  {tareas.length === 0 && (
                    <div className="flex-1 flex items-center justify-center py-8 text-xs text-muted-foreground/50 border-2 border-dashed border-muted rounded-xl">
                      Sin tareas
                    </div>
                  )}
                </KanbanColumn>
              );
            })}
          </KanbanBoard>

          <KanbanOverlay>
            {activeTarea ? (
              <TaskCard
                tarea={activeTarea}
                onClick={() => {}}
                className="rotate-2 shadow-2xl scale-105"
              />
            ) : null}
          </KanbanOverlay>
        </Kanban>
      </div>
    </div>
  );
}
