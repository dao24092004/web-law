'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Upload, Image, FileText, Trash2, Copy, CheckCircle2, XCircle,
  Loader2, FolderOpen, Grid, List, Search, RefreshCw, File, Download
} from 'lucide-react';
import { AdminPageHeader, ConfirmDialog } from '@/features/admin/shared';
import { useApiMutation } from '@/lib/api/hooks';
import type { FileItem, FileUploadResult } from '@/lib/api/admin-files';
import { notifySuccess, notifyError } from '@/features/admin/lib';

const FOLDER_OPTIONS = [
  { value: 'misc', label: 'Misc' },
  { value: 'images', label: 'Images' },
  { value: 'documents', label: 'Documents' },
  { value: 'blog', label: 'Blog' },
  { value: 'services', label: 'Services' },
  { value: 'lawyers', label: 'Lawyers' },
  { value: 'case-studies', label: 'Case Studies' },
  { value: 'landing-pages', label: 'Landing Pages' },
  { value: 'jobs', label: 'Jobs' },
];

export default function FileManagerPage() {
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [folder, setFolder] = useState('images');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImageMutation = useApiMutation<FileUploadResult, FormData>(
    'POST',
    () => '/admin/upload/image',
  );
  const uploadDocMutation = useApiMutation<FileUploadResult, FormData>(
    'POST',
    () => '/admin/upload/document',
  );
  const deleteMutation = useApiMutation<unknown, { fileUrl: string }>(
    'DELETE',
    () => '/admin/upload',
  );

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    for (const file of Array.from(files)) {
      try {
        const form = new FormData();
        form.append('file', file);
        form.append('folder', folder);
        const result = folder === 'images'
          ? await uploadImageMutation.mutateAsync(form)
          : await uploadDocMutation.mutateAsync(form);
        notifySuccess(`Da tai len: ${file.name}`);
        setSelectedFiles(prev => [{
          url: result.url,
          publicId: result.publicId,
          size: result.size,
          folder,
        }, ...prev]);
      } catch (err) {
        notifyError(`Loi tai file: ${file.name}`);
      }
    }
  }, [folder, uploadImageMutation, uploadDocMutation]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
    notifySuccess('Da copy URL');
  };

  const handleDelete = async (fileUrl: string) => {
    try {
      await deleteMutation.mutateAsync({ fileUrl });
      setSelectedFiles(prev => prev.filter(f => f.url !== fileUrl));
      setDeleteConfirm(null);
      notifySuccess('Da xoa file');
    } catch (err) {
      notifyError('Loi xoa file');
    }
  };

  const getFileIcon = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(ext)) {
      return <Image size={24} />;
    }
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(ext)) {
      return <FileText size={24} />;
    }
    return <File size={24} />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileName = (url: string) => {
    return url.split('/').pop() || url;
  };

  return (
    <div className="admin-view">
      <AdminPageHeader
        title="Quan ly File"
        subtitle="Tai len va quan ly cac file da upload len he thong"
      />

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--gray-300)'}`,
          borderRadius: 10,
          padding: 24,
          textAlign: 'center',
          marginBottom: 16,
          background: isDragging ? 'rgba(30, 58, 95, 0.05)' : 'var(--gray-50)',
          transition: 'all 0.15s',
          cursor: 'pointer',
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploadImageMutation.isPending || uploadDocMutation.isPending ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
            <span>dang tai...</span>
          </div>
        ) : (
          <>
            <Upload size={32} style={{ margin: '0 auto 8px', color: 'var(--gray-400)' }} />
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              Keo tha file hoac click de chon
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>
              Hinh anh, PDF, Word, Excel (max 10MB moi file)
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 16,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        {/* Folder select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FolderOpen size={16} style={{ color: 'var(--gray-500)' }} />
          <select
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            style={{
              padding: '6px 12px',
              border: '1px solid var(--gray-300)',
              borderRadius: 6,
              fontSize: '0.85rem',
              background: 'white',
            }}
          >
            {FOLDER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* View mode toggle */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            style={{
              padding: '6px 10px',
              border: '1px solid',
              borderColor: viewMode === 'grid' ? 'var(--primary)' : 'var(--gray-300)',
              borderRadius: '6px 0 0 6px',
              background: viewMode === 'grid' ? 'var(--primary)' : 'white',
              color: viewMode === 'grid' ? 'white' : 'var(--gray-600)',
              cursor: 'pointer',
            }}
          >
            <Grid size={14} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            style={{
              padding: '6px 10px',
              border: '1px solid',
              borderColor: viewMode === 'list' ? 'var(--primary)' : 'var(--gray-300)',
              borderRadius: '0 6px 6px 0',
              background: viewMode === 'list' ? 'var(--primary)' : 'white',
              color: viewMode === 'list' ? 'white' : 'var(--gray-600)',
              cursor: 'pointer',
            }}
          >
            <List size={14} />
          </button>
        </div>

        <div style={{ flex: 1 }} />

        <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>
          {selectedFiles.length} file(s)
        </span>
      </div>

      {/* File list */}
      {selectedFiles.length === 0 ? (
        <div style={{
          padding: 40,
          textAlign: 'center',
          color: 'var(--gray-400)',
          background: 'white',
          border: '1px solid var(--gray-200)',
          borderRadius: 10,
        }}>
          <FolderOpen size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <div>Chua co file nao</div>
          <div style={{ fontSize: '0.78rem', marginTop: 4 }}>
            Tai len file dau tien de bat dau
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 12,
        }}>
          {selectedFiles.map((file, i) => (
            <div
              key={file.url + i}
              style={{
                background: 'white',
                border: '1px solid var(--gray-200)',
                borderRadius: 8,
                overflow: 'hidden',
                transition: 'all 0.15s',
              }}
            >
              {/* Preview */}
              <div style={{
                height: 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--gray-50)',
                color: 'var(--gray-400)',
              }}>
                {getFileIcon(file.url)}
              </div>
              {/* Info */}
              <div style={{ padding: 10 }}>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginBottom: 4,
                }}>
                  {getFileName(file.url)}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)', marginBottom: 8 }}>
                  {formatSize(file.size)}
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(file.url)}
                    style={{
                      flex: 1,
                      padding: '4px 8px',
                      background: copiedUrl === file.url ? 'var(--success)' : 'var(--gray-100)',
                      color: copiedUrl === file.url ? 'white' : 'var(--gray-600)',
                      border: 'none',
                      borderRadius: 4,
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                  >
                    {copiedUrl === file.url ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(file.url)}
                    style={{
                      padding: '4px 8px',
                      background: 'var(--danger)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>File</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', width: 100 }}>Folder</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', width: 100 }}>Size</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {selectedFiles.map((file, i) => (
                <tr key={file.url + i} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ color: 'var(--gray-400)' }}>{getFileIcon(file.url)}</div>
                      <div>
                        <div style={{ fontWeight: 600, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {getFileName(file.url)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {file.url}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      padding: '2px 8px',
                      background: 'var(--gray-100)',
                      borderRadius: 4,
                      fontSize: '0.72rem',
                    }}>
                      {file.folder || 'misc'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--gray-500)' }}>
                    {formatSize(file.size)}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(file.url)}
                        style={{
                          padding: '4px 8px',
                          background: copiedUrl === file.url ? 'var(--success)' : 'var(--primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: '0.72rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {copiedUrl === file.url ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(file.url)}
                        style={{
                          padding: '4px 8px',
                          background: 'var(--danger)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Xac nhan xoa file"
        message="Ban co chac chan muon xoa file nay? Hanh dong nay khong the hoan tac."
        confirmLabel="Xoa"
        variant="danger"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
