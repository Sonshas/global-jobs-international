import { useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { useAuth } from '@/hooks/useAuth';
import { useResolvedJob } from '@/hooks/queries/useJobsQueries';
import { useCreateApplicationMutation } from '@/hooks/queries/useApplicationsQueries';
import {
  applicantNeedsCvPayment,
  documentLabel,
  requiredDocumentsForJob,
  type ApplicationDocument,
  type ApplicationDocumentKind,
} from '@/data/applications';
import { formatCvPrice, getCvOrderFromPayments, getCvPreparationPrice } from '@/data/cv-services';
import { addNotification } from '@/data/notifications';
import { useUploadApplicantDocumentMutation } from '@/hooks/queries/useDocumentsQueries';
import { startPaymentCheckout } from '@/repositories/payments.repository';
import {
  evaluateEligibility,
  type EligibilityAnswers,
} from '@/data/recruitment-pipeline';

const STEP_KEYS = [
  'apply.stepJob',
  'apply.stepProfile',
  'apply.stepDocuments',
  'apply.stepCv',
  'apply.stepEligibility',
  'apply.stepReview',
  'apply.stepSuccess',
] as const;

export function ApplyWizardPage() {
  const { t } = useTranslation();
  const { jobId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: job, isLoading: jobLoading } = useResolvedJob(jobId);
  const createApplicationMutation = useCreateApplicationMutation();

  const meta = user?.user_metadata ?? {};
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState(
    typeof meta.full_name === 'string' ? meta.full_name : '',
  );
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(typeof meta.phone === 'string' ? meta.phone : '');
  const [country, setCountry] = useState(
    typeof meta.country_of_residence === 'string' ? meta.country_of_residence : '',
  );
  const [preferredCategory, setPreferredCategory] = useState(
    typeof meta.preferred_job_category === 'string' ? meta.preferred_job_category : 'skilled',
  );
  const [documents, setDocuments] = useState<Partial<Record<ApplicationDocumentKind, ApplicationDocument>>>(
    {},
  );
  const [error, setError] = useState<string | null>(null);
  const [createdAppId, setCreatedAppId] = useState<string | null>(null);
  const [createdNumber, setCreatedNumber] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<ApplicationDocumentKind | null>(null);
  const uploadDocumentMutation = useUploadApplicantDocumentMutation(user?.id);
  const [eligibility, setEligibility] = useState<EligibilityAnswers>({
    hasPassport: true,
    hasExperience: true,
    willingToRelocate: true,
    willingMedical: true,
    education: 'High school',
  });
  const eligibilityResult = evaluateEligibility(eligibility);

  const requiredDocs = useMemo(() => (job ? requiredDocumentsForJob(job) : []), [job]);
  const { data: needsCvPay = false } = useQuery({
    queryKey: ['cv', 'needs-payment', user?.id],
    queryFn: () => applicantNeedsCvPayment(user!),
    enabled: Boolean(user?.id),
  });
  const cvPrice = getCvPreparationPrice(country);
  const { data: cvOrder = null } = useQuery({
    queryKey: ['cv', 'order', user?.id],
    queryFn: () => getCvOrderFromPayments(user!.id),
    enabled: Boolean(user?.id),
  });
  const cvPaid =
    !needsCvPay ||
    Boolean(cvOrder && (cvOrder.status === 'completed' || cvOrder.status === 'in_progress'));

  const stepLabels = useMemo(() => STEP_KEYS.map((key) => t(key)), [t]);

  if (jobLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] py-16">
        <Container>
          <p className="text-ink-muted dark:text-ink-muted-dark">{t('common.loading')}</p>
        </Container>
      </div>
    );
  }

  if (!job) return <Navigate to="/jobs" replace />;
  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(`/apply/${job.id}`)}`} replace />;

  const onUpload = async (kind: ApplicationDocumentKind, file: File | null) => {
    if (!file || !user?.id) return;
    setError(null);
    setUploadingDoc(kind);
    try {
      const result = await uploadDocumentMutation.mutateAsync({ kind, file });
      setDocuments((prev) => ({
        ...prev,
        [kind]: {
          kind,
          fileName: result.record.fileName || file.name,
          fileSize: result.record.fileSize ?? file.size,
          uploadedAt: result.record.uploadedAt || new Date().toISOString(),
          documentId: result.documentId,
          storagePath: result.storagePath,
        },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.errorGeneric'));
    } finally {
      setUploadingDoc(null);
    }
  };

  const missingDocs = requiredDocs.filter((kind) => !documents[kind]);

  const goNext = () => {
    setError(null);
    if (step === 1) {
      if (!fullName.trim() || !email.trim() || !phone.trim() || !country.trim()) {
        setError(t('apply.profileIncomplete'));
        return;
      }
    }
    if (step === 2 && missingDocs.length > 0) {
      setError(t('apply.uploadRequiredDocs', { docs: missingDocs.map(documentLabel).join(', ') }));
      return;
    }
    if (step === 3 && needsCvPay && !cvPaid) {
      setError(t('apply.cvPaymentRequiredContinue'));
      return;
    }
    setStep((value) => Math.min(value + 1, stepLabels.length - 1));
  };

  const handleCvPayment = async () => {
    if (!user.id) return;
    setPaying(true);
    try {
      const { url } = await startPaymentCheckout('cv_preparation');
      window.location.assign(url);
    } catch (err) {
      setPaying(false);
      setError(err instanceof Error ? err.message : 'Unable to start checkout.');
    }
  };

  const submitApplication = async () => {
    if (!user.id || !job) return;
    setError(null);
    if (needsCvPay && !cvPaid) {
      setError(t('apply.cvPaymentStillRequired'));
      setStep(3);
      return;
    }

    const docs = requiredDocs
      .map((kind) => documents[kind])
      .filter((doc): doc is ApplicationDocument => Boolean(doc));

    setSubmitting(true);
    try {
      const app = await createApplicationMutation.mutateAsync({
        userId: user.id,
        job,
        profile: {
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          countryOfResidence: country.trim(),
          preferredCategory,
        },
        documents: docs,
        cvRequired: needsCvPay,
        cvPaid,
        residenceCountry: country.trim(),
      });

      void addNotification({
        userId: user.id,
        title: 'You have applied successfully',
        body: `${app.applicationNumber}: ${app.jobTitle} in ${app.country} was submitted.`,
        href: `/dashboard/applications/${app.id}`,
      });

      setCreatedAppId(app.id);
      setCreatedNumber(app.applicationNumber);
      setStep(6);
    } catch {
      setError('Could not submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-border bg-[var(--nav-bg)] backdrop-blur-md dark:border-border-dark">
        <Container className="flex h-16 items-center justify-between">
          <Link to="/" className="font-heading text-lg font-bold text-brand dark:text-brand-light">
            Global Jobs International
          </Link>
          <Button href="/dashboard" variant="ghost" size="sm">
            {t('nav.dashboard')}
          </Button>
        </Container>
      </header>

      <main>
        <Container className="max-w-3xl py-10">
          <p className="text-sm font-semibold tracking-wide text-brand uppercase dark:text-brand-light">
            {t('apply.wizard')}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-ink dark:text-ink-dark">
            {t('apply.applyFor', { title: job.title })}
          </h1>

          <ol className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {stepLabels.map((label, index) => (
              <li
                key={label}
                className={`rounded-xl border px-2 py-2 text-center text-[11px] font-semibold ${
                  index === step
                    ? 'border-brand bg-brand text-white'
                    : index < step
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300'
                      : 'border-border text-slate-600 dark:border-border-dark dark:text-slate-300'
                }`}
              >
                {label}
              </li>
            ))}
          </ol>

          <section className="mt-8 rounded-[1.75rem] border border-border/70 bg-white/85 p-6 shadow-sm backdrop-blur-xl dark:border-border-dark dark:bg-slate-900/55">
            {error ? (
              <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </p>
            ) : null}

            {step === 0 ? (
              <StepCard title={t('apply.selectedJob')}>
                <dl className="grid gap-3 sm:grid-cols-2">
                  <Info label={t('apply.role')} value={job.title} />
                  <Info label={t('common.country')} value={job.country} />
                  <Info label={t('common.employer')} value={job.employer} />
                  <Info label={t('common.salary')} value={job.salaryLabel} />
                  <Info label={t('jobs.visaSponsorship')} value={job.visaSponsorship ? t('apply.yesCheck') : t('common.no')} />
                  <Info label={t('jobs.accommodation')} value={job.accommodation ? t('apply.yesCheck') : t('common.no')} />
                  <Info label={t('jobs.medicalInsurance')} value={job.medicalInsurance ? t('apply.yesCheck') : t('common.no')} />
                  <Info label={t('common.city')} value={job.city} />
                </dl>
              </StepCard>
            ) : null}

            {step === 1 ? (
              <StepCard title={t('apply.applicantProfile')}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t('apply.fullName')}>
                    <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </Field>
                  <Field label={t('common.email')}>
                    <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </Field>
                  <Field label={t('common.phone')}>
                    <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </Field>
                  <Field label={t('auth.countryOfResidence')}>
                    <input className={inputClass} value={country} onChange={(e) => setCountry(e.target.value)} />
                  </Field>
                  <Field label={t('apply.preferredCategory')}>
                    <select
                      className={inputClass}
                      value={preferredCategory}
                      onChange={(e) => setPreferredCategory(e.target.value)}
                    >
                      <option value="skilled">{t('apply.skilled')}</option>
                      <option value="unskilled">{t('apply.unskilled')}</option>
                    </select>
                  </Field>
                </div>
              </StepCard>
            ) : null}

            {step === 2 ? (
              <StepCard title={t('apply.requiredDocuments')}>
                <div className="space-y-4">
                  {requiredDocs.map((kind) => (
                    <div key={kind} className="rounded-2xl border border-border p-4 dark:border-border-dark">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-ink dark:text-ink-dark">{documentLabel(kind)}</p>
                          <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
                            {documents[kind]
                              ? `${documents[kind]!.fileName} · ${t('apply.uploadedLabel')}`
                              : t('apply.uploadRequired')}
                          </p>
                        </div>
                        <label className="cursor-pointer rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white">
                          {uploadingDoc === kind ? t('common.uploading') : t('common.upload')}
                          <input
                            type="file"
                            className="sr-only"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            disabled={uploadingDoc !== null || uploadDocumentMutation.isPending}
                            onChange={(e) => void onUpload(kind, e.target.files?.[0] ?? null)}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </StepCard>
            ) : null}

            {step === 3 ? (
              <StepCard title={t('apply.cvVerification')}>
                {!needsCvPay ? (
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">{t('apply.cvOnProfile')}</p>
                ) : cvPaid ? (
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    {t('apply.cvPaymentReceived', {
                      price: formatCvPrice(cvPrice),
                      status: cvOrder?.status ?? t('dashboard.inProgress'),
                    })}
                  </p>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-ink dark:text-ink-dark">
                      <strong>{t('apply.cvRequired')}</strong>
                    </p>
                    <p className="text-sm text-ink-muted dark:text-ink-muted-dark">
                      {t('apply.cvPrepResidenceDesc', { country: cvPrice.countryName })}
                    </p>
                    <p className="font-heading text-2xl font-bold text-ink dark:text-ink-dark">
                      {formatCvPrice(cvPrice)}
                    </p>
                    <Button type="button" className="rounded-2xl" disabled={paying} onClick={() => void handleCvPayment()}>
                      {paying ? t('dashboard.processing') : t('apply.continueToPayment')}
                    </Button>
                  </div>
                )}
              </StepCard>
            ) : null}

            {step === 4 ? (
              <StepCard title={t('apply.eligibilityChecker')}>
                <p className="mb-4 text-sm text-ink-muted dark:text-ink-muted-dark">
                  {t('apply.eligibilityDisclaimer')}
                </p>
                <div className="space-y-3">
                  <YesNo
                    label={t('apply.hasPassport')}
                    value={eligibility.hasPassport}
                    onChange={(value) => setEligibility((prev) => ({ ...prev, hasPassport: value }))}
                  />
                  <YesNo
                    label={t('apply.hasExperience')}
                    value={eligibility.hasExperience}
                    onChange={(value) => setEligibility((prev) => ({ ...prev, hasExperience: value }))}
                  />
                  <YesNo
                    label={t('apply.willingToRelocate')}
                    value={eligibility.willingToRelocate}
                    onChange={(value) =>
                      setEligibility((prev) => ({ ...prev, willingToRelocate: value }))
                    }
                  />
                  <YesNo
                    label={t('apply.willingMedical')}
                    value={eligibility.willingMedical}
                    onChange={(value) => setEligibility((prev) => ({ ...prev, willingMedical: value }))}
                  />
                  <Field label={t('apply.educationLevel')}>
                    <select
                      className={inputClass}
                      value={eligibility.education}
                      onChange={(e) =>
                        setEligibility((prev) => ({ ...prev, education: e.target.value }))
                      }
                    >
                      <option>{t('apply.educationPrimary')}</option>
                      <option>{t('apply.educationHighSchool')}</option>
                      <option>{t('apply.educationDiploma')}</option>
                      <option>{t('apply.educationBachelor')}</option>
                      <option>{t('apply.educationMaster')}</option>
                      <option>{t('apply.educationOther')}</option>
                    </select>
                  </Field>
                </div>
                <p
                  className={`mt-4 rounded-2xl px-4 py-3 text-sm font-medium ${
                    eligibilityResult.eligible
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300'
                      : 'bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200'
                  }`}
                >
                  {eligibilityResult.message}
                </p>
              </StepCard>
            ) : null}

            {step === 5 ? (
              <StepCard title={t('apply.reviewSubmit')}>
                <dl className="grid gap-3 sm:grid-cols-2">
                  <Info label={t('common.job')} value={`${job.title} · ${job.country}`} />
                  <Info label={t('common.employer')} value={job.employer} />
                  <Info label={t('common.salary')} value={job.salaryLabel} />
                  <Info label={t('common.applicant')} value={fullName} />
                  <Info label={t('common.email')} value={email} />
                  <Info label={t('common.phone')} value={phone} />
                  <Info label={t('apply.residence')} value={country} />
                  <Info label={t('dashboard.documents')} value={t('apply.documentsUploaded', { count: requiredDocs.length })} />
                  <Info label={t('jobs.visaSponsorship')} value={job.visaSponsorship ? t('apply.yesCheck') : t('common.no')} />
                  <Info label={t('jobs.accommodation')} value={job.accommodation ? t('apply.yesCheck') : t('common.no')} />
                  <Info
                    label={t('apply.eligibilityChecker')}
                    value={eligibilityResult.eligible ? t('apply.eligibleToApply') : t('apply.mayNeedReview')}
                  />
                </dl>
              </StepCard>
            ) : null}

            {step === 6 ? (
              <StepCard title={t('apply.congratulations')}>
                <p className="text-sm text-ink-muted dark:text-ink-muted-dark">
                  {t('apply.applicationReceived')}
                </p>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Info label={t('apply.applicationNumber')} value={createdNumber ?? '—'} />
                  <Info label={t('common.status')} value={t('apply.submittedStatus')} />
                  <Info label={t('apply.recruitmentStage')} value={t('apply.employerReview')} />
                </dl>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button
                    href={createdAppId ? `/dashboard/applications/${createdAppId}` : '/dashboard/applications'}
                    className="rounded-2xl sm:flex-1"
                  >
                    {t('apply.viewApplication')}
                  </Button>
                  <Button href="/dashboard" variant="secondary" className="rounded-2xl sm:flex-1">
                    {t('apply.applicantDashboard')}
                  </Button>
                </div>
              </StepCard>
            ) : null}

            {step < 6 ? (
              <div className="mt-8 flex flex-wrap justify-between gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-2xl"
                  disabled={step === 0}
                  onClick={() => setStep((value) => Math.max(0, value - 1))}
                >
                  {t('common.back')}
                </Button>
                {step < 5 ? (
                  <Button type="button" className="rounded-2xl" onClick={goNext}>
                    {t('common.continue')}
                  </Button>
                ) : (
                  <Button type="button" className="rounded-2xl" onClick={submitApplication} disabled={submitting}>
                    {submitting ? t('dashboard.processing') : t('apply.submitApplication')}
                  </Button>
                )}
              </div>
            ) : null}

            {step < 6 ? (
              <button
                type="button"
                className="mt-4 text-sm text-ink-muted hover:underline dark:text-ink-muted-dark"
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                {t('apply.cancelReturn')}
              </button>
            ) : null}
          </section>
        </Container>
      </main>
    </div>
  );
}

const inputClass =
  'h-11 w-full rounded-xl border border-border bg-[var(--bg)] px-3 text-sm font-medium text-ink outline-none focus:border-brand dark:border-border-dark dark:text-ink-dark';

function StepCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="font-heading text-xl font-semibold text-ink dark:text-ink-dark">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-ink dark:text-ink-dark">{label}</span>
      {children}
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-2.5 dark:bg-slate-950/40">
      <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd className="mt-1 font-semibold text-ink dark:text-ink-dark">{value}</dd>
    </div>
  );
}

function YesNo({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3 dark:border-border-dark">
      <p className="text-sm font-medium text-ink dark:text-ink-dark">{label}</p>
      <div className="flex gap-2">
        <button
          type="button"
          className={`rounded-xl px-3 py-1.5 text-sm font-semibold ${
            value ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}
          onClick={() => onChange(true)}
        >
          {t('common.yes')}
        </button>
        <button
          type="button"
          className={`rounded-xl px-3 py-1.5 text-sm font-semibold ${
            !value ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}
          onClick={() => onChange(false)}
        >
          {t('common.no')}
        </button>
      </div>
    </div>
  );
}
