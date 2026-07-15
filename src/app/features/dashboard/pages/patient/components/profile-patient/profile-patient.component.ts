import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService } from '@app/core/services/patient.service';

@Component({
  selector: 'app-profile-patient',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-patient.component.html',
  styleUrl: './profile-patient.component.scss'
})
export class ProfilePatientComponent implements OnInit {
  private readonly patientService = inject(PatientService);

  loading = true;
  profile: any = {
    personalInformation: {
      photoUrl: '',
      firstName: '',
      middleName: '',
      lastName: '',
      secondLastName: '',
      document: {
        type: 'CC',
        number: ''
      },
      birthDate: '',
      sex: 'MALE'
    },
    demographicInformation: {
      country: {
        code: 'CO',
        name: 'Colombia'
      },
      department: {
        code: '76',
        name: 'Valle del Cauca'
      },
      municipality: {
        code: '76001',
        name: 'Cali'
      },
      territorialZone: 'URBAN',
      address: {
        addressLine: '',
        neighborhood: '',
        commune: '',
        postalCode: '760042'
      },
      ethnicity: {
        code: 'NONE',
        name: 'Ninguna'
      },
      educationLevel: {
        code: 'UNIVERSITY',
        name: 'Universitario'
      }
    },
    contactInformation: {
      email: '',
      mobile: {
        countryCode: '+57',
        number: ''
      },
      phones: [],
      emergencyContact: {
        fullName: '',
        relationship: '',
        countryCode: '+57',
        phone: ''
      },
      notificationPreferences: {
        email: true,
        sms: true,
        whatsapp: true,
        push: true
      }
    },
    clinicalSummary: {
      bloodType: 'O+',
      heightCm: null,
      weightKg: null,
      bodyMassIndex: null,
      allergies: [],
      chronicConditions: [],
      lastUpdatedAt: '',
      lastUpdatedBy: {
        providerId: '',
        fullName: ''
      }
    },
    payment: {
      cards: []
    }
  };

  successMessage = '';
  errorMessage = '';

  showAddCardModal = false;
  cards: any[] = [];
  newCard = {
    number: '',
    holderName: '',
    expiryDate: '',
    isPrimary: false
  };

  ngOnInit(): void {
    this.loadProfile();
    this.loadActiveCard();
  }

  loadProfile(): void {
    this.loading = true;
    this.patientService.getMyProfile().subscribe({
      next: (res) => {
        if (res) {
          this.profile = {
            ...this.profile,
            ...res
          };
          const savedEd = localStorage.getItem('kinexa_patient_education_level');
          if (savedEd && this.profile.demographicInformation?.educationLevel) {
            this.profile.demographicInformation.educationLevel.code = savedEd;
          }
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading profile', err);
        this.errorMessage = 'No fue posible cargar el perfil del paciente.';
        this.loading = false;
      }
    });
  }

  saveProfile(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.profile.demographicInformation?.educationLevel?.code) {
      localStorage.setItem('kinexa_patient_education_level', this.profile.demographicInformation.educationLevel.code);
    }
    
    const payload = {
      personalInformation: {
        firstName: this.profile.personalInformation.firstName,
        middleName: this.profile.personalInformation.middleName,
        lastName: this.profile.personalInformation.lastName,
        secondLastName: this.profile.personalInformation.secondLastName,
        sex: this.profile.personalInformation.sex,
        birthDate: this.profile.personalInformation.birthDate
      },
      demographicInformation: {
        country: {
          code: this.profile.demographicInformation.country.code
        },
        department: {
          name: this.profile.demographicInformation.department.name
        },
        municipality: {
          code: this.profile.demographicInformation.municipality.code,
          name: this.profile.demographicInformation.municipality.name
        },
        territorialZone: this.profile.demographicInformation.territorialZone,
        address: {
          addressLine: this.profile.demographicInformation.address.addressLine,
          neighborhood: this.profile.demographicInformation.address.neighborhood,
          commune: this.profile.demographicInformation.address.commune
        },
        ethnicity: {
          code: this.profile.demographicInformation.ethnicity.code
        }
      },
      contactInformation: {
        mobile: {
          number: this.profile.contactInformation.mobile.number
        },
        emergencyContact: {
          fullName: this.profile.contactInformation.emergencyContact.fullName,
          relationship: this.profile.contactInformation.emergencyContact.relationship,
          phone: this.profile.contactInformation.emergencyContact.phone
        }
      }
    };

    this.patientService.updateMyProfile(payload).subscribe({
      next: () => {
        this.successMessage = 'Perfil actualizado correctamente.';
        this.loadProfile();
      },
      error: (err) => {
        console.error('Error updating profile', err);
        this.errorMessage = err?.error?.message || 'Error al actualizar el perfil. Intente de nuevo.';
      }
    });
  }

  get primaryCard(): any {
    return this.cards.find(c => c.isPrimary) || this.cards[0] || null;
  }

  loadActiveCard(): void {
    const saved = localStorage.getItem('kinexa_patient_cards');
    if (saved) {
      try {
        this.cards = JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing cards list', e);
        this.cards = [];
      }
    } else {
      // Default initial mock card
      const fullName = (this.profile.personalInformation.firstName + ' ' + (this.profile.personalInformation.middleName ? this.profile.personalInformation.middleName + ' ' : '') + this.profile.personalInformation.lastName + ' ' + (this.profile.personalInformation.secondLastName ?? '')).trim();
      this.cards = [
        {
          id: 'default',
          number: '4111222233331234',
          holderName: fullName || 'Titular de la Tarjeta',
          expiryDate: '10/28',
          brand: 'VISA',
          isPrimary: true
        }
      ];
    }
  }

  openAddCardModal(): void {
    const fullName = (this.profile.personalInformation.firstName + ' ' + (this.profile.personalInformation.middleName ? this.profile.personalInformation.middleName + ' ' : '') + this.profile.personalInformation.lastName + ' ' + (this.profile.personalInformation.secondLastName ?? '')).trim();
    this.newCard = {
      number: '',
      holderName: fullName || '',
      expiryDate: '',
      isPrimary: this.cards.length === 0 // Default true if it's the first card
    };
    this.showAddCardModal = true;
  }

  closeAddCardModal(): void {
    this.showAddCardModal = false;
  }

  detectCardType(num: string): string {
    const cleanNum = num.replace(/\D/g, '');
    if (cleanNum.startsWith('4')) return 'VISA';
    if (cleanNum.startsWith('5')) return 'MASTERCARD';
    if (cleanNum.startsWith('3')) return 'AMEX';
    if (cleanNum.startsWith('6')) return 'DISCOVER';
    return 'VISA';
  }

  formatCardNumber(num: string): string {
    const cleanNum = num.replace(/\D/g, '');
    return cleanNum.replace(/(.{4})/g, '$1 ').trim();
  }

  maskCardNumber(num: string): string {
    const clean = num.replace(/\s+/g, '');
    if (clean.length < 4) return '**** **** **** ****';
    const last4 = clean.slice(-4);
    return `**** **** **** ${last4}`;
  }

  onCardNumberInput(event: any): void {
    const cleanNum = event.target.value.replace(/\D/g, '');
    let formatted = cleanNum.replace(/(.{4})/g, '$1 ').trim();
    if (formatted.length > 19) {
      formatted = formatted.substring(0, 19);
    }
    this.newCard.number = formatted;
  }

  onExpiryInput(event: any): void {
    let val = event.target.value.replace(/\D/g, '');
    if (val.length >= 2) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    if (val.length > 5) {
      val = val.substring(0, 5);
    }
    this.newCard.expiryDate = val;
  }

  saveCard(): void {
    if (!this.newCard.number || this.newCard.number.replace(/\s+/g, '').length < 13) {
      alert('Por favor ingrese un número de tarjeta válido.');
      return;
    }
    if (!this.newCard.holderName) {
      alert('Por favor ingrese el nombre del titular.');
      return;
    }
    if (!this.newCard.expiryDate || !/^\d{2}\/\d{2}$/.test(this.newCard.expiryDate)) {
      alert('Por favor ingrese una fecha de expiración válida (MM/YY).');
      return;
    }

    const brand = this.detectCardType(this.newCard.number);
    const cardId = Date.now().toString();

    // If the new card is set as primary, unmark other cards
    if (this.newCard.isPrimary) {
      this.cards.forEach(c => c.isPrimary = false);
    } else if (this.cards.length === 0) {
      // If it's the first card, it must be primary
      this.newCard.isPrimary = true;
    }

    const savedCard = {
      id: cardId,
      number: this.newCard.number,
      holderName: this.newCard.holderName,
      expiryDate: this.newCard.expiryDate,
      brand: brand,
      isPrimary: this.newCard.isPrimary
    };

    this.cards.push(savedCard);

    // Save to localStorage
    localStorage.setItem('kinexa_patient_cards', JSON.stringify(this.cards));
    this.closeAddCardModal();
  }

  setPrimaryCard(id: string): void {
    this.cards.forEach(c => {
      c.isPrimary = (c.id === id);
    });
    localStorage.setItem('kinexa_patient_cards', JSON.stringify(this.cards));
  }

  deleteCard(id: string): void {
    if (confirm('¿Está seguro de que desea eliminar esta tarjeta?')) {
      const wasPrimary = this.cards.find(c => c.id === id)?.isPrimary;
      this.cards = this.cards.filter(c => c.id !== id);
      
      if (wasPrimary && this.cards.length > 0) {
        this.cards[0].isPrimary = true;
      }
      
      localStorage.setItem('kinexa_patient_cards', JSON.stringify(this.cards));
    }
  }
}
