import { Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '@app/core/services/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home-admin',
  standalone: true,
  imports: [RouterModule, DecimalPipe, CommonModule],
  templateUrl: './home-admin.component.html',
  styleUrl: './home-admin.component.scss',
})
export class HomeAdminComponent implements OnInit {
  articles: Array<{
    id: string;
    title: string;
    subtitle: string;
    time: string;
    color: string;
  }> | null = null;
  totalUsers: number | null = null;
  percent = '%100';
  appointments: Array<{
    id: string;
    paciente: string;
    initials: string;
    initialsColor: string;
    servicio: string;
    hora: string;
    doctor: string;
    estado: {
      label: string;
      colorClass: string;
      borderClass: string;
      dotClass?: string;
      extraClass?: string;
    };
  }> | null = null;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.getUsers().subscribe((users) => {
      this.totalUsers = users.length;
      this.appointments = [
        {
          id: '1',
          paciente: 'Maria Rodriguez',
          initials: 'MR',
          initialsColor: 'bg-blue-100 text-blue-600',
          servicio: 'Nefrología General',
          hora: '09:30 AM',
          doctor: 'Dr. A. Vargas',
          estado: {
            label: 'Confirmada',
            colorClass: 'bg-blue-50 text-primary',
            borderClass: 'border-blue-100',
            dotClass: 'bg-primary',
          },
        },
        {
          id: '2',
          paciente: 'Jorge Perez',
          initials: 'JP',
          initialsColor: 'bg-amber-100 text-amber-600',
          servicio: 'Control Hipertensión',
          hora: '10:15 AM',
          doctor: 'Dra. M. López',
          estado: {
            label: 'En Sala',
            colorClass: 'bg-amber-50 text-amber-700',
            borderClass: 'border-amber-100',
            dotClass: 'bg-amber-500 animate-pulse',
          },
        },
        {
          id: '3',
          paciente: 'Lucia Gomez',
          initials: 'LG',
          initialsColor: 'bg-purple-100 text-purple-600',
          servicio: 'Nutrición Renal',
          hora: '11:00 AM',
          doctor: 'Lic. K. Diaz',
          estado: {
            label: 'Pendiente',
            colorClass: 'bg-slate-100 text-slate-600',
            borderClass: 'border-slate-200',
          },
        },
        {
          id: '4',
          paciente: 'Carlos Ruiz',
          initials: 'CR',
          initialsColor: 'bg-red-100 text-secondary',
          servicio: 'Examen Laboratorio',
          hora: '11:30 AM',
          doctor: 'Lab. Central',
          estado: {
            label: 'Cancelada',
            colorClass: 'bg-red-50 text-secondary',
            borderClass: 'border-red-100',
          },
        },
        {
          id: '5',
          paciente: 'Andrés Felipe',
          initials: 'AF',
          initialsColor: 'bg-blue-100 text-primary',
          servicio: 'Medicina General',
          hora: '12:45 PM',
          doctor: 'Dr. S. Castro',
          estado: {
            label: 'Confirmado',
            colorClass: 'bg-blue-50 text-primary',
            borderClass: 'border-blue-100',
            dotClass: 'bg-primary',
          },
        },
      ];

      this.articles = [
        {
          id: '1',
          title: 'Importancia del Chequeo Renal',
          subtitle: 'Publicado por Dra. Torres',
          time: 'Hace 15 min',
          color: 'bg-primary',
        },
        {
          id: '2',
          title: 'Nutrición en Pacientes Hipertensos',
          subtitle: 'Editado hace 2 horas',
          time: 'Hace 2 horas',
          color: 'bg-primary',
        },
        {
          id: '3',
          title: 'Nuevos protocolos de Laboratorio',
          subtitle: 'Borrador guardado ayer',
          time: 'Ayer',
          color: 'bg-secondary',
        },
      ];
    });
  }
}
