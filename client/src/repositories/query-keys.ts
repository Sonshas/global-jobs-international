export const queryKeys = {
  rbac: {
    roles: (userId: string) => ['rbac', 'roles', userId] as const,
  },
  jobs: {
    all: ['jobs'] as const,
    published: () => ['jobs', 'published'] as const,
    detail: (id: string) => ['jobs', 'detail', id] as const,
    employer: (userId: string) => ['jobs', 'employer', userId] as const,
    admin: () => ['jobs', 'admin'] as const,
    search: (filters: Record<string, unknown>) => ['jobs', 'search', filters] as const,
  },
  applications: {
    all: ['applications'] as const,
    list: () => ['applications', 'list'] as const,
    forUser: (userId: string) => ['applications', 'user', userId] as const,
    detail: (id: string) => ['applications', 'detail', id] as const,
    forJob: (jobId: string) => ['applications', 'job', jobId] as const,
  },
  employers: {
    profile: (userId: string) => ['employers', 'profile', userId] as const,
    byUser: (userId: string) => ['employers', 'byUser', userId] as const,
  },
  applicants: {
    byUser: (userId: string) => ['applicants', 'byUser', userId] as const,
  },
  documents: {
    forUser: (userId: string) => ['documents', 'user', userId] as const,
  },
  notifications: {
    forUser: (userId: string) => ['notifications', 'user', userId] as const,
  },
  savedJobs: {
    forUser: (userId: string) => ['savedJobs', 'user', userId] as const,
    isSaved: (userId: string, jobId: string) => ['savedJobs', 'isSaved', userId, jobId] as const,
  },
  conversations: {
    forUser: (userId: string) => ['conversations', 'user', userId] as const,
    detail: (conversationId: string) => ['conversations', 'detail', conversationId] as const,
    unreadCount: (userId: string) => ['conversations', 'unread', userId] as const,
  },
  messages: {
    forConversation: (conversationId: string) => ['messages', 'conversation', conversationId] as const,
  },
  interviews: {
    forApplicant: (userId: string) => ['interviews', 'applicant', userId] as const,
    forEmployer: (userId: string) => ['interviews', 'employer', userId] as const,
    allStaff: () => ['interviews', 'staff-all'] as const,
  },
  settings: {
    forUser: (userId: string, key: string) => ['settings', userId, key] as const,
  },
  publicStats: {
    platform: ['publicStats', 'platform'] as const,
    verifiedEmployers: ['publicStats', 'verifiedEmployers'] as const,
  },
};
