import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ElementRef,
} from '@angular/core';

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

  isLoading: boolean = false;
  userMessage: string = '';
  chatHistory: ChatContent[] = [];
  visibleThinkMessages = new Set<number>();
  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;

  toggleThink(index: number) {
    if (this.visibleThinkMessages.has(index)) {
      this.visibleThinkMessages.delete(index);
    } else {
      this.visibleThinkMessages.add(index);
    }
  }

  handleKeyDown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.addMessage();
    }
  }

  autoGrow(element: HTMLTextAreaElement): void {
    element.style.height = 'auto';
    element.style.height = element.scrollHeight + 2 + 'px';

    const maxHeight = 200;
    if (parseInt(element.style.height) > maxHeight) {
      element.style.height = maxHeight + 'px';
      element.style.overflowY = 'auto';
    } else {
      element.style.overflowY = 'hidden';
    }
  }

  private resetTextarea() {
    if (this.messageInput?.nativeElement) {
      this.messageInput.nativeElement.style.height = '60px';
      this.messageInput.nativeElement.style.overflowY = 'hidden';
    }
  }

  isThinkVisible(index: number): boolean {
    return this.visibleThinkMessages.has(index);
  }

  constructor(private chatService: ChatService) {
    // Chat Service
  }

  async addMessage(): Promise<void> {
    if (!this.userMessage?.trim() || this.isLoading) return;

    this.isLoading = true;
    try {
      if (this.userMessage.trim()) {
        this.chatService.sendWebSocketMessage(this.userMessage);
        this.userMessage = '';
        this.resetTextarea();
      }
    } finally {
      this.isLoading = false;
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

  ngAfterViewInit() {
    const messageInput = this.messageInput?.nativeElement;
    if (messageInput) {
      this.autoGrow(messageInput);
    }
  }

  ngOnDestroy(): void {
    this.chatService.closeWebSocket();
  }
}
