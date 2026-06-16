import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SignalingService } from './signaling.service';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebRTCService {
  private peerConnection!: RTCPeerConnection;
  private localStream: MediaStream | null = null;
  private remoteStream!: MediaStream;

  public onRemoteStream$ = new Subject<MediaStream>();
  
  private sessionId!: string;
  private targetUserId?: string;
  private isBrowser = false;

  constructor(
    private signaling: SignalingService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    if (this.isBrowser) {
      this.remoteStream = new MediaStream();
      this.initializePeerConnection();
      this.setupSignaling();
    }
  }

  private initializePeerConnection() {
    if (!this.isBrowser) return;

    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.signaling.sendIceCandidate(this.sessionId, event.candidate);
      }
    };

    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        if (!this.remoteStream.getTracks().includes(track)) {
          this.remoteStream.addTrack(track);
        }
      });
      this.onRemoteStream$.next(this.remoteStream);
    };
  }

  private setupSignaling() {
    if (!this.isBrowser) return;

    this.signaling.onUserJoined$.subscribe(async (data: any) => {
      console.log('Nuevo usuario unido:', data.userId);
      this.targetUserId = data.userId;
      await this.createOffer();
    });

    this.signaling.onOffer$.subscribe(async (data: any) => {
      console.log('Oferta recibida de:', data.fromUserId);
      this.targetUserId = data.fromUserId;
      await this.handleOffer(data.offer);
    });

    this.signaling.onAnswer$.subscribe(async (data: any) => {
      console.log('Respuesta recibida');
      if (this.peerConnection && this.peerConnection.signalingState !== 'stable') {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });

    this.signaling.onIceCandidate$.subscribe(async (data: any) => {
      if (data.candidate && this.peerConnection) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error('Error adding received ice candidate', e);
        }
      }
    });
  }

  public joinSession(sessionId: string, userId: string) {
    if (!this.isBrowser) return;
    this.sessionId = sessionId;
    this.signaling.joinRoom(sessionId, userId, 'TEST');
  }

  public async startLocalVideo(): Promise<MediaStream | null> {
    if (!this.isBrowser) return null;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('navigator.mediaDevices no está disponible. ¿Estás usando HTTP en lugar de HTTPS en un dispositivo móvil?');
      throw new Error('Cámara/Micrófono bloqueados por el navegador por falta de HTTPS.');
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection) {
          this.peerConnection.addTrack(track, this.localStream!);
        }
      });
      return this.localStream;
    } catch (err) {
      console.error("Error al acceder a los dispositivos:", err);
      throw err;
    }
  }

  private async createOffer() {
    if (!this.isBrowser || !this.peerConnection) return;
    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      this.signaling.sendOffer(this.sessionId, offer, this.targetUserId!);
    } catch (e) {
      console.error('Error creating offer', e);
    }
  }

  private async handleOffer(offer: RTCSessionDescriptionInit) {
    if (!this.isBrowser || !this.peerConnection) return;
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      this.signaling.sendAnswer(this.sessionId, answer);
    } catch (e) {
      console.error('Error handling offer', e);
    }
  }

  public toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => track.enabled = enabled);
    }
  }

  public toggleAudio(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => track.enabled = enabled);
    }
  }

  public resetConnection() {
    if (!this.isBrowser) return;
    if (this.peerConnection) this.peerConnection.close();
    this.localStream?.getTracks().forEach(t => t.stop());
    this.localStream = null;
    this.remoteStream = new MediaStream();
    this.initializePeerConnection();
  }
}
