import { Component } from '@angular/core';
import { InputTextComponent } from '../../../../shared/components/form/input-text/input-text.component';
import { InputEmailComponent } from '../../../../shared/components/form/input-email/input-email.component';
import { SelectComponent } from '../../../../shared/components/form/select/select.component';
import { TextareaComponent } from '../../../../shared/components/form/textarea/textarea.component';

@Component({
  selector: 'app-form-contact',
  standalone: true,
  imports: [
    InputTextComponent,
    InputEmailComponent,
    SelectComponent,
    TextareaComponent,
  ],
  templateUrl: './form-contact.component.html',
  styleUrl: './form-contact.component.scss',
})
export class FormContactComponent {
  optionsSelectForm = [
    { label: 'Cita de Paciente', value: 'patient' },
    { label: 'Consulta de Resultados', value: 'results' },
    { label: 'Alianza Clínica', value: 'clinical' },
    { label: 'Otros', value: 'other' },
  ];
}
