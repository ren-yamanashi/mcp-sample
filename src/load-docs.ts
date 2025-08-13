import { glob } from "glob";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { simpleGit } from "simple-git";
import type { DocFile } from "./types.js";

export const loadDocs = async (): Promise<DocFile[]> => {
  const repoUrl = "https://github.com/ren-yamanashi/eslint-cdk-plugin";
  const docsPath = "docs/rules";
  const mdGlobPattern = "**/*.md";

  const targetDir = path.join(os.tmpdir(), "docs-local-mcp-server");

  try {
    if (fs.existsSync(targetDir)) {
      await fs.promises.rm(targetDir, { recursive: true, force: false });
    }
  } catch (error) {
    console.error(`Error while deleting ${targetDir}: ${error}`);
  }

  await gitClone({ repoUrl, targetDir, docsPath });

  const docsParent = path.join(targetDir, docsPath);
  const relativePaths = await glob(mdGlobPattern, { cwd: docsParent });

  if (!relativePaths.length) {
    console.error(`Markdown files not found in ${docsParent}.`);
    return [];
  }

  const docFiles = (
    await Promise.all(
      relativePaths.map((relativePath) =>
        getDocFile({ relativePath, docsParent })
      )
    )
  ).filter((file) => !!file);

  return docFiles;
};

const gitClone = async (args: {
  repoUrl: string;
  targetDir: string;
  docsPath: string;
}) => {
  const { repoUrl, targetDir, docsPath } = args;
  const git = simpleGit();
  try {
    console.info(`Start cloning repo ${repoUrl} to ${targetDir}`);
    await git.clone(repoUrl, targetDir, [
      "--depth",
      "1",
      "--sparse",
      "--filter=blob:none",
    ]);
    await git.cwd(targetDir);
    await git.raw(["sparse-checkout", "set", docsPath]);
    console.info(`Successfully cloned repo ${repoUrl} to ${targetDir}`);
  } catch (error) {
    console.error(
      `Error while cloning repo ${repoUrl} to ${targetDir}: ${error}`
    );
    throw error;
  }
};

const getDocFile = async (args: {
  relativePath: string;
  docsParent: string;
}): Promise<DocFile | null> => {
  const { relativePath, docsParent } = args;

  const absPath = path.join(docsParent, relativePath);
  try {
    const content = await fs.promises.readFile(absPath, "utf-8");
    return {
      path: relativePath,
      content: String(content),
    };
  } catch (error) {
    console.error(`Error reading file ${absPath}: ${error}`);
    return null;
  }
};
