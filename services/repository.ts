import prisma from '@/lib/prisma';
import { Lead } from '@prisma/client';

export { LeadStatus } from '@prisma/client';
export type { Lead };

// Here i try to implement a hybrid storage strategy
// 1. SQLite for local development
// 2. In-Memory for production
// because vercel serverless functions have a read-only filesystem so sqlite writes will fail

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_VERCEL = !!process.env.VERCEL;

// Switch logic: Use Memory if Prod/Vercel, otherwise SQLite
const USE_IN_MEMORY = IS_PRODUCTION || IS_VERCEL;

if (USE_IN_MEMORY) {
  console.log('🚀 Storage Mode: IN-MEMORY (Optimized for Vercel/Production)');
} else {
  console.log('📂 Storage Mode: SQLITE (Persistent for Development)');
}

// In-Memory Store
let memoryStore: Lead[] = [];

export const LeadRepository = {
  /**
   * Fetch all leads
   */
  async getAll(): Promise<Lead[]> {
    if (USE_IN_MEMORY) {
      return [...memoryStore].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Find unique lead by email
   */
  async findByEmail(email: string): Promise<Lead | null> {
    if (USE_IN_MEMORY) {
      return memoryStore.find(l => l.email === email) || null;
    }
    return await prisma.lead.findUnique({ where: { email } });
  },

  /**
   * Create a new lead
   */
  async create(data: { name: string; email: string; website?: string | null }): Promise<Lead> {
    if (USE_IN_MEMORY) {
      const newLead: Lead = {
        id: crypto.randomUUID(),
        name: data.name,
        email: data.email,
        website: data.website || null,
        companyName: null,
        country: null,
        emailStatus: null,
        score: 0,
        status: 'UNQUALIFIED', // Default (matches Prisma schema default)
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memoryStore.push(newLead);
      return newLead;
    }

    return await prisma.lead.create({ data });
  },

  /**
   * Update a lead
   */
  async update(id: string, data: Partial<Lead>): Promise<Lead> {
    if (USE_IN_MEMORY) {
      const index = memoryStore.findIndex(l => l.id === id);
      if (index !== -1) {
        memoryStore[index] = {
          ...memoryStore[index],
          ...data,
          updatedAt: new Date()
        };
        return memoryStore[index];
      }
      throw new Error("Lead not found in memory");
    }

    return await prisma.lead.update({
      where: { id },
      data: data as any,
    });
  }
};
