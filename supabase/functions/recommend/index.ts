import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// =====================================================================
// TYPES
// =====================================================================

interface FertilizerInput {
  crop: string;
  soilType: string;
  nitrogen: number;      // N (kg/ha) — current soil N level
  phosphorus: number;    // P (kg/ha) — current soil P level
  potassium: number;     // K (kg/ha) — current soil K level
  ph: number;            // soil pH
  temperature: number;   // °C
  humidity: number;      // %
  rainfall: number;      // mm
  area: number;          // hectares (for quantity calc)
}

interface Fertilizer {
  id: string;
  name: string;
  category: string;
  composition: { n: number; p: number; k: number };
  cost_per_kg: number;
  description: string;
  suitable_ph_range: string;
}

interface RecommendationResult {
  primaryFertilizer: string;
  secondaryFertilizer: string | null;
  primaryQuantityKg: number;
  secondaryQuantityKg: number;
  totalCost: number;
  nutrientGaps: { n: number; p: number; k: number };
  nutrientSupplied: { n: number; p: number; k: number };
  confidence: number;
  reasoning: string[];
  warnings: string[];
}

// =====================================================================
// CROP NUTRIENT REQUIREMENTS DATABASE
// This is the swappable knowledge base. In production, this would be
// replaced by a trained ML model. Each crop has target N-P-K (kg/ha)
// for optimal yield, plus tolerable pH and climate ranges.
// =====================================================================

interface CropProfile {
  targetN: number;
  targetP: number;
  targetK: number;
  phRange: [number, number];
  tempRange: [number, number];
  humidityRange: [number, number];
  rainfallRange: [number, number];
}

const CROP_PROFILES: Record<string, CropProfile> = {
  rice:     { targetN: 100, targetP: 50,  targetK: 60,  phRange: [5.5, 7.0],  tempRange: [20, 35], humidityRange: [60, 90], rainfallRange: [1000, 2000] },
  wheat:    { targetN: 120, targetP: 60,  targetK: 50,  phRange: [6.0, 7.5],  tempRange: [10, 25], humidityRange: [40, 70], rainfallRange: [450, 900] },
  maize:    { targetN: 150, targetP: 70,  targetK: 80,  phRange: [5.8, 7.0],  tempRange: [18, 32], humidityRange: [50, 80], rainfallRange: [600, 1200] },
  cotton:   { targetN: 130, targetP: 65,  targetK: 90,  phRange: [6.0, 7.5],  tempRange: [20, 35], humidityRange: [50, 80], rainfallRange: [700, 1300] },
  sugarcane:{ targetN: 200, targetP: 80,  targetK: 100, phRange: [6.0, 7.5],  tempRange: [22, 35], humidityRange: [60, 85], rainfallRange: [1000, 1800] },
  soybean:  { targetN: 40,  targetP: 60,  targetK: 70,  phRange: [6.0, 7.0],  tempRange: [15, 30], humidityRange: [50, 80], rainfallRange: [500, 900] },
  tomato:   { targetN: 110, targetP: 70,  targetK: 90,  phRange: [5.5, 7.0],  tempRange: [18, 30], humidityRange: [50, 80], rainfallRange: [600, 1000] },
  potato:   { targetN: 130, targetP: 80,  targetK: 120, phRange: [5.0, 6.5],  tempRange: [15, 25], humidityRange: [60, 85], rainfallRange: [500, 800] },
  banana:   { targetN: 180, targetP: 70,  targetK: 150, phRange: [5.5, 7.5],  tempRange: [20, 35], humidityRange: [60, 90], rainfallRange: [1000, 2000] },
  groundnut:{ targetN: 30,  targetP: 50,  targetK: 60,  phRange: [5.5, 7.0],  tempRange: [20, 32], humidityRange: [40, 70], rainfallRange: [400, 800] },
};

const SOIL_TYPE_ADJUSTMENTS: Record<string, { n: number; p: number; k: number }> = {
  sandy:     { n: 1.2, p: 1.1, k: 1.3 },   // leaching — need more
  loamy:     { n: 1.0, p: 1.0, k: 1.0 },   // ideal
  clay:      { n: 0.9, p: 1.2, k: 0.8 },   // holds N/K, fixes P
  silty:     { n: 1.0, p: 1.0, k: 1.0 },
  peaty:     { n: 0.7, p: 1.1, k: 1.2 },
  chalky:    { n: 1.1, p: 1.3, k: 1.0 },
};

// =====================================================================
// VALIDATION
// =====================================================================

function validateInput(input: Partial<FertilizerInput>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.crop || typeof input.crop !== "string") {
    errors.push("Crop is required");
  } else if (!CROP_PROFILES[input.crop.toLowerCase()]) {
    errors.push(`Unsupported crop: "${input.crop}". Supported: ${Object.keys(CROP_PROFILES).join(", ")}`);
  }

  if (!input.soilType || typeof input.soilType !== "string") {
    errors.push("Soil type is required");
  }

  const numFields: (keyof FertilizerInput)[] = ["nitrogen", "phosphorus", "potassium", "ph", "temperature", "humidity", "rainfall"];
  for (const field of numFields) {
    const val = input[field];
    if (val === undefined || val === null || typeof val !== "number" || isNaN(val)) {
      errors.push(`${field} must be a valid number`);
    }
  }

  if (typeof input.ph === "number" && (input.ph < 0 || input.ph > 14)) {
    errors.push("pH must be between 0 and 14");
  }
  if (typeof input.temperature === "number" && (input.temperature < -20 || input.temperature > 60)) {
    errors.push("Temperature must be between -20°C and 60°C");
  }
  if (typeof input.humidity === "number" && (input.humidity < 0 || input.humidity > 100)) {
    errors.push("Humidity must be between 0% and 100%");
  }
  if (typeof input.rainfall === "number" && input.rainfall < 0) {
    errors.push("Rainfall cannot be negative");
  }
  if (typeof input.nitrogen === "number" && input.nitrogen < 0) errors.push("Nitrogen cannot be negative");
  if (typeof input.phosphorus === "number" && input.phosphorus < 0) errors.push("Phosphorus cannot be negative");
  if (typeof input.potassium === "number" && input.potassium < 0) errors.push("Potassium cannot be negative");

  const area = input.area ?? 1;
  if (typeof area !== "number" || area <= 0) {
    errors.push("Area must be a positive number (hectares)");
  }

  return { valid: errors.length === 0, errors };
}

// =====================================================================
// RECOMMENDATION ENGINE
// This module is designed to be swappable. The current implementation
// uses a rule-based nutrient-gap approach with cost optimization.
// A trained ML model could replace the `generateRecommendation` function
// while keeping the same interface.
// =====================================================================

function inRange(value: number, range: [number, number]): boolean {
  return value >= range[0] && value <= range[1];
}

function rangeScore(value: number, range: [number, number]): number {
  // Returns 0-1 based on how well the value fits the range.
  // 1.0 = perfectly within range, decreasing outside.
  if (inRange(value, range)) return 1.0;
  const mid = (range[0] + range[1]) / 2;
  const halfWidth = (range[1] - range[0]) / 2 || 1;
  const deviation = Math.abs(value - mid) - halfWidth;
  return Math.max(0, 1 - deviation / halfWidth);
}

function generateRecommendation(
  input: FertilizerInput,
  fertilizers: Fertilizer[]
): RecommendationResult {
  const crop = CROP_PROFILES[input.crop.toLowerCase()];
  const soilAdj = SOIL_TYPE_ADJUSTMENTS[input.soilType.toLowerCase()] || { n: 1, p: 1, k: 1 };

  // Step 1: Calculate nutrient gaps (target - current, adjusted for soil type)
  const nGap = Math.max(0, crop.targetN * soilAdj.n - input.nitrogen);
  const pGap = Math.max(0, crop.targetP * soilAdj.p - input.phosphorus);
  const kGap = Math.max(0, crop.targetK * soilAdj.k - input.potassium);

  // Step 2: Find the best fertilizer(s) to fill the gaps cost-effectively.
  // Strategy: pick the fertilizer with the highest coverage of the most
  // deficient nutrient at the lowest cost per unit of nutrient delivered.
  const reasoning: string[] = [];
  const warnings: string[] = [];

  reasoning.push(`Crop "${input.crop}" requires approximately ${crop.targetN}-${crop.targetP}-${crop.targetK} kg/ha N-P-K.`);
  reasoning.push(`Current soil levels: N=${input.nitrogen}, P=${input.phosphorus}, K=${input.potassium} kg/ha.`);
  reasoning.push(`Nutrient gaps after ${input.soilType} soil adjustment: N=${nGap.toFixed(1)}, P=${pGap.toFixed(1)}, K=${kGap.toFixed(1)} kg/ha.`);

  // Determine the dominant deficiency
  const gaps = [
    { nutrient: "n" as const, gap: nGap },
    { nutrient: "p" as const, gap: pGap },
    { nutrient: "k" as const, gap: kGap },
  ].sort((a, b) => b.gap - a.gap);

  const dominantGap = gaps[0];
  const secondaryGap = gaps[1];

  // Select primary fertilizer — the one that most efficiently fills the dominant gap
  let primary: Fertilizer | null = null;
  let bestScore = -1;

  for (const f of fertilizers) {
    const nutrientPct = f.composition[dominantGap.nutrient];
    if (nutrientPct <= 0) continue;

    // Score = nutrient concentration / cost (efficiency metric)
    const efficiency = nutrientPct / f.cost_per_kg;
    // Bonus if fertilizer also covers secondary gap
    const secondaryCoverage = f.composition[secondaryGap.nutrient] > 0 ? 1.1 : 1.0;
    const score = efficiency * secondaryCoverage;

    if (score > bestScore) {
      bestScore = score;
      primary = f;
    }
  }

  if (!primary) {
    throw new Error("No suitable fertilizer found for the given nutrient gaps");
  }

  // Calculate primary quantity (kg per hectare)
  const primaryNutrientPct = primary.composition[dominantGap.nutrient];
  const primaryQtyPerHa = dominantGap.gap > 0
    ? (dominantGap.gap / (primaryNutrientPct / 100))
    : 10; // minimal maintenance dose if no gap

  let primaryQty = primaryQtyPerHa * input.area;

  // After primary, check remaining gaps
  const nFromPrimary = (primary.composition.n / 100) * primaryQtyPerHa;
  const pFromPrimary = (primary.composition.p / 100) * primaryQtyPerHa;
  const kFromPrimary = (primary.composition.k / 100) * primaryQtyPerHa;

  const remainingN = Math.max(0, nGap - nFromPrimary);
  const remainingP = Math.max(0, pGap - pFromPrimary);
  const remainingK = Math.max(0, kGap - kFromPrimary);

  // Select secondary fertilizer for the next biggest remaining gap
  let secondary: Fertilizer | null = null;
  let secondaryQtyPerHa = 0;
  const remainingGaps = [
    { nutrient: "n" as const, gap: remainingN },
    { nutrient: "p" as const, gap: remainingP },
    { nutrient: "k" as const, gap: remainingK },
  ].filter(g => g.gap > 1).sort((a, b) => b.gap - a.gap);

  if (remainingGaps.length > 0) {
    const targetNutrient = remainingGaps[0].nutrient;
    let bestSecScore = -1;

    for (const f of fertilizers) {
      if (f.id === primary.id) continue;
      const pct = f.composition[targetNutrient];
      if (pct <= 0) continue;
      const efficiency = pct / f.cost_per_kg;
      if (efficiency > bestSecScore) {
        bestSecScore = efficiency;
        secondary = f;
      }
    }

    if (secondary) {
      const secPct = secondary.composition[targetNutrient];
      secondaryQtyPerHa = remainingGaps[0].gap / (secPct / 100);
    }
  }

  const secondaryQty = secondaryQtyPerHa * input.area;

  // Total nutrient supplied
  const totalN = nFromPrimary + (secondary ? (secondary.composition.n / 100) * secondaryQtyPerHa : 0);
  const totalP = pFromPrimary + (secondary ? (secondary.composition.p / 100) * secondaryQtyPerHa : 0);
  const totalK = kFromPrimary + (secondary ? (secondary.composition.k / 100) * secondaryQtyPerHa : 0);

  // Cost calculation
  const totalCost = primaryQty * primary.cost_per_kg + (secondary ? secondaryQty * secondary.cost_per_kg : 0);

  reasoning.push(`Primary fertilizer: ${primary.name} (${primary.composition.n}-${primary.composition.p}-${primary.composition.k}) at ${primaryQty.toFixed(1)} kg for ${input.area} ha.`);
  if (secondary) {
    reasoning.push(`Secondary fertilizer: ${secondary.name} (${secondary.composition.n}-${secondary.composition.p}-${secondary.composition.k}) at ${secondaryQty.toFixed(1)} kg for ${input.area} ha.`);
  } else {
    reasoning.push(`No secondary fertilizer needed — primary covers all nutrient gaps.`);
  }
  reasoning.push(`Estimated total cost: $${totalCost.toFixed(2)}.`);

  // pH and climate warnings
  if (!inRange(input.ph, crop.phRange)) {
    const direction = input.ph < crop.phRange[0] ? "acidic" : "alkaline";
    warnings.push(`Soil pH (${input.ph}) is too ${direction} for ${input.crop}. Ideal range: ${crop.phRange[0]}-${crop.phRange[1]}. Consider liming (if acidic) or adding sulfur (if alkaline).`);
  }

  if (!inRange(input.temperature, crop.tempRange)) {
    warnings.push(`Temperature (${input.temperature}°C) is outside the optimal range (${crop.tempRange[0]}-${crop.tempRange[1]}°C) for ${input.crop}. Yield may be affected.`);
  }

  if (!inRange(input.humidity, crop.humidityRange)) {
    warnings.push(`Humidity (${input.humidity}%) is outside the ideal range (${crop.humidityRange[0]}-${crop.humidityRange[1]}%) for ${input.crop}.`);
  }

  if (!inRange(input.rainfall, crop.rainfallRange)) {
    const direction = input.rainfall < crop.rainfallRange[0] ? "low" : "high";
    warnings.push(`Rainfall (${input.rainfall}mm) is ${direction} for ${input.crop}. Ideal: ${crop.rainfallRange[0]}-${crop.rainfallRange[1]}mm. ${direction === "low" ? "Consider irrigation." : "Ensure proper drainage."}`);
  }

  // Confidence score — based on how well environmental conditions match crop requirements
  const phScore = rangeScore(input.ph, crop.phRange);
  const tempScore = rangeScore(input.temperature, crop.tempRange);
  const humidityScore = rangeScore(input.humidity, crop.humidityRange);
  const rainfallScore = rangeScore(input.rainfall, crop.rainfallRange);
  // Nutrient coverage — how much of the gap is filled
  const totalGap = nGap + pGap + kGap || 1;
  const totalSupplied = totalN + totalP + totalK;
  const coverageScore = Math.min(1, totalSupplied / totalGap);

  const confidence = Math.round(
    (phScore * 0.25 + tempScore * 0.20 + humidityScore * 0.15 + rainfallScore * 0.15 + coverageScore * 0.25) * 100
  );

  return {
    primaryFertilizer: primary.name,
    secondaryFertilizer: secondary?.name ?? null,
    primaryQuantityKg: Math.round(primaryQty * 10) / 10,
    secondaryQuantityKg: Math.round(secondaryQty * 10) / 10,
    totalCost: Math.round(totalCost * 100) / 100,
    nutrientGaps: { n: Math.round(nGap * 10) / 10, p: Math.round(pGap * 10) / 10, k: Math.round(kGap * 10) / 10 },
    nutrientSupplied: {
      n: Math.round(totalN * 10) / 10,
      p: Math.round(totalP * 10) / 10,
      k: Math.round(totalK * 10) / 10,
    },
    confidence,
    reasoning,
    warnings,
  };
}

// =====================================================================
// MAIN HANDLER
// =====================================================================

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // GET /functions/v1/recommend → list recent recommendations (history)
    if (req.method === "GET") {
      const url = new URL(req.url);
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);

      const { data, error } = await supabase
        .from("recommendations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return new Response(JSON.stringify({ recommendations: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /functions/v1/recommend → generate recommendation
    if (req.method === "POST") {
      const input = await req.json();

      const { valid, errors } = validateInput(input);
      if (!valid) {
        return new Response(JSON.stringify({ error: "Validation failed", details: errors }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const sanitizedInput: FertilizerInput = {
        crop: input.crop,
        soilType: input.soilType,
        nitrogen: input.nitrogen,
        phosphorus: input.phosphorus,
        potassium: input.potassium,
        ph: input.ph,
        temperature: input.temperature,
        humidity: input.humidity,
        rainfall: input.rainfall,
        area: input.area || 1,
      };

      // Fetch fertilizer catalog from database
      const { data: fertData, error: fertError } = await supabase
        .from("fertilizers")
        .select("*");

      if (fertError) throw fertError;
      if (!fertData || fertData.length === 0) {
        throw new Error("Fertilizer catalog is empty");
      }

      const fertilizers: Fertilizer[] = fertData.map((f: any) => ({
        id: f.id,
        name: f.name,
        category: f.category,
        composition: f.composition,
        cost_per_kg: parseFloat(f.cost_per_kg),
        description: f.description,
        suitable_ph_range: f.suitable_ph_range,
      }));

      // Run the recommendation engine
      const result = generateRecommendation(sanitizedInput, fertilizers);

      // Persist to database
      const { data: record, error: insertError } = await supabase
        .from("recommendations")
        .insert({
          crop: sanitizedInput.crop,
          soil_type: sanitizedInput.soilType,
          nitrogen: sanitizedInput.nitrogen,
          phosphorus: sanitizedInput.phosphorus,
          potassium: sanitizedInput.potassium,
          ph: sanitizedInput.ph,
          temperature: sanitizedInput.temperature,
          humidity: sanitizedInput.humidity,
          rainfall: sanitizedInput.rainfall,
          recommended_fertilizer: result.secondaryFertilizer
            ? `${result.primaryFertilizer} + ${result.secondaryFertilizer}`
            : result.primaryFertilizer,
          recommended_quantity_kg: result.primaryQuantityKg + result.secondaryQuantityKg,
          estimated_cost: result.totalCost,
          confidence: result.confidence,
          input_data: sanitizedInput,
          result_data: result,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return new Response(JSON.stringify({
        id: record.id,
        recommendation: result,
        input: sanitizedInput,
        created_at: record.created_at,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE /functions/v1/recommend?id=xxx → delete a recommendation
    if (req.method === "DELETE") {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");
      if (!id) {
        return new Response(JSON.stringify({ error: "Missing id parameter" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("recommendations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
