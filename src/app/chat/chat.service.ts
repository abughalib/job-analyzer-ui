import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject, filter } from 'rxjs';

import { ChatContent, Messages } from '../models/chat-history.model';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private API_URL = 'http://localhost:8100/api/v1/chat';

  private chatHistorySubject = new BehaviorSubject<ChatContent[]>([]);
  public chatHistory$: Observable<ChatContent[]> =
    this.chatHistorySubject.asObservable();

  private thinkContentSubject = new Subject<string>();
  public thinkContent$ = this.thinkContentSubject.asObservable();

  private ws!: WebSocketSubject<any>;

  private streamedTokenSubject = new Subject<string>();

  private thinkMessageSubject = new BehaviorSubject<string>('');
  private contentMessageSubject = new BehaviorSubject<string>('');

  // Expose the observables
  public thinkMessage$ = this.thinkMessageSubject.asObservable();
  public contentMessage$ = this.contentMessageSubject.asObservable();

  private startedThinkMessage: boolean = false;

  public streamedToken$: Observable<string> =
    this.streamedTokenSubject.asObservable();

  constructor(private http: HttpClient) {}

  private processMessage(msg: string): void {
    if (msg.startsWith('<think>')) {
      console.log('Think Message Started');
      this.startedThinkMessage = true;
      return;
    }

    if (msg.startsWith('</think>')) {
      console.log('Think Message End');
      this.startedThinkMessage = false;
      return;
    }

    if (this.startedThinkMessage) {
      const currentThinkMessage = this.thinkMessageSubject.getValue();
      this.thinkMessageSubject.next(currentThinkMessage + msg);
      this.updateLastThinkMessage(msg);
    } else {
      const currentContentMessage = this.contentMessageSubject.getValue();
      this.contentMessageSubject.next(currentContentMessage + msg);
      this.updateLastAIMessage(msg);
    }
  }

  public connectWebSocket(wsUrl: string): void {
    if (this.ws && !this.ws.closed) {
      console.warn('WebSocket already connected.');
      return;
    }

    this.ws = webSocket({
      url: wsUrl,
      deserializer: (e) => e.data,
    });

    this.ws.subscribe({
      next: (msg) => {
        this.processMessage(msg.toString());
      },
      error: (err) => {
        console.error('WebSocket Error: ', err);
      },
      complete: () => {
        console.log('WebSocket connection closed.');
      },
    });
  }

  public getInitialChatHistory(): Observable<Messages> {
    return this.http.get<Messages>(`${this.API_URL}/history`);
  }

  public addMessage(chatMessage: ChatContent): void {
    const currentHistory = this.chatHistorySubject.getValue();
    this.chatHistorySubject.next([...currentHistory, chatMessage]);
  }

  public sendWebSocketMessage(message: string): void {
    if (this.ws && !this.ws.closed) {
      this.ws.next({ type: 'Human', content: message });
      console.log('Sent message via WebSocket: ', message);

      this.addMessage({ type: 'Human', content: message, think: '' });
      this.addMessage({ type: 'AI', content: '', think: '' });
    } else {
      console.error('WebSocket not connected. Cannot send message.');
    }
  }

  public updateLastAIMessage(newContent: string): void {
    const currentHistory = this.chatHistorySubject.getValue();

    if (currentHistory.length > 0 && newContent) {
      const lastMessage = currentHistory[currentHistory.length - 1];
      if (lastMessage.type === 'AI') {
        // Remove the space checking logic since WebSocket messages should handle their own spacing
        lastMessage.content += newContent;
        this.chatHistorySubject.next([...currentHistory]);
      }
    }
  }

  public updateLastThinkMessage(newContent: string): void {
    const currentHistory = this.chatHistorySubject.getValue();

    if (currentHistory.length > 0 && newContent) {
      const lastMessage = currentHistory[currentHistory.length - 1];
      if (lastMessage.type === 'AI') {
        // Remove the space checking logic here as well
        lastMessage.think += newContent;
        this.chatHistorySubject.next([...currentHistory]);
      }
    }
  }

  public clearMessages(): void {
    this.thinkMessageSubject.next('');
    this.contentMessageSubject.next('');
  }

  public clearChatHistory(): void {
    this.chatHistorySubject.next([]);
  }

  public closeWebSocket(): void {
    if (this.ws) {
      this.ws.complete();
    }
  }
}
