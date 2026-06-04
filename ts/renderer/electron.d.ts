export {};

declare global {
  interface Window {
    showOpenFilePicker?: (options?: {
      multiple?: boolean;
      types?: Array<{ description?: string; accept: Record<string, string[]> }>;
    }) => Promise<FileSystemFileHandle[]>;
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      types?: Array<{ description?: string; accept: Record<string, string[]> }>;
    }) => Promise<FileSystemFileHandle>;
    showDirectoryPicker?: (options?: { mode?: "read" | "readwrite" }) => Promise<FileSystemDirectoryHandle>;
  }

  interface FileSystemDirectoryHandle {
    entries(): AsyncIterableIterator<[string, FileSystemFileHandle | FileSystemDirectoryHandle]>;
  }

  interface Window {
    lingrid?: {
      openFiles(extensions: string[]): Promise<Array<{ path: string; name: string; content: string; modifiedAt: number }>>;
      readFiles(paths: string[]): Promise<{
        files: Array<{ path: string; name: string; content: string; modifiedAt: number }>;
        missingPaths: string[];
      }>;
      writeFile(path: string, content: string, expectedModifiedAt?: number): Promise<number>;
      saveAs(name: string, content: string): Promise<string | undefined>;
    };
  }
}
