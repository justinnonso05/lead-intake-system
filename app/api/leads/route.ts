import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { LeadStatus } from '@prisma/client';
import { enrichLead } from '@/services/enrichment';
import { scoreLead } from '@/services/scoring';
import { leadSchema } from '@/schemas/lead';
import { createSuccessResponse, createErrorResponse } from '@/schemas/api';

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(createSuccessResponse(leads), { status: 200 });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch leads'),
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validate Input
    const validation = leadSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Validation failed', validation.error.flatten()),
        { status: 400 }
      );
    }

    const { name, email, website } = validation.data;

    // 2. Check for existence
    const existing = await prisma.lead.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        createErrorResponse('Lead with this email already exists'),
        { status: 409 }
      );
    }

    // 3. Create Basic Lead (Requirement: Persist first)
    let lead = await prisma.lead.create({
      data: {
        name,
        email,
        website: website || null,
      },
    });

    // 4. Enrich Lead
    // Requirement: "After a lead is stored, attempt to enrich it"
    // Requirement: "Handle failed API calls gracefully" (Handled in service)
    const enrichmentData = await enrichLead(email, website || undefined);

    // 5. Score Lead
    const score = scoreLead({
      website: website || undefined, // undefined matches service signature better if optional
      enrichment: enrichmentData
    });

    // 6. Determine Status
    // Assumption: Score >= 15 is "qualified"
    const status = score >= 15 ? LeadStatus.QUALIFIED : LeadStatus.UNQUALIFIED;

    // 7. Update Lead
    lead = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        ...enrichmentData,
        score,
        status,
      },
    });

    return NextResponse.json(createSuccessResponse(lead, 'Lead submitted successfully'), { status: 201 });

  } catch (error) {
    console.error('Error submitting lead:', error);
    return NextResponse.json(
      createErrorResponse('Internal Server Error'),
      { status: 500 }
    );
  }
}
