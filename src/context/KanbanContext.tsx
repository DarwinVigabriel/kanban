import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { KanbanData, Task, Worker, Subtask, Comment, FilterState } from '@/types';
import { generarId, calcularProgreso } from '@/lib/kanban-utils';

const STORAGE_KEY = 'innovabrokers_kanban_v2';

const DEFAULT_FILTROS: FilterState = {
  trabajadorId: null,
  plazo: null,
  semana: null,
  prioridad: null,
  progreso: null,
  soloAtrasadas: false,
  busqueda: '',
};

function migrateData(raw: unknown): KanbanData {
  const data = raw as Partial<KanbanData>;
  const tareas = (data.tareas ?? []).map((t: Partial<Task>) => ({
    ...t,
    etiquetas: t.etiquetas ?? [],
    comentarios: t.comentarios ?? [],
    estimacionHoras: t.estimacionHoras,
    microtareas: (t.microtareas ?? []).map((m: Partial<Subtask>) => ({
      id: m.id ?? generarId(),
      texto: m.texto ?? '',
      completada: m.completada ?? false,
      asignadoId: m.asignadoId,
      fechaFin: m.fechaFin,
    })),
  })) as Task[];

  const trabajadores = (data.trabajadores ?? []).map((w: Partial<Worker>) => ({
    ...w,
    color: w.color ?? '#6366f1',
  })) as Worker[];

  return {
    tareas,
    trabajadores,
    tareaActual: data.tareaActual ?? null,
    etiquetasGlobales: data.etiquetasGlobales ?? [],
  };
}

async function cargarDatosIniciales(): Promise<KanbanData> {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return migrateData(JSON.parse(stored));
    } catch {
      // datos corruptos, recarga desde JSON
    }
  }
  const res = await fetch('/data/kanbanData.json');
  const json = await res.json() as unknown;
  return migrateData(json);
}

interface KanbanContextValue {
  data: KanbanData;
  filtros: FilterState;
  setFiltros: (f: FilterState) => void;
  tareaActualId: string | null;
  setTareaActualId: (id: string | null) => void;
  // Tareas
  crearTarea: (t: Omit<Task, 'id' | 'fechaCreacion' | 'comentarios'>) => void;
  actualizarTarea: (id: string, cambios: Partial<Task>) => void;
  eliminarTarea: (id: string) => void;
  moverTarea: (id: string, nuevoEstado: Task['estado']) => void;
  reordenarTareas: (tareas: Task[]) => void;
  // Subtareas
  agregarSubtarea: (tareaId: string, texto: string) => void;
  toggleSubtarea: (tareaId: string, subtareaId: string) => void;
  editarSubtarea: (tareaId: string, subtareaId: string, datos: Partial<Subtask>) => void;
  eliminarSubtarea: (tareaId: string, subtareaId: string) => void;
  // Comentarios
  agregarComentario: (tareaId: string, autorId: string, texto: string) => void;
  editarComentario: (tareaId: string, comentarioId: string, texto: string) => void;
  eliminarComentario: (tareaId: string, comentarioId: string) => void;
  // Trabajadores
  crearTrabajador: (w: Omit<Worker, 'id'>) => void;
  actualizarTrabajador: (id: string, cambios: Partial<Worker>) => void;
  eliminarTrabajador: (id: string) => void;
  // Etiquetas
  agregarEtiquetaGlobal: (etiqueta: string) => void;
  // Persistencia
  exportarDatos: () => void;
  importarDatos: (file: File) => Promise<void>;
  cargando: boolean;
}

const KanbanContext = createContext<KanbanContextValue | null>(null);

export function KanbanProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<KanbanData>({
    tareas: [],
    trabajadores: [],
    tareaActual: null,
    etiquetasGlobales: [],
  });
  const [filtros, setFiltros] = useState<FilterState>(DEFAULT_FILTROS);
  const [tareaActualId, setTareaActualId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatosIniciales().then((d) => {
      setData(d);
      setTareaActualId(d.tareaActual);
      setCargando(false);
    });
  }, []);

  const guardar = useCallback((nuevoData: KanbanData) => {
    setData(nuevoData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevoData));
  }, []);

  const actualizarTarea = useCallback(
    (id: string, cambios: Partial<Task>) => {
      guardar({
        ...data,
        tareas: data.tareas.map((t) => {
          if (t.id !== id) return t;
          const actualizada = { ...t, ...cambios };
          actualizada.progreso = calcularProgreso(actualizada);
          return actualizada;
        }),
      });
    },
    [data, guardar]
  );

  const crearTarea = useCallback(
    (t: Omit<Task, 'id' | 'fechaCreacion' | 'comentarios'>) => {
      const nueva: Task = {
        ...t,
        id: generarId(),
        fechaCreacion: new Date().toISOString(),
        comentarios: [],
        progreso: calcularProgreso({ ...t, id: '', fechaCreacion: '', comentarios: [] }),
      };
      guardar({ ...data, tareas: [nueva, ...data.tareas] });
    },
    [data, guardar]
  );

  const eliminarTarea = useCallback(
    (id: string) => {
      guardar({ ...data, tareas: data.tareas.filter((t) => t.id !== id) });
    },
    [data, guardar]
  );

  const moverTarea = useCallback(
    (id: string, nuevoEstado: Task['estado']) => {
      guardar({
        ...data,
        tareas: data.tareas.map((t) => {
          if (t.id !== id) return t;
          const actualizada = { ...t, estado: nuevoEstado };
          if (nuevoEstado === 'completado') {
            actualizada.microtareas = t.microtareas.map((m) => ({ ...m, completada: true }));
            actualizada.progreso = 100;
          }
          return actualizada;
        }),
      });
    },
    [data, guardar]
  );

  const reordenarTareas = useCallback(
    (tareas: Task[]) => {
      guardar({ ...data, tareas });
    },
    [data, guardar]
  );

  const agregarSubtarea = useCallback(
    (tareaId: string, texto: string) => {
      const nueva: Subtask = { id: generarId(), texto, completada: false };
      actualizarTarea(tareaId, {
        microtareas: [
          ...(data.tareas.find((t) => t.id === tareaId)?.microtareas ?? []),
          nueva,
        ],
      });
    },
    [data, actualizarTarea]
  );

  const toggleSubtarea = useCallback(
    (tareaId: string, subtareaId: string) => {
      const tarea = data.tareas.find((t) => t.id === tareaId);
      if (!tarea) return;
      actualizarTarea(tareaId, {
        microtareas: tarea.microtareas.map((m) =>
          m.id === subtareaId ? { ...m, completada: !m.completada } : m
        ),
      });
    },
    [data, actualizarTarea]
  );

  const editarSubtarea = useCallback(
    (tareaId: string, subtareaId: string, datos: Partial<Subtask>) => {
      const tarea = data.tareas.find((t) => t.id === tareaId);
      if (!tarea) return;
      actualizarTarea(tareaId, {
        microtareas: tarea.microtareas.map((m) =>
          m.id === subtareaId ? { ...m, ...datos } : m
        ),
      });
    },
    [data, actualizarTarea]
  );

  const eliminarSubtarea = useCallback(
    (tareaId: string, subtareaId: string) => {
      const tarea = data.tareas.find((t) => t.id === tareaId);
      if (!tarea) return;
      actualizarTarea(tareaId, {
        microtareas: tarea.microtareas.filter((m) => m.id !== subtareaId),
      });
    },
    [data, actualizarTarea]
  );

  const agregarComentario = useCallback(
    (tareaId: string, autorId: string, texto: string) => {
      const tarea = data.tareas.find((t) => t.id === tareaId);
      if (!tarea) return;
      const nuevo: Comment = {
        id: generarId(),
        autorId,
        texto,
        fecha: new Date().toISOString(),
        editado: false,
      };
      actualizarTarea(tareaId, { comentarios: [...tarea.comentarios, nuevo] });
    },
    [data, actualizarTarea]
  );

  const editarComentario = useCallback(
    (tareaId: string, comentarioId: string, texto: string) => {
      const tarea = data.tareas.find((t) => t.id === tareaId);
      if (!tarea) return;
      actualizarTarea(tareaId, {
        comentarios: tarea.comentarios.map((c) =>
          c.id === comentarioId ? { ...c, texto, editado: true } : c
        ),
      });
    },
    [data, actualizarTarea]
  );

  const eliminarComentario = useCallback(
    (tareaId: string, comentarioId: string) => {
      const tarea = data.tareas.find((t) => t.id === tareaId);
      if (!tarea) return;
      actualizarTarea(tareaId, {
        comentarios: tarea.comentarios.filter((c) => c.id !== comentarioId),
      });
    },
    [data, actualizarTarea]
  );

  const crearTrabajador = useCallback(
    (w: Omit<Worker, 'id'>) => {
      const nuevo: Worker = { ...w, id: generarId() };
      guardar({ ...data, trabajadores: [...data.trabajadores, nuevo] });
    },
    [data, guardar]
  );

  const actualizarTrabajador = useCallback(
    (id: string, cambios: Partial<Worker>) => {
      guardar({
        ...data,
        trabajadores: data.trabajadores.map((w) =>
          w.id === id ? { ...w, ...cambios } : w
        ),
      });
    },
    [data, guardar]
  );

  const eliminarTrabajador = useCallback(
    (id: string) => {
      guardar({
        ...data,
        trabajadores: data.trabajadores.filter((w) => w.id !== id),
        tareas: data.tareas.map((t) => ({
          ...t,
          asignados: t.asignados.filter((a) => a !== id),
        })),
      });
    },
    [data, guardar]
  );

  const agregarEtiquetaGlobal = useCallback(
    (etiqueta: string) => {
      if (data.etiquetasGlobales.includes(etiqueta)) return;
      guardar({ ...data, etiquetasGlobales: [...data.etiquetasGlobales, etiqueta] });
    },
    [data, guardar]
  );

  const exportarDatos = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kanban-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const importarDatos = useCallback(async (file: File) => {
    const text = await file.text();
    const parsed = JSON.parse(text) as unknown;
    guardar(migrateData(parsed));
  }, [guardar]);

  return (
    <KanbanContext.Provider
      value={{
        data,
        filtros,
        setFiltros,
        tareaActualId,
        setTareaActualId,
        crearTarea,
        actualizarTarea,
        eliminarTarea,
        moverTarea,
        reordenarTareas,
        agregarSubtarea,
        toggleSubtarea,
        editarSubtarea,
        eliminarSubtarea,
        agregarComentario,
        editarComentario,
        eliminarComentario,
        crearTrabajador,
        actualizarTrabajador,
        eliminarTrabajador,
        agregarEtiquetaGlobal,
        exportarDatos,
        importarDatos,
        cargando,
      }}
    >
      {children}
    </KanbanContext.Provider>
  );
}

export function useKanban(): KanbanContextValue {
  const ctx = useContext(KanbanContext);
  if (!ctx) throw new Error('useKanban debe usarse dentro de KanbanProvider');
  return ctx;
}

export { DEFAULT_FILTROS };
