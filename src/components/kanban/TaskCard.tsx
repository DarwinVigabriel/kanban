import { AlertTriangle, Calendar, CheckSquare, Clock, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';
import { useKanban } from '@/context/KanbanContext';
import {
  calcularProgreso,
  colorBordePrioridad,
  colorDePrioridad,
  diasRestantes,
  estaVencida,
  formatearFecha,
  inicialDeTrabajador,
  labelPrioridad,
  resolverTrabajador,
} from '@/lib/kanban-utils';

interface TaskCardProps {
  tarea: Task;
  onClick: () => void;
  className?: string;
}

export function TaskCard({ tarea, onClick, className }: TaskCardProps) {
  const { data } = useKanban();
  const progreso = calcularProgreso(tarea);
  const vencida = estaVencida(tarea);
  const dias = diasRestantes(tarea.fechaFin);
  const completadas = tarea.microtareas.filter((m) => m.completada).length;
  const totalMicro = tarea.microtareas.length;

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative bg-card rounded-xl border border-l-4 p-4 cursor-pointer',
        'shadow-sm hover:shadow-md transition-all duration-150',
        'hover:border-primary/30 active:scale-[0.98]',
        colorBordePrioridad(tarea.prioridad),
        vencida && 'bg-red-50/50 dark:bg-red-950/20',
        className
      )}
    >
      {vencida && (
        <div className="flex items-center gap-1 text-red-500 text-xs font-medium mb-2">
          <AlertTriangle className="size-3.5" />
          Vencida hace {Math.abs(dias)}d
        </div>
      )}

      <h3 className="text-sm font-semibold leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
        {tarea.titulo}
      </h3>

      {tarea.descripcion && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {tarea.descripcion}
        </p>
      )}

      {tarea.etiquetas.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {tarea.etiquetas.slice(0, 3).map((e) => (
            <span
              key={e}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary"
            >
              {e}
            </span>
          ))}
          {tarea.etiquetas.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{tarea.etiquetas.length - 3}</span>
          )}
        </div>
      )}

      {totalMicro > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="flex items-center gap-1">
              <CheckSquare className="size-3" />
              {completadas}/{totalMicro} subtareas
            </span>
            <span className="font-medium text-foreground">{progreso}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                progreso === 100
                  ? 'bg-emerald-500'
                  : progreso > 0
                  ? 'bg-primary'
                  : 'bg-slate-300 dark:bg-slate-600'
              )}
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span
            className={cn(
              'text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded',
              colorDePrioridad(tarea.prioridad)
            )}
          >
            {labelPrioridad(tarea.prioridad)}
          </span>

          <span className={cn(
            'flex items-center gap-1 text-xs',
            vencida ? 'text-red-500' : !dias || dias <= 2 ? 'text-orange-500' : 'text-muted-foreground'
          )}>
            <Calendar className="size-3 shrink-0" />
            {formatearFecha(tarea.fechaFin)}
          </span>

          {tarea.estimacionHoras && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {tarea.estimacionHoras}h
            </span>
          )}

          {tarea.comentarios.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="size-3" />
              {tarea.comentarios.length}
            </span>
          )}
        </div>

        <div className="flex -space-x-1.5 shrink-0">
          {tarea.asignados.slice(0, 3).map((id) => {
            const w = resolverTrabajador(id, data.trabajadores);
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
      </div>
    </div>
  );
}
