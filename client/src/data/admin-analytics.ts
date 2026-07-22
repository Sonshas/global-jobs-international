import type { JobApplication } from '@/data/applications';
import { fetchAllApplications } from '@/repositories/applications.repository';
import { fetchPublishedDbJobs } from '@/repositories/jobs.repository';
import { supabase } from '@/lib/supabase';
import { getTimeline } from '@/data/recruitment-pipeline';

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}

function countTimelineLabel(apps: JobApplication[], label: string) {
  return apps.filter((app) =>
    getTimeline(app.id, apps).some((event) => event.label.toLowerCase().includes(label.toLowerCase())),
  ).length;
}

export type SuperAdminStats = {
  totalApplicants: number;
  totalEmployers: number;
  totalJobs: number;
  activeJobs: number;
  countriesHiring: number;
  applicationsToday: number;
  applicationsThisWeek: number;
  shortlisted: number;
  interviewsScheduled: number;
  visaProcessing: number;
  workPermits: number;
  flightBookings: number;
  arrivals: number;
  rejected: number;
  revenue: number;
  cvServiceRevenue: number;
  otherServiceRevenue: number;
  weeklyApplications: number[];
  pipelineBreakdown: Array<{ label: string; value: number }>;
};

export async function getSuperAdminStats(): Promise<SuperAdminStats> {
  const apps = await fetchAllApplications();
  const employers = await countEmployersFromDb();
  const employerJobs = await fetchPublishedDbJobs();
  const today = startOfDay(new Date());
  const week = daysAgo(7);

  const applicationsToday = apps.filter((app) => new Date(app.createdAt).getTime() >= today).length;
  const applicationsThisWeek = apps.filter((app) => new Date(app.createdAt).getTime() >= week).length;

  const shortlisted = apps.filter(
    (app) =>
      app.status === 'approved' ||
      app.currentStage === 'Shortlisted' ||
      app.stageStatuses.Shortlisted === 'completed',
  ).length;

  const interviewsScheduled = apps.filter(
    (app) =>
      app.currentStage === 'Interview' ||
      app.stageStatuses.Interview === 'in_progress' ||
      app.stageStatuses.Interview === 'completed',
  ).length;

  const visaProcessing = apps.filter(
    (app) =>
      app.currentStage === 'Visa Processing' ||
      getTimeline(app.id, apps).some((e) => e.label.includes('Visa')),
  ).length;

  const workPermits = apps.filter((app) => app.visaTracker['Visa Approved']).length;
  const flightBookings = countTimelineLabel(apps, 'Flight');
  const arrivals = apps.filter(
    (app) =>
      app.currentStage === 'Arrived' ||
      app.stageStatuses.Arrived === 'completed' ||
      getTimeline(app.id, apps).some((e) => e.label === 'Arrived' && e.status === 'completed'),
  ).length;
  const rejected = apps.filter((app) => app.status === 'rejected').length;

  const { cvServiceRevenue, otherServiceRevenue } = await getRevenueFromPayments();
  const revenue = cvServiceRevenue + otherServiceRevenue;

  const weeklyApplications = Array.from({ length: 7 }, (_, index) => {
    const dayStart = daysAgo(6 - index);
    const dayEnd = dayStart + 86400000;
    return apps.filter((app) => {
      const t = new Date(app.createdAt).getTime();
      return t >= dayStart && t < dayEnd;
    }).length;
  });

  return {
    totalApplicants: new Set(apps.map((app) => app.userId)).size || apps.length,
    totalEmployers: employers,
    totalJobs: employerJobs.length,
    activeJobs: employerJobs.filter((job) => job.status === 'Open').length,
    countriesHiring: new Set(employerJobs.map((job) => job.country)).size,
    applicationsToday,
    applicationsThisWeek,
    shortlisted,
    interviewsScheduled,
    visaProcessing,
    workPermits,
    flightBookings,
    arrivals,
    rejected,
    revenue,
    cvServiceRevenue,
    otherServiceRevenue,
    weeklyApplications,
    pipelineBreakdown: [
      { label: 'Submitted', value: apps.length },
      { label: 'Shortlisted', value: shortlisted },
      { label: 'Interviews', value: interviewsScheduled },
      { label: 'Visa', value: visaProcessing },
      { label: 'Flights', value: flightBookings },
      { label: 'Arrivals', value: arrivals },
      { label: 'Rejected', value: rejected },
    ],
  };
}

/** Revenue is derived exclusively from succeeded/paid rows in `public.payments`. */
async function getRevenueFromPayments(): Promise<{ cvServiceRevenue: number; otherServiceRevenue: number }> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('amount, status, metadata')
      .in('status', ['succeeded', 'paid']);
    if (error || !data) return { cvServiceRevenue: 0, otherServiceRevenue: 0 };

    let cvServiceRevenue = 0;
    let otherServiceRevenue = 0;
    for (const row of data) {
      const amount = Number(row.amount) || 0;
      const metadata = (row.metadata ?? {}) as Record<string, unknown>;
      const serviceId = String(metadata.serviceId ?? '');
      if (serviceId.includes('cv')) {
        cvServiceRevenue += amount;
      } else {
        otherServiceRevenue += amount;
      }
    }
    return { cvServiceRevenue, otherServiceRevenue };
  } catch {
    return { cvServiceRevenue: 0, otherServiceRevenue: 0 };
  }
}

async function countEmployersFromDb(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('employers')
      .select('*', { count: 'exact', head: true });
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}
