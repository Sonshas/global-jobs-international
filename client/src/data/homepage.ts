export const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Jobs', href: '#jobs' },
  { label: 'Countries', href: '#countries' },
  { label: 'Employers', href: '#employers' },
  { label: 'Services', href: '#services' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
] as const;

export const languages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ar', label: 'العربية' },
] as const;

export const stats = [
  { id: 'applicants', label: 'Applicants', value: 25000, suffix: '+' },
  { id: 'employers', label: 'Employers', value: 650, suffix: '+' },
  { id: 'countries', label: 'Countries', value: 17, suffix: '' },
  { id: 'jobs', label: 'Jobs', value: 7500, suffix: '+' },
] as const;

export const jobCategories = [
  'Healthcare',
  'Engineering',
  'Hospitality',
  'IT & Software',
  'Construction',
  'Logistics',
  'Education',
  'Finance',
] as const;

export const searchCountries = [
  'Canada',
  'Australia',
  'United Kingdom',
  'Germany',
  'Ireland',
  'Qatar',
  'United Arab Emirates',
  'Saudi Arabia',
] as const;

export const featuredCountries = [
  {
    name: 'Canada',
    code: 'ca',
    openings: 1840,
    averageSalary: 'CAD 72,000',
    visaSponsorship: true,
    image:
      'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?auto=format&fit=crop&w=800&q=70',
    imageAlt: 'Toronto skyline at dusk',
  },
  {
    name: 'Australia',
    code: 'au',
    openings: 1520,
    averageSalary: 'AUD 95,000',
    visaSponsorship: true,
    image:
      'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=70',
    imageAlt: 'Sydney Opera House and harbour',
  },
  {
    name: 'United Kingdom',
    code: 'gb',
    openings: 1680,
    averageSalary: 'GBP 48,000',
    visaSponsorship: true,
    image:
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=70',
    imageAlt: 'London cityscape along the Thames',
  },
  {
    name: 'Germany',
    code: 'de',
    openings: 1410,
    averageSalary: 'EUR 58,000',
    visaSponsorship: true,
    image:
      'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=800&q=70',
    imageAlt: 'Berlin streets and architecture',
  },
  {
    name: 'Ireland',
    code: 'ie',
    openings: 980,
    averageSalary: 'EUR 62,000',
    visaSponsorship: true,
    image:
      'https://images.unsplash.com/photo-1564953263297-0fe329af7105?auto=format&fit=crop&w=800&q=70',
    imageAlt: 'Colourful buildings in Dublin',
  },
  {
    name: 'Qatar',
    code: 'qa',
    openings: 760,
    averageSalary: 'QAR 18,000 / mo',
    visaSponsorship: true,
    image:
      'https://images.unsplash.com/photo-1559599746-8823b38544c6?auto=format&fit=crop&w=800&q=70',
    imageAlt: 'Doha skyline at night',
  },
  {
    name: 'United Arab Emirates',
    code: 'ae',
    openings: 1290,
    averageSalary: 'AED 16,500 / mo',
    visaSponsorship: true,
    image:
      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=70',
    imageAlt: 'Dubai skyline with Burj Khalifa',
  },
  {
    name: 'Saudi Arabia',
    code: 'sa',
    openings: 1120,
    averageSalary: 'SAR 14,000 / mo',
    visaSponsorship: true,
    image:
      'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=800&q=70',
    imageAlt: 'Riyadh modern skyline',
  },
] as const;

export const featuredJobs = [
  {
    id: '1',
    title: 'Registered Nurse',
    company: 'Maple Health Network',
    logo: 'MH',
    logoColor: '#0052CC',
    country: 'Canada',
    salary: 'CAD 78,000 – 95,000',
    type: 'Full-time',
  },
  {
    id: '2',
    title: 'Civil Engineer',
    company: 'Pacific Infrastructure',
    logo: 'PI',
    logoColor: '#0F766E',
    country: 'Australia',
    salary: 'AUD 110,000 – 135,000',
    type: 'Full-time',
  },
  {
    id: '3',
    title: 'Software Engineer',
    company: 'Thames Digital',
    logo: 'TD',
    logoColor: '#7C3AED',
    country: 'United Kingdom',
    salary: 'GBP 55,000 – 75,000',
    type: 'Full-time',
  },
  {
    id: '4',
    title: 'Hotel Operations Manager',
    company: 'Gulf Hospitality Group',
    logo: 'GH',
    logoColor: '#B45309',
    country: 'United Arab Emirates',
    salary: 'AED 18,000 – 24,000 / mo',
    type: 'Full-time',
  },
  {
    id: '5',
    title: 'Warehouse Supervisor',
    company: 'Rhein Logistics',
    logo: 'RL',
    logoColor: '#DC2626',
    country: 'Germany',
    salary: 'EUR 42,000 – 52,000',
    type: 'Full-time',
  },
  {
    id: '6',
    title: 'Project Site Manager',
    company: 'Desert Build Co.',
    logo: 'DB',
    logoColor: '#0369A1',
    country: 'Qatar',
    salary: 'QAR 16,000 – 22,000 / mo',
    type: 'Contract',
  },
] as const;

export const whyChooseUs = [
  {
    id: 'verified',
    title: 'Verified Employers',
    description:
      'Every employer is screened so you apply to legitimate international opportunities with confidence.',
    icon: 'shield' as const,
  },
  {
    id: 'guidance',
    title: 'End-to-End Guidance',
    description:
      'From application to visa documentation, our advisors support you at every stage of your journey.',
    icon: 'route' as const,
  },
  {
    id: 'reach',
    title: 'Global Reach',
    description:
      'Access roles across North America, Europe, the Middle East, and Oceania from one trusted platform.',
    icon: 'globe' as const,
  },
  {
    id: 'candidate',
    title: 'Candidate-First Process',
    description:
      'Transparent timelines, clear requirements, and personalised matching built around your goals.',
    icon: 'spark' as const,
  },
] as const;

export const recruitmentSteps = [
  {
    step: 1,
    title: 'Create Account',
    description: 'Register in minutes and secure your candidate workspace.',
  },
  {
    step: 2,
    title: 'Complete Profile',
    description: 'Add experience, credentials, and preferred destinations.',
  },
  {
    step: 3,
    title: 'Apply',
    description: 'Submit to verified roles matched to your strengths.',
  },
  {
    step: 4,
    title: 'Document Review',
    description: 'Our team validates certificates and eligibility files.',
  },
  {
    step: 5,
    title: 'Employer Review',
    description: 'Shortlisted applications are reviewed by hiring partners.',
  },
  {
    step: 6,
    title: 'Interview',
    description: 'Prepare with coaches and meet employers virtually.',
  },
  {
    step: 7,
    title: 'Offer Letter',
    description: 'Receive and review your international employment offer.',
  },
  {
    step: 8,
    title: 'Visa Preparation',
    description: 'Get structured support for sponsorship and filings.',
  },
  {
    step: 9,
    title: 'Travel',
    description: 'Final relocation guidance before you depart.',
  },
] as const;

export const testimonials = [
  {
    id: '1',
    name: 'Amina Okonkwo',
    role: 'ICU Nurse',
    country: 'Canada',
    rating: 5,
    photo: 'https://i.pravatar.cc/160?img=47',
    quote:
      'Global Jobs International made my move to Toronto seamless. The advisors were responsive and honest every step of the way.',
  },
  {
    id: '2',
    name: 'Daniel Reyes',
    role: 'Software Engineer',
    country: 'Ireland',
    rating: 5,
    photo: 'https://i.pravatar.cc/160?img=12',
    quote:
      'I found a verified tech role in Dublin within weeks. The process felt premium, organised, and genuinely supportive.',
  },
  {
    id: '3',
    name: 'Fatima Al-Hassan',
    role: 'Hotel Manager',
    country: 'United Arab Emirates',
    rating: 5,
    photo: 'https://i.pravatar.cc/160?img=5',
    quote:
      'From interview prep to contract review, the team helped me land a leadership role in Dubai with confidence.',
  },
] as const;

export const footerColumns = [
  {
    title: 'Explore',
    links: [
      { label: 'Find Jobs', href: '#jobs' },
      { label: 'Countries', href: '#countries' },
      { label: 'Employers', href: '#employers' },
      { label: 'Services', href: '#services' },
    ],
  },
  {
    title: 'Candidates',
    links: [
      { label: 'Create Account', href: '/register' },
      { label: 'Visa Guidance', href: '#visa' },
      { label: 'Recruitment Journey', href: '#services' },
      { label: 'Success Stories', href: '#testimonials' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '#about' },
      { label: 'Contact', href: '#contact' },
      { label: 'Careers', href: '#careers' },
      { label: 'Press', href: '#press' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Centre', href: '#help' },
      { label: 'Privacy Policy', href: '#privacy' },
      { label: 'Terms of Use', href: '#terms' },
      { label: 'Cookie Settings', href: '#cookies' },
    ],
  },
] as const;

/** Approximate map coordinates in a 1000×500 viewBox */
export const mapLocations = [
  { id: 'ca', label: 'Canada', x: 220, y: 148 },
  { id: 'gb', label: 'United Kingdom', x: 478, y: 142 },
  { id: 'ie', label: 'Ireland', x: 452, y: 148 },
  { id: 'de', label: 'Germany', x: 512, y: 156 },
  { id: 'qa', label: 'Qatar', x: 618, y: 236 },
  { id: 'ae', label: 'UAE', x: 638, y: 250 },
  { id: 'sa', label: 'Saudi Arabia', x: 598, y: 248 },
  { id: 'au', label: 'Australia', x: 820, y: 372 },
] as const;

export const flightRoutes = [
  {
    id: 'ca-gb',
    d: 'M220 148 C 320 80, 400 90, 478 142',
    delay: 0,
  },
  {
    id: 'gb-de',
    d: 'M478 142 C 492 146, 502 150, 512 156',
    delay: 0.4,
  },
  {
    id: 'de-ae',
    d: 'M512 156 C 560 190, 600 220, 638 250',
    delay: 0.9,
  },
  {
    id: 'ae-au',
    d: 'M638 250 C 700 290, 760 330, 820 372',
    delay: 1.4,
  },
  {
    id: 'ca-au',
    d: 'M220 148 C 420 220, 640 300, 820 372',
    delay: 1.9,
  },
  {
    id: 'ie-qa',
    d: 'M452 148 C 520 180, 570 210, 618 236',
    delay: 2.3,
  },
] as const;
