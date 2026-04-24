import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Pencil, Trash2, Send, ChevronDown } from 'lucide-react';
import { useKanban } from '@/context/KanbanContext';
import type { Task } from '@/types';
import {
  formatearFechaRelativa,
  inicialDeTrabajador,
  resolverTrabajador,
} from '@/lib/kanban-utils';
import { cn } from '@/lib/utils';

interface CommentSectionProps {
  tarea: Task;
  autorId: string;
}

export function CommentSection({ tarea, autorId }: CommentSectionProps) {
  const { data, agregarComentario, editarComentario, eliminarComentario } = useKanban();
  const [texto, setTexto] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editTexto, setEditTexto] = useState('');
  const [autorSeleccionado, setAutorSeleccionado] = useState(autorId || data.trabajadores[0]?.id || '');
  const [mostrarSelectorAutor, setMostrarSelectorAutor] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
        setMostrarSelectorAutor(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function enviarComentario(e: React.FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t || !autorSeleccionado) return;
    agregarComentario(tarea.id, autorSeleccionado, t);
    setTexto('');
  }

  function iniciarEdicion(id: string, textoActual: string) {
    setEditandoId(id);
    setEditTexto(textoActual);
  }

  function guardarEdicion(id: string) {
    const t = editTexto.trim();
    if (t) editarComentario(tarea.id, id, t);
    setEditandoId(null);
  }

  const autorActual = resolverTrabajador(autorSeleccionado, data.trabajadores);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <MessageSquare className="size-4" />
        <span className="text-sm font-semibold text-foreground">
          Comentarios
        </span>
        <span className="text-xs">({tarea.comentarios.length})</span>
      </div>

      <div className="space-y-4 pl-2">
        {tarea.comentarios.map((c) => {
          const autor = resolverTrabajador(c.autorId, data.trabajadores);
          const esMio = c.autorId === autorSeleccionado;
          return (
            <div key={c.id} className="flex gap-3 group">
              <div
                className="size-7 rounded-full text-xs font-bold text-white flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: autor?.color ?? '#6366f1' }}
              >
                {autor ? inicialDeTrabajador(autor) : '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold">{autor?.nombre ?? 'Desconocido'}</span>
                  <span className="text-xs text-muted-foreground">{formatearFechaRelativa(c.fecha)}</span>
                  {c.editado && <span className="text-xs text-muted-foreground">(editado)</span>}
                </div>

                {editandoId === c.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editTexto}
                      onChange={(e) => setEditTexto(e.target.value)}
                      rows={2}
                      className="w-full text-sm bg-muted/50 rounded-lg px-3 py-2 outline-none border border-primary resize-none"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => guardarEdicion(c.id)}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditandoId(null)}
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className={cn(
                    'text-sm bg-muted/40 rounded-lg px-3 py-2',
                    esMio && 'bg-primary/5'
                  )}>
                    {c.texto}
                  </p>
                )}
              </div>

              {esMio && editandoId !== c.id && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                  <button
                    onClick={() => iniciarEdicion(c.id, c.texto)}
                    className="size-6 flex items-center justify-center text-muted-foreground hover:text-foreground rounded"
                  >
                    <Pencil className="size-3" />
                  </button>
                  <button
                    onClick={() => eliminarComentario(tarea.id, c.id)}
                    className="size-6 flex items-center justify-center text-muted-foreground hover:text-red-500 rounded"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={enviarComentario} className="space-y-2">
        {/* Selector de autor */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Escribiendo como:</span>
          <div className="relative" ref={selectorRef}>
            <button
              type="button"
              onClick={() => setMostrarSelectorAutor((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium rounded-lg px-2 py-1 hover:bg-muted/60 transition-colors border border-transparent hover:border-border"
            >
              {autorActual && (
                <div
                  className="size-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                  style={{ backgroundColor: autorActual.color }}
                >
                  {inicialDeTrabajador(autorActual)}
                </div>
              )}
              <span>{autorActual?.nombre ?? 'Seleccionar'}</span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </button>

            {mostrarSelectorAutor && (
              <div className="absolute top-full left-0 mt-1 z-10 bg-popover border rounded-xl shadow-lg py-1 min-w-35">
                {data.trabajadores.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => { setAutorSeleccionado(w.id); setMostrarSelectorAutor(false); }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/60 transition-colors',
                      autorSeleccionado === w.id && 'bg-primary/10 font-medium'
                    )}
                  >
                    <div
                      className="size-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center shrink-0"
                      style={{ backgroundColor: w.color }}
                    >
                      {inicialDeTrabajador(w)}
                    </div>
                    <span className="truncate">{w.nombre}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Input de comentario */}
        <div className="flex gap-3 items-end">
          {autorActual && (
            <div
              className="size-7 rounded-full text-xs font-bold text-white flex items-center justify-center shrink-0"
              style={{ backgroundColor: autorActual.color }}
            >
              {inicialDeTrabajador(autorActual)}
            </div>
          )}
          <div className="flex-1 flex items-end gap-2 bg-muted/40 rounded-xl px-3 py-2 border border-transparent focus-within:border-primary transition-colors">
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escribe un comentario..."
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (texto.trim()) enviarComentario(e as unknown as React.FormEvent);
                }
              }}
              className="flex-1 text-sm bg-transparent outline-none resize-none placeholder:text-muted-foreground/60"
            />
            <button
              type="submit"
              disabled={!texto.trim() || !autorSeleccionado}
              className="text-primary disabled:text-muted-foreground/40 transition-colors"
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
