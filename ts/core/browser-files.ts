type PermissionAwareFileHandle = FileSystemFileHandle & {
  queryPermission?: (descriptor: { mode: "readwrite" }) => Promise<PermissionState>;
  requestPermission?: (descriptor: { mode: "readwrite" }) => Promise<PermissionState>;
};

const READWRITE_PERMISSION = { mode: "readwrite" } as const;
export type BrowserFileDiagnostic = (event: string, details?: Record<string, unknown>) => void;

export async function ensureBrowserWritePermission(fileHandle: FileSystemFileHandle, name: string, log?: BrowserFileDiagnostic): Promise<void> {
  const handle = fileHandle as PermissionAwareFileHandle;
  if (!handle.queryPermission || !handle.requestPermission) {
    log?.("write.permission.unsupported", { name });
    return;
  }
  const queried = await handle.queryPermission(READWRITE_PERMISSION);
  log?.("write.permission.queried", { name, state: queried });
  if (queried === "granted") return;
  const requested = await handle.requestPermission(READWRITE_PERMISSION);
  log?.("write.permission.requested", { name, state: requested });
  if (requested === "granted") return;
  throw new Error(`Write permission was not granted for ${name}. Reopen the source file or authorize its project folder with write access.`);
}

export async function writeBrowserFile(
  fileHandle: FileSystemFileHandle,
  content: string,
  expectedModifiedAt: number | undefined,
  name: string,
  log?: BrowserFileDiagnostic,
): Promise<number> {
  log?.("write.start", { name, bytes: new Blob([content]).size, expectedModifiedAt });
  await verifyBrowserFileWritable(fileHandle, expectedModifiedAt, name, log);
  log?.("write.createWritable.start", { name });
  const writable = await fileHandle.createWritable();
  log?.("write.createWritable.success", { name });
  await writable.write(content);
  log?.("write.content.success", { name });
  await writable.close();
  log?.("write.close.success", { name });
  const writtenFile = await fileHandle.getFile();
  const writtenContent = await writtenFile.text();
  log?.("write.verify.readback", { name, bytes: writtenFile.size, modifiedAt: writtenFile.lastModified, matches: writtenContent === content });
  if (writtenContent !== content) {
    throw new Error(`File write verification failed: ${name}`);
  }
  return writtenFile.lastModified;
}

export async function verifyBrowserFileWritable(
  fileHandle: FileSystemFileHandle,
  expectedModifiedAt: number | undefined,
  name: string,
  log?: BrowserFileDiagnostic,
): Promise<void> {
  log?.("write.preflight.start", { name, expectedModifiedAt });
  await ensureBrowserWritePermission(fileHandle, name, log);
  const existingFile = await fileHandle.getFile();
  log?.("write.preflight.file", { name, bytes: existingFile.size, modifiedAt: existingFile.lastModified });
  if (expectedModifiedAt !== undefined && existingFile.lastModified !== expectedModifiedAt) {
    throw new Error(`File changed outside Lingrid: ${name}`);
  }
  log?.("write.preflight.success", { name });
}
