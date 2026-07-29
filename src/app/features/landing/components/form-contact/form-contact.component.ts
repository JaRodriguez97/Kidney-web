import { Component } from '@angular/core';
import {
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputTextComponent } from '../../../../shared/components/form/input-text/input-text.component';
import { InputEmailComponent } from '../../../../shared/components/form/input-email/input-email.component';
import { SelectComponent } from '../../../../shared/components/form/select/select.component';
import { TextareaComponent } from '../../../../shared/components/form/textarea/textarea.component';

@Component({
	selector: 'app-form-contact',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		InputTextComponent,
		InputEmailComponent,
		SelectComponent,
		TextareaComponent,
	],
	templateUrl: './form-contact.component.html',
	styleUrl: './form-contact.component.scss',
})
export class FormContactComponent {
	form: FormGroup;
	successMessage: string | null = null;
	errorMessage: string | null = null;

	optionsSelectForm = [
		{ label: 'Cita de Paciente', value: 'patient' },
		{ label: 'Consulta de Resultados', value: 'results' },
		{ label: 'Alianza Clínica', value: 'clinical' },
		{ label: 'Otros', value: 'other' },
	];

	constructor(private fb: FormBuilder) {
		this.form = this.fb.group({
			name: ['', Validators.required],
			lastName: ['', Validators.required],
			email: ['', [Validators.required, Validators.email]],
			queryType: ['patient', Validators.required],
			message: ['', Validators.required],
		});
	}

	onSubmit() {
		if (typeof window === 'undefined') return;
    
		if (this.form.valid) {
			const { name, lastName, email, queryType, message } = this.form.value;
			const typeLabel =
				this.optionsSelectForm.find((o) => o.value === queryType)?.label ||
				'Otros';

			const text = `Hola Kidney Medicine! \nSoy ${name} ${lastName}.\nEmail: ${email}\nMotivo: ${typeLabel}\n\nMensaje: ${message}`;
			const phone = '573000000000';
			const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

			window.open(url, '_blank');

			this.form.reset({ queryType: 'patient' });
			this.successMessage = 'Redirigiendo a WhatsApp...';
			this.errorMessage = null;

			setTimeout(() => {
				this.successMessage = null;
			}, 5000);
		} else {
			this.errorMessage = 'Por favor, completa todos los campos obligatorios.';
			this.successMessage = null;
		}
	}
}
