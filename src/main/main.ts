import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 720,
    title: "Lingrid 灵译",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(currentDir, "../preload/preload.js"),
    },
  });
  const devUrl = process.env.VITE_DEV_SERVER_URL ?? "http://localhost:5173";
  if (!app.isPackaged) void window.loadURL(devUrl);
  else void window.loadFile(join(currentDir, "../dist/index.html"));
}

ipcMain.handle("files:open", async (_event, extensions: string[]) => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile", "multiSelections"],
    filters: [{ name: "Lingrid files", extensions }],
  });
  if (result.canceled) return [];
  return Promise.all(
    result.filePaths.map(async (path) => ({
      path,
      name: path.split("/").pop() ?? path,
      content: await readFile(path, "utf8"),
      modifiedAt: (await stat(path)).mtimeMs,
    })),
  );
});

ipcMain.handle("files:write", async (_event, path: string, content: string, expectedModifiedAt?: number) => {
  if (expectedModifiedAt && (await stat(path)).mtimeMs !== expectedModifiedAt) {
    throw new Error(`File changed outside Lingrid: ${path}`);
  }
  await writeFile(path, content, "utf8");
  return (await stat(path)).mtimeMs;
});

ipcMain.handle("files:read-many", async (_event, paths: string[]) =>
  Promise.all(
    paths.map(async (path) => ({
      path,
      name: path.split("/").pop() ?? path,
      content: await readFile(path, "utf8"),
      modifiedAt: (await stat(path)).mtimeMs,
    })),
  ),
);

ipcMain.handle("files:save-as", async (_event, name: string, content: string) => {
  const result = await dialog.showSaveDialog({ defaultPath: name });
  if (result.canceled || !result.filePath) return undefined;
  await writeFile(result.filePath, content, "utf8");
  return result.filePath;
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
