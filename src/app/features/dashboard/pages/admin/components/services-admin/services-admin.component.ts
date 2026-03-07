import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputTextComponent } from '@app/shared/components/form/input-text/input-text.component';

@Component({
  selector: 'app-services-admin',
  standalone: true,
  imports: [CommonModule, InputTextComponent],
  templateUrl: './services-admin.component.html',
  styleUrl: './services-admin.component.scss',
})
export class ServicesAdminComponent {
  // sample services; in a real app these would likely come from a backend
  services: Array<any> = [
    {
      name: 'Consulta Médica General',
      subtitle: 'Valoración integral',
      code: 'GEN-001',
      specialization: 'Medicina General',
      price: 180000,
      status: 'Activo',
    },
    {
      name: 'Panel Metabólico Completo',
      subtitle: 'Análisis sanguíneo',
      code: 'LAB-102',
      specialization: 'Lab. Clínico',
      price: 150000,
      status: 'Activo',
    },
    {
      name: 'Perfil Lipídico Avanzado',
      code: 'LAB-205',
      specialization: 'Lab. Clínico',
      price: 95000,
      status: 'Activo',
    },
    {
      name: 'Examen de Hemoglobina Glicosilada',
      code: 'LAB-310',
      specialization: 'Lab. Clínico',
      price: 45000,
      status: 'Inactivo',
    },
    {
      name: 'Electrocardiograma de Reposo',
      code: 'CAR-110',
      specialization: 'Cardiología',
      price: 90000,
      status: 'Activo',
    },
  ];

  sortColumn: string = '';
  sortAscending: boolean = true;

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortAscending = !this.sortAscending;
    } else {
      this.sortColumn = column;
      this.sortAscending = true;
    }

    this.services.sort((a, b) => {
      const va: any = a[column];
      const vb: any = b[column];
      if (typeof va === 'string' && typeof vb === 'string') {
        return va.localeCompare(vb);
      }
      if (typeof va === 'number' && typeof vb === 'number') {
        return va - vb;
      }
      return 0;
    });

    if (!this.sortAscending) {
      this.services.reverse();
    }
  }
}
