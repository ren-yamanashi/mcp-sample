import type { DocFile } from "../shared/doc-file.js";
import pj from "../../package.json" with { type: "json" };
import { TARGET_REPOSITORY } from "../shared/repository.js";

interface GitHubFile {
  name: string;
  path: string;
  download_url: string;
  type: string;
}

export const fetchDocs = async (): Promise<DocFile[]> => {
  const apiUrl = `https://api.github.com/repos/${TARGET_REPOSITORY.OWNER}/${TARGET_REPOSITORY.NAME}/contents/${TARGET_REPOSITORY.DOCS_PATH}`;

  console.info(`Fetching documentation from ${apiUrl}`);

  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": `${pj.name}/${pj.version}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}`
    );
  }

  const files: GitHubFile[] = await response.json().then((data) => {
    if (!Array.isArray(data) || data.some((item) => !isGithubFile(item))) {
      throw new Error("Unexpected response format from GitHub API");
    }
    return data;
  });

  const mdFiles = files.filter(
    ({ type, name }) => type === "file" && name.endsWith(".md")
  );

  if (!mdFiles.length) {
    console.error(`No markdown files found in ${TARGET_REPOSITORY.DOCS_PATH}.`);
    return [];
  }

  const docFiles = (
    await Promise.all(mdFiles.map(async (file) => await getDocFile(file)))
  ).filter((file) => !!file);

  return docFiles;
};

const getDocFile = async (file: GitHubFile): Promise<DocFile | null> => {
  try {
    const contentResponse = await fetch(file.download_url, {
      headers: { "User-Agent": `${pj.name}/${pj.version}` },
    });

    if (!contentResponse.ok) {
      throw new Error(
        `Failed to fetch ${file.path}: ${contentResponse.status}`
      );
    }

    const content = await contentResponse.text();

    return {
      path: file.name,
      content,
    };
  } catch (error) {
    console.error(`Error fetching file ${file.path}: ${error}`);
    return null;
  }
};

const isGithubFile = (file: unknown): file is GitHubFile => {
  return (
    typeof file === "object" &&
    file !== null &&
    "name" in file &&
    typeof file.name === "string" &&
    "path" in file &&
    typeof file.path === "string" &&
    "download_url" in file &&
    typeof file.download_url === "string" &&
    "type" in file &&
    typeof file.type === "string"
  );
};
