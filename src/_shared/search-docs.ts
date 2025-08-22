import type { DocFile } from "./doc-file.ts";

export const searchDocs = async (args: {
  docsIndexes: DocFile[];
  queries: string[];
  offset: number;
  limit: number;
}): Promise<DocFile[]> => {
  const { docsIndexes, queries, offset, limit } = args;

  const result = docsIndexes
    .filter((doc) => queries.some((query) => doc.path.includes(query)))
    .slice(offset, offset + limit);
  if (result.length >= limit) return result;
  return result;
};
