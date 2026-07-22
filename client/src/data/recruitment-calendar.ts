import { fetchAllApplications } from '@/repositories/applications.repository';
import { getTimeline } from '@/data/recruitment-pipeline';
import { searchJobs } from '@/data/jobs-catalog';
import { applicationSeason } from '@/data/homepage';
import { listAllForStaff } from '@/repositories/interviews.repository';

export type CalendarEventType =
  | 'interview'
  | 'medical'
  | 'passport'
  | 'visa'
  | 'flight'
  | 'deadline'
  | 'meeting';

export type CalendarEvent = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: CalendarEventType;
  meta?: string;
  applicationId?: string;
};

const TYPE_LABEL: Record<CalendarEventType, string> = {
  interview: 'Interview',
  medical: 'Medical',
  passport: 'Passport deadline',
  visa: 'Visa appointment',
  flight: 'Flight departure',
  deadline: 'Application deadline',
  meeting: 'Employer meeting',
};

export function calendarTypeLabel(type: CalendarEventType) {
  return TYPE_LABEL[type];
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

/** Build recruitment calendar events from real interviews, timelines, and open jobs. */
export async function listRecruitmentCalendarEvents(anchor = new Date()): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = [];
  const [apps, interviews] = await Promise.all([fetchAllApplications(), listAllForStaff()]);
  const appsById = new Map(apps.map((app) => [app.id, app]));
  const appsWithRealInterview = new Set(interviews.map((row) => row.applicationId));

  // Prefer structured `interviews` rows over synthetic timeline placeholders.
  for (const interview of interviews) {
    if (interview.status === 'cancelled') continue;
    const app = appsById.get(interview.applicationId);
    events.push({
      id: `interview-${interview.id}`,
      title: `Interview · ${app?.profile.fullName ?? 'Applicant'} (${interview.status})`,
      date: interview.scheduledStartAt.slice(0, 10),
      type: 'interview',
      meta: [
        app?.jobTitle,
        app?.country,
        interview.mode,
        interview.meetingUrl,
      ]
        .filter(Boolean)
        .join(' · '),
      applicationId: interview.applicationId,
    });
  }

  apps.forEach((app, index) => {
    const timeline = getTimeline(app.id, apps);
    timeline.forEach((event) => {
      const lower = event.label.toLowerCase();
      let type: CalendarEventType | null = null;
      if (lower.includes('interview')) {
        // Skip timeline interview markers when a real interview row exists.
        if (appsWithRealInterview.has(app.id)) return;
        type = 'interview';
      } else if (lower.includes('medical')) type = 'medical';
      else if (lower.includes('passport')) type = 'passport';
      else if (lower.includes('visa')) type = 'visa';
      else if (lower.includes('flight') || lower.includes('depart')) type = 'flight';
      if (!type) return;
      events.push({
        id: `${app.id}-${event.id}`,
        title: `${event.label} · ${app.profile.fullName}`,
        date: event.at.slice(0, 10),
        type,
        meta: `${app.jobTitle} · ${app.country}`,
        applicationId: app.id,
      });
    });

    // Seed planning dates only when timeline is sparse and no real interview exists.
    if (timeline.length < 3 && !appsWithRealInterview.has(app.id)) {
      events.push({
        id: `${app.id}-plan-interview`,
        title: `Interview window · ${app.profile.fullName}`,
        date: isoDate(addDays(anchor, 3 + (index % 5))),
        type: 'interview',
        meta: app.applicationNumber,
        applicationId: app.id,
      });
      events.push({
        id: `${app.id}-plan-medical`,
        title: `Medical slot · ${app.profile.fullName}`,
        date: isoDate(addDays(anchor, 7 + (index % 4))),
        type: 'medical',
        meta: app.country,
        applicationId: app.id,
      });
    }
  });

  searchJobs({})
    .filter((job) => job.status === 'Open')
    .slice(0, 24)
    .forEach((job) => {
      events.push({
        id: `deadline-${job.id}`,
        title: `Deadline · ${job.title}`,
        date: job.applicationDeadline,
        type: 'deadline',
        meta: `${job.city}, ${job.country}`,
      });
    });

  events.push({
    id: 'season-close',
    title: `${applicationSeason.name} closes`,
    date: applicationSeason.closesAt.slice(0, 10),
    type: 'deadline',
    meta: 'Application season',
  });

  events.push({
    id: 'employer-meeting-weekly',
    title: 'Employer coordination call',
    date: isoDate(addDays(anchor, ((3 - anchor.getDay() + 7) % 7) || 7)),
    type: 'meeting',
    meta: 'Ops · Global Jobs International',
  });

  // Deduplicate by id
  const map = new Map(events.map((event) => [event.id, event]));
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function eventsForDay(date: string, events: CalendarEvent[]) {
  return events.filter((event) => event.date === date);
}

export function monthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ date: string | null; day: number | null }> = [];
  for (let i = 0; i < startPad; i += 1) cells.push({ date: null, day: null });
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({ date, day });
  }
  while (cells.length % 7 !== 0) cells.push({ date: null, day: null });
  return cells;
}
