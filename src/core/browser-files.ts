type PermissionAwareFileHandle = FileSystemFileHandle & {
  queryPermission?: (descriptor: { mode: "readwrite" }) => Promise<PermissionState>;
  requestPermission?: (descriptor: { mode: "readwrite" }) => Promise<PermissionState>;
};

const READWRITE_PERMISSION = { mode: "readwrite" } as const;

export async function ensureBrowserWritePermission(fileHandle: FileSystemFileHandle, name: string): Promise<void> {
  const handle = fileHandle as PermissionAwareFileHandle;
  if (!handle.queryPermission || !handle.requestPermission) return;
  if (await handle.queryPermission(READWRITE_PERMISSION) === "granted") return;
  if (await handle.requestPermission(READWRITE_PERMISSION) === "granted") return;
  throw new Error(`Write permission was not granted for ${name}. Reopen the source file or authorize its project folder with write access.`);
}

export async function writeBrowserFile(
  fileHandle: FileSystemFileHandle,
  content: string,
  expectedModifiedAt: number | undefined,
  name: string,
): Promise<number> {
  await ensureBrowserWritePermission(fileHandle, name);
  const existingFile = await fileHandle.getFile();
  if (expectedModifiedAt !== undefined && existingFile.lastModified !== expectedModifiedAt) {
    throw new Error(`File changed outside Lingrid: ${name}`);
  }
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
  const writtenFile = await fileHandle.getFile();
  if (await writtenFile.text() !== content) {
    throw new Error(`File write verification failed: ${name}`);
  }
  return writtenFile.lastModified;
}
