import { Component, OnDestroy, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { WebRTCService } from '../../services/webrtc.service';
import { TelemedicineService } from '../../services/telemedicine.service';
import { AuthService } from '@app/features/auth/services/auth.service';
import { ClinicalAttentionProviderComponent } from '../../../dashboard/pages/provider/components/clinical-attention-provider/clinical-attention-provider.component';

@Component({
  selector: 'app-video-call-room',
  standalone: true,
  imports: [CommonModule, ClinicalAttentionProviderComponent],
  templateUrl: './video-call-room.component.html',
  styleUrls: ['./video-call-room.component.scss'],
})
export class VideoCallRoomComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly webrtcService = inject(WebRTCService);
  private readonly telemedicineService = inject(TelemedicineService);
  private readonly authService = inject(AuthService);

  sessionId = '';
  accessToken = '';
  role: 'PROVIDER' | 'PATIENT' = 'PATIENT';
  userId = '';
  isVideoEnabled = true;
  isAudioEnabled = true;
  loading = true;
  errorMessage = '';
  remoteConnected = false;
  private sessionStarted = false;

  // Context properties hydrated from getSessionAccess
  patientName = 'Paciente';
  patientDocument = 'ID: No disponible';
  patientRiskLevel = 'PENDIENTE';
  providerName = 'Profesional de salud';
  providerSpecialty = 'En línea';
  serviceName = 'Telemedicina';
  appointmentId = '';

  // Timer properties
  elapsedLabel = '00:00:00';
  elapsedSeconds = 0;
  private timerHandle: any = null;

  // Tab state for embedded clinical record
  activeTab: 'FORM' | 'HISTORY' | 'ORDERS' = 'FORM';

  // Draggable PIP coordinates
  pipPosition = { x: 0, y: 0 };
  isDragging = false;
  private dragStart = { x: 0, y: 0 };

  async ngOnInit() {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') ?? '';
    this.accessToken = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.userId = this.authService.currentUser?.id ?? '';

    if (!this.sessionId || !this.accessToken || !this.userId) {
      this.errorMessage = 'Enlace de videollamada inválido.';
      this.loading = false;
      return;
    }

    this.telemedicineService
      .getSessionAccess(this.sessionId, this.accessToken)
      .subscribe({
        next: async (access) => {
          this.role = access.role;
          this.loading = false;

          // Hydrate details from the enriched backend session access API
          if (access.patientDetails) {
            this.patientName = access.patientDetails.name;
            const docType = access.patientDetails.documentType || 'ID';
            const docNum = access.patientDetails.documentNumber || 'No disponible';
            this.patientDocument = `${docType}: ${docNum}`;
            this.patientRiskLevel = access.patientDetails.riskIntegral || 'PENDIENTE';
          }
          if (access.providerDetails) {
            this.providerName = access.providerDetails.name;
            this.providerSpecialty = access.providerDetails.specialty || 'En línea';
          }
          if (access.serviceName) {
            this.serviceName = access.serviceName;
          }
          if (access.appointmentId) {
            this.appointmentId = access.appointmentId;
          }

          // Start the elapsed call timer
          this.startStopwatch();

          try {
            await firstValueFrom(
              this.telemedicineService.updateSessionStatus(
                this.sessionId,
                'WAITING',
              ),
            );

            const localStream = await this.webrtcService.startLocalVideo();
            if (localStream) {
              this.localVideo.nativeElement.srcObject = localStream;
              this.webrtcService.joinSession(
                this.sessionId,
                this.userId,
                this.role,
              );

              this.webrtcService.onRemoteStream$.subscribe((stream) => {
                this.remoteConnected = true;
                if (this.remoteVideo?.nativeElement) {
                  this.remoteVideo.nativeElement.srcObject = stream;
                }
                if (!this.sessionStarted) {
                  this.sessionStarted = true;
                  this.telemedicineService
                    .updateSessionStatus(this.sessionId, 'IN_PROGRESS')
                    .subscribe();
                }
              });
            }
          } catch (err: any) {
            this.errorMessage =
              err?.message ??
              'No fue posible iniciar la videollamada. Verifica permisos de cámara y micrófono.';
          }
        },
        error: () => {
          this.loading = false;
          this.errorMessage =
            'No tienes acceso a esta sala de videollamada o la sesión no está disponible.';
        },
      });
  }

  ngOnDestroy() {
    this.stopStopwatch();
    if (this.sessionId) {
      this.telemedicineService
        .updateSessionStatus(this.sessionId, 'COMPLETED')
        .subscribe();
    }
    this.webrtcService.resetConnection();
  }

  toggleVideo() {
    this.isVideoEnabled = !this.isVideoEnabled;
    this.webrtcService.toggleVideo(this.isVideoEnabled);
  }

  toggleAudio() {
    this.isAudioEnabled = !this.isAudioEnabled;
    this.webrtcService.toggleAudio(this.isAudioEnabled);
  }

  leaveRoom() {
    if (confirm('¿Estás seguro de que deseas finalizar la sesión de telemedicina?')) {
      const dashboardPath =
        this.role === 'PROVIDER'
          ? '/dashboard/provider/appointments'
          : '/dashboard/patient/appointments';
      this.router.navigate([dashboardPath]);
    }
  }

  // Timer helper methods
  private startStopwatch() {
    this.stopStopwatch();
    this.elapsedSeconds = 0;
    this.elapsedLabel = '00:00:00';
    this.timerHandle = setInterval(() => {
      this.elapsedSeconds++;
      const hours = Math.floor(this.elapsedSeconds / 3600).toString().padStart(2, '0');
      const minutes = Math.floor((this.elapsedSeconds % 3600) / 60).toString().padStart(2, '0');
      const seconds = (this.elapsedSeconds % 60).toString().padStart(2, '0');
      this.elapsedLabel = `${hours}:${minutes}:${seconds}`;
    }, 1000);
  }

  private stopStopwatch() {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
  }

  // Returns the animated dot color class based on the stopwatch time
  getTimerDotColorClass(): string {
    const minutes = this.elapsedSeconds / 60;
    if (minutes < 5) {
      return 'bg-green-500';
    } else if (minutes < 10) {
      return 'bg-yellow-500';
    } else if (minutes < 15) {
      return 'bg-orange-500';
    } else {
      return 'bg-red-500';
    }
  }

  // Returns the border and text container styling based on the time
  getTimerBadgeClass(): string {
    const minutes = this.elapsedSeconds / 60;
    if (minutes < 5) {
      return 'bg-green-50/70 border-green-200/60 text-green-700';
    } else if (minutes < 10) {
      return 'bg-yellow-50/70 border-yellow-200/60 text-yellow-700';
    } else if (minutes < 15) {
      return 'bg-orange-50/70 border-orange-200/60 text-orange-700';
    } else {
      return 'bg-red-50/70 border-red-200/60 text-red-700';
    }
  }

  // Drag handlers for the PIP camera window
  onPointerDown(event: PointerEvent) {
    this.isDragging = true;
    this.dragStart = {
      x: event.clientX - this.pipPosition.x,
      y: event.clientY - this.pipPosition.y
    };
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  onPointerMove(event: PointerEvent) {
    if (!this.isDragging) return;
    this.pipPosition = {
      x: event.clientX - this.dragStart.x,
      y: event.clientY - this.dragStart.y
    };
  }

  onPointerUp(event: PointerEvent) {
    this.isDragging = false;
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
  }
}
