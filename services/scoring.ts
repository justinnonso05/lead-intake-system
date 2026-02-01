import { EnrichmentData } from './enrichment';

interface ScoringInput {
  website?: string | null;
  enrichment?: EnrichmentData;
}

export function scoreLead(data: ScoringInput): number {
  let score = 0;
  const { website, enrichment } = data;

  // Rule 1: Has website -> +10
  if (website) {
    score += 10;
  }

  // Check enrichment data
  if (!enrichment || Object.keys(enrichment).length === 0) {
    // Rule 4: Missing enrichment data -> -5 
    // (This happens if API fails AND we couldn't infer anything)
    score -= 5;
  } else {
    // Rule 2: Email Verification (AnyMail Finder)
    if (enrichment.emailStatus === 'valid') {
      score += 15; // High confidence
    } else if (enrichment.emailStatus === 'invalid' || enrichment.emailStatus === 'not_found') {
      score -= 10; // Penalty for bad email or not found
    }

    // Rule 3: Country = Tier 1 -> +10
    const targetCountries = ['US', 'UK', 'CA', 'Canada', 'United Kingdom', 'Germany', 'France', 'Australia', 'Nigeria'];
    if (enrichment.country && targetCountries.includes(enrichment.country)) {
      score += 10;
    }
  }

  return score;
}
