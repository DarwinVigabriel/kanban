import type { Task, Worker, FilterState } from '@/types';

export function generarId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function calcularProgreso(tarea: Task): number {
  if (tarea.microtareas.length === 0) return tarea.progreso;
  const completadas = tarea.microtareas.filter((m) => m.completada).length;
  return Math.round((completadas / tarea.microtareas.length) * 100);
}

export function formatearFecha(fecha: string): string {
  if (!fecha) return '—';
  const [y, m, d] = fecha.split('-');
  return `${d}/${m}/${y}`;
}

export function formatearFechaRelativa(fecha: string): string {
  const date = new Date(fecha);
  const ahora = new Date();
  const diffMs = ahora.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'ahora mismo';
  if (diffMin < 60) return `hace ${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `hace ${diffD}d`;
  return formatearFecha(fecha.split('T')[0]);
}

export function estaVencida(tarea: Task): boolean {
  if (tarea.estado === 'completado') return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fin = new Date(tarea.fechaFin);
  return fin < hoy;
}

export function diasRestantes(fechaFin: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fin = new Date(fechaFin);
  fin.setHours(0, 0, 0, 0);
  return Math.ceil((fin.getTime() - hoy.getTime()) / 86400000);
}

export function resolverTrabajador(id: string, trabajadores: Worker[]): Worker | undefined {
  return trabajadores.find((w) => w.id === id);
}

export function inicialDeTrabajador(worker: Worker): string {
  return worker.nombre.charAt(0).toUpperCase();
}

export function colorDePrioridad(prioridad: Task['prioridad']): string {
  switch (prioridad) {
    case 'urgente': return 'bg-red-500 text-white';
    case 'alta': return 'bg-orange-500 text-white';
    case 'media': return 'bg-yellow-400 text-black';
    case 'baja': return 'bg-slate-400 text-white';
  }
}

export function colorBordePrioridad(prioridad: Task['prioridad']): string {
  switch (prioridad) {
    case 'urgente': return 'border-l-red-500';
    case 'alta': return 'border-l-orange-500';
    case 'media': return 'border-l-yellow-400';
    case 'baja': return 'border-l-slate-400';
  }
}

export function labelPrioridad(prioridad: Task['prioridad']): string {
  switch (prioridad) {
    case 'urgente': return 'Urgente';
    case 'alta': return 'Alta';
    case 'media': return 'Media';
    case 'baja': return 'Baja';
  }
}

export function labelEstado(estado: Task['estado']): string {
  switch (estado) {
    case 'pendiente': return 'Pendiente';
    case 'en-progreso': return 'En Progreso';
    case 'completado': return 'Completado';
  }
}

export function labelPlazo(plazo: Task['plazo']): string {
  switch (plazo) {
    case 'diario': return 'Diario';
    case 'semanal': return 'Semanal';
    case 'mensual': return 'Mensual';
  }
}

function getSemana(offset: number): { inicio: Date; fin: Date } {
  const hoy = new Date();
  const diaSemana = hoy.getDay();
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1) + offset * 7);
  lunes.setHours(0, 0, 0, 0);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  domingo.setHours(23, 59, 59, 999);
  return { inicio: lunes, fin: domingo };
}

export function filtrarTareas(tareas: Task[], filtros: FilterState): Task[] {
  return tareas.filter((tarea) => {
    if (filtros.busqueda) {
      const q = filtros.busqueda.toLowerCase();
      const enTitulo = tarea.titulo.toLowerCase().includes(q);
      const enDesc = tarea.descripcion.toLowerCase().includes(q);
      const enEtiquetas = tarea.etiquetas.some((e) => e.toLowerCase().includes(q));
      if (!enTitulo && !enDesc && !enEtiquetas) return false;
    }

    if (filtros.trabajadorId && !tarea.asignados.includes(filtros.trabajadorId)) return false;

    if (filtros.plazo && tarea.plazo !== filtros.plazo) return false;

    if (filtros.prioridad && tarea.prioridad !== filtros.prioridad) return false;

    if (filtros.progreso) {
      const p = calcularProgreso(tarea);
      if (filtros.progreso === 'sin-iniciar' && p > 0) return false;
      if (filtros.progreso === 'en-curso' && (p === 0 || p === 100)) return false;
      if (filtros.progreso === 'completo' && p < 100) return false;
    }

    if (filtros.soloAtrasadas && !estaVencida(tarea)) return false;

    if (filtros.semana) {
      const offset = filtros.semana === 'anterior' ? -1 : filtros.semana === 'proxima' ? 1 : 0;
      const { inicio, fin } = getSemana(offset);
      const inicio_t = new Date(tarea.fechaInicio);
      const fin_t = new Date(tarea.fechaFin);
      if (fin_t < inicio || inicio_t > fin) return false;
    }

    return true;
  });
}

export function colorEstado(estado: Task['estado']): string {
  switch (estado) {
    case 'pendiente': return 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400';
    case 'en-progreso': return 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400';
    case 'completado': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400';
  }
}
