import { Router } from '@angular/router';
import { Component, Inject, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-aside-admin',
  standalone: true,
  imports: [],
  templateUrl: './aside-admin.component.html',
  styleUrl: './aside-admin.component.scss',
})
export class AsideAdminComponent implements OnInit {
  activeIndex: number = 0;
  private router = inject(Router);
  private readonly STORAGE_KEY = 'adminSidebarActive';
  isBrowser = false;

  private routes = [
    'home',
    'services',
    'users',
    'articles',
    'appointments',
    'labs',
    'results',
    'settings',
    'support',
    '',
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Detecta si estamos corriendo en navegador
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      const savedIndex = localStorage.getItem(this.STORAGE_KEY);
      if (savedIndex !== null) {
        this.activeIndex = parseInt(savedIndex, 10);
      }
    }
  }

  setActive(index: number): void {
    this.activeIndex = index;
    if (this.isBrowser) {
      localStorage.setItem(this.STORAGE_KEY, index.toString());
    }
    const route = this.routes[index];
    if (route !== '' || index === 0) {
      this.router.navigate(['dashboard/admin/' + route]);
    }
  }
}
