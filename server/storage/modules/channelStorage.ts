import { BaseStorage } from "../base/BaseStorage";
import { channels, type Channel, type InsertChannel } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Channel storage module - manages communication channels
 */
export class ChannelStorage extends BaseStorage {
  async getChannels(): Promise<Channel[]> {
    return this.db.select().from(channels).orderBy(desc(channels.createdAt));
  }

  async getChannel(id: number): Promise<Channel | undefined> {
    const [channel] = await this.db.select().from(channels).where(eq(channels.id, id));
    return channel;
  }

  async getChannelsByType(type: string): Promise<Channel[]> {
    return this.db.select().from(channels)
      .where(eq(channels.type, type))
      .orderBy(desc(channels.createdAt));
  }

  async createChannel(channel: InsertChannel): Promise<Channel> {
    const [newChannel] = await this.db.insert(channels).values(channel).returning();
    return newChannel;
  }

  async updateChannel(id: number, channelData: Partial<InsertChannel>): Promise<Channel> {
    const [updated] = await this.db.update(channels)
      .set({ ...channelData, updatedAt: new Date() })
      .where(eq(channels.id, id))
      .returning();
    return updated;
  }

  async deleteChannel(id: number): Promise<void> {
    await this.db.delete(channels).where(eq(channels.id, id));
  }

  async updateChannelConnectionStatus(id: number, connectionStatus: string, isConnected: boolean): Promise<void> {
    await this.db.update(channels)
      .set({ 
        connectionStatus, 
        isConnected,
        updatedAt: new Date()
      })
      .where(eq(channels.id, id));
  }

  async getActiveWhatsAppChannel(): Promise<Channel | undefined> {
    const [channel] = await this.db.select().from(channels)
      .where(eq(channels.type, 'whatsapp'))
      .where(eq(channels.isActive, true))
      .orderBy(desc(channels.createdAt))
      .limit(1);
    return channel;
  }
}