export type PlatformService = {
  id: string;
  title: string;
  description: string;
  href: string;
  accent: string;
};

export const platformServices: PlatformService[] = [
  {
    id: 'cv',
    title: 'CV Preparation',
    description: 'Professionally written international CVs tailored to employer and visa requirements.',
    href: '/dashboard/cv-preparation',
    accent: '#0052CC',
  },
  {
    id: 'police',
    title: 'Police Clearance Assistance',
    description: 'Guidance on obtaining and verifying police clearance certificates for overseas work.',
    href: '/services#police',
    accent: '#0F766E',
  },
  {
    id: 'medical',
    title: 'Medical Examination Guidance',
    description: 'Clinic checklists, appointment timing, and document packaging for medicals.',
    href: '/services#medical',
    accent: '#B45309',
  },
  {
    id: 'visa',
    title: 'Visa Assistance',
    description: 'End-to-end support through embassy forms, biometrics, and visa decision tracking.',
    href: '/services#visa',
    accent: '#0369A1',
  },
  {
    id: 'interview',
    title: 'Interview Preparation',
    description: 'Role-specific coaching so candidates present confidently to international employers.',
    href: '/services#interview',
    accent: '#7C2D12',
  },
  {
    id: 'flight',
    title: 'Flight Booking Assistance',
    description: 'Coordinated departure planning once visas and work permits are confirmed.',
    href: '/services#flight',
    accent: '#1D4ED8',
  },
  {
    id: 'passport',
    title: 'Passport Guidance',
    description: 'Renewal timelines, photo standards, and validity checks before applications.',
    href: '/services#passport',
    accent: '#047857',
  },
  {
    id: 'accommodation',
    title: 'Accommodation Support',
    description: 'Housing orientation for roles that include or exclude employer accommodation.',
    href: '/services#accommodation',
    accent: '#DC2626',
  },
];
