/*
# Fertilizer Recommendation System — Schema

1. New Tables
- `fertilizers`: Reference catalog of fertilizer types with N-P-K composition percentages, cost per kg, and suitability metadata. Used by the recommendation engine to look up fertilizer options.
- `recommendations`: Stores every recommendation request — user inputs (soil params, environmental conditions, crop) and the engine's output (recommended fertilizer(s), quantities, cost estimate, nutrient gap analysis, confidence). Acts as the historical record.

2. Security
- Single-tenant app (no auth). Enable RLS on both tables.
- `fertilizers`: public read-only (anon + authenticated SELECT). No inserts/updates/deletes via API — managed by migrations only.
- `recommendations`: full CRUD for anon + authenticated (shared/public data).

3. Notes
- `fertilizers.composition` is a JSONB column storing { n, p, k } percentages for flexible querying.
- `recommendations.input_data` stores the full input payload as JSONB.
- `recommendations.result_data` stores the full engine output as JSONB (recommended fertilizers, quantities, cost, gaps, confidence).
- A `confidence` numeric column is extracted for easy sorting/filtering.
*/

-- Fertilizer reference catalog
CREATE TABLE IF NOT EXISTS fertilizers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'NPK',
  composition jsonb NOT NULL,
  cost_per_kg numeric NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  suitable_ph_range text NOT NULL DEFAULT '5.5-7.5',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fertilizers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fertilizers_read_all" ON fertilizers;
CREATE POLICY "fertilizers_read_all" ON fertilizers FOR SELECT
TO anon, authenticated USING (true);

-- Recommendation records (historical)
CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Input parameters
  crop text NOT NULL,
  soil_type text NOT NULL,
  nitrogen numeric NOT NULL,
  phosphorus numeric NOT NULL,
  potassium numeric NOT NULL,
  ph numeric NOT NULL,
  temperature numeric NOT NULL,
  humidity numeric NOT NULL,
  rainfall numeric NOT NULL,
  -- Engine output
  recommended_fertilizer text NOT NULL,
  recommended_quantity_kg numeric NOT NULL,
  estimated_cost numeric NOT NULL DEFAULT 0,
  confidence numeric NOT NULL DEFAULT 0,
  input_data jsonb NOT NULL DEFAULT '{}',
  result_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recommendations_read_all" ON recommendations;
CREATE POLICY "recommendations_read_all" ON recommendations FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "recommendations_insert_all" ON recommendations;
CREATE POLICY "recommendations_insert_all" ON recommendations FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "recommendations_update_all" ON recommendations;
CREATE POLICY "recommendations_update_all" ON recommendations FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "recommendations_delete_all" ON recommendations;
CREATE POLICY "recommendations_delete_all" ON recommendations FOR DELETE
TO anon, authenticated USING (true);

-- Index for sorting by most recent
CREATE INDEX IF NOT EXISTS idx_recommendations_created_at ON recommendations (created_at DESC);
