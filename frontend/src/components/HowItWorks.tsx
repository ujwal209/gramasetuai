'use client';

export function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Profile Ingestion',
      description:
        'Specify your citizen profile including landholding acreage, regional state, and farming crops.',
    },
    {
      number: '02',
      title: 'Deterministic Matching',
      description:
        'Our statutory rule engine compares your profile deterministically against official gazette rules.',
    },
    {
      number: '03',
      title: 'Multimodal Vision Audit',
      description:
        'Audit your certificates, land records, and passbooks via vision OCR for missing parameters.',
    },
    {
      number: '04',
      title: 'Parchaa Generation',
      description:
        'Compile a verified single-page CSC application dossier with QR code verification.',
    },
  ];

  return (
    <section className="py-16 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-left max-w-2xl space-y-2">
          <span className="badge-sleek badge-sleek-active inline-block">
            FOUR-STEP METHODOLOGY
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            How GramSetu Operates
          </h3>
          <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed font-sans-sleek">
            Eliminating bureaucratic complexity and intermediaries so every eligible citizen receives their statutory entitlements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="p-5 border border-border bg-card corner-accent shadow-xs space-y-3 text-left"
            >
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="font-mono-code text-xs font-bold text-[#15803d] dark:text-[#34d399]">
                  STEP // {step.number}
                </span>
                <span className="font-mono-code text-[10px] text-muted-foreground uppercase">
                  ACTIVE
                </span>
              </div>

              <h4 className="font-bold text-sm text-foreground">
                {step.title}
              </h4>

              <p className="text-xs text-muted-foreground leading-relaxed font-sans-sleek">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
