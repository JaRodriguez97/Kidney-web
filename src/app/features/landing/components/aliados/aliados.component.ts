import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
export interface Organization {
  name: string;
  category: string;
  url: string;
  icon: string; // material symbol
  variant: 'light' | 'primary' | 'secondary';
}
@Component({
  selector: 'app-aliados',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aliados.component.html',
  styleUrl: './aliados.component.scss',
})
export class AliadosComponent {
  organizations: Organization[] = [
    // --- SALUD DIRECTA ---
    {
      name: 'Laboratorio Clínico Central',
      category: 'Laboratorio',
      url: 'https://laboratoriocentral.com',
      icon: 'biotech',
      variant: 'light',
    },
    {
      name: 'Clínica Integral Vida',
      category: 'Clínica',
      url: 'https://clinicaintegralvida.com',
      icon: 'local_hospital',
      variant: 'light',
    },
    {
      name: 'Centro Radiológico Avanzado',
      category: 'Imágenes Diagnósticas',
      url: 'https://centroradiologico.com',
      icon: 'medical_services',
      variant: 'light',
    },
    {
      name: 'TeleSalud 24/7',
      category: 'Telemedicina',
      url: 'https://telesalud247.com',
      icon: 'monitor_heart',
      variant: 'light',
    },

    // --- INDIRECTOS RELACIONADOS ---
    {
      name: 'Seguros Globales',
      category: 'Seguros',
      url: 'https://segurosglobales.com',
      icon: 'health_and_safety',
      variant: 'secondary',
    },
    {
      name: 'MediSoft Solutions',
      category: 'Software Médico',
      url: 'https://medisoft.com',
      icon: 'lan',
      variant: 'primary',
    },
    {
      name: 'Logística FarmaExpress',
      category: 'Logística Farmacéutica',
      url: 'https://farmaexpress.com',
      icon: 'local_shipping',
      variant: 'primary',
    },
    {
      name: 'BioEquipos SAS',
      category: 'Equipos Biomédicos',
      url: 'https://bioequipos.com',
      icon: 'precision_manufacturing',
      variant: 'secondary',
    },
  ];
}
