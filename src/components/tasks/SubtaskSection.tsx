import { useState, useRef, useEffect } from 'react';
import { Check, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useKanban } from '@/context/KanbanContext';
import type { Task } from '@/types';
import { calcularProgreso, formatearFechaRelativa } from '@/lib/kanban-utils';
import { cn } from '@/lib/utils';

interface SubtaskSectionProps {
  tarea: Task;
}

export function SubtaskSection({ tarea }: SubtaskSectionProps) {
  const { agregarSubtarea, toggleSubtarea, editarSubtarea, eliminarSubtarea } = useKanban();
  const [nuevoTexto, setNuevoTexto] = useState('');
  const [expandida, setExpandida] = useState(true);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editTexto, setEditTexto] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLInputElement>(null);

  const progreso = calcularProgreso(tarea);
  const completadas = tarea.microtareas.filter((m) => m.completada).length;

  useEffect(() => {
    if (editandoId && editRef.current) editRef.current.focus();
  }, [editandoId]);

  function agregarNueva(e: React.FormEvent) {
    e.preventDefault();
    const texto = nuevoTexto.trim();
    if (!texto) return;
    agregarSubtarea(tarea.id, texto);
    setNuevoTexto('');
    inputRef.current?.focus();
  }

  function iniciarEdicion(id: string, texto: string) {
    setEditandoId(id);
    setEditTexto(texto);
  }

  function guardarEdicion(id: string) {
    const texto = editTexto.trim();
    if (texto) editarSubtarea(tarea.id, id, { texto });
    setEditandoId(null);
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setExpandida((v) => !v)}
        className="flex items-center gap-2 w-full hover:text-foreground text-muted-foreground transition-colors"
      >
        {expandida ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        <span className="text-sm font-semibold text-foreground">Subtareas</span>
        <span className="text-xs text-muted-foreground">
          {completadas}/{tarea.microtareas.length}
        </span>
        <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden ml-2">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              progreso === 100 ? 'bg-emerald-500' : 'bg-primary'
            )}
            style={{ width: `${progreso}%` }}
          />
        </div>
        <span className="text-xs font-semibold tabular-nums">{progreso}%</span>
      </button>

      {expandida && (
        <div className="pl-2 space-y-1">
          {/* Lista con scroll máximo */}
          <div className="max-h-48 overflow-y-auto pr-1 space-y-0.5">
            {tarea.microtareas.map((m) => (
              <div
                key={m.id}
                className="group flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <button
                  onClick={() => toggleSubtarea(tarea.id, m.id)}
                  className={cn(
                    'size-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors mt-0.5',
                    m.completada
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-muted-foreground/40 hover:border-primary'
                  )}
                >
                  {m.completada && <Check className="size-2.5" />}
                </button>

                <div className="flex-1 min-w-0">
                  {editandoId === m.id ? (
                    <input
                      ref={editRef}
                      value={editTexto}
                      onChange={(e) => setEditTexto(e.target.value)}
                      onBlur={() => guardarEdicion(m.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') guardarEdicion(m.id);
                        if (e.key === 'Escape') setEditandoId(null);
                      }}
                      className="w-full text-sm bg-transparent border-b border-primary outline-none"
                    />
                  ) : (
                    <span
                      onClick={() => iniciarEdicion(m.id, m.texto)}
                      className={cn(
                        'block text-sm cursor-text leading-snug',
                        m.completada && 'line-through text-muted-foreground'
                      )}
                    >
                      {m.texto}
                    </span>
                  )}
                  {/* Fechas de seguimiento */}
                  <div className="flex gap-3 mt-0.5">
                    <span className="text-[10px] text-muted-foreground/60">
                      Creada {formatearFechaRelativa(m.fechaCreacion)}
                    </span>
                    {m.fechaModificacion !== m.fechaCreacion && (
                      <span className="text-[10px] text-muted-foreground/60">
                        · Modificada {formatearFechaRelativa(m.fechaModificacion)}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => eliminarSubtarea(tarea.id, m.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all size-5 flex items-center justify-center mt-0.5"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={agregarNueva} className="flex items-center gap-2 mt-2 pl-2">
            <Plus className="size-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={nuevoTexto}
              onChange={(e) => setNuevoTexto(e.target.value)}
              placeholder="Agregar subtarea..."
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/60 border-b border-transparent focus:border-primary transition-colors py-1"
            />
            {nuevoTexto && (
              <button
                type="submit"
                className="text-xs text-primary font-medium hover:underline"
              >
                Agregar
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
