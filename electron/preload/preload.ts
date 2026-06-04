import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("lingrid", {
  openFiles: (extensions: string[]) => ipcRenderer.invoke("files:open", extensions),
  readFiles: (paths: string[]) => ipcRenderer.invoke("files:read-many", paths),
  writeFile: (path: string, content: string, expectedModifiedAt?: number) => ipcRenderer.invoke("files:write", path, content, expectedModifiedAt),
  saveAs: (name: string, content: string) => ipcRenderer.invoke("files:save-as", name, content),
});
