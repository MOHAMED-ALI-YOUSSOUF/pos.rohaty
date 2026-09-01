import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'

export function CategoryNavigation({ categories, selected, onSelect, variant }: { categories: Category[]; selected: string; onSelect: (id: string) => void; variant: 'desktop' | 'mobile' }) {
    const buttons = (mobile = false) => <>
        <button onClick={() => onSelect('all')} className={cn(mobile ? 'category-pill whitespace-nowrap' : 'w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', selected === 'all' ? 'bg-primary text-primary-foreground' : mobile ? 'bg-muted text-muted-foreground' : 'hover:bg-muted text-muted-foreground')}>Tous</button>
        {categories.map(category => <button key={category.id} onClick={() => onSelect(category.id)} className={cn(mobile ? 'category-pill whitespace-nowrap' : 'w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', selected === category.id ? 'bg-primary text-primary-foreground' : mobile ? 'bg-muted text-muted-foreground' : 'hover:bg-muted text-muted-foreground')}>{category.name}</button>)}
    </>
    if (variant === 'mobile') return <div className="sm:hidden border-b bg-background overflow-x-auto"><div className="flex gap-1 p-2 min-w-max">{buttons(true)}</div></div>
    return <aside className="hidden sm:flex w-36 md:w-44 border-r bg-background flex-col shrink-0"><div className="p-3 border-b"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Catégories</p></div><ScrollArea className="flex-1"><div className="p-2 space-y-1">{buttons()}</div></ScrollArea></aside>
}
