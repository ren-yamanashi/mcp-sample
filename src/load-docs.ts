import { glob } from "glob";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { simpleGit } from "simple-git";
import type { DocFile } from "./types.js";

export async function loadDocs(): Promise<DocFile[]> {
  const REPO = "https://github.com/ren-yamanashi/eslint-cdk-plugin";
  const BRANCH = "main";
  const DOCS_PATH = "docs/rules";
  const MARKDOWN_GLOB_PATTERN = "**/*.md";

  const targetDir = path.join(os.tmpdir(), "docs-local-mcp-server");

  try {
    if (fs.existsSync(targetDir)) {
      await fs.promises.rm(targetDir, { recursive: true, force: false });
    }
  } catch (error) {
    console.error(`Error while deleting targetDir ${targetDir}: ${error}`);
  }

  await gitClone({
    repoUrl: REPO,
    targetDir,
    docsPath: DOCS_PATH,
    branchName: BRANCH,
  });

  const docsParent = path.join(targetDir, DOCS_PATH);
  const relativePaths = await glob(MARKDOWN_GLOB_PATTERN, { cwd: docsParent });

  if (!relativePaths.length) {
    console.error(`No Markdown files found in ${docsParent}.`);
    return [];
  }

  // NOTE: get doc files
  const docFiles = (
    await Promise.all(
      relativePaths.map((relativePath) => getDocFile(relativePath, docsParent))
    )
  ).filter((file) => !!file);

  return docFiles;
}

const gitClone = async (args: {
  repoUrl: string;
  targetDir: string;
  docsPath: string;
  branchName: string;
}) => {
  const { repoUrl, targetDir, docsPath, branchName } = args;
  const git = simpleGit();
  try {
    console.info(`Start cloning repo ${repoUrl} to ${targetDir}`);
    await git.clone(repoUrl, targetDir, [
      "--depth",
      "1",
      "--branch",
      branchName,
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

const getDocFile = async (
  relativePath: string,
  docsParent: string
): Promise<DocFile | null> => {
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
