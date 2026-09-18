import type { ID, ISODateString } from "./common";

export interface User {
  id: ID;

  name: string;

  phone?: string;

  createdAt: ISODateString;
}
