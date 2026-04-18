export interface Message {
  id: number;
  text: string;
  timestamp: Date;
  sender: 'user' | 'support';
}

// New interfaces for API communication (Real-Time Support Chat)
export interface ApiMessage {
  id: number;
  uid: number; // Assuming uid is always present for API messages
  message: string;
  fromAdmin: boolean;
  created: string;
}

// SupportMessage is what the UI expects
export interface SupportMessage {
  id: number;
  content: string;
  timestamp: string;
  isFromSupport: boolean;
}

export interface HasPendingMessagesResponse {
  hasPending: boolean;
}

export interface SendMessageRequest {
  message: string; // Adjusted to match backend payload
}

export interface SendMessageResponse {
  success: boolean;
  messageId?: number; // messageId might not be returned on success
}