// lib/api/admin-files.ts
// File Upload/Delete API

export interface FileUploadResult {
  url: string;
  publicId: string;
  size: number;
}

export interface FileItem {
  url: string;
  publicId: string;
  size: number;
  folder?: string;
  createdAt?: string;
}

async function uploadForm(
  endpoint: string,
  file: File,
  folder: string,
): Promise<FileUploadResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('folder', folder);
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
  const res = await fetch(`${apiBase}${endpoint}`, {
    method: 'POST',
    body: form,
    credentials: 'include',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Upload failed');
  return json.data;
}

async function deleteFile(fileUrl: string): Promise<void> {
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
  const res = await fetch(`${apiBase}/admin/upload?fileUrl=${encodeURIComponent(fileUrl)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Delete failed');
}

export const fileApi = {
  upload: (file: File, folder?: string) =>
    uploadForm('/admin/upload', file, folder || 'misc'),

  uploadImage: (file: File, folder?: string) =>
    uploadForm('/admin/upload/image', file, folder || 'images'),

  uploadDocument: (file: File, folder?: string) =>
    uploadForm('/admin/upload/document', file, folder || 'documents'),

  delete: (fileUrl: string) => deleteFile(fileUrl),
};
