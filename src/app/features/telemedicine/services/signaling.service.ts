import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SignalingService {
  private socket!: Socket;

  // Observables para WebRTC
  public onRoomJoined$ = new Subject<any>();
  public onUserJoined$ = new Subject<any>();
  public onOffer$ = new Subject<any>();
  public onAnswer$ = new Subject<any>();
  public onIceCandidate$ = new Subject<any>();
  public onUserLeft$ = new Subject<any>();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      let serverUrl = environment.apiUrl.replace('/api/', '');
      
      if (!serverUrl || serverUrl === '') {
        serverUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';
      }

      this.socket = io(serverUrl + '/telemedicine', {
        path: '/ws/telemedicine'
      });

      this.setupListeners();
    }
  }

  private setupListeners() {
    this.socket.on('room-joined', (data) => this.onRoomJoined$.next(data));
    this.socket.on('user-joined', (data) => this.onUserJoined$.next(data));
    this.socket.on('offer', (data) => this.onOffer$.next(data));
    this.socket.on('answer', (data) => this.onAnswer$.next(data));
    this.socket.on('ice-candidate', (data) => this.onIceCandidate$.next(data));
    this.socket.on('user-left', (data) => this.onUserLeft$.next(data));
  }

  joinRoom(sessionId: string, userId: string, role: string = 'TEST') {
    if (this.socket) {
      this.socket.emit('join-room', { sessionId, userId, role });
    }
  }

  sendOffer(sessionId: string, offer: RTCSessionDescriptionInit, targetUserId: string) {
    if (this.socket) {
      this.socket.emit('offer', { sessionId, offer, targetUserId });
    }
  }

  sendAnswer(sessionId: string, answer: RTCSessionDescriptionInit) {
    if (this.socket) {
      this.socket.emit('answer', { sessionId, answer });
    }
  }

  sendIceCandidate(sessionId: string, candidate: RTCIceCandidateInit) {
    if (this.socket) {
      this.socket.emit('ice-candidate', { sessionId, candidate });
    }
  }
}
