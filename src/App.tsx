import { useState } from 'react';
import { KanbanProvider, useKanban } from '@/context/KanbanContext';
import { Header } from '@/components/layout/Header';
import { NavTabs, type TabId } from '@/components/layout/NavTabs';
import { BoardView } from '@/components/kanban/BoardView';
import { ListaView } from '@/components/kanban/ListaView';
import { WorkersView } from '@/components/workers/WorkersView';
import { ReportsView } from '@/components/reports/ReportsView';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { WorkerModal } from '@/components/workers/WorkerModal';

function KanbanApp() {
  const { cargando } = useKanban();
  const [tab, setTab] = useState<TabId>('tablero');
  const [tareaAbiertaId, setTareaAbiertaId] = useState<string | null>(null);
  const [mostrarCrearTarea, setMostrarCrearTarea] = useState(false);
  const [mostrarCrearTrabajador, setMostrarCrearTrabajador] = useState(false);

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        onNuevaTarea={() => setMostrarCrearTarea(true)}
        onNuevoTrabajador={() => setMostrarCrearTrabajador(true)}
      />
      <NavTabs activo={tab} onChange={setTab} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {tab === 'tablero' && (
          <BoardView
            onAbrirTarea={setTareaAbiertaId}
            onNuevaTarea={() => setMostrarCrearTarea(true)}
          />
        )}
        {tab === 'lista' && (
          <ListaView onAbrirTarea={setTareaAbiertaId} />
        )}
        {tab === 'trabajadores' && (
          <WorkersView onAbrirTarea={setTareaAbiertaId} />
        )}
        {tab === 'informes' && <ReportsView />}
      </main>

      {tareaAbiertaId && (
        <TaskDetailModal
          tareaId={tareaAbiertaId}
          onClose={() => setTareaAbiertaId(null)}
        />
      )}

      {mostrarCrearTarea && (
        <CreateTaskModal onClose={() => setMostrarCrearTarea(false)} />
      )}

      {mostrarCrearTrabajador && (
        <WorkerModal onClose={() => setMostrarCrearTrabajador(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <KanbanProvider>
      <KanbanApp />
    </KanbanProvider>
  );
}
