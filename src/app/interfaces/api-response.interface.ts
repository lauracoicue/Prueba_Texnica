export interface ApiResponse<T> {
    length: number;
    size: number;
    page: number;
    firstPage: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
    items: T[];
}