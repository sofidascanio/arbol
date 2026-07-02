import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { SortState } from '@/types/sort';

interface SortContextValue {
    sortState: SortState;
    handleSortChange: (sort: SortState) => void;
}

const SortContext = createContext<SortContextValue | null>(null);

export const SortProvider = ({ children }: { children: ReactNode }) => {
    const [sortState, setSortState] = useState<SortState>({
        sortBy: 'createdAt',
        sortDir: 'desc',
    });

    const handleSortChange = useCallback((sort: SortState) => {
        setSortState(sort);
    }, []);

    return (
        <SortContext.Provider value={{ sortState, handleSortChange }}>
            {children}
        </SortContext.Provider>
    );
};

export const useSortContext = () => {
    const ctx = useContext(SortContext);
    if (!ctx) throw new Error('useSortContext debe usarse dentro de SortProvider');
    return ctx;
};