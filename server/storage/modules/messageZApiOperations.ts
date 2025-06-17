import { BaseStorage } from '../base/BaseStorage';
import { messages, type Message } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

export class MessageZApiOperations extends BaseStorage {
  async getMessageByZApiId(zapiMessageId: string): Promise<Message | undefined> {
    const [message] = await this.db.select().from(messages)
      .where(eq(messages.whatsappMessageId, zapiMessageId));
    return message;
  }

  async updateMessageZApiStatus(whatsappMessageId: string, status: string): Promise<void> {
    await this.db.update(messages)
      .set({ 
        zapiStatus: status
      })
      .where(eq(messages.whatsappMessageId, whatsappMessageId));
  }
} 