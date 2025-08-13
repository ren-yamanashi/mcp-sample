import type { DocFile } from "../../shared/doc-file.js";

export const searchDocs = async (args: {
  docsIndexes: DocFile[];
  queries: string[];
  offset: number;
  limit: number;
}): Promise<DocFile[]> => {
  const { docsIndexes, queries, offset, limit } = args;

  // NOTE: 1. prioritize title match
  const result = docsIndexes
    .filter((doc) => queries.some((query) => doc.path.includes(query)))
    .slice(offset, offset + limit);
  if (result.length >= limit) return result;

  // NOTE: 2. if title match was not enough, then content match
  const byContent = docsIndexes
    .filter((doc) => queries.some((query) => doc.content.includes(query)))
    .slice(offset, offset + (limit - result.length));
  result.push(...byContent);

  return result;
};
