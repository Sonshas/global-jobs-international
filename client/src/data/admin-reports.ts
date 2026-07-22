import { fetchAllApplications } from '@/repositories/applications.repository';
import { getSuperAdminStats } from '@/data/admin-analytics';
import { getTimeline } from '@/data/recruitment-pipeline';

export async function getAdminReports() {
  const apps = await fetchAllApplications();
  const stats = await getSuperAdminStats();

  const byCountry = new Map<string, number>();
  const byMonth = new Map<string, number>();
  const byEmployer = new Map<string, number>();
  const byJob = new Map<string, number>();

  apps.forEach((app) => {
    byCountry.set(app.country, (byCountry.get(app.country) || 0) + 1);
    const month = app.createdAt.slice(0, 7);
    byMonth.set(month, (byMonth.get(month) || 0) + 1);
    byEmployer.set(app.employer, (byEmployer.get(app.employer) || 0) + 1);
    byJob.set(app.jobTitle, (byJob.get(app.jobTitle) || 0) + 1);
  });

  const interviewSuccess = apps.filter((app) =>
    getTimeline(app.id, apps).some((e) => e.label.includes('Interview Passed') && e.status === 'completed'),
  ).length;
  const visaSuccess = apps.filter((app) => app.visaTracker['Visa Approved']).length;
  const travelSuccess = apps.filter((app) =>
    getTimeline(app.id, apps).some((e) => e.label === 'Arrived' && e.status === 'completed'),
  ).length;

  const top = (map: Map<string, number>, limit = 8) =>
    [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);

  return {
    stats,
    applicationsByCountry: top(byCountry),
    applicationsByMonth: top(byMonth, 12),
    topEmployers: top(byEmployer),
    topJobs: top(byJob),
    revenue: stats.revenue,
    interviewSuccessRate: apps.length ? Math.round((interviewSuccess / apps.length) * 100) : 0,
    visaSuccessRate: apps.length ? Math.round((visaSuccess / apps.length) * 100) : 0,
    travelSuccessRate: apps.length ? Math.round((travelSuccess / apps.length) * 100) : 0,
    interviewSuccess,
    visaSuccess,
    travelSuccess,
  };
}
