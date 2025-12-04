import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HeroService } from '../../services/hero.service';
import { Hero } from '../../models/hero.model';
import { Subscription, switchMap, tap, catchError } from 'rxjs';

@Component({
  selector: 'app-hero-detail',
  templateUrl: './hero-detail.component.html',
  styleUrls: ['./hero-detail.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class HeroDetailComponent implements OnInit, OnDestroy {
  
  hero: Hero | null = null; // Héroe actual
  heroId: number | null = null; // ID del héroe actual
  isLoading = false; // Estado de carga
  isFromCache = false; // Indica si los datos vienen de cache
  error: string | null = null; // Mensaje de error
  
  
  //Arrays para organizar los datos
  powerStats: { name: string; value: number; color: string; text: string }[] = [];
  biographyItems: { label: string; value: string }[] = [];
  appearanceItems: { label: string; value: string }[] = [];
  workItems: { label: string; value: string }[] = [];
  connectionsItems: { label: string; value: string }[] = [];

  
  /**
   * Colección de suscripciones RxJS para manejo de desuscripción automática
   */
  private subscriptions = new Subscription();

  constructor(
    /**
     * Servicio para acceder a parámetros de la ruta activa
     */
    private route: ActivatedRoute,
    
    /**
     * Servicio para navegación programática entre rutas
     */
    private router: Router,
    
    /**
     * Servicio principal para operaciones con datos de héroes
     */
    private heroService: HeroService,
    
    /**
     * Referencia al sistema de detección de cambios de Angular
     */
    private cdRef: ChangeDetectorRef
  ) { }

  /**
   * Inicialización del componente
   * @method
   * @returns {void}
   */
  ngOnInit(): void {
    this.subscriptions.add(
      this.route.params.pipe(
        switchMap(params => {
          const id = Number(params['id']);
          
          if (!id || isNaN(id)) {
            this.handleError('ID de héroe inválido');
            return [];
          }
          
          this.heroId = id;
          return this.loadHeroData(id);
        })
      ).subscribe()
    );
  }

  /**
   * Carga datos del héroe con estrategia inteligente de dos niveles:
   * 1. Cache síncrono (inmediato)
   * 2. API con cache asíncrono (fallback)
   * @param {number} id - ID del héroe a cargar
   * @returns {Observable<Hero> | []} Observable con datos o array vacío si hay cache
   */
  private loadHeroData(id: number) {
    
    // -----------------------------------------------------------------------
    // Cache SÍNCRONO (feedback inmediato al usuario)
    // ----------------------------------------------------------------------
    const cachedHero = this.heroService.getHeroFromCache(id);
    if (cachedHero) {
      this.hero = cachedHero;
      this.isFromCache = true;
      this.isLoading = false;
      this.organizeHeroData(cachedHero); // Procesa y organiza los datos del héroe
      this.cdRef.detectChanges(); 
      return [];
    }
    
    this.isLoading = true;
    this.isFromCache = false;
    this.error = null;
    this.cdRef.detectChanges();
    
    return this.heroService.getHeroById(id).pipe(
      tap((hero) => {
        this.hero = hero;
        this.organizeHeroData(hero); // Procesa y organiza los datos del héroe
        this.isLoading = false;
        this.cdRef.detectChanges();
      }),
      catchError((error) => {
        this.handleError('Error al cargar los detalles. La API puede estar lenta.');
        this.cdRef.detectChanges();
        return [];
      })
    );
  }

  /**
   * Organiza los datos del héroe en arrays estructurados para facilitar su visualización
   * @param {Hero} hero - Objeto héroe con todos sus datos
   * @returns {void}
   */
  private organizeHeroData(hero: Hero): void {
    console.log('📊 Organizando datos del héroe:', hero);
    
    this.powerStats = [
      { name: 'Inteligencia', value: hero.powerstats.intelligence, color: this.getStatColor(hero.powerstats.intelligence), text: this.getStatText(hero.powerstats.intelligence) },
      { name: 'Fuerza', value: hero.powerstats.strength, color: this.getStatColor(hero.powerstats.strength), text: this.getStatText(hero.powerstats.strength) },
      { name: 'Velocidad', value: hero.powerstats.speed, color: this.getStatColor(hero.powerstats.speed), text: this.getStatText(hero.powerstats.speed) },
      { name: 'Durabilidad', value: hero.powerstats.durability, color: this.getStatColor(hero.powerstats.durability), text: this.getStatText(hero.powerstats.durability) },
      { name: 'Poder', value: hero.powerstats.power, color: this.getStatColor(hero.powerstats.power), text: this.getStatText(hero.powerstats.power) },
      { name: 'Combate', value: hero.powerstats.combat, color: this.getStatColor(hero.powerstats.combat), text: this.getStatText(hero.powerstats.combat) }
    ];

    this.biographyItems = [
      { label: 'Nombre Completo', value: hero.biography.fullName || 'No disponible' },
      { label: 'Lugar de Nacimiento', value: hero.biography.placeOfBirth || 'Desconocido' },
      { label: 'Primera Aparición', value: hero.biography.firstAppearance || 'No disponible' },
      { label: 'Editorial', value: hero.biography.publisher || 'No disponible' },
      { label: 'Alter Egos', value: hero.biography.alterEgos || 'No disponible' },
      { label: 'Alias', value: Array.isArray(hero.biography.aliases) ? hero.biography.aliases.join(', ') : hero.biography.aliases || 'No disponible' }
    ];

    this.appearanceItems = [
      { label: 'Género', value: hero.appearance.gender || 'Desconocido' },
      { label: 'Raza', value: hero.appearance.race || 'Desconocida' },
      { label: 'Altura', value: Array.isArray(hero.appearance.height) ? hero.appearance.height.join(' / ') : hero.appearance.height || 'Desconocida' },
      { label: 'Peso', value: Array.isArray(hero.appearance.weight) ? hero.appearance.weight.join(' / ') : hero.appearance.weight || 'Desconocido' },
      { label: 'Color de Ojos', value: hero.appearance.eyeColor || 'Desconocido' },
      { label: 'Color de Cabello', value: hero.appearance.hairColor || 'Desconocido' }
    ];

    this.workItems = [
      { label: 'Ocupación', value: hero.work.occupation || 'No disponible' },
      { label: 'Base de Operaciones', value: hero.work.base || 'No disponible' }
    ];

    this.connectionsItems = [
      { label: 'Afiliación de Grupo', value: hero.connections.groupAffiliation || 'No disponible' },
      { label: 'Familiares', value: hero.connections.relatives || 'No disponible' }
    ];

    console.log(' Datos organizados correctamente:');
    console.log('- Power Stats:', this.powerStats.length, 'items');
    console.log('- Biography:', this.biographyItems.length, 'items');
    console.log('- Appearance:', this.appearanceItems.length, 'items');
    console.log('- Work:', this.workItems.length, 'items');
    console.log('- Connections:', this.connectionsItems.length, 'items');
  }

  /**
   * Maneja errores estableciendo el mensaje y actualizando el estado
   * @param {string} message - Mensaje de error a mostrar
   * @returns {void}
   */
  private handleError(message: string): void {
    this.error = message;
    this.isLoading = false;
    this.cdRef.detectChanges();
  }

  /**
   * Obtiene la URL de la imagen del héroe actual
   * Retorna imagen de placeholder si no hay héroe cargado
   * @returns {string} URL de la imagen a mostrar
   */
  getHeroImage(): string {
    if (!this.hero) return 'assets/images/placeholder.jpg';
    return this.heroService.getHeroImage(this.hero);
  }

  /**
   * Determina la clase CSS para el color de una barra de estadística basándose en su valor numérico (0-100)
   * @param {number} value - Valor numérico de la estadística (0-100)
   * @returns {string} Nombre de la clase CSS para color
   */
  getStatColor(value: number): string {
    if (value >= 80) return 'stat-green';
    if (value >= 60) return 'stat-blue';
    if (value >= 40) return 'stat-yellow';
    if (value >= 20) return 'stat-orange';
    return 'stat-red';
  }

  /**
   * Genera texto descriptivo para una estadística basándose en su valor
   * @param {number} value - Valor numérico de la estadística (0-100)
   * @returns {string} Texto descriptivo del nivel de la estadística
   */
  getStatText(value: number): string {
    if (value >= 90) return 'Legendario';
    if (value >= 70) return 'Excelente';
    if (value >= 50) return 'Bueno';
    if (value >= 30) return 'Regular';
    if (value >= 10) return 'Bajo';
    return 'Muy Bajo';
  }

  /**
   * Navega de regreso a la lista de héroes preservando los parámetros de paginación almacenados
   * @returns {void}
   */
  goBack(): void {
    this.router.navigate(['/'], { 
      queryParams: { 
        page: this.getCurrentPageFromStorage(),
        size: this.getPageSizeFromStorage()
      }
    });
  }

  /**
   * Obtiene el número de página actual desde sessionStorage
   * @returns {number} Número de página (1 por defecto)
   */
  private getCurrentPageFromStorage(): number {
    return Number(sessionStorage.getItem('currentPage')) || 1;
  }

  /**
   * Obtiene el tamaño de página desde sessionStorage
   * @returns {number} Tamaño de página (10 por defecto)
   */
  private getPageSizeFromStorage(): number {
    return Number(sessionStorage.getItem('pageSize')) || 10;
  }

  /**
   * Limpieza del componente al destruirse
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}