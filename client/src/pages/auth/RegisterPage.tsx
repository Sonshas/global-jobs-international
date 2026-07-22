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
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { createRegisterSchema, type RegisterFormValues } from '@/schemas/auth';
import {
  findCountryByIso,
  jobSkillCategories,
  passportStatuses,
  registrationCountries,
  workDestinationCountries,
} from '@/data/registration';

export function RegisterPage() {
  const { t, i18n } = useTranslation();
  useDocumentTitle(`${t('auth.registerTitle')} | ${t('app.name')}`);
  const { signUp, isConfigured, isAuthenticated, isEmailVerified } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const schema = useMemo(() => createRegisterSchema(), [i18n.language]);

  const residenceCountries = useMemo(
    () => [...registrationCountries].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  useEffect(() => {
    if (isAuthenticated && isEmailVerified) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isEmailVerified, navigate]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      phoneCountryIso: 'NG',
      phoneNumber: '',
      countryOfResidence: '',
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
      Boolean(watched.email?.trim()) &&
      Boolean(watched.phoneNumber?.trim()) &&
      Boolean(watched.password) &&
      Boolean(watched.confirmPassword);

    const profileReady =
      Boolean(watched.countryOfResidence) &&
      Boolean(watched.preferredWorkCountry) &&
      Boolean(watched.preferredJobCategory) &&
      Boolean(watched.passportStatus) &&
      Boolean(watched.hasCv);

    if (accountReady && profileReady) return 3;
    if (accountReady || dirtyFields.countryOfResidence || dirtyFields.preferredWorkCountry) {
      return 2;
    }
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
      profile: {
        fullName: values.fullName,
        email: values.email,
        phoneCountryIso: values.phoneCountryIso,
        phoneNumber: values.phoneNumber,
        countryOfResidence: values.countryOfResidence,
        preferredWorkCountry: values.preferredWorkCountry,
        preferredJobCategory: values.preferredJobCategory,
        passportStatus: values.passportStatus,
        hasCv: values.hasCv,
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
              {t('auth.registerEyebrow')}
            </p>
            <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {t('auth.registerHeadline')}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
              {t('auth.registerIntro')}
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

              {formError ? (
                <FormAlert tone="glass">{formError}</FormAlert>
              ) : null}

              <div>
                <h2 className="font-heading text-sm font-semibold tracking-wide text-accent uppercase">
                  {t('auth.accountDetails')}
                </h2>
                <div className="mt-4 grid gap-5 md:grid-cols-2">
                  <Field
                    id="fullName"
                    label={t('auth.fullName')}
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
                  {t('auth.profilePreferences')}
                </h2>
                <div className="mt-4 grid gap-5 md:grid-cols-2">
                  <Field
                    id="countryOfResidence"
                    label={t('auth.countryOfResidence')}
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
                      {residenceCountries.map((country) => (
                        <option key={country.iso} value={country.name}>
                          {country.name}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>

                  <Field
                    id="preferredWorkCountry"
                    label={t('auth.preferredWorkCountry')}
                    error={errors.preferredWorkCountry?.message}
                    tone="glass"
                  >
                    <SelectInput
                      id="preferredWorkCountry"
                      tone="glass"
                      hasError={Boolean(errors.preferredWorkCountry)}
                      {...register('preferredWorkCountry')}
                    >
                      <option value="">{t('auth.selectDestination')}</option>
                      {workDestinationCountries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <Field
                    id="preferredJobCategory"
                    label={t('auth.preferredCategory')}
                    error={errors.preferredJobCategory?.message}
                    tone="glass"
                  >
                    <SelectInput
                      id="preferredJobCategory"
                      tone="glass"
                      hasError={Boolean(errors.preferredJobCategory)}
                      {...register('preferredJobCategory')}
                    >
                      <option value="">{t('auth.selectCategory')}</option>
                      {jobSkillCategories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>

                  <Field
                    id="passportStatus"
                    label={t('auth.passportStatus')}
                    error={errors.passportStatus?.message}
                    tone="glass"
                  >
                    <SelectInput
                      id="passportStatus"
                      tone="glass"
                      hasError={Boolean(errors.passportStatus)}
                      {...register('passportStatus')}
                    >
                      <option value="">{t('auth.selectPassportStatus')}</option>
                      {passportStatuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                </div>

                <div className="mt-5">
                  <Field
                    id="hasCv"
                    label={t('auth.hasCv')}
                    error={errors.hasCv?.message}
                    hint={t('auth.hasCvHint')}
                    tone="glass"
                  >
                    <Controller
                      name="hasCv"
                      control={control}
                      render={({ field }) => (
                        <div className="flex gap-3">
                          {(['yes', 'no'] as const).map((option) => (
                            <label
                              key={option}
                              className={`flex flex-1 cursor-pointer items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold capitalize transition ${
                                field.value === option
                                  ? 'border-accent/60 bg-accent/15 text-accent'
                                  : 'border-white/15 bg-white/5 text-slate-200 hover:border-white/30'
                              }`}
                            >
                              <input
                                type="radio"
                                className="sr-only"
                                value={option}
                                checked={field.value === option}
                                onChange={() => field.onChange(option)}
                              />
                              {option === 'yes' ? t('common.yes') : t('common.no')}
                            </label>
                          ))}
                        </div>
                      )}
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
                    I agree to the{' '}
                    <a href="#terms" className="font-medium text-accent hover:underline">
                      Terms &amp; Conditions
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
                    I agree to the{' '}
                    <a href="#privacy" className="font-medium text-accent hover:underline">
                      Privacy Policy
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
                {isSubmitting ? t('auth.creatingAccount') : t('auth.createAccount')}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-300">
              {t('auth.alreadyHaveAccount')}{' '}
              <Link to="/login" className="font-semibold text-accent hover:underline">
                {t('auth.signIn')}
              </Link>
            </p>
            <p className="mt-2 text-center text-sm text-slate-300">
              <Link to="/register/employer" className="font-semibold text-accent hover:underline">
                {t('auth.registerAsEmployer')}
              </Link>
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
