export interface EmailAddress {
  name: string;
  email: string;
}

export type MailFolder = 'inbox' | 'unofficial' | 'sent' | 'starred' | 'archive' | 'trash';

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
  threadId?: string;
  thread_id?: string;
  resendId?: string;
  resend_id?: string;
  folder: 'inbox' | 'sent' | 'archive' | 'trash';
  status?: 'unread' | 'read' | 'delivered' | 'failed' | 'bounced' | 'complained' | string;
  mailbox?: 'official' | 'unofficial' | null;
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
  readAt?: string;
  read_at?: string;
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

export interface MailThread {
  id: string; // thread_id
  subject: string;
  normalizedSubject: string;
  snippet: string;
  lastMessageAt: string;
  firstMessageAt: string;
  participants: EmailAddress[];
  messageCount: number;
  hasUnread: boolean;
  isStarred: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  hasSent: boolean;
  hasInbound: boolean;
  tags: string[];
  mailbox?: 'official' | 'unofficial' | null;
  messages: MailMessage[];
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
  deletedResendIds?: string[];
  updatedAt: string;
}
