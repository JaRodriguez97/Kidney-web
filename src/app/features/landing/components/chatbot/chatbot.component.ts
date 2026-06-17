import { Component, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ChatOption {
  id: string;
  label: string;
}

interface ChatMessage {
  text: string;
  isBot: boolean;
  options?: ChatOption[];
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.scss'
})
export class ChatbotComponent implements AfterViewChecked {
  @ViewChild('chatScroll') private chatScrollContainer!: ElementRef;

  isOpen = false;
  messages: ChatMessage[] = [];

  constructor() {
    this.showInitialMenu();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.messages.length === 0) {
      this.showInitialMenu();
    }
  }

  scrollToBottom(): void {
    try {
      this.chatScrollContainer.nativeElement.scrollTop = this.chatScrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  showInitialMenu() {
    this.messages.push({
      text: '¡Hola! Soy el asistente virtual de Kidney Medicine. ¿En qué te puedo ayudar hoy?',
      isBot: true,
      options: [
        { id: 'paciente', label: 'Soy o quiero ser Paciente' },
        { id: 'aliado', label: 'Soy o quiero ser Aliado' },
        { id: 'ubicacion', label: 'Ubicación y Contacto' },
        { id: 'whatsapp', label: 'Contactar a un Asesor (WhatsApp)' }
      ]
    });
  }

  handleOptionClick(option: ChatOption) {
    // Add user message
    this.messages.push({
      text: option.label,
      isBot: false
    });

    // Handle bot response based on option selected
    setTimeout(() => {
      this.processResponse(option.id);
    }, 500);
  }

  processResponse(id: string) {
    switch (id) {
      // MENU PACIENTE
      case 'paciente':
        this.messages.push({
          text: 'Entendido. Como paciente, ¿qué información estás buscando?',
          isBot: true,
          options: [
            { id: 'servicios', label: 'Servicios que ofrecemos' },
            { id: 'a_quienes', label: '¿A quiénes atendemos?' },
            { id: 'inicio', label: 'Volver al menú principal' }
          ]
        });
        break;

      case 'servicios':
        this.messages.push({
          text: 'Ofrecemos una amplia variedad de servicios médicos, especialidades clínicas, laboratorio integral y atención en salud general para asegurar tu bienestar.',
          isBot: true,
          options: [{ id: 'inicio', label: 'Volver al menú principal' }]
        });
        break;

      case 'a_quienes':
        this.messages.push({
          text: 'Atendemos a todo tipo de pacientes que busquen cuidado médico especializado y general. Si deseas ser paciente nuestro, te invitamos a contactar a un asesor.',
          isBot: true,
          options: [{ id: 'inicio', label: 'Volver al menú principal' }]
        });
        break;

      // MENU ALIADO
      case 'aliado':
        this.messages.push({
          text: '¡Excelente! Los aliados son una parte vital de nuestra red. ¿Qué te gustaría saber?',
          isBot: true,
          options: [
            { id: 'como_aliado', label: '¿Cómo ser aliado?' },
            { id: 'beneficios_aliado', label: 'Beneficios de ser aliado' },
            { id: 'inicio', label: 'Volver al menú principal' }
          ]
        });
        break;

      case 'como_aliado':
        this.messages.push({
          text: 'Para ser nuestro aliado, puedes solicitar acceso desde el Portal Aliado en la parte superior de esta página o contactar a nuestro equipo por WhatsApp para asistencia en tu registro.',
          isBot: true,
          options: [{ id: 'inicio', label: 'Volver al menú principal' }]
        });
        break;

      case 'beneficios_aliado':
        this.messages.push({
          text: 'Nuestros aliados obtienen acceso a una robusta plataforma tecnológica, resultados clínicos en tiempo real, trazabilidad de órdenes e informes analíticos para mejorar su toma de decisiones.',
          isBot: true,
          options: [{ id: 'inicio', label: 'Volver al menú principal' }]
        });
        break;

      // UBICACION
      case 'ubicacion':
        this.messages.push({
          text: 'Nos encontramos ubicados en la ciudad de Cali, Valle del Cauca. Para mayor información de la ubicación exacta, no dudes en llamar a nuestras líneas de atención o escribirnos por WhatsApp.',
          isBot: true,
          options: [
            { id: 'whatsapp', label: 'Contactar por WhatsApp' },
            { id: 'inicio', label: 'Volver al menú principal' }
          ]
        });
        break;

      // WHATSAPP
      case 'whatsapp':
        this.messages.push({
          text: 'Te conectaremos con un asesor a través de WhatsApp. ¡Gracias por contactarnos!',
          isBot: true,
          options: [{ id: 'inicio', label: 'Volver al menú principal' }]
        });
        setTimeout(() => {
          window.open('https://wa.me/573000000000?text=Hola,%20me%20gustar%C3%ADa%20obtener%20m%C3%A1s%20informaci%C3%B3n', '_blank');
        }, 1500);
        break;

      // DEFAULT / INICIO
      case 'inicio':
      default:
        this.showInitialMenu();
        break;
    }
  }
}
