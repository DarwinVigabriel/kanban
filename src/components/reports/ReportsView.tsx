import { AlertTriangle, CheckCircle2, Clock, TrendingUp, Users, Calendar } from 'lucide-react';
import { useKanban } from '@/context/KanbanContext';
import {
  calcularProgreso,
  diasRestantes,
  estaVencida,
  formatearFecha,
  inicialDeTrabajador,
  labelEstado,
  labelPrioridad,
  resolverTrabajador,
} from '@/lib/kanban-utils';
import { cn } from '@/lib/utils';

export function ReportsView() {
  const { data } = useKanban();
  const { tareas, trabajadores } = data;

  // General stats
  const total = tareas.length;
  const pendientes = tareas.filter((t) => t.estado === 'pendiente').length;
  const enProgreso = tareas.filter((t) => t.estado === 'en-progreso').length;
  const completadas = tareas.filter((t) => t.estado === 'completado').length;
  const atrasadas = tareas.filter(estaVencida);
  const porcentajeComplecion = total > 0 ? Math.round((completadas / total) * 100) : 0;
  const progresoPromedio =
    total > 0
      ? Math.round(tareas.reduce((sum, t) => sum + calcularProgreso(t), 0) / total)
      : 0;

  // By priority
  const porPrioridad = (['urgente', 'alta', 'media', 'baja'] as const).map((p) => ({
    prioridad: p,
    count: tareas.filter((t) => t.prioridad === p).length,
  }));

  // By plazo
  const porPlazo = (['diario', 'semanal', 'mensual'] as const).map((pl) => ({
    plazo: pl,
    count: tareas.filter((t) => t.plazo === pl).length,
  }));

  return (
    <div className="flex-1 overflow-auto p-6 space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-1">Informes</h2>
        <p className="text-sm text-muted-foreground">Resumen general del estado del proyecto</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<TrendingUp className="size-5 text-primary" />}
          label="Total tareas"
          value={total}
          sub={`${progresoPromedio}% avance prom.`}
          color="bg-primary/10"
        />
        <StatCard
          icon={<Clock className="size-5 text-blue-500" />}
          label="En Progreso"
          value={enProgreso}
          sub={`${pendientes} pendientes`}
          color="bg-blue-50 dark:bg-blue-950/30"
        />
        <StatCard
          icon={<CheckCircle2 className="size-5 text-emerald-500" />}
          label="Completadas"
          value={completadas}
          sub={`${porcentajeComplecion}% completado`}
          color="bg-emerald-50 dark:bg-emerald-950/30"
        />
        <StatCard
          icon={<AlertTriangle className="size-5 text-red-500" />}
          label="Atrasadas"
          value={atrasadas.length}
          sub={atrasadas.length > 0 ? 'Requieren atención' : 'Todo al día'}
          color={atrasadas.length > 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-muted/40'}
        />
      </div>

      {/* Completion bar */}
      <div className="bg-card border rounded-2xl p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="size-4 text-muted-foreground" />
          Progreso general del proyecto
        </h3>
        <div className="space-y-3">
          {(
            [
              { label: labelEstado('completado'), count: completadas, color: 'bg-emerald-500' },
              { label: labelEstado('en-progreso'), count: enProgreso, color: 'bg-blue-500' },
              { label: labelEstado('pendiente'), count: pendientes, color: 'bg-slate-300 dark:bg-slate-600' },
            ] as const
          ).map(({ label, count, color }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
              <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', color)}
                  style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-xs font-semibold tabular-nums w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* By priority */}
        <div className="bg-card border rounded-2xl p-5">
          <h3 className="text-sm font-semibold mb-4">Por prioridad</h3>
          <div className="space-y-2.5">
            {porPrioridad.map(({ prioridad, count }) => (
              <div key={prioridad} className="flex items-center justify-between">
                <span className="text-sm">{labelPrioridad(prioridad)}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        prioridad === 'urgente' ? 'bg-red-500' :
                        prioridad === 'alta' ? 'bg-orange-500' :
                        prioridad === 'media' ? 'bg-yellow-400' : 'bg-slate-400'
                      )}
                      style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-xs font-semibold w-4 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By plazo */}
        <div className="bg-card border rounded-2xl p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            Por tipo de plazo
          </h3>
          <div className="space-y-2.5">
            {porPlazo.map(({ plazo, count }) => (
              <div key={plazo} className="flex items-center justify-between">
                <span className="text-sm capitalize">{plazo}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-xs font-semibold w-4 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per worker */}
      <div className="bg-card border rounded-2xl p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          Rendimiento por trabajador
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left font-medium text-muted-foreground pb-3">Trabajador</th>
                <th className="text-center font-medium text-muted-foreground pb-3">Total</th>
                <th className="text-center font-medium text-muted-foreground pb-3">Progreso</th>
                <th className="text-center font-medium text-muted-foreground pb-3 hidden md:table-cell">Pendientes</th>
                <th className="text-center font-medium text-muted-foreground pb-3 hidden md:table-cell">En Progreso</th>
                <th className="text-center font-medium text-muted-foreground pb-3">Completadas</th>
                <th className="text-center font-medium text-muted-foreground pb-3">Atrasadas</th>
              </tr>
            </thead>
            <tbody>
              {trabajadores.map((w) => {
                const mis = tareas.filter((t) => t.asignados.includes(w.id));
                const misComp = mis.filter((t) => t.estado === 'completado').length;
                const misProgreso = mis.length > 0
                  ? Math.round(mis.reduce((s, t) => s + calcularProgreso(t), 0) / mis.length)
                  : 0;
                const misAtrasadas = mis.filter(estaVencida).length;
                return (
                  <tr key={w.id} className="border-b last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="size-7 rounded-full text-xs font-bold text-white flex items-center justify-center"
                          style={{ backgroundColor: w.color }}
                        >
                          {inicialDeTrabajador(w)}
                        </div>
                        <div>
                          <p className="font-medium">{w.nombre}</p>
                          <p className="text-xs text-muted-foreground">{w.cargo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-3 font-semibold">{mis.length}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={cn('h-full rounded-full', misProgreso === 100 ? 'bg-emerald-500' : 'bg-primary')} style={{ width: `${misProgreso}%` }} />
                        </div>
                        <span className="text-xs tabular-nums">{misProgreso}%</span>
                      </div>
                    </td>
                    <td className="text-center py-3 text-muted-foreground hidden md:table-cell">
                      {mis.filter((t) => t.estado === 'pendiente').length}
                    </td>
                    <td className="text-center py-3 text-blue-500 font-medium hidden md:table-cell">
                      {mis.filter((t) => t.estado === 'en-progreso').length}
                    </td>
                    <td className="text-center py-3 text-emerald-500 font-medium">{misComp}</td>
                    <td className="text-center py-3">
                      {misAtrasadas > 0 ? (
                        <span className="text-red-500 font-semibold">{misAtrasadas}</span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Overdue tasks */}
      {atrasadas.length > 0 && (
        <div className="bg-card border border-red-200 dark:border-red-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-red-500">
            <AlertTriangle className="size-4" />
            Tareas vencidas ({atrasadas.length})
          </h3>
          <div className="space-y-2">
            {atrasadas.map((t) => {
              const dias = Math.abs(diasRestantes(t.fechaFin));
              const p = calcularProgreso(t);
              return (
                <div key={t.id} className="flex items-center gap-4 py-2.5 px-3 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{t.titulo}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">Venció: {formatearFecha(t.fechaFin)}</span>
                      <span className="text-xs text-red-500 font-medium">hace {dias}d</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex -space-x-1">
                      {t.asignados.slice(0, 2).map((id) => {
                        const w = resolverTrabajador(id, trabajadores);
                        if (!w) return null;
                        return (
                          <div key={id} className="size-6 rounded-full text-[10px] font-bold text-white flex items-center justify-center ring-1 ring-card" style={{ backgroundColor: w.color }}>
                            {inicialDeTrabajador(w)}
                          </div>
                        );
                      })}
                    </div>
                    <span className="text-xs font-semibold text-red-500">{p}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
  color: string;
}) {
  return (
    <div className={cn('rounded-2xl p-5 border', color)}>
      <div className="flex items-center justify-between mb-3">
        {icon}
      </div>
      <div className="text-3xl font-bold tabular-nums">{value}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}
