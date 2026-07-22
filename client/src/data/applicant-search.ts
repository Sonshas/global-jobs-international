import type { JobApplication } from '@/data/applications';
import { fetchAllApplications } from '@/repositories/applications.repository';
import { getTimeline } from '@/data/recruitment-pipeline';

export type ApplicantSearchFilters = {
  name?: string;
  country?: string;
  phone?: string;
  email?: string;
  employer?: string;
  job?: string;
  status?: string;
  visaStage?: string;
  interviewStage?: string;
  applicationDateFrom?: string;
  applicationDateTo?: string;
};

export function filterApplicants(
  apps: JobApplication[],
  filters: ApplicantSearchFilters,
): JobApplication[] {
  return apps.filter((app) => {
    if (filters.name && !app.profile.fullName.toLowerCase().includes(filters.name.toLowerCase())) {
      return false;
    }
    if (filters.country && !app.country.toLowerCase().includes(filters.country.toLowerCase())) {
      return false;
    }
    if (filters.phone && !app.profile.phone.includes(filters.phone)) return false;
    if (filters.email && !app.profile.email.toLowerCase().includes(filters.email.toLowerCase())) {
      return false;
    }
    if (filters.employer && !app.employer.toLowerCase().includes(filters.employer.toLowerCase())) {
      return false;
    }
    if (filters.job && !app.jobTitle.toLowerCase().includes(filters.job.toLowerCase())) {
      return false;
    }
    if (filters.status && app.status !== filters.status && app.currentStage !== filters.status) {
      return false;
    }
    if (filters.visaStage) {
      const timeline = getTimeline(app.id, apps).map((e) => e.label.toLowerCase()).join(' ');
      if (!timeline.includes(filters.visaStage.toLowerCase()) && app.currentStage !== filters.visaStage) {
        return false;
      }
    }
    if (filters.interviewStage) {
      const interview =
        app.currentStage === 'Interview' ||
        app.stageStatuses.Interview !== 'pending' ||
        getTimeline(app.id, apps).some((e) => e.label.toLowerCase().includes('interview'));
      if (filters.interviewStage === 'scheduled' && !interview) return false;
      if (filters.interviewStage === 'none' && interview) return false;
    }
    if (filters.applicationDateFrom) {
      if (new Date(app.createdAt) < new Date(filters.applicationDateFrom)) return false;
    }
    if (filters.applicationDateTo) {
      if (new Date(app.createdAt) > new Date(filters.applicationDateTo)) return false;
    }
    return true;
  });
}

export async function searchApplicants(filters: ApplicantSearchFilters): Promise<JobApplication[]> {
  const apps = await fetchAllApplications();
  return filterApplicants(apps, filters);
}
