import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Field, FormAlert, SelectInput, TextInput } from '@/components/auth/FormFields';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { RegistrationAtmosphere } from '@/components/auth/RegistrationAtmosphere';
import { RegistrationProgress } from '@/components/auth/RegistrationProgress';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { createEmployerRegisterSchema, type EmployerRegisterFormValues } from '@/schemas/employer-auth';
import { findCountryByIso, registrationCountries } from '@/data/registration';
import { EMPLOYER_INDUSTRIES } from '@/data/employer';

export function EmployerRegisterPage() {
  const { t, i18n } = useTranslation();
  const { signUp, isConfigured, isAuthenticated, isEmailVerified } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const schema = useMemo(() => createEmployerRegisterSchema(), [i18n.language]);

  const hqCountries = useMemo(
    () => [...registrationCountries].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  useEffect(() => {
    if (isAuthenticated && isEmailVerified) {
      navigate('/dashboard/employer', { replace: true });
    }
  }, [isAuthenticated, isEmailVerified, navigate]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<EmployerRegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      companyName: '',
      email: '',
      phoneCountryIso: 'US',
      phoneNumber: '',
      countryOfResidence: '',
      industry: '',
      website: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
      acceptPrivacy: false,
    },
  });

  const watched = useWatch({ control });

  const progressStep = useMemo((): 1 | 2 | 3 => {
    const accountReady =
      Boolean(watched.fullName?.trim()) &&
      Boolean(watched.companyName?.trim()) &&
      Boolean(watched.email?.trim()) &&
      Boolean(watched.phoneNumber?.trim()) &&
      Boolean(watched.password) &&
      Boolean(watched.confirmPassword);

    const profileReady = Boolean(watched.countryOfResidence) && Boolean(watched.industry?.trim());

    if (accountReady && profileReady) return 3;
    if (accountReady || dirtyFields.countryOfResidence || dirtyFields.industry) return 2;
    return 1;
  }, [watched, dirtyFields]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    const dialCode = findCountryByIso(values.phoneCountryIso)?.dialCode ?? '';
    const national = values.phoneNumber.replace(/[^\d]/g, '');
    const phoneE164 = `${dialCode}${national}`;

    const result = await signUp({
      email: values.email,
      password: values.password,
      fullName: values.fullName,
      accountType: 'employer',
      employerProfile: {
        fullName: values.fullName,
        companyName: values.companyName,
        email: values.email,
        phoneCountryIso: values.phoneCountryIso,
        phoneNumber: values.phoneNumber,
        countryOfResidence: values.countryOfResidence,
        industry: values.industry,
        website: values.website,
        acceptTerms: values.acceptTerms,
        acceptPrivacy: values.acceptPrivacy,
        phoneE164,
        phoneDialCode: dialCode,
      },
    });

    if (result.error) {
      setFormError(result.error);
      return;
    }

    navigate(`/verify-email?email=${encodeURIComponent(values.email)}`, { replace: true });
  });

  return (
    <div className="relative min-h-screen overflow-x-hidden text-white">
      <RegistrationAtmosphere />

      <div className="relative z-10">
        <header className="border-b border-white/10 bg-slate-950/40 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link to="/" className="font-heading text-lg font-bold tracking-tight text-white">
              {t('app.name')}
            </Link>
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-200 transition hover:text-white"
            >
              {t('auth.signIn')}
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="mb-8 text-center sm:text-left">
            <p className="text-sm font-semibold tracking-[0.18em] text-accent uppercase">
              {t('auth.employerRegisterEyebrow')}
            </p>
            <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {t('auth.employerRegisterHeadline')}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
              {t('auth.employerRegisterIntro')}
            </p>
          </div>

          <RegistrationProgress currentStep={progressStep} />

          <section className="rounded-[1.75rem] border border-white/15 bg-white/[0.08] p-5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
            <form onSubmit={onSubmit} className="space-y-6" noValidate>
              {!isConfigured ? (
                <FormAlert variant="info" tone="glass">
                  {t('auth.supabaseMissing')}
                </FormAlert>
              ) : null}

              {formError ? <FormAlert tone="glass">{formError}</FormAlert> : null}

              <div>
                <h2 className="font-heading text-sm font-semibold tracking-wide text-accent uppercase">
                  {t('auth.accountDetails')}
                </h2>
                <div className="mt-4 grid gap-5 md:grid-cols-2">
                  <Field
                    id="fullName"
                    label={t('auth.contactFullName')}
                    error={errors.fullName?.message}
                    tone="glass"
                  >
                    <TextInput
                      id="fullName"
                      type="text"
                      autoComplete="name"
                      tone="glass"
                      hasError={Boolean(errors.fullName)}
                      {...register('fullName')}
                    />
                  </Field>

                  <Field
                    id="companyName"
                    label={t('auth.companyName')}
                    error={errors.companyName?.message}
                    tone="glass"
                  >
                    <TextInput
                      id="companyName"
                      type="text"
                      autoComplete="organization"
                      tone="glass"
                      hasError={Boolean(errors.companyName)}
                      {...register('companyName')}
                    />
                  </Field>
                </div>

                <div className="mt-5">
                  <Field id="email" label={t('common.email')} error={errors.email?.message} tone="glass">
                    <TextInput
                      id="email"
                      type="email"
                      autoComplete="email"
                      tone="glass"
                      hasError={Boolean(errors.email)}
                      {...register('email')}
                    />
                  </Field>
                </div>

                <div className="mt-5">
                  <Field
                    id="phoneNumber"
                    label={t('auth.internationalPhone')}
                    error={errors.phoneNumber?.message || errors.phoneCountryIso?.message}
                    hint={t('auth.phoneHint')}
                    tone="glass"
                  >
                    <Controller
                      name="phoneNumber"
                      control={control}
                      render={({ field: phoneField }) => (
                        <Controller
                          name="phoneCountryIso"
                          control={control}
                          render={({ field: countryField }) => (
                            <PhoneInput
                              id="phoneNumber"
                              appearance="dark"
                              countryIso={countryField.value}
                              phoneNumber={phoneField.value}
                              hasError={Boolean(errors.phoneNumber || errors.phoneCountryIso)}
                              onCountryChange={countryField.onChange}
                              onPhoneChange={phoneField.onChange}
                            />
                          )}
                        />
                      )}
                    />
                  </Field>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <Field
                    id="password"
                    label={t('common.password')}
                    error={errors.password?.message}
                    hint={t('auth.passwordHint')}
                    tone="glass"
                  >
                    <TextInput
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      tone="glass"
                      hasError={Boolean(errors.password)}
                      {...register('password')}
                    />
                  </Field>

                  <Field
                    id="confirmPassword"
                    label={t('auth.confirmPassword')}
                    error={errors.confirmPassword?.message}
                    tone="glass"
                  >
                    <TextInput
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      tone="glass"
                      hasError={Boolean(errors.confirmPassword)}
                      {...register('confirmPassword')}
                    />
                  </Field>
                </div>
              </div>

              <div className="border-t border-white/10 pt-6">
                <h2 className="font-heading text-sm font-semibold tracking-wide text-accent uppercase">
                  {t('auth.companyDetails')}
                </h2>
                <div className="mt-4 grid gap-5 md:grid-cols-2">
                  <Field
                    id="countryOfResidence"
                    label={t('auth.companyHqCountry')}
                    error={errors.countryOfResidence?.message}
                    tone="glass"
                  >
                    <SelectInput
                      id="countryOfResidence"
                      tone="glass"
                      hasError={Boolean(errors.countryOfResidence)}
                      {...register('countryOfResidence')}
                    >
                      <option value="">{t('auth.selectCountry')}</option>
                      {hqCountries.map((country) => (
                        <option key={country.iso} value={country.name}>
                          {country.name}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>

                  <Field
                    id="industry"
                    label={t('auth.companyIndustry')}
                    error={errors.industry?.message}
                    tone="glass"
                  >
                    <input
                      id="industry"
                      list="employer-industries"
                      className={`h-12 w-full rounded-2xl border px-4 text-sm font-medium outline-none transition ${
                        errors.industry
                          ? 'border-red-400 bg-white/5 text-white focus:border-red-400'
                          : 'border-white/15 bg-white/5 text-white placeholder:text-slate-400 focus:border-brand-light'
                      }`}
                      {...register('industry')}
                    />
                    <datalist id="employer-industries">
                      {EMPLOYER_INDUSTRIES.map((industry) => (
                        <option key={industry} value={industry} />
                      ))}
                    </datalist>
                  </Field>
                </div>

                <div className="mt-5">
                  <Field
                    id="website"
                    label={t('auth.companyWebsite')}
                    error={errors.website?.message}
                    hint={t('auth.companyWebsiteHint')}
                    tone="glass"
                  >
                    <TextInput
                      id="website"
                      type="url"
                      placeholder="https://"
                      tone="glass"
                      hasError={Boolean(errors.website)}
                      {...register('website')}
                    />
                  </Field>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <label className="flex items-start gap-3 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-white/30 bg-transparent text-brand focus:ring-brand"
                    {...register('acceptTerms')}
                  />
                  <span>
                    {t('auth.acceptTermsPrefix')}{' '}
                    <a href="#terms" className="font-medium text-accent hover:underline">
                      {t('auth.termsLink')}
                    </a>
                    .
                  </span>
                </label>
                {errors.acceptTerms?.message ? (
                  <p className="text-sm text-red-300" role="alert">
                    {errors.acceptTerms.message}
                  </p>
                ) : null}

                <label className="flex items-start gap-3 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-white/30 bg-transparent text-brand focus:ring-brand"
                    {...register('acceptPrivacy')}
                  />
                  <span>
                    {t('auth.acceptPrivacyPrefix')}{' '}
                    <a href="#privacy" className="font-medium text-accent hover:underline">
                      {t('auth.privacyLink')}
                    </a>
                    .
                  </span>
                </label>
                {errors.acceptPrivacy?.message ? (
                  <p className="text-sm text-red-300" role="alert">
                    {errors.acceptPrivacy.message}
                  </p>
                ) : null}
              </div>

              <Button
                type="submit"
                className="w-full rounded-2xl bg-brand shadow-lg shadow-brand/30"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('auth.creatingAccount') : t('auth.createEmployerAccount')}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-300">
              {t('auth.alreadyHaveAccount')}{' '}
              <Link to="/login" className="font-semibold text-accent hover:underline">
                {t('auth.signIn')}
              </Link>
            </p>
            <p className="mt-2 text-center text-sm text-slate-300">
              {t('auth.notAnEmployer')}{' '}
              <Link to="/register" className="font-semibold text-accent hover:underline">
                {t('auth.registerAsApplicant')}
              </Link>
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
