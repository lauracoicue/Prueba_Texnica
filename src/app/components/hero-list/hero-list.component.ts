import { Component, OnInit , ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeroService } from '../../services/hero.service';
import { Hero } from '../../models/hero.model';
import { ApiResponse } from '../../interfaces/api-response.interface';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
    selector: 'app-hero-list',
    templateUrl: './hero-list.component.html',
    styleUrls: ['./hero-list.component.css'],
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, ScrollingModule],
    changeDetection: ChangeDetectionStrategy.OnPush // Optimiza rendimiento
})
export class HeroListComponent implements OnInit {
    
    heroes: Hero[] = []; // Lista actual de héroes
    currentPage = 1; // Página actual
    pageSize = 10; // Items por página
    totalPages = 0; // Total de páginas disponibles
    totalItems = 0; // Total de héroes en la API
    isLoading = true; // Estado de carga
    error: string | null = null; // Mensaje de error

    // Subject para manejar debounce en cambios de página
    private pageChangeSubject = new Subject<number>();

    constructor(
        private heroService: HeroService,
        private cdRef: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.loadHeroes(); 

        // Configura debounce para evitar múltiples llamadas rápidas
        this.pageChangeSubject.pipe(
            debounceTime(300), // Espera 300ms
            distinctUntilChanged() // Solo si cambió el valor
        ).subscribe((page: number) => {
            this.goToPage(page);
        });
    }

    /**
     * Pre-carga detalles de primeros héroes para navegación rápida
     */
    prefetchHeroDetails(): void {
        this.heroes.slice(0, 3).forEach(hero => {
            this.heroService.getHeroById(hero.id).subscribe(); // Cachea detalles
        });
    }

    /**
     * Carga la lista de héroes desde el servicio
     */
    loadHeroes(): void {
        this.isLoading = true;
        this.error = null;
        this.cdRef.markForCheck();
        
        this.heroService.getHeroes(this.currentPage, this.pageSize).subscribe({
            next: (response: ApiResponse<Hero>) => {
                this.heroes = response.items;
                this.totalItems = response.length;
                this.totalPages = response.lastPage;
                this.isLoading = false;
                this.prefetchHeroDetails(); // Pre-carga para mejor UX
                this.cdRef.markForCheck();
            },
            error: (error) => {
                this.error = 'Error al cargar los superhéroes.';
                this.isLoading = false;
                this.cdRef.markForCheck();
            }
        });
    }

    /**
     * Obtiene la URL de la imagen de un héroe
     * @param hero Objeto héroe
     * @returns URL de la imagen
     */
    getHeroImage(hero: Hero): string {
        return this.heroService.getHeroImage(hero);
    }

    /**
     * Dispara cambio de página
     */
    onPageChange(page: number): void {
        this.pageChangeSubject.next(page);
    }

    /**
     * Cambia a la página especificada
     * @param page Número de página
     */
    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
            this.currentPage = page;
            this.loadHeroes();
            window.scrollTo(0, 0); // Scroll al inicio
        }
    }

    /**
     * Cambia el tamaño de página
     * @param size Nuevo tamaño de página
     */
    changePageSize(size: number): void {
        this.pageSize = size;
        this.currentPage = 1; // Reset a página 1
        this.loadHeroes();
    }

    /**
     * Genera array de números de página para la paginación
     * @returns Array con números de página a mostrar
     */
    getPageNumbers(): number[] {
        const pages = [];
        const maxVisible = 5;
        
        let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(this.totalPages, start + maxVisible - 1);
        
        // Ajusta inicio si no hay suficientes páginas
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }
        
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        
        return pages;
    }

    /**
     * Función helper para template
     */
    getMin(a: number, b: number): number {
        return Math.min(a, b);
    }

    /**
     * Calcula altura dinámica para virtual scroll
     */
    getViewportHeight(): number {
        if (this.heroes.length <= 4) {
            return 350 * this.heroes.length;
        }
        return 350 * 4; // Máximo 4 filas visibles
    }

    /**
     * Optimización: trackBy para ngFor
     */
    trackByHeroId(index: number, hero: Hero): number {
        return hero.id;
    }

    ngOnDestroy(): void {
        this.pageChangeSubject.complete(); // Limpia subject
    }
}