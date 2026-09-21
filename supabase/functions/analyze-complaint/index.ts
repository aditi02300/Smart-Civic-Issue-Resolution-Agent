import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisResult {
  issue: string;
  category: string;
  department: string;
  severity: 'Low' | 'Medium' | 'High';
  reason: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { complaint, image } = await req.json();

    if (!complaint || typeof complaint !== 'string' || complaint.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'Complaint text is required and must be at least 10 characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is not configured on the server.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `
You are an expert civic complaint classifier. Analyze the following complaint and return a JSON object with these exact fields:

- "issue": A short, clear title summarizing the problem (max 5 words)
- "category": One of: "Waste Management", "Roads", "Electrical", "Water", "Drainage", "Other"
- "department": The relevant municipal department name
- "severity": One of: "Low", "Medium", "High"
- "reason": A brief explanation (1-2 sentences) of why this classification was chosen

Complaint: "${complaint}"
${image ? `An image was also provided at: ${image}` : ''}

Return ONLY valid JSON, no markdown, no extra text.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a civic complaint classifier. Return only valid JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error?.message || `OpenAI API error (${response.status})`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('AI model returned an empty response.');
    }

    let result: AnalysisResult;
    try {
      result = JSON.parse(content);
    } catch {
      throw new Error('AI model returned invalid JSON.');
    }

    // Validate required fields
    const validCategories = ['Waste Management', 'Roads', 'Electrical', 'Water', 'Drainage', 'Other'];
    const validSeverities = ['Low', 'Medium', 'High'];

    if (!result.issue || !result.category || !result.department || !result.severity || !result.reason) {
      throw new Error('AI response is missing required fields.');
    }

    if (!validCategories.includes(result.category)) {
      result.category = 'Other';
    }

    if (!validSeverities.includes(result.severity)) {
      result.severity = 'Low';
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
