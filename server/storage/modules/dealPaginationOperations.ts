import { BaseStorage } from "../base/BaseStorage";
import { deals } from "../../../shared/schema";
import { eq, desc, and, count, sql } from "drizzle-orm";

export class DealPaginationOperations extends BaseStorage {
  async getDealsWithPagination(params: any): Promise<any> {
    const { page = 1, limit = 10, stage, contactId, userId, teamId, teamType, search, assignedUserId } = params;
    const offset = (page - 1) * limit;

    let query = this.db.select().from(deals);
    const conditions = [];

    if (stage) conditions.push(eq(deals.stage, stage));
    if (contactId) conditions.push(eq(deals.contactId, contactId));
    if (teamType) conditions.push(eq(deals.teamType, teamType));
    if (search) {
      conditions.push(sql`${deals.name} ILIKE ${`%${search}%`}`);
    }

    // Filtro específico por usuário atribuído (para usuários não-admin)
    if (userId) {
      conditions.push(eq(deals.assignedUserId, userId));
    }
    
    // Filtro adicional por assignedUserId (do query parameter)
    if (assignedUserId) {
      conditions.push(eq(deals.assignedUserId, parseInt(assignedUserId)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query
      .orderBy(desc(deals.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(deals)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return {
      deals: results,
      total: totalResult.count,
      totalPages: Math.ceil(totalResult.count / limit),
      currentPage: page
    };
  }
} 