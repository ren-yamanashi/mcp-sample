import { glob } from "glob";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { simpleGit } from "simple-git";
import { TARGET_REPOSITORY } from "../../shared/repository.js";
import type { DocFile } from "../../shared/doc-file.js";

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

  const docFiles = (
    await Promise.all(
      relativePaths.map((relativePath) =>
        getDocFile({ relativePath, docsParent })
      )
    )
  ).filter((file) => !!file);

  return docFiles;
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
