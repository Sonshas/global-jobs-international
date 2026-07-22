import { z } from 'zod';
import i18n from '@/i18n';
import { jobSkillCategories, passportStatuses, workDestinationCountries } from '@/data/registration';

const passportValues = passportStatuses.map((item) => item.value) as [
  (typeof passportStatuses)[number]['value'],
  ...(typeof passportStatuses)[number]['value'][],
];

const skillValues = jobSkillCategories.map((item) => item.value) as [
  (typeof jobSkillCategories)[number]['value'],
  ...(typeof jobSkillCategories)[number]['value'][],
];

const workCountryValues = workDestinationCountries as unknown as [
  (typeof workDestinationCountries)[number],
  ...(typeof workDestinationCountries)[number][],
];

function t(key: string) {
  return i18n.t(key);
}

export function createLoginSchema() {
  return z.object({
    email: z.email(t('validation.emailInvalid')),
    password: z.string().min(6, t('validation.passwordMin')),
  });
}

export function createRegisterSchema() {
  return z
    .object({
      fullName: z
        .string()
        .trim()
        .min(2, t('validation.required'))
        .max(80, t('validation.required'))
        .regex(/^[\p{L}\s'.-]+$/u, t('validation.required')),
      email: z.email(t('validation.emailInvalid')),
      phoneCountryIso: z.string().length(2, t('validation.selectOption')),
      phoneNumber: z
        .string()
        .trim()
        .min(6, t('validation.phoneInvalid'))
        .max(20, t('validation.phoneInvalid'))
        .regex(/^[0-9\s()-]+$/, t('validation.phoneInvalid')),
      countryOfResidence: z.string().min(2, t('auth.countryOfResidence')),
      preferredWorkCountry: z.enum(workCountryValues, {
        message: t('validation.selectOption'),
      }),
      preferredJobCategory: z.enum(skillValues, {
        message: t('validation.selectOption'),
      }),
      passportStatus: z.enum(passportValues, {
        message: t('validation.selectOption'),
      }),
      hasCv: z.enum(['yes', 'no'], {
        message: t('auth.hasCv'),
      }),
      password: z
        .string()
        .min(8, t('validation.passwordMin'))
        .regex(/[A-Za-z]/, t('validation.passwordMin'))
        .regex(/[0-9]/, t('validation.passwordMin')),
      confirmPassword: z.string().min(1, t('auth.confirmPassword')),
      acceptTerms: z.boolean().refine((value) => value, {
        message: t('validation.required'),
      }),
      acceptPrivacy: z.boolean().refine((value) => value, {
        message: t('validation.required'),
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('validation.passwordMismatch'),
      path: ['confirmPassword'],
    });
}

export function createForgotPasswordSchema() {
  return z.object({
    email: z.email(t('validation.emailInvalid')),
  });
}

export function createResetPasswordSchema() {
  return z
    .object({
      password: z
        .string()
        .min(8, t('validation.passwordMin'))
        .regex(/[A-Za-z]/, t('validation.passwordMin'))
        .regex(/[0-9]/, t('validation.passwordMin')),
      confirmPassword: z.string().min(1, t('auth.confirmPassword')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('validation.passwordMismatch'),
      path: ['confirmPassword'],
    });
}

/** Default schemas (English at module load) — prefer create*Schema() in forms for live language. */
export const loginSchema = createLoginSchema();
export const registerSchema = createRegisterSchema();
export const forgotPasswordSchema = createForgotPasswordSchema();
export const resetPasswordSchema = createResetPasswordSchema();

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;
export type RegisterFormValues = z.infer<ReturnType<typeof createRegisterSchema>>;
export type ForgotPasswordFormValues = z.infer<ReturnType<typeof createForgotPasswordSchema>>;
export type ResetPasswordFormValues = z.infer<ReturnType<typeof createResetPasswordSchema>>;
