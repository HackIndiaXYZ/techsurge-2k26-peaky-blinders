export interface PaymentContextPackage {
  messageId: string;

  messageText: string;

  sender: {
    name: string;
    identifier?: string;
  };

  timestamp: string;

  claimedAmount?: number;

  claimedRecipient?: string;

  urgency: boolean;
}
