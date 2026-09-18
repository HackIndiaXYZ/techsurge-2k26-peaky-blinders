import type {
  ID,
  ISODateString,
  MessageChannel,
} from "./common";

export interface Message {
  id: ID;

  userId: ID;

  channel: MessageChannel;

  senderName?: string;

  senderIdentifier?: string;

  content: string;

  timestamp: ISODateString;
}

export interface MessageContext {
  message?: Message;

  hasMessageContext: boolean;

  messageAgeSeconds?: number;

  containsUrgencyLanguage: boolean;

  containsRefundLanguage: boolean;

  containsMistakenTransferClaim: boolean;

  mentionedAmount?: number;

  mentionedPayeeName?: string;

  mentionedPayeeIdentifier?: string;
}
