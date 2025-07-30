import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';
import 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-markdown';


import { ChatService } from './chat.service';
import { ChatContent } from '../models/chat-history.model';


@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule, MarkdownModule],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat implements OnInit, OnDestroy {
  private WEBSOCKET_API: string = 'http://localhost:8100/api/v1/chat';

  userMessage: string = '';
  chatHistory: ChatContent[] = [];
  visibleThinkMessages = new Set<number>();

  toggleThink(index: number) {
    if (this.visibleThinkMessages.has(index)) {
      this.visibleThinkMessages.delete(index);
    } else {
      this.visibleThinkMessages.add(index);
    }
  }

  isThinkVisible(index: number): boolean {
    return this.visibleThinkMessages.has(index);
  }

  constructor(private chatService: ChatService) {
    // Chat Service
  }

  addMessage() {
    if (this.userMessage.trim()) {
      this.chatService.sendWebSocketMessage(this.userMessage);
      this.userMessage = '';
    }
  }

  ngOnInit() {

    this.chatService.connectWebSocket(this.WEBSOCKET_API);
    this.chatService.chatHistory$.subscribe((history) => {
      this.chatHistory = history;
    });
    // this.chatService.thinkMessage$.subscribe((thinkMsg) => {
    //   console.log('Think message updated:', thinkMsg);
    // });
    // this.chatService.contentMessage$.subscribe((contentMsg) => {
    //   console.log('Content message updated:', contentMsg);
    // });
  }

  ngOnDestroy(): void {
    this.chatService.closeWebSocket();
  }
}
