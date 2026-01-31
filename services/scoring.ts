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
    score -= 5;
  } else {
    // Rule 2: Company size 11–50 -> +20
    if (enrichment.companySize === '11-50') {
      score += 20;
    }

    // Rule 3: Country = US / UK / CA -> +10
    const targetCountries = ['US', 'UK', 'CA', 'United States', 'United Kingdom', 'Canada'];
    if (enrichment.country && targetCountries.includes(enrichment.country)) {
      score += 10;
    }
  }

  return score;
}
