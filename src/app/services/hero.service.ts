import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap, shareReplay } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';
import { Hero } from '../models/hero.model';

@Injectable({
    providedIn: 'root'
})
export class HeroService {
    private apiUrl = 'https://ea1w717ym2.execute-api.us-east-1.amazonaws.com/api';
    
    // Caches para datos y observables en carga
    private heroCache = new Map<number, Hero>();
    private heroesCache = new Map<string, ApiResponse<Hero>>();
    private heroLoadingCache = new Map<number, Observable<Hero>>();
    private heroesLoadingCache = new Map<string, Observable<ApiResponse<Hero>>>();

    constructor(private http: HttpClient) { }

    /**
     * Obtiene lista paginada de héroes con cache
     * @param page Página solicitada
     * @param size Items por página
     */
    getHeroes(page: number = 1, size: number = 10): Observable<ApiResponse<Hero>> {
        const cacheKey = `page-${page}-size-${size}`;
        
        // 1. Retorna desde cache si existe
        if (this.heroesCache.has(cacheKey)) {
            return of({ ...this.heroesCache.get(cacheKey)! });
        }
        
        // 2. Reusa observable si ya está cargando
        if (this.heroesLoadingCache.has(cacheKey)) {
            return this.heroesLoadingCache.get(cacheKey)!;
        }
        
        // 3. Nueva petición HTTP
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        const request$ = this.http.get<ApiResponse<Hero>>(`${this.apiUrl}/heroes`, { params })
            .pipe(
                tap(response => {
                    this.heroesCache.set(cacheKey, response);
                    this.prefetchFirstHeroes(response.items.slice(0, 3));
                    this.heroesLoadingCache.delete(cacheKey);
                }),
                catchError(error => {
                    this.heroesLoadingCache.delete(cacheKey);
                    throw error;
                }),
                shareReplay(1) // Comparte el observable entre múltiples suscriptores
            );
        
        this.heroesLoadingCache.set(cacheKey, request$);
        return request$;
    }

    /**
     * Obtiene detalles de héroe por ID con cache optimizado
     * @param id ID del héroe
     */
    getHeroById(id: number): Observable<Hero> {
        // 1. Cache inmediato
        if (this.heroCache.has(id)) {
            return of({ ...this.heroCache.get(id)! });
        }
        
        // 2. Reusa observable en carga
        if (this.heroLoadingCache.has(id)) {
            return this.heroLoadingCache.get(id)!;
        }
        
        // 3. Nueva petición HTTP
        const params = new HttpParams().set('id', id.toString());
        
        const request$ = this.http.get<Hero>(`${this.apiUrl}/hero`, { params })
            .pipe(
                tap(hero => {
                    this.heroCache.set(id, hero);
                    this.heroLoadingCache.delete(id);
                }),
                catchError(error => {
                    this.heroLoadingCache.delete(id);
                    throw error;
                }),
                shareReplay(1)
            );
        
        this.heroLoadingCache.set(id, request$);
        return request$;
    }

    /**
     * Pre-carga detalles de primeros héroes para navegación rápida
     */
    private prefetchFirstHeroes(heroes: Hero[]): void {
        heroes.forEach(hero => {
            if (!this.heroCache.has(hero.id)) {
                this.getHeroById(hero.id).subscribe();
            }
        });
    }

    /**
     * Obtiene URL de imagen con fallbacks
     */
    getHeroImage(hero: Hero | null): string {
        if (!hero) return 'assets/images/placeholder.jpg';
        return hero.images?.md || hero.images?.lg || hero.images?.sm || 'assets/images/placeholder.jpg';
    }

    /**
     * Obtiene héroe desde cache síncrono
     */
    getHeroFromCache(id: number): Hero | null {
        return this.heroCache.get(id) || null;
    }

    /**
     * Limpia todos los caches
     */
    clearCache(): void {
        this.heroCache.clear();
        this.heroesCache.clear();
        this.heroLoadingCache.clear();
        this.heroesLoadingCache.clear();
    }
}