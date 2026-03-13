import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Servicio de almacenamiento local con soporte para SSR.
 * Valida que se ejecute únicamente en el navegador antes de acceder a localStorage.
 */
@Injectable({
    providedIn: 'root'
})
export class StorageService {
    private readonly platformId = inject(PLATFORM_ID);

    /**
     * Verifica si estamos ejecutando en el navegador
     */
    get isBrowser(): boolean {
        return isPlatformBrowser(this.platformId);
    }

    /**
     * Obtiene un valor del localStorage
     * @param key - Clave del item a obtener
     * @returns El valor parseado o null si no existe
     */
    get<T>(key: string): T | null {
        if (!this.isBrowser) {
            return null;
        }

        try {
            const item = localStorage.getItem(key);
            if (item === null) {
                return null;
            }
            return JSON.parse(item) as T;
        } catch (error) {
            console.error(`Error al leer localStorage key "${key}":`, error);
            return null;
        }
    }

    /**
     * Guarda un valor en localStorage
     * @param key - Clave del item
     * @param value - Valor a guardar (se serializa a JSON)
     * @returns true si se guardó correctamente, false si no
     */
    set<T>(key: string, value: T): boolean {
        if (!this.isBrowser) {
            return false;
        }

        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            console.error(`Error al guardar en localStorage key "${key}":`, error);
            return false;
        }
    }

    /**
     * Elimina un item del localStorage
     * @param key - Clave del item a eliminar
     * @returns true si se eliminó correctamente
     */
    remove(key: string): boolean {
        if (!this.isBrowser) {
            return false;
        }

        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error al eliminar localStorage key "${key}":`, error);
            return false;
        }
    }

    /**
     * Limpia todo el localStorage
     * @returns true si se limpió correctamente
     */
    clear(): boolean {
        if (!this.isBrowser) {
            return false;
        }

        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error al limpiar localStorage:', error);
            return false;
        }
    }

    /**
     * Verifica si existe una clave en localStorage
     * @param key - Clave a verificar
     * @returns true si existe
     */
    has(key: string): boolean {
        if (!this.isBrowser) {
            return false;
        }

        return localStorage.getItem(key) !== null;
    }

    /**
     * Obtiene todas las claves almacenadas
     * @returns Array de claves
     */
    keys(): string[] {
        if (!this.isBrowser) {
            return [];
        }

        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                keys.push(key);
            }
        }
        return keys;
    }

    /**
     * Obtiene el tamaño aproximado del localStorage en bytes
     * @returns Tamaño en bytes
     */
    getSize(): number {
        if (!this.isBrowser) {
            return 0;
        }

        let size = 0;
        for (const key of this.keys()) {
            const item = localStorage.getItem(key);
            if (item) {
                size += key.length + item.length;
            }
        }
        return size * 2; // UTF-16 = 2 bytes por carácter
    }

    /**
     * Actualiza parcialmente un objeto en localStorage
     * @param key - Clave del item
     * @param partial - Objeto parcial con las propiedades a actualizar
     * @returns true si se actualizó correctamente
     */
    update<T extends object>(key: string, partial: Partial<T>): boolean {
        if (!this.isBrowser) {
            return false;
        }

        const current = this.get<T>(key);
        if (current === null) {
            return false;
        }

        const updated = { ...current, ...partial };
        return this.set(key, updated);
    }
}
