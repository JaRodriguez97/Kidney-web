import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { WebRTCService } from '../../services/webrtc.service';

@Component({
  selector: 'app-test-video-call',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './test-video-call.component.html',
  styleUrls: ['./test-video-call.component.scss']
})
export class TestVideoCallComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  sessionId!: string;
  userId: string;
  isVideoEnabled = true;
  isAudioEnabled = true;

  constructor(
    private route: ActivatedRoute,
    private webrtcService: WebRTCService
  ) {
    // Generamos un ID de usuario temporal para la sesión de prueba
    this.userId = 'test-user-' + Math.random().toString(36).substring(2, 9); 
  }

  async ngOnInit() {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') || 'test-room';
    
    try {
      const localStream = await this.webrtcService.startLocalVideo();
      if (localStream) {
        this.localVideo.nativeElement.srcObject = localStream;
        
        this.webrtcService.joinSession(this.sessionId, this.userId);
        
        this.webrtcService.onRemoteStream$.subscribe((stream) => {
          if (this.remoteVideo && this.remoteVideo.nativeElement) {
            this.remoteVideo.nativeElement.srcObject = stream;
          }
        });
      }
    } catch (err: any) {
      console.error('No se pudo acceder a la cámara o el micrófono', err);
      if (err.message && err.message.includes('HTTPS')) {
        alert('⚠️ ' + err.message + '\n\nEn los celulares, por seguridad, el navegador no permite encender la cámara si no es una conexión segura (HTTPS).');
      } else {
        alert('⚠️ Debes conceder permisos de cámara y micrófono para usar la prueba.');
      }
    }
  }

  ngOnDestroy() {
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
}
