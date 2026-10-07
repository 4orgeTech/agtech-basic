import { getAuthHeaders, EDGE_FUNCTION_URL } from "./supabase";
import type { FertilizerInput, ApiResponse, RecommendationRecord } from "./types";

export async function getRecommendation(
  input: FertilizerInput,
): Promise<ApiResponse> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const message =
      errBody?.error ||
      errBody?.details?.join("; ") ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }

  const data = await response.json();

  if (!data?.recommendation) {
    throw new Error("Invalid response from recommendation engine");
  }

  return data as ApiResponse;
}

export async function getHistory(
  limit = 20,
): Promise<RecommendationRecord[]> {
  const response = await fetch(
    `${EDGE_FUNCTION_URL}?limit=${limit}`,
    { method: "GET", headers: getAuthHeaders() },
  );

  if (!response.ok) {
    throw new Error(`Failed to load history (${response.status})`);
  }

  const data = await response.json();
  if (!data?.recommendations) {
    return [];
  }
  return data.recommendations as RecommendationRecord[];
}

export async function deleteRecommendation(id: string): Promise<void> {
  const response = await fetch(`${EDGE_FUNCTION_URL}?id=${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete record (${response.status})`);
  }
}
