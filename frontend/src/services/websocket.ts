export type WebSocketMessage = 
  | { type: 'quiz_started'; message: string }
  | { type: 'question_changed'; question_order: number; message: string }
  | { type: 'team_joined'; team_name: string; message: string }
  | { type: 'answer_submitted'; participant_id: string; message: string }
  | { type: 'quiz_completed'; message: string }
  | { type: 'pong'; message: string };

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private inviteCode: string;
  private onMessageCallback: ((message: WebSocketMessage) => void) | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(inviteCode: string) {
    this.inviteCode = inviteCode;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const wsUrl = apiUrl.replace('http://', 'ws://').replace('https://', 'wss://');
      this.ws = new WebSocket(`${wsUrl}/ws/${this.inviteCode}`);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          if (this.onMessageCallback) {
            this.onMessageCallback(message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        this.ws = null;
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
        }
      };
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  onMessage(callback: (message: WebSocketMessage) => void): void {
    this.onMessageCallback = callback;
  }

  send(message: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    }
  }
}

