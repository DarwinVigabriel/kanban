export interface Subtask {
  id: string;
  texto: string;
  completada: boolean;
  asignadoId?: string;
  fechaFin?: string;
}

export interface Comment {
  id: string;
  autorId: string;
  texto: string;
  fecha: string;
  editado: boolean;
}

export type TaskState = 'pendiente' | 'en-progreso' | 'completado';
export type TaskPriority = 'baja' | 'media' | 'alta' | 'urgente';
export type TaskPlazo = 'diario' | 'semanal' | 'mensual';

export interface Task {
  id: string;
  titulo: string;
  descripcion: string;
  asignados: string[];
  estado: TaskState;
  plazo: TaskPlazo;
  prioridad: TaskPriority;
  fechaInicio: string;
  fechaFin: string;
  progreso: number;
  estimacionHoras?: number;
  etiquetas: string[];
  fechaCreacion: string;
  microtareas: Subtask[];
  comentarios: Comment[];
}

export interface Worker {
  id: string;
  nombre: string;
  email: string;
  cargo: string;
  color: string;
}

export interface KanbanData {
  tareas: Task[];
  trabajadores: Worker[];
  tareaActual: string | null;
  etiquetasGlobales: string[];
}

export interface FilterState {
  trabajadorId: string | null;
  plazo: TaskPlazo | null;
  semana: 'anterior' | 'esta' | 'proxima' | null;
  prioridad: TaskPriority | null;
  progreso: 'sin-iniciar' | 'en-curso' | 'completo' | null;
  soloAtrasadas: boolean;
  busqueda: string;
}

export interface KanbanColumn {
  id: TaskState;
  label: string;
  tareas: Task[];
}
