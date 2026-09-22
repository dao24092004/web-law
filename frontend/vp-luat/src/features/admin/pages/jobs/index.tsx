'use client';

import { useState, useMemo } from 'react';
import { Briefcase, Plus, Search, Eye, Trash2, CheckCircle, XCircle, Users } from 'lucide-react';
import { AdminPageHeader, SearchBar, ConfirmDialog } from '@/features/admin/shared';
import {
  useJobs,
  useJobApplications,
  useCreateJob,
  useUpdateJob,
  useDeleteJob,
  usePublishJob,
  useUpdateApplicationStatus,
  JOB_STATUS_OPTIONS,
  APPLICATION_STATUS_OPTIONS,
} from './hooks/use-jobs';
import type { JobPosting, JobApplication } from '@/lib/api/admin-jobs';

type Tab = 'jobs' | 'applications';

export default function JobsPage() {
  const [tab, setTab] = useState<Tab>('jobs');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<JobPosting | null>(null);

  const { data: jobsData, isLoading: jobsLoading } = useJobs(0, 100, statusFilter || undefined);
  const { data: appsData, isLoading: appsLoading } = useJobApplications(0, 100, undefined, statusFilter || undefined);

  const jobs = jobsData.content || [];
  const applications = appsData.content || [];

  const filteredJobs = useMemo(() => {
    if (!search) return jobs;
    const q = search.toLowerCase();
    return jobs.filter(
      (j) =>
        j.title?.toLowerCase().includes(q) ||
        j.location?.toLowerCase().includes(q) ||
        j.category?.toLowerCase().includes(q),
    );
  }, [jobs, search]);

  const filteredApps = useMemo(() => {
    if (!search) return applications;
    const q = search.toLowerCase();
    return applications.filter(
      (a) =>
        a.fullName?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.jobTitle?.toLowerCase().includes(q),
    );
  }, [applications, search]);

  const stats = useMemo(() => ({
    totalJobs: jobs.length,
    openJobs: jobs.filter((j) => j.status === 'PUBLISHED').length,
    totalApps: applications.length,
    newApps: applications.filter((a) => a.status === 'NEW').length,
  }), [jobs, applications]);

  return (
    <div className="admin-view">
      <AdminPageHeader
        title="Tuyen dung"
        subtitle="Quan ly tin tuyen dung va ho so ung vien"
        actions={
          tab === 'jobs' && (
            <button type="button" className="action-btn action-btn--primary">
              <Plus size={12} /> Tao tin tuyen dung
            </button>
          )
        }
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
        <StatCard label="Tong tin" value={stats.totalJobs} color="var(--primary)" />
        <StatCard label="Dang mo" value={stats.openJobs} color="var(--success)" />
        <StatCard label="Ho so" value={stats.totalApps} color="var(--blue)" />
        <StatCard label="Ho so moi" value={stats.newApps} color="var(--warning)" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        <button
          type="button"
          className={tab === 'jobs' ? 'action-btn action-btn--primary' : 'action-btn'}
          onClick={() => setTab('jobs')}
        >
          <Briefcase size={12} /> Tin tuyen dung ({stats.totalJobs})
        </button>
        <button
          type="button"
          className={tab === 'applications' ? 'action-btn action-btn--primary' : 'action-btn'}
          onClick={() => setTab('applications')}
        >
          <Users size={12} /> Ho so ({stats.totalApps})
        </button>
      </div>

      {/* Filter */}
      <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' as const }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Tim kiem..." />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="action-btn"
            style={{ padding: '6px 10px', fontSize: '0.8rem' }}
          >
            <option value="">Tat ca trang thai</option>
            {tab === 'jobs'
              ? JOB_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))
              : APPLICATION_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {tab === 'jobs' ? (
        <JobsList
          jobs={filteredJobs}
          isLoading={jobsLoading}
          onDelete={(j) => setConfirmDelete(j)}
        />
      ) : (
        <ApplicationsList
          applications={filteredApps}
          isLoading={appsLoading}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            // TODO: call delete hook
            setConfirmDelete(null);
          }
        }}
        title="Xoa tin tuyen dung"
        message={confirmDelete ? `Xoa "${confirmDelete.title}"? Hanh dong khong the hoan tac.` : ''}
        confirmLabel="Xoa"
        variant="danger"
      />
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 12, textAlign: 'center' as const }}>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>{label}</div>
    </div>
  );
}

interface JobsListProps {
  jobs: JobPosting[];
  isLoading: boolean;
  onDelete: (j: JobPosting) => void;
}

function JobsList({ jobs, isLoading, onDelete }: JobsListProps) {
  if (isLoading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>Dang tai...</div>;
  if (jobs.length === 0) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--gray-400)' }}>
        <Briefcase size={48} style={{ opacity: 0.2, margin: '0 auto 12px', display: 'block' }} />
        <div>Chua co tin tuyen dung nao</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {jobs.map((job) => {
        const statusOpt = JOB_STATUS_OPTIONS.find((o) => o.value === job.status);
        return (
          <div key={job.id} style={{
            background: 'white', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 16,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>
                {job.title}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
                <span>{job.category}</span>
                <span>{job.location}</span>
                {job.employmentType && <span>{job.employmentType}</span>}
                {job.salary && <span>{job.salary}</span>}
                <span>{job.applicationCount || 0} ho so</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                padding: '2px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600,
                background: statusOpt?.color ? `${statusOpt.color}20` : 'var(--gray-100)',
                color: statusOpt?.color || 'var(--gray-600)',
              }}>
                {statusOpt?.label || job.status}
              </span>
              <button type="button" className="action-btn" title="Xem">
                <Eye size={14} />
              </button>
              <button type="button" className="action-btn" title="Xoa" onClick={() => onDelete(job)}>
                <Trash2 size={14} color="var(--danger)" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface ApplicationsListProps {
  applications: JobApplication[];
  isLoading: boolean;
}

function ApplicationsList({ applications, isLoading }: ApplicationsListProps) {
  if (isLoading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>Dang tai...</div>;
  if (applications.length === 0) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--gray-400)' }}>
        <Users size={48} style={{ opacity: 0.2, margin: '0 auto 12px', display: 'block' }} />
        <div>Chua co ho so nao</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {applications.map((app) => {
        const statusOpt = APPLICATION_STATUS_OPTIONS.find((o) => o.value === app.status);
        return (
          <div key={app.id} style={{
            background: 'white', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 16,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>
                {app.fullName}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
                <span>{app.email}</span>
                {app.phone && <span>{app.phone}</span>}
                <span>{app.jobTitle}</span>
                <span>{new Date(app.appliedAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                padding: '2px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600,
                background: statusOpt?.color ? `${statusOpt.color}20` : 'var(--gray-100)',
                color: statusOpt?.color || 'var(--gray-600)',
              }}>
                {statusOpt?.label || app.status}
              </span>
              <button type="button" className="action-btn" title="Xem">
                <Eye size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
