const MATTERPORT_GRAPHQL_URL =
  "https://api.matterport.com/api/models/graph";

export interface MatterportGraphQLTag {
  id: string;
  label: string;
  description: string | null;
  anchorPosition: { x: number; y: number; z: number };
}

export interface MatterportModelData {
  name: string;
  mattertags: MatterportGraphQLTag[];
}

/**
 * Fetch model data (including mattertags) from the Matterport GraphQL API.
 * Server-only — never import this from a client component.
 */
export async function fetchModelData(
  modelSid: string
): Promise<MatterportModelData> {
  const tokenId = process.env.MATTERPORT_API_TOKEN_ID;
  const tokenSecret = process.env.MATTERPORT_API_TOKEN_SECRET;

  if (!tokenId || !tokenSecret) {
    throw new Error(
      "Matterport API credentials not configured. Set MATTERPORT_API_TOKEN_ID and MATTERPORT_API_TOKEN_SECRET."
    );
  }

  const credentials = Buffer.from(`${tokenId}:${tokenSecret}`).toString(
    "base64"
  );

  const query = `
    query GetModelData($modelId: ID!) {
      model(id: $modelId) {
        name
        mattertags {
          id
          label
          description
          anchorPosition { x y z }
        }
      }
    }
  `;

  const response = await fetch(MATTERPORT_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      query,
      variables: { modelId: modelSid },
    }),
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(
      `Matterport API error: ${response.status} ${response.statusText}`
    );
  }

  const json = await response.json();

  if (json.errors) {
    throw new Error(
      `Matterport GraphQL error: ${json.errors[0]?.message || "Unknown error"}`
    );
  }

  const model = json.data.model;
  return {
    name: model.name,
    mattertags: model.mattertags || [],
  };
}
