import { useState } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkerModal } from './WorkerModal';
import { useKanban } from '@/context/KanbanContext';
import type { Worker } from '@/types';
import { calcularProgreso, estaVencida, inicialDeTrabajador, labelEstado } from '@/lib/kanban-utils';
import { cn } from '@/lib/utils';

interface WorkersViewProps {
  onAbrirTarea: (id: string) => void;
}

export function WorkersView({ onAbrirTarea }: WorkersViewProps) {
  const { data, eliminarTrabajador } = useKanban();
  const [editando, setEditando] = useState<Worker | undefined>(undefined);
  const [creando, setCreando] = useState(false);

  function handleEliminar(w: Worker) {
    if (confirm(`¿Eliminar a ${w.nombre}? Se quitará de todas las tareas.`)) {
      eliminarTrabajador(w.id);
    }
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Equipo</h2>
        <Button size="sm" onClick={() => setCreando(true)}>
          <Plus className="size-4" />
          Nuevo trabajador
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {data.trabajadores.map((w) => (
          <WorkerCard
            key={w.id}
            worker={w}
            onAbrirTarea={onAbrirTarea}
            onEditar={() => setEditando(w)}
            onEliminar={() => handleEliminar(w)}
          />
        ))}
      </div>

      {(creando || editando) && (
        <WorkerModal
          worker={editando}
          onClose={() => { setCreando(false); setEditando(undefined); }}
        />
      )}
    </div>
  );
}

function WorkerCard({
  worker,
  onAbrirTarea,
  onEditar,
  onEliminar,
}: {
  worker: Worker;
  onAbrirTarea: (id: string) => void;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  const { data } = useKanban();
  const [expandido, setExpandido] = useState(false);

  const tareasAsignadas = data.tareas.filter((t) => t.asignados.includes(worker.id));
  const pendientes = tareasAsignadas.filter((t) => t.estado === 'pendiente');
  const enProgreso = tareasAsignadas.filter((t) => t.estado === 'en-progreso');
  const completadas = tareasAsignadas.filter((t) => t.estado === 'completado');
  const atrasadas = tareasAsignadas.filter(estaVencida);

  const progresoTotal =
    tareasAsignadas.length > 0
      ? Math.round(
          tareasAsignadas.reduce((sum, t) => sum + calcularProgreso(t), 0) /
            tareasAsignadas.length
        )
      : 0;

  return (
    <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div
            className="size-12 rounded-full text-lg font-bold text-white flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: worker.color }}
          >
            {inicialDeTrabajador(worker)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base leading-tight">{worker.nombre}</h3>
            <p className="text-xs text-muted-foreground">{worker.cargo}</p>
            <p className="text-xs text-muted-foreground">{worker.email}</p>
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={onEditar} className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Pencil className="size-3.5" />
            </button>
            <button onClick={onEliminar} className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>

        {atrasadas.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3 text-red-500 text-xs font-medium bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-1.5">
            <AlertTriangle className="size-3.5" />
            {atrasadas.length} tarea{atrasadas.length > 1 ? 's' : ''} atrasada{atrasadas.length > 1 ? 's' : ''}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <Stat icon={<Clock className="size-3.5 text-blue-500" />} label="En progreso" value={enProgreso.length} color="text-blue-600" />
          <Stat icon={<Clock className="size-3.5 text-slate-400" />} label="Pendientes" value={pendientes.length} color="text-slate-500" />
          <Stat icon={<CheckCircle2 className="size-3.5 text-emerald-500" />} label="Completadas" value={completadas.length} color="text-emerald-600" />
        </div>

        {/* Progreso promedio */}
        {tareasAsignadas.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Avance promedio</span>
              <span className="font-semibold text-foreground">{progresoTotal}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', progresoTotal === 100 ? 'bg-emerald-500' : 'bg-primary')}
                style={{ width: `${progresoTotal}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Task list toggle */}
      {tareasAsignadas.length > 0 && (
        <>
          <button
            onClick={() => setExpandido((v) => !v)}
            className="w-full px-5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-t text-left"
          >
            {expandido ? 'Ocultar' : 'Ver'} {tareasAsignadas.length} tarea{tareasAsignadas.length > 1 ? 's' : ''}
          </button>

          {expandido && (
            <div className="border-t divide-y">
              {tareasAsignadas.map((t) => {
                const p = calcularProgreso(t);
                const vencida = estaVencida(t);
                return (
                  <button
                    key={t.id}
                    onClick={() => onAbrirTarea(t.id)}
                    className="w-full text-left px-5 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn(
                        'size-1.5 rounded-full mt-1.5 shrink-0',
                        t.estado === 'completado' ? 'bg-emerald-500' :
                        t.estado === 'en-progreso' ? 'bg-blue-500' : 'bg-slate-400'
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-xs font-medium line-clamp-1', vencida && 'text-red-500')}>
                          {vencida && <AlertTriangle className="size-3 inline mr-1" />}
                          {t.titulo}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground">{labelEstado(t.estado)}</span>
                          <div className="w-12 h-1 rounded-full bg-muted overflow-hidden">
                            <div className={cn('h-full rounded-full', p === 100 ? 'bg-emerald-500' : 'bg-primary')} style={{ width: `${p}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{p}%</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {tareasAsignadas.length === 0 && (
        <div className="px-5 pb-4 text-xs text-muted-foreground/50">Sin tareas asignadas</div>
      )}
    </div>
  );
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-muted/40 rounded-xl p-2.5 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <div className={cn('text-lg font-bold tabular-nums', color)}>{value}</div>
      <div className="text-[10px] text-muted-foreground leading-tight">{label}</div>
    </div>
  );
}
