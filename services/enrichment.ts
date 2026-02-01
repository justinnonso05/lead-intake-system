export interface EnrichmentData {
  companyName?: string;
  country?: string;
  emailStatus?: string;
}

export async function enrichLead(name: string, email: string, website?: string): Promise<EnrichmentData> {
  const result: EnrichmentData = {};

  // Infer Domain from Website OR Email as fallback
  let domain = '';
  if (website) {
    try {
      const url = website.startsWith('http') ? website : `https://${website}`;
      domain = new URL(url).hostname.replace('www.', '');
    } catch (e) {
      console.warn('Invalid website URL provided, falling back to email domain');
    }
  }

  if (!domain && email.includes('@')) {
    domain = email.split('@')[1];
  }

  // local logic to infer data to enrich the lead since Anymail doesn't provide all the data we need, can implement another external API for this later
  if (domain) {
    // Infer Company Name from Domain (e.g., google.com -> Google)
    result.companyName = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);

    // Infer Country from TLD
    if (domain.endsWith('.uk')) result.country = 'UK';
    else if (domain.endsWith('.ca')) result.country = 'Canada';
    else if (domain.endsWith('.de')) result.country = 'Germany';
    else if (domain.endsWith('.fr')) result.country = 'France';
    else if (domain.endsWith('.au')) result.country = 'Australia';
    else if (domain.endsWith('.ng')) result.country = 'Nigeria';
    // add more countries as needed (Could implement another external API for this)
  }


  // verify the SUBMITTED email to check if it's real.
  const baseUrl = process.env.ANYMAIL_API_BASE_URL || "https://api.anymailfinder.com/v5.1";

  if (process.env.ANYMAIL_API_KEY && email) {
    try {
      const response = await fetch(`${baseUrl}/verify-email`, {
        method: "POST",
        headers: {
          "Authorization": process.env.ANYMAIL_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.email_status) {
          result.emailStatus = data.email_status;
        } else {
          result.emailStatus = 'not_found';
        }
      } else {
        console.warn(`Verification API failed: ${response.status}`);
        if (response.status >= 400 && response.status < 500) {
          result.emailStatus = 'not_found';
        }
      }
    } catch (error) {
      console.error("Enrichment API network error:", error);
      // Fail gracefully
    }
  }

  return result;
}
