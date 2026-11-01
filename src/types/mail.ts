export interface EmailAddress {
  name: string;
  email: string;
}

export type MailFolder = 'inbox' | 'sent' | 'starred' | 'archive' | 'trash';

export interface EmailAttachment {
  id?: string | null;
  filename?: string | null;
  size?: number | null;
  contentType?: string | null;
  content_type?: string | null;
  url?: string | null;
  download_url?: string | null;
}

export interface MailMessage {
  id: string;
  resendId?: string;
  folder: 'inbox' | 'sent' | 'archive' | 'trash';
  from: EmailAddress;
  to: EmailAddress[];
  replyTo?: string;
  subject: string;
  body: string;
  textBody?: string;
  htmlBody?: string;
  snippet: string;
  createdAt: string;
  receivedAt?: string;
  isRead: boolean;
  isStarred: boolean;
  isTrashed?: boolean;
  isArchived?: boolean;
  label?: string;
  direction?: 'inbound' | 'outbound';
  inReplyTo?: string;
  references?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  tags?: string[];
}

export interface MailSendRequest {
  from?: string;
  to: string | string[];
  replyTo?: string;
  subject: string;
  text?: string;
  html?: string;
  inReplyTo?: string;
  references?: string;
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
