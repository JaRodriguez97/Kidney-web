import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-rol-patient',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './rol-patient.component.html',
  styleUrl: './rol-patient.component.scss',
})
export class RolPatientComponent implements OnInit {
  patientForm!: FormGroup;
  @Output() formDataChange = new EventEmitter<any>();

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.patientForm = this.fb.group({
      // Datos obligatorios
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      documentNumber: [null, [Validators.required, Validators.minLength(5)]],

      // Datos opcionales
      middleName: [''],
      secondLastName: [''],
      phone: [''],
      address: [''],
      neighborhood: [''],
      commune: [''],
    });
    this.patientForm.valueChanges.subscribe((value) => {
      this.formDataChange.emit(value);
    });
  }

  getFormData(): any {
    const raw = this.patientForm.value;
    // Filtra las propiedades que tienen valor válido (no null, no undefined, no string vacío)
    const filtered: any = {};
    Object.keys(raw).forEach((key) => {
      const value = raw[key];
      if (
        value !== null &&
        value !== undefined &&
        !(typeof value === 'string' && value.trim() === '')
      ) {
        filtered[key] = value;
      }
    });
    console.log('🚀 ~ RolPatientComponent ~ getFormData ~ filtered:', filtered);
    return filtered;
  }
}
