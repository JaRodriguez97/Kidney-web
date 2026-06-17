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
			document_type: ['NIT', [Validators.required]],
			document_number: ['', [Validators.required, Validators.minLength(5)]],
			email: ['', [Validators.required, Validators.email]],
			password: ['', [Validators.required, Validators.minLength(8)]],
			entity_type: ['', [Validators.required]],
			city: ['Cali', [Validators.required]],
			department: ['Valle del Cauca', [Validators.required]],
			trade_name: [''],
			phone: [''],
			address: [''],
			website_url: ['', [Validators.pattern(/^$|https?:\/\/.+/)]],
			logo_url: ['', [Validators.pattern(/^$|https?:\/\/.+/)]],
			neighborhood: [''],
		});
		this.organizationForm.valueChanges.subscribe((value) => {
			this.formDataChange.emit(value);
		});
	}

	getFormData(): any {
		return this.organizationForm.value;
	}
}
