import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/common/form-field';
import { ErrorNote } from '@/components/common/states';
import { useUpdateApplication } from '@/hooks/use-applications';
import { ApiClientError, errorMessage } from '@/lib/api';
import type { ApplicationDetail, UpdateApplicationRequest } from '@/types/api';

const optionalNumber = z
  .string()
  .trim()
  .refine((v) => v === '' || (/^\d+(\.\d+)?$/.test(v) && Number(v) >= 0), 'Enter a positive number');

const schema = z
  .object({
    companyName: z.string().trim().min(1, 'Company is required').max(200),
    jobTitle: z.string().trim().min(1, 'Job title is required').max(200),
    location: z.string().trim().max(200),
    jobUrl: z
      .string()
      .trim()
      .max(2000)
      .refine((v) => !v || /^https?:\/\/\S+$/i.test(v), 'Enter a full URL starting with http:// or https://'),
    appliedAt: z.string(),
    source: z.string().trim().max(100),
    employmentType: z.string().trim().max(60),
    salaryMin: optionalNumber,
    salaryMax: optionalNumber,
    salaryCurrency: z
      .string()
      .trim()
      .refine((v) => v === '' || /^[A-Za-z]{3}$/.test(v), 'Use a 3-letter code, e.g. EUR'),
    recruiterName: z.string().trim().max(200),
    recruiterEmail: z
      .string()
      .trim()
      .refine((v) => v === '' || z.string().email().safeParse(v).success, 'Enter a valid email'),
    currentStage: z.string().trim().max(200),
  })
  .refine((v) => !v.salaryMin || !v.salaryMax || Number(v.salaryMin) <= Number(v.salaryMax), {
    path: ['salaryMax'],
    message: 'Max must be ≥ min',
  });

type Values = z.infer<typeof schema>;

const toForm = (a: ApplicationDetail): Values => ({
  companyName: a.companyName,
  jobTitle: a.jobTitle,
  location: a.location ?? '',
  jobUrl: a.jobUrl ?? '',
  appliedAt: a.appliedAt?.slice(0, 10) ?? '',
  source: a.source ?? '',
  employmentType: a.employmentType ?? '',
  salaryMin: a.salaryMin?.toString() ?? '',
  salaryMax: a.salaryMax?.toString() ?? '',
  salaryCurrency: a.salaryCurrency ?? '',
  recruiterName: a.recruiterName ?? '',
  recruiterEmail: a.recruiterEmail ?? '',
  currentStage: a.currentStage ?? '',
});

export function EditDetailsDialog({
  app,
  open,
  onOpenChange,
}: {
  app: ApplicationDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const update = useUpdateApplication(app.id);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toForm(app) });
  const { register, handleSubmit, formState, reset, setError } = form;
  const e = formState.errors;

  useEffect(() => {
    if (open) {
      reset(toForm(app));
      update.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = handleSubmit(async (v) => {
    // Send only changed fields (contract: only non-undefined fields are applied)
    const orig = toForm(app);
    const body: UpdateApplicationRequest = {};
    const str = (k: keyof Values) => (v[k] === orig[k] ? undefined : v[k].trim() || null);
    if (v.companyName !== orig.companyName) body.companyName = v.companyName.trim();
    if (v.jobTitle !== orig.jobTitle) body.jobTitle = v.jobTitle.trim();
    body.location = str('location');
    body.jobUrl = str('jobUrl');
    body.appliedAt = str('appliedAt');
    body.source = str('source');
    body.employmentType = str('employmentType');
    body.recruiterName = str('recruiterName');
    body.recruiterEmail = str('recruiterEmail');
    body.currentStage = str('currentStage');
    if (v.salaryMin !== orig.salaryMin) body.salaryMin = v.salaryMin ? Number(v.salaryMin) : null;
    if (v.salaryMax !== orig.salaryMax) body.salaryMax = v.salaryMax ? Number(v.salaryMax) : null;
    if (v.salaryCurrency !== orig.salaryCurrency) body.salaryCurrency = v.salaryCurrency.trim().toUpperCase() || null;
    (Object.keys(body) as (keyof UpdateApplicationRequest)[]).forEach((k) => body[k] === undefined && delete body[k]);

    if (Object.keys(body).length === 0) return onOpenChange(false);
    try {
      await update.mutateAsync(body);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiClientError && err.fieldErrors)
        Object.entries(err.fieldErrors).forEach(([f, m]) => f in v && setError(f as keyof Values, { message: m }));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit details</DialogTitle>
          <DialogDescription>Correct anything the email parser got wrong. Leave a field empty if unknown.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
            {update.isError && <ErrorNote className="sm:col-span-2">{errorMessage(update.error)}</ErrorNote>}
            <FormField label="Company" htmlFor="ed-company" error={e.companyName?.message} required>
              <Input id="ed-company" aria-invalid={!!e.companyName} {...register('companyName')} />
            </FormField>
            <FormField label="Job title" htmlFor="ed-title" error={e.jobTitle?.message} required>
              <Input id="ed-title" aria-invalid={!!e.jobTitle} {...register('jobTitle')} />
            </FormField>
            <FormField label="Location" htmlFor="ed-location" error={e.location?.message}>
              <Input id="ed-location" {...register('location')} />
            </FormField>
            <FormField label="Employment type" htmlFor="ed-emp" error={e.employmentType?.message}>
              <Input id="ed-emp" list="ed-emp-list" placeholder="Full-time, Contract…" {...register('employmentType')} />
              <datalist id="ed-emp-list">
                {['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary', 'Freelance'].map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </FormField>
            <FormField label="Job URL" htmlFor="ed-url" error={e.jobUrl?.message} className="sm:col-span-2">
              <Input id="ed-url" type="url" placeholder="https://" aria-invalid={!!e.jobUrl} {...register('jobUrl')} />
            </FormField>
            <FormField label="Applied date" htmlFor="ed-date" error={e.appliedAt?.message}>
              <Input id="ed-date" type="date" {...register('appliedAt')} />
            </FormField>
            <FormField label="Source" htmlFor="ed-source" error={e.source?.message}>
              <Input id="ed-source" {...register('source')} />
            </FormField>
            <div className="grid grid-cols-[1fr_1fr_88px] gap-2 sm:col-span-2">
              <FormField label="Salary min" htmlFor="ed-smin" error={e.salaryMin?.message}>
                <Input id="ed-smin" inputMode="numeric" aria-invalid={!!e.salaryMin} {...register('salaryMin')} />
              </FormField>
              <FormField label="Salary max" htmlFor="ed-smax" error={e.salaryMax?.message}>
                <Input id="ed-smax" inputMode="numeric" aria-invalid={!!e.salaryMax} {...register('salaryMax')} />
              </FormField>
              <FormField label="Currency" htmlFor="ed-cur" error={e.salaryCurrency?.message}>
                <Input id="ed-cur" placeholder="EUR" maxLength={3} className="uppercase" aria-invalid={!!e.salaryCurrency} {...register('salaryCurrency')} />
              </FormField>
            </div>
            <FormField label="Recruiter name" htmlFor="ed-rname" error={e.recruiterName?.message}>
              <Input id="ed-rname" {...register('recruiterName')} />
            </FormField>
            <FormField label="Recruiter email" htmlFor="ed-remail" error={e.recruiterEmail?.message}>
              <Input id="ed-remail" type="email" aria-invalid={!!e.recruiterEmail} {...register('recruiterEmail')} />
            </FormField>
            <FormField label="Current stage" htmlFor="ed-stage" error={e.currentStage?.message} hint="Free text, e.g. “Waiting for onsite feedback”" className="sm:col-span-2">
              <Input id="ed-stage" {...register('currentStage')} />
            </FormField>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={update.isPending} disabled={!formState.isDirty}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
