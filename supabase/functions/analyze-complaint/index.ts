const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalysisResult {
  issue: string;
  category: string;
  department: string;
  severity: string;
  reason: string;
}

const CATEGORY_DEPARTMENT_MAP: Record<string, string> = {
  "Waste Management": "Municipal Sanitation Department",
  "Roads": "Public Works/Roads Department",
  "Electrical": "Electrical Department",
  "Water": "Water Board",
  "Drainage": "Public Works",
  "Other": "General Municipal Services",
};

const CATEGORY_KEYWORDS: { category: string; keywords: string[] }[] = [
  {
    category: "Waste Management",
    keywords: ["garbage", "trash", "rubbish", "waste", "dump", "litter", "bin", "garbage bin", "overflow", "dumpster", "recycling", "landfill", "sewage", "foul smell", "rotting", "debris"],
  },
  {
    category: "Roads",
    keywords: ["pothole", "road", "street", "crack", "asphalt", "pavement", "sidewalk", "footpath", "crack", "broken road", "damaged road", "manhole", "speed bump", "curb", "potholes", "road surface"],
  },
  {
    category: "Electrical",
    keywords: ["streetlight", "street light", "lamp", "power", "electric", "electrical", "wire", "transformer", "pole", " blackout", "outage", "short circuit", "spark", "voltage", "meter", "cable", "junction box"],
  },
  {
    category: "Water",
    keywords: ["water", "pipe", "leak", "tap", "supply", "tank", "drinking water", "no water", "water pressure", "burst pipe", "contaminated water", "meter", "hydrant", "water main"],
  },
  {
    category: "Drainage",
    keywords: ["drain", "drainage", "gutter", "sewer", "overflow", "flood", "waterlogging", "stagnant water", "clogged drain", "manhole", "storm drain", "open drain", "blockage"],
  },
];

const HIGH_SEVERITY_INDICATORS = [
  "urgent", "emergency", "danger", "dangerous", "hazard", "hazardous",
  "accident", "injury", "injured", "fire", "flood", "electrocution", "shock",
  "collapse", "collapsed", "burst", "explosion", "contaminated", "toxic",
  "poison", "sewage", "raw sewage", "overflowing", "children", "school",
  "hospital", "main road", "heavy traffic", "live wire", "exposed wire",
  "major", "severe", "critical", "immediate", "blockage", "blocked",
];

const MEDIUM_SEVERITY_INDICATORS = [
  "accumulating", "piling", "growing", "increasing", "spreading",
  "frequent", "recurring", "ongoing", "persistent", "weeks",
  "days", "smell", "odor", "stink", "nuisance", "inconvenience",
  "damaged", "broken", "cracked", "leaking", "overflow", "clogged",
  "standing water", "stagnant", "dark", "flickering", "intermittent",
];

function categorize(text: string): { category: string; matchedKeyword: string } {
  const lower = text.toLowerCase();
  let bestCategory = "Other";
  let bestScore = 0;
  let matchedKeyword = "";

  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        score += kw.length > 6 ? 2 : 1;
        if (score > bestScore) {
          matchedKeyword = kw;
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return { category: bestCategory, matchedKeyword };
}

function generateIssueName(text: string, category: string): string {
  const lower = text.toLowerCase();

  if (category === "Waste Management") {
    if (lower.includes("overflow") || lower.includes("bin")) return "Overflowing Garbage Bin";
    if (lower.includes("dump") || lower.includes("accumulat") || lower.includes("piling")) return "Illegal Waste Accumulation";
    if (lower.includes("litter")) return "Street Littering";
    if (lower.includes("recycling")) return "Recycling Collection Issue";
    return "Waste Accumulation";
  }
  if (category === "Roads") {
    if (lower.includes("pothole")) return "Pothole on Road";
    if (lower.includes("sidewalk") || lower.includes("footpath")) return "Damaged Sidewalk";
    if (lower.includes("crack")) return "Road Surface Cracking";
    if (lower.includes("manhole")) return "Open Manhole Cover";
    if (lower.includes("curb")) return "Damaged Curb";
    return "Road Surface Damage";
  }
  if (category === "Electrical") {
    if (lower.includes("streetlight") || lower.includes("street light") || lower.includes("lamp")) return "Malfunctioning Streetlight";
    if (lower.includes("wire") || lower.includes("cable")) return "Exposed Electrical Wiring";
    if (lower.includes("transformer")) return "Transformer Issue";
    if (lower.includes("pole")) return "Damaged Electric Pole";
    if (lower.includes("outage") || lower.includes("blackout")) return "Power Outage";
    return "Electrical Fault";
  }
  if (category === "Water") {
    if (lower.includes("leak") || lower.includes("burst")) return "Water Pipe Leakage";
    if (lower.includes("no water") || lower.includes("supply")) return "Water Supply Disruption";
    if (lower.includes("contaminat") || lower.includes("dirty water")) return "Contaminated Water Supply";
    if (lower.includes("pressure")) return "Low Water Pressure";
    return "Water Infrastructure Issue";
  }
  if (category === "Drainage") {
    if (lower.includes("clog") || lower.includes("block")) return "Clogged Drain";
    if (lower.includes("flood") || lower.includes("waterlog") || lower.includes("stagnant")) return "Waterlogged Area";
    if (lower.includes("sewer") || lower.includes("sewage")) return "Sewage Overflow";
    if (lower.includes("open drain")) return "Open Drainage Hazard";
    return "Drainage Blockage";
  }

  return "Municipal Issue";
}

function assessSeverity(text: string): { severity: string; reason: string } {
  const lower = text.toLowerCase();

  const highHits = HIGH_SEVERITY_INDICATORS.filter((kw) => lower.includes(kw));
  const mediumHits = MEDIUM_SEVERITY_INDICATORS.filter((kw) => lower.includes(kw));

  if (highHits.length >= 2) {
    return {
      severity: "High",
      reason: `Multiple safety-risk indicators detected (${highHits.slice(0, 2).join(", ")}), requiring urgent intervention to prevent harm.`,
    };
  }

  if (highHits.length === 1) {
    return {
      severity: "High",
      reason: `The complaint mentions a high-risk condition ("${highHits[0]}") that could pose immediate danger to residents.`,
    };
  }

  if (mediumHits.length >= 3) {
    return {
      severity: "Medium",
      reason: `The issue shows multiple signs of escalation (${mediumHits.slice(0, 3).join(", ")}), warranting prompt attention before it worsens.`,
    };
  }

  if (mediumHits.length >= 1) {
    return {
      severity: "Medium",
      reason: `The complaint describes a persistent or worsening condition ("${mediumHits[0]}") that should be addressed in a timely manner.`,
    };
  }

  return {
    severity: "Low",
    reason: "The issue appears to be a routine municipal concern with no immediate safety or escalation indicators.",
  };
}

function analyzeComplaint(complaintText: string, hasImage: boolean): AnalysisResult {
  const { category, matchedKeyword } = categorize(complaintText);
  const issue = generateIssueName(complaintText, category);
  const department = CATEGORY_DEPARTMENT_MAP[category];
  const { severity, reason } = assessSeverity(complaintText);

  let finalReason = reason;
  if (hasImage) {
    finalReason += " Photographic evidence was provided, supporting the reported severity.";
  }

  return {
    issue,
    category,
    department,
    severity,
    reason: finalReason,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { complaint, image } = body as { complaint?: string; image?: string };

    if (!complaint || complaint.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Complaint text is required and must be at least 10 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = analyzeComplaint(complaint.trim(), !!image);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
