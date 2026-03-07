import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class PlatformService {
  private readonly isBrowser: boolean;
  private readonly isServer: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);
  }

  /**
   * Verifica si el código se está ejecutando en el navegador
   */
  getIsBrowser(): boolean {
    return this.isBrowser;
  }

  /**
   * Verifica si el código se está ejecutando en el servidor
   */
  getIsServer(): boolean {
    return this.isServer;
  }

  /**
   * Ejecuta una función solo si está en el navegador
   */
  runInBrowser(callback: () => void): void {
    if (this.isBrowser) {
      callback();
    }
  }

  /**
   * Ejecuta una función solo si está en el servidor
   */
  runInServer(callback: () => void): void {
    if (this.isServer) {
      callback();
    }
  }

  /**
   * Accede a localStorage de forma segura
   */
  getLocalStorage(): Storage | null {
    if (this.isBrowser) {
      return localStorage;
    }
    return null;
  }

  /**
   * Obtiene un valor de localStorage de forma segura
   */
  getLocalStorageItem(key: string): string | null {
    if (this.isBrowser) {
      return localStorage.getItem(key);
    }
    return null;
  }

  /**
   * Guarda un valor en localStorage de forma segura
   */
  setLocalStorageItem(key: string, value: string): void {
    if (this.isBrowser) {
      localStorage.setItem(key, value);
    }
  }

  /**
   * Elimina un valor de localStorage de forma segura
   */
  removeLocalStorageItem(key: string): void {
    if (this.isBrowser) {
      localStorage.removeItem(key);
    }
  }

  /**
   * Accede al objeto window de forma segura
   */
  getWindow(): Window | null {
    if (this.isBrowser) {
      return window;
    }
    return null;
  }

  /**
   * Realiza scroll a una posición específica de forma segura
   */
  scrollToTop(behavior: ScrollBehavior = 'auto'): void {
    if (this.isBrowser) {
      window.scrollTo({ top: 0, behavior });
    }
  }

  /**
   * Realiza scroll a una posición específica
   */
  scrollTo(top: number, behavior: ScrollBehavior = 'auto'): void {
    if (this.isBrowser) {
      window.scrollTo({ top, behavior });
    }
  }

  /**
   * Obtiene la posición actual del scroll
   */
  getScrollPosition(): number {
    if (this.isBrowser) {
      return window.scrollY || document.documentElement.scrollTop;
    }
    return 0;
  }

  /**
   * Obtiene la altura total del documento
   */
  getDocumentHeight(): number {
    if (this.isBrowser) {
      return document.documentElement.scrollHeight - window.innerHeight;
    }
    return 0;
  }
}
