import type { ID, ISODateString } from "./common";

export interface UserBehaviour {
  id: ID;

  userId: ID;

  recordedAt: ISODateString;

  averageTransactionAmount: number;

  averageDailyTransactionCount: number;

  typicalPaymentHour?: number;

  typicalPayeeCount: number;

  recentPaymentCount: number;
}

export interface BehaviourContext {
  behaviour: UserBehaviour;

  currentAmountDeviation: number;

  isUnusualAmount: boolean;

  isUnusualTime: boolean;

  recentPaymentVelocity: number;

  isHighVelocity: boolean;
}
