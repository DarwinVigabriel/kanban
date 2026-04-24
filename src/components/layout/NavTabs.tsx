import { LayoutGrid, List, Users, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TabId = 'tablero' | 'lista' | 'trabajadores' | 'informes';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

const TABS: Tab[] = [
  { id: 'tablero', label: 'Tablero', icon: LayoutGrid },
  { id: 'lista', label: 'Lista', icon: List },
  { id: 'trabajadores', label: 'Trabajadores', icon: Users },
  { id: 'informes', label: 'Informes', icon: BarChart3 },
];

interface NavTabsProps {
  activo: TabId;
  onChange: (tab: TabId) => void;
}

export function NavTabs({ activo, onChange }: NavTabsProps) {
  return (
    <nav className="border-b bg-background px-6">
      <div className="flex gap-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activo === id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
