import { Download, Upload, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useKanban } from '@/context/KanbanContext';
import { useRef } from 'react';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';

interface HeaderProps {
  onNuevaTarea: () => void;
  onNuevoTrabajador: () => void;
}

export function Header({ onNuevaTarea, onNuevoTrabajador }: HeaderProps) {
  const { exportarDatos, importarDatos } = useKanban();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      importarDatos(file).catch(console.error);
      e.target.value = '';
    }
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 py-3 gap-4">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="size-5 text-primary-foreground fill-current">
              <rect x="3" y="3" width="7" height="18" rx="1" />
              <rect x="14" y="3" width="7" height="11" rx="1" />
              <rect x="14" y="17" width="7" height="4" rx="1" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-semibold leading-none">Medicuan</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Panel de gestión de tareas</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AnimatedThemeToggler
            variant="circle"
            duration={1000}
            className="size-9 rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-colors [&>svg]:size-4"
          />
          <Button variant="outline" size="sm" onClick={onNuevoTrabajador}>
            <Users className="size-4" />
            <span className="hidden sm:inline">Trabajador</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            <Upload className="size-4" />
            <span className="hidden sm:inline">Importar</span>
          </Button>
          <Button variant="outline" size="sm" onClick={exportarDatos}>
            <Download className="size-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
          <Button size="sm" onClick={onNuevaTarea}>
            <Plus className="size-4" />
            Nueva tarea
          </Button>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImport}
      />
    </header>
  );
}
