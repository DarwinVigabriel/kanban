import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useKanban } from '@/context/KanbanContext';
import type { TaskState, TaskPriority, TaskPlazo } from '@/types';
import { inicialDeTrabajador } from '@/lib/kanban-utils';
import { cn } from '@/lib/utils';

interface CreateTaskModalProps {
  onClose: () => void;
  estadoInicial?: TaskState;
}

export function CreateTaskModal({ onClose, estadoInicial = 'pendiente' }: CreateTaskModalProps) {
  const { data, crearTarea } = useKanban();
  const hoy = new Date().toISOString().split('T')[0];

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [estado, setEstado] = useState<TaskState>(estadoInicial);
  const [prioridad, setPrioridad] = useState<TaskPriority>('media');
  const [plazo, setPlazo] = useState<TaskPlazo>('semanal');
  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [fechaFin, setFechaFin] = useState('');
  const [asignados, setAsignados] = useState<string[]>([]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function toggleAsignado(id: string) {
    setAsignados((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    crearTarea({
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      estado,
      prioridad,
      plazo,
      fechaInicio,
      fechaFin: fechaFin || fechaInicio,
      progreso: 0,
      asignados,
      etiquetas: [],
      microtareas: [],
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-background rounded-2xl shadow-2xl border">
        <div className="flex items-center justify-between p-6 pb-4 border-b">
          <h2 className="text-lg font-semibold">Nueva tarea</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Nombre de la tarea..."
              autoFocus
              required
              className="w-full text-lg font-semibold bg-transparent outline-none placeholder:text-muted-foreground/50 border-b-2 border-muted focus:border-primary transition-colors pb-2"
            />
          </div>

          <div>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción (opcional)..."
              rows={2}
              className="w-full text-sm bg-muted/30 rounded-xl px-4 py-3 outline-none resize-none border border-transparent focus:border-primary transition-colors placeholder:text-muted-foreground/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Estado</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as TaskState)}
                className="w-full text-sm rounded-lg px-3 py-2 border bg-background outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="pendiente">Pendiente</option>
                <option value="en-progreso">En Progreso</option>
                <option value="completado">Completado</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Prioridad</label>
              <select
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value as TaskPriority)}
                className="w-full text-sm rounded-lg px-3 py-2 border bg-background outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="urgente">Urgente</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Plazo</label>
              <select
                value={plazo}
                onChange={(e) => setPlazo(e.target.value as TaskPlazo)}
                className="w-full text-sm rounded-lg px-3 py-2 border bg-background outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="diario">Diario</option>
                <option value="semanal">Semanal</option>
                <option value="mensual">Mensual</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full text-sm rounded-lg px-3 py-2 border bg-background outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Vence</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                min={fechaInicio}
                className="w-full text-sm rounded-lg px-3 py-2 border bg-background outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Asignar a</label>
            <div className="flex flex-wrap gap-2">
              {data.trabajadores.map((w) => {
                const seleccionado = asignados.includes(w.id);
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => toggleAsignado(w.id)}
                    className={cn(
                      'flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-all',
                      seleccionado
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-muted hover:border-primary/50 text-muted-foreground'
                    )}
                  >
                    <div
                      className="size-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                      style={{ backgroundColor: w.color }}
                    >
                      {inicialDeTrabajador(w)}
                    </div>
                    {w.nombre}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!titulo.trim()}>
              Crear tarea
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
