import { BaseStorage } from "../base/BaseStorage";
import { contacts } from "../../../shared/schema";
import { eq } from "drizzle-orm";

export class ContactStatusOperations extends BaseStorage {
  async updateContactOnlineStatus(id: number, isOnline: boolean): Promise<void> {
    await this.db.update(contacts)
      .set({ 
        isOnline,
        lastSeenAt: isOnline ? undefined : new Date(),
        updatedAt: new Date()
      })
      .where(eq(contacts.id, id));
  }
} 