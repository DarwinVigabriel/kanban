import { useState, useEffect, useRef } from 'react';
import { X, Trash2, Calendar, Clock, Tag, Users, TrendingUp } from 'lucide-react';
import { useKanban } from '@/context/KanbanContext';
import { SubtaskSection } from './SubtaskSection';
import { CommentSection } from './CommentSection';
import { Button } from '@/components/ui/button';
import type { Task, TaskState, TaskPriority, TaskPlazo } from '@/types';
import {
  calcularProgreso,
  colorBordePrioridad,
  colorEstado,
  formatearFecha,
  inicialDeTrabajador,
  labelEstado,
  labelPlazo,
  labelPrioridad,
  resolverTrabajador,
} from '@/lib/kanban-utils';
import { cn } from '@/lib/utils';

interface TaskDetailModalProps {
  tareaId: string;
  onClose: () => void;
}

export function TaskDetailModal({ tareaId, onClose }: TaskDetailModalProps) {
  const { data, actualizarTarea, eliminarTarea, agregarEtiquetaGlobal } = useKanban();
  const tarea = data.tareas.find((t) => t.id === tareaId);
  const [editandoTitulo, setEditandoTitulo] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState('');
  const [mostrarEtiquetas, setMostrarEtiquetas] = useState(false);
  const tituloRef = useRef<HTMLTextAreaElement>(null);

  const AUTOR_ID = data.trabajadores[0]?.id ?? '';

  useEffect(() => {
    if (editandoTitulo && tituloRef.current) {
      tituloRef.current.focus();
      tituloRef.current.select();
    }
  }, [editandoTitulo]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!tarea) return null;

  const progreso = calcularProgreso(tarea);

  function set<K extends keyof Task>(key: K, value: Task[K]) {
    actualizarTarea(tareaId, { [key]: value } as Partial<Task>);
  }

  function guardarTitulo() {
    const t = nuevoTitulo.trim();
    if (t) set('titulo', t);
    setEditandoTitulo(false);
  }

  function toggleAsignado(workerId: string) {
    const asignados = tarea!.asignados.includes(workerId)
      ? tarea!.asignados.filter((a) => a !== workerId)
      : [...tarea!.asignados, workerId];
    set('asignados', asignados);
  }

  function toggleEtiqueta(etiqueta: string) {
    const etiquetas = tarea!.etiquetas.includes(etiqueta)
      ? tarea!.etiquetas.filter((e) => e !== etiqueta)
      : [...tarea!.etiquetas, etiqueta];
    set('etiquetas', etiquetas);
  }

  function agregarNuevaEtiqueta(e: React.FormEvent) {
    e.preventDefault();
    const et = nuevaEtiqueta.trim().toLowerCase();
    if (!et) return;
    agregarEtiquetaGlobal(et);
    if (!tarea!.etiquetas.includes(et)) {
      set('etiquetas', [...tarea!.etiquetas, et]);
    }
    setNuevaEtiqueta('');
  }

  function handleEliminar() {
    if (confirm(`¿Eliminar "${tarea!.titulo}"?`)) {
      eliminarTarea(tareaId);
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={cn(
          'relative w-full max-w-4xl bg-background rounded-2xl shadow-2xl border border-l-4 flex flex-col',
          colorBordePrioridad(tarea.prioridad)
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-6 pb-4 border-b">
          <div className="flex-1 min-w-0">
            {editandoTitulo ? (
              <textarea
                ref={tituloRef}
                value={nuevoTitulo}
                onChange={(e) => setNuevoTitulo(e.target.value)}
                onBlur={guardarTitulo}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); guardarTitulo(); }
                  if (e.key === 'Escape') setEditandoTitulo(false);
                }}
                rows={2}
                className="w-full text-2xl font-bold bg-transparent outline-none resize-none border-b-2 border-primary"
              />
            ) : (
              <h2
                onClick={() => { setEditandoTitulo(true); setNuevoTitulo(tarea.titulo); }}
                className="text-2xl font-bold cursor-text hover:text-primary/80 transition-colors leading-snug"
              >
                {tarea.titulo}
              </h2>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Creada el {formatearFecha(tarea.fechaCreacion.split('T')[0])} · ID: {tarea.id.slice(0, 8)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="icon" onClick={handleEliminar} className="text-muted-foreground hover:text-red-500">
              <Trash2 className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col lg:flex-row gap-6 p-6 overflow-y-auto max-h-[80vh]">
          {/* Left: description, subtasks, comments */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Description */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Descripción</p>
              <textarea
                value={tarea.descripcion}
                onChange={(e) => set('descripcion', e.target.value)}
                placeholder="Agrega una descripción..."
                rows={3}
                className="w-full text-sm bg-muted/30 rounded-xl px-4 py-3 outline-none resize-none border border-transparent focus:border-primary transition-colors placeholder:text-muted-foreground/50"
              />
            </div>

            {/* Progress bar (manual if no subtasks) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="size-3.5" />
                  Avance
                </p>
                <span className="text-sm font-bold text-foreground">{progreso}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    progreso === 100 ? 'bg-emerald-500' : progreso > 0 ? 'bg-primary' : 'bg-slate-300'
                  )}
                  style={{ width: `${progreso}%` }}
                />
              </div>
              {tarea.microtareas.length === 0 && (
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={tarea.progreso}
                  onChange={(e) => set('progreso', Number(e.target.value))}
                  className="w-full mt-2 accent-primary"
                />
              )}
            </div>

            <SubtaskSection tarea={tarea} />

            <CommentSection tarea={tarea} autorId={AUTOR_ID} />
          </div>

          {/* Right: Properties */}
          <div className="lg:w-60 shrink-0 space-y-4">
            <PropGroup label="Estado">
              <select
                value={tarea.estado}
                onChange={(e) => set('estado', e.target.value as TaskState)}
                className={cn(
                  'w-full text-sm rounded-lg px-3 py-2 border outline-none focus:ring-1 focus:ring-primary',
                  colorEstado(tarea.estado)
                )}
              >
                <option value="pendiente">{labelEstado('pendiente')}</option>
                <option value="en-progreso">{labelEstado('en-progreso')}</option>
                <option value="completado">{labelEstado('completado')}</option>
              </select>
            </PropGroup>

            <PropGroup label="Prioridad">
              <select
                value={tarea.prioridad}
                onChange={(e) => set('prioridad', e.target.value as TaskPriority)}
                className="w-full text-sm rounded-lg px-3 py-2 border outline-none focus:ring-1 focus:ring-primary bg-background"
              >
                <option value="urgente">{labelPrioridad('urgente')}</option>
                <option value="alta">{labelPrioridad('alta')}</option>
                <option value="media">{labelPrioridad('media')}</option>
                <option value="baja">{labelPrioridad('baja')}</option>
              </select>
            </PropGroup>

            <PropGroup label="Plazo">
              <select
                value={tarea.plazo}
                onChange={(e) => set('plazo', e.target.value as TaskPlazo)}
                className="w-full text-sm rounded-lg px-3 py-2 border outline-none focus:ring-1 focus:ring-primary bg-background"
              >
                <option value="diario">{labelPlazo('diario')}</option>
                <option value="semanal">{labelPlazo('semanal')}</option>
                <option value="mensual">{labelPlazo('mensual')}</option>
              </select>
            </PropGroup>

            <PropGroup label={<><Calendar className="size-3.5" />Fecha inicio</>}>
              <input
                type="date"
                value={tarea.fechaInicio}
                onChange={(e) => set('fechaInicio', e.target.value)}
                className="w-full text-sm rounded-lg px-3 py-2 border outline-none focus:ring-1 focus:ring-primary bg-background"
              />
            </PropGroup>

            <PropGroup label={<><Calendar className="size-3.5" />Fecha límite</>}>
              <input
                type="date"
                value={tarea.fechaFin}
                onChange={(e) => set('fechaFin', e.target.value)}
                className="w-full text-sm rounded-lg px-3 py-2 border outline-none focus:ring-1 focus:ring-primary bg-background"
              />
            </PropGroup>

            <PropGroup label={<><Clock className="size-3.5" />Estimación (horas)</>}>
              <input
                type="number"
                min={0}
                value={tarea.estimacionHoras ?? ''}
                onChange={(e) => set('estimacionHoras', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="—"
                className="w-full text-sm rounded-lg px-3 py-2 border outline-none focus:ring-1 focus:ring-primary bg-background"
              />
            </PropGroup>

            <PropGroup label={<><Users className="size-3.5" />Asignados</>}>
              <div className="space-y-1">
                {data.trabajadores.map((w) => (
                  <label key={w.id} className="flex items-center gap-2 cursor-pointer py-1 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={tarea.asignados.includes(w.id)}
                      onChange={() => toggleAsignado(w.id)}
                      className="rounded"
                    />
                    <div
                      className="size-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                      style={{ backgroundColor: w.color }}
                    >
                      {inicialDeTrabajador(w)}
                    </div>
                    <span className="text-sm">{w.nombre}</span>
                  </label>
                ))}
              </div>
            </PropGroup>

            <PropGroup label={<><Tag className="size-3.5" />Etiquetas</>}>
              <div className="flex flex-wrap gap-1 mb-2">
                {tarea.etiquetas.map((e) => (
                  <button
                    key={e}
                    onClick={() => toggleEtiqueta(e)}
                    className="text-xs px-2 py-0.5 rounded bg-primary/15 text-primary hover:bg-red-100 hover:text-red-600 transition-colors"
                  >
                    {e} ×
                  </button>
                ))}
              </div>
              <button
                onClick={() => setMostrarEtiquetas((v) => !v)}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                + Agregar etiqueta
              </button>
              {mostrarEtiquetas && (
                <div className="mt-2 space-y-1">
                  <div className="flex flex-wrap gap-1">
                    {data.etiquetasGlobales
                      .filter((e) => !tarea.etiquetas.includes(e))
                      .map((e) => (
                        <button
                          key={e}
                          onClick={() => toggleEtiqueta(e)}
                          className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          {e}
                        </button>
                      ))}
                  </div>
                  <form onSubmit={agregarNuevaEtiqueta} className="flex gap-1 mt-1">
                    <input
                      value={nuevaEtiqueta}
                      onChange={(e) => setNuevaEtiqueta(e.target.value)}
                      placeholder="Nueva etiqueta..."
                      className="flex-1 text-xs rounded px-2 py-1 border bg-background outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button type="submit" className="text-xs text-primary font-medium px-2">
                      +
                    </button>
                  </form>
                </div>
              )}
            </PropGroup>
          </div>
        </div>
      </div>
    </div>
  );
}

function PropGroup({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
      {children}
    </div>
  );
}

