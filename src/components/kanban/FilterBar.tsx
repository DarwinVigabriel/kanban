import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useKanban, DEFAULT_FILTROS } from '@/context/KanbanContext';
import type { FilterState } from '@/types';
import { cn } from '@/lib/utils';

export function FilterBar() {
  const { data, filtros, setFiltros } = useKanban();
  const hayFiltros =
    filtros.busqueda ||
    filtros.trabajadorId ||
    filtros.plazo ||
    filtros.semana ||
    filtros.prioridad ||
    filtros.progreso ||
    filtros.soloAtrasadas;

  function set(parcial: Partial<FilterState>) {
    setFiltros({ ...filtros, ...parcial });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-6 py-3 border-b bg-background/80">
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar tareas..."
          value={filtros.busqueda}
          onChange={(e) => set({ busqueda: e.target.value })}
          className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <select
        value={filtros.trabajadorId ?? ''}
        onChange={(e) => set({ trabajadorId: e.target.value || null })}
        className={cn(
          'text-sm rounded-md border bg-background px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary',
          filtros.trabajadorId && 'border-primary text-primary'
        )}
      >
        <option value="">Todos</option>
        {data.trabajadores.map((w) => (
          <option key={w.id} value={w.id}>{w.nombre}</option>
        ))}
      </select>

      <select
        value={filtros.prioridad ?? ''}
        onChange={(e) => set({ prioridad: (e.target.value as FilterState['prioridad']) || null })}
        className={cn(
          'text-sm rounded-md border bg-background px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary',
          filtros.prioridad && 'border-primary text-primary'
        )}
      >
        <option value="">Prioridad</option>
        <option value="urgente">Urgente</option>
        <option value="alta">Alta</option>
        <option value="media">Media</option>
        <option value="baja">Baja</option>
      </select>

      <select
        value={filtros.plazo ?? ''}
        onChange={(e) => set({ plazo: (e.target.value as FilterState['plazo']) || null })}
        className={cn(
          'text-sm rounded-md border bg-background px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary',
          filtros.plazo && 'border-primary text-primary'
        )}
      >
        <option value="">Plazo</option>
        <option value="diario">Diario</option>
        <option value="semanal">Semanal</option>
        <option value="mensual">Mensual</option>
      </select>

      <select
        value={filtros.semana ?? ''}
        onChange={(e) => set({ semana: (e.target.value as FilterState['semana']) || null })}
        className={cn(
          'text-sm rounded-md border bg-background px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary',
          filtros.semana && 'border-primary text-primary'
        )}
      >
        <option value="">Semana</option>
        <option value="anterior">Anterior</option>
        <option value="esta">Esta semana</option>
        <option value="proxima">Próxima</option>
      </select>

      <select
        value={filtros.progreso ?? ''}
        onChange={(e) => set({ progreso: (e.target.value as FilterState['progreso']) || null })}
        className={cn(
          'text-sm rounded-md border bg-background px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary',
          filtros.progreso && 'border-primary text-primary'
        )}
      >
        <option value="">Progreso</option>
        <option value="sin-iniciar">Sin iniciar</option>
        <option value="en-curso">En curso</option>
        <option value="completo">Completo</option>
      </select>

      <label className="flex items-center gap-1.5 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={filtros.soloAtrasadas}
          onChange={(e) => set({ soloAtrasadas: e.target.checked })}
          className="rounded"
        />
        <span className={filtros.soloAtrasadas ? 'text-red-500 font-medium' : 'text-muted-foreground'}>
          Solo atrasadas
        </span>
      </label>

      {hayFiltros && (
        <Button variant="ghost" size="sm" onClick={() => setFiltros(DEFAULT_FILTROS)}>
          <X className="size-3.5" />
          Limpiar
        </Button>
      )}
    </div>
  );
}
