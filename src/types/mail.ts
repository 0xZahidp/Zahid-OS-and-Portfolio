export interface EmailAddress {
  name: string;
  email: string;
}

export type MailFolder = 'inbox' | 'sent' | 'starred' | 'trash';

export interface MailMessage {
  id: string;
  folder: 'inbox' | 'sent' | 'trash';
  from: EmailAddress;
  to: EmailAddress[];
  replyTo?: string;
  subject: string;
  body: string;
  snippet: string;
  createdAt: string;
  isRead: boolean;
  isStarred: boolean;
  resendId?: string;
  tags?: string[];
}

export interface MailSendRequest {
  from?: string;
  to: string | string[];
  replyTo?: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface MailSendResponse {
  success: boolean;
  messageId?: string;
  resendId?: string;
  error?: string;
}

export interface MailStoreData {
  messages: MailMessage[];
  updatedAt: string;
}

