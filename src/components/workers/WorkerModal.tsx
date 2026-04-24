import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useKanban } from '@/context/KanbanContext';
import type { Worker } from '@/types';

const COLORES = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
];

interface WorkerModalProps {
  worker?: Worker;
  onClose: () => void;
}

export function WorkerModal({ worker, onClose }: WorkerModalProps) {
  const { crearTrabajador, actualizarTrabajador } = useKanban();
  const [nombre, setNombre] = useState(worker?.nombre ?? '');
  const [email, setEmail] = useState(worker?.email ?? '');
  const [cargo, setCargo] = useState(worker?.cargo ?? '');
  const [color, setColor] = useState(worker?.color ?? COLORES[0]);

  const esEdicion = !!worker;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    if (esEdicion && worker) {
      actualizarTrabajador(worker.id, { nombre: nombre.trim(), email: email.trim(), cargo: cargo.trim(), color });
    } else {
      crearTrabajador({ nombre: nombre.trim(), email: email.trim(), cargo: cargo.trim(), color });
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-background rounded-2xl shadow-2xl border">
        <div className="flex items-center justify-between p-6 pb-4 border-b">
          <h2 className="text-lg font-semibold">{esEdicion ? 'Editar trabajador' : 'Nuevo trabajador'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <div
              className="size-14 rounded-full flex items-center justify-center text-xl font-bold text-white ring-4 ring-background shadow-lg"
              style={{ backgroundColor: color }}
            >
              {nombre.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {COLORES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="size-6 rounded-full transition-all"
                  style={{
                    backgroundColor: c,
                    outline: color === c ? `3px solid ${c}` : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              autoFocus
              placeholder="Nombre completo"
              className="w-full text-sm rounded-lg px-3 py-2 border bg-background outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@empresa.com"
              className="w-full text-sm rounded-lg px-3 py-2 border bg-background outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Cargo</label>
            <input
              type="text"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Ej: Frontend Dev, DevOps..."
              className="w-full text-sm rounded-lg px-3 py-2 border bg-background outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={!nombre.trim()}>
              {esEdicion ? 'Guardar cambios' : 'Crear trabajador'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
