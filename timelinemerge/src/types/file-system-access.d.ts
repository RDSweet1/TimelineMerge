/**
 * Type declarations for File System Access API
 * https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API
 */

interface FileSystemHandle {
  readonly kind: 'file' | 'directory';
  readonly name: string;
}

interface FileSystemFileHandle extends FileSystemHandle {
  readonly kind: 'file';
  getFile(): Promise<File>;
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
  readonly kind: 'directory';
  values(): AsyncIterableIterator<FileSystemHandle>;
  getFileHandle(name: string): Promise<FileSystemFileHandle>;
  getDirectoryHandle(name: string): Promise<FileSystemDirectoryHandle>;
}

interface Window {
  showDirectoryPicker(options?: {
    mode?: 'read' | 'readwrite';
  }): Promise<FileSystemDirectoryHandle>;
}
