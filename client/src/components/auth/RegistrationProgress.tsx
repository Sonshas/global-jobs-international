type RegistrationProgressProps = {
  currentStep: 1 | 2 | 3;
};

const steps = [
  { id: 1, label: 'Account' },
  { id: 2, label: 'Profile' },
  { id: 3, label: 'Verification' },
] as const;

export function RegistrationProgress({ currentStep }: RegistrationProgressProps) {
  return (
    <nav aria-label="Registration progress" className="mb-8">
      <ol className="grid grid-cols-3 gap-2 sm:gap-3">
        {steps.map((step, index) => {
          const complete = step.id < currentStep;
          const active = step.id === currentStep;

          return (
            <li key={step.id} className="relative">
              <div
                className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 sm:px-4 ${
                  active
                    ? 'border-brand/50 bg-brand/15 text-white'
                    : complete
                      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
                      : 'border-white/10 bg-white/5 text-slate-300'
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    active
                      ? 'bg-brand text-white'
                      : complete
                        ? 'bg-emerald-400 text-slate-950'
                        : 'bg-white/10 text-slate-200'
                  }`}
                >
                  {complete ? '✓' : step.id}
                </span>
                <span className="font-heading text-xs font-semibold tracking-wide sm:text-sm">
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 ? (
                <span className="pointer-events-none absolute top-1/2 -right-1.5 hidden h-px w-3 bg-white/20 sm:block" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
