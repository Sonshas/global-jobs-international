import { z } from 'zod';
import i18n from '@/i18n';

function t(key: string) {
  return i18n.t(key);
}

export function createEmployerRegisterSchema() {
  return z
    .object({
      fullName: z
        .string()
        .trim()
        .min(2, t('validation.required'))
        .max(80, t('validation.required'))
        .regex(/^[\p{L}\s'.-]+$/u, t('validation.required')),
      companyName: z.string().trim().min(2, t('validation.required')).max(120, t('validation.required')),
      email: z.email(t('validation.emailInvalid')),
      phoneCountryIso: z.string().length(2, t('validation.selectOption')),
      phoneNumber: z
        .string()
        .trim()
        .min(6, t('validation.phoneInvalid'))
        .max(20, t('validation.phoneInvalid'))
        .regex(/^[0-9\s()-]+$/, t('validation.phoneInvalid')),
      countryOfResidence: z.string().min(2, t('auth.companyHqCountry')),
      industry: z.string().trim().min(2, t('validation.required')).max(80, t('validation.required')),
      website: z
        .string()
        .trim()
        .max(200)
        .optional()
        .refine(
          (value) => !value || /^https?:\/\/.+/i.test(value),
          t('auth.websiteInvalid'),
        ),
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

export const employerRegisterSchema = createEmployerRegisterSchema();

export type EmployerRegisterFormValues = z.infer<ReturnType<typeof createEmployerRegisterSchema>>;
