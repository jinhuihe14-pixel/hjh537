
import { ChatMessage } from '../../shared/types/game.js';

export class ChatManager {
  private messages: ChatMessage[] = [];
  private maxMessages: number = 500;
  
  addMessage(message: ChatMessage): void {
    this.messages.push(message);
    
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }
  }
  
  getMessages(channel?: string, limit: number = 100): ChatMessage[] {
    let filtered = this.messages;
    
    if (channel) {
      filtered = filtered.filter(m => m.channel === channel);
    }
    
    return filtered.slice(-limit);
  }
  
  getWorldMessages(limit: number = 100): ChatMessage[] {
    return this.getMessages('world', limit);
  }
  
  getPlayerMessages(playerId: string, limit: number = 50): ChatMessage[] {
    return this.messages
      .filter(m => m.senderId === playerId || m.channel === 'world')
      .slice(-limit);
  }
  
  clearMessages(): void {
    this.messages = [];
  }
  
  getMessageCount(): number {
    return this.messages.length;
  }
}
