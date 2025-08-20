import { glob } from "glob";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { simpleGit } from "simple-git";
import { TARGET_REPOSITORY } from "./git-repository.ts";
import type { DocFile } from "./doc-file.ts";

export const loadDocs = async (): Promise<DocFile[]> => {
  const mdGlobPattern = "**/*.md";
  const targetDir = path.join(os.tmpdir(), "local-document-mcp");

  try {
    if (fs.existsSync(targetDir)) {
      await fs.promises.rm(targetDir, { recursive: true, force: false });
    }
  } catch (error) {
    console.error(`Error while deleting ${targetDir}: ${error}`);
  }

  await gitClone(targetDir);

  const docsParent = path.join(targetDir, TARGET_REPOSITORY.DOCS_PATH);
  const relativePaths = await glob(mdGlobPattern, { cwd: docsParent });

  if (!relativePaths.length) {
    console.error(`Markdown files not found in ${docsParent}.`);
    return [];
  }

  return await getDocFiles({ relativePaths, docsParent });
};

const gitClone = async (targetDir: string) => {
  const git = simpleGit();
  try {
    console.info(`Start cloning repo ${TARGET_REPOSITORY.URL} to ${targetDir}`);
    await git.clone(TARGET_REPOSITORY.URL, targetDir, [
      "--depth",
      "1",
      "--sparse",
      "--filter=blob:none",
    ]);
    await git.cwd(targetDir);
    await git.raw(["sparse-checkout", "set", TARGET_REPOSITORY.DOCS_PATH]);
    console.info(
      `Successfully cloned repo ${TARGET_REPOSITORY.URL} to ${targetDir}`
    );
  } catch (error) {
    console.error(
      `Error while cloning repo ${TARGET_REPOSITORY.URL} to ${targetDir}: ${error}`
    );
    throw error;
  }
};

const getDocFiles = async (args: {
  relativePaths: string[];
  docsParent: string;
}): Promise<DocFile[]> => {
  const { relativePaths, docsParent } = args;

  const files = await Promise.all(
    relativePaths.map(async (relativePath) => {
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
    })
  );

  return files.filter((file) => !!file);
};
