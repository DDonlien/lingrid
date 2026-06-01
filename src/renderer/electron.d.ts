export {};

declare global {
  interface Window {
    lingrid?: {
      openFiles(extensions: string[]): Promise<Array<{ path: string; name: string; content: string; modifiedAt: number }>>;
      readFiles(paths: string[]): Promise<Array<{ path: string; name: string; content: string; modifiedAt: number }>>;
      writeFile(path: string, content: string, expectedModifiedAt?: number): Promise<number>;
      saveAs(name: string, content: string): Promise<string | undefined>;
    };
  }
}
