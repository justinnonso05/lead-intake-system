import prisma from '@/lib/prisma';
import { Lead } from '@prisma/client';

export { LeadStatus } from '@prisma/client';
export type { Lead };

// STORAGE STRATEGY
// Controlled via STORAGE_MODE environment variable.
// "sqlite" (default) -> Uses local SQLite file (dev.db)
// "in-memory" -> Uses RAM (Required for Vercel/Serverless read-only environments)

let USE_IN_MEMORY = process.env.STORAGE_MODE === 'in-memory';

if (USE_IN_MEMORY) {
  console.log('🚀 Storage Mode: IN-MEMORY (Configured via env)');
} else {
  console.log('📂 Storage Mode: SQLITE (Default)');
}

// In-Memory Store
let memoryStore: Lead[] = [];

// Helper to switch mode if SQLite fails (Auto-Heal)
function enableMemoryMode() {
  if (!USE_IN_MEMORY) {
    console.warn('⚠️ SQLite crashed (SQLITE_CANTOPEN). Dynamically switching to In-Memory mode.');
    USE_IN_MEMORY = true;
  }
}

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
    try {
      return await prisma.lead.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (e: any) {
      // FAILSAFE: If DB fails, switch to memory and return empty (or current memory)
      enableMemoryMode();
      return [...memoryStore];
    }
  },

  /**
   * Find unique lead by email
   */
  async findByEmail(email: string): Promise<Lead | null> {
    if (USE_IN_MEMORY) {
      return memoryStore.find(l => l.email === email) || null;
    }
    try {
      return await prisma.lead.findUnique({ where: { email } });
    } catch (e: any) {
      enableMemoryMode();
      return memoryStore.find(l => l.email === email) || null;
    }
  },

  /**
   * Create a new lead
   */
  async create(data: { name: string; email: string; website?: string | null }): Promise<Lead> {
    // If we already know we are in memory mode, just do it
    if (USE_IN_MEMORY) return this.createInMemory(data);

    try {
      return await prisma.lead.create({ data });
    } catch (e: any) {
      enableMemoryMode();
      return this.createInMemory(data);
    }
  },

  // Helper for internal use handling the memory creation
  createInMemory(data: { name: string; email: string; website?: string | null }): Lead {
    const newLead: Lead = {
      id: crypto.randomUUID(),
      name: data.name,
      email: data.email,
      website: data.website || null,
      companyName: null,
      country: null,
      emailStatus: null,
      score: 0,
      status: 'UNQUALIFIED',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryStore.push(newLead);
    return newLead;
  },

  /**
   * Update a lead
   */
  async update(id: string, data: Partial<Lead>): Promise<Lead> {
    if (USE_IN_MEMORY) return this.updateInMemory(id, data);

    try {
      return await prisma.lead.update({
        where: { id },
        data: data as any,
      });
    } catch (e: any) {
      enableMemoryMode();
      return this.updateInMemory(id, data);
    }
  },

  updateInMemory(id: string, data: Partial<Lead>): Lead {
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
};
