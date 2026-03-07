import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-rol-organization',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './rol-organization.component.html',
  styleUrl: './rol-organization.component.scss',
})
export class RolOrganizationComponent implements OnInit {
  organizationForm!: FormGroup;
  @Output() formDataChange = new EventEmitter<any>();

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.organizationForm = this.fb.group({
      legal_name: ['', [Validators.required, Validators.minLength(5)]],
      document_number: ['', [Validators.required, Validators.minLength(5)]],
      email: ['', [Validators.required, Validators.email]],
      password_hash: ['', [Validators.required, Validators.minLength(8)]],
      entity_type: ['', [Validators.required]],
      phone: [null],
      address: [''],
      website_url: ['https://', [Validators.pattern('https?://.+')]],
      neighborhood: [''],
      commune: [''],
    });
    this.organizationForm.valueChanges.subscribe((value) => {
      this.formDataChange.emit(value);
    });
  }

  getFormData(): any {
    return this.organizationForm.value;
  }
}
