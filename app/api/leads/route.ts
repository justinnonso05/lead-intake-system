import { NextResponse } from 'next/server';
import { enrichLead } from '@/services/enrichment';
import { scoreLead } from '@/services/scoring';
import { leadSchema } from '@/schemas/lead';
import { checkRateLimit } from '@/lib/rate-limit';
import { createSuccessResponse, createErrorResponse } from '@/schemas/api';
import { LeadRepository, LeadStatus } from '@/services/repository';

export async function GET() {
  try {
    const leads = await LeadRepository.getAll();
    return NextResponse.json(createSuccessResponse(leads), { status: 200 });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch leads'),
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // Rate Limiting
  const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
  const rateLimit = checkRateLimit(ip);

  if (!rateLimit.success) {
    return NextResponse.json(
      createErrorResponse('Too many requests. Please try again later.'),
      { status: 429 }
    );
  }

  try {
    const body = await request.json();

    const validation = leadSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Validation failed', validation.error.flatten()),
        { status: 400 }
      );
    }

    const { name, email, website } = validation.data;

    // 1. Check Existence (Repository handles DB/Memory switch)
    const existing = await LeadRepository.findByEmail(email);
    if (existing) {
      return NextResponse.json(
        createErrorResponse('Lead with this email already exists'),
        { status: 409 }
      );
    }

    // 2. Create Basic Lead
    let lead = await LeadRepository.create({
      name,
      email,
      website: website || null,
    });

    // 3. Enrich
    const enrichmentData = await enrichLead(name, email, website || undefined);

    // 4. Score
    // Note: scoreLead expects { website?: string; enrichment: ... }
    const score = scoreLead({
      website: website || undefined,
      enrichment: enrichmentData
    });

    // 5. Determine Status
    const status = score >= 15 ? LeadStatus.QUALIFIED : LeadStatus.UNQUALIFIED;

    // 6. Update
    lead = await LeadRepository.update(lead.id, {
      ...enrichmentData,
      score,
      status,
    });

    return NextResponse.json(
      createSuccessResponse(lead, 'Lead submitted successfully'),
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Submission error:', error);
    return NextResponse.json(
      createErrorResponse('Internal Server Error', error.message),
      { status: 500 }
    );
  }
}
