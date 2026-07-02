export type SortBy = 'createdAt' | 'title';
export type SortDir = 'asc' | 'desc';

export interface SortState {
    sortBy: SortBy;
    sortDir: SortDir;
}