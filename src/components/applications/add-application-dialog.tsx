import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
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
import { Input, Textarea } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusDot } from '@/components/common/badges';
import { FormField } from '@/components/common/form-field';
import { ErrorNote } from '@/components/common/states';
import { useAppUI } from '@/hooks/use-app-ui';
import { useApplicationFacets, useCreateApplication } from '@/hooks/use-applications';
import { ApiClientError, errorMessage } from '@/lib/api';
import { isoDate } from '@/lib/format';
import { ALL_STATUSES } from '@/lib/status';
import type { ApplicationStatus } from '@/types/api';

export const SOURCE_OPTIONS = ['LinkedIn', 'Company site', 'Greenhouse', 'Lever', 'Workday', 'Indeed', 'Referral', 'Recruiter', 'Manual'];

const schema = z.object({
  companyName: z.string().trim().min(1, 'Company is required').max(200),
  jobTitle: z.string().trim().min(1, 'Job title is required').max(200),
  jobUrl: z
    .string()
    .trim()
    .max(2000)
    .refine((v) => !v || /^https?:\/\/\S+$/i.test(v), 'Enter a full URL starting with http:// or https://'),
  location: z.string().trim().max(200),
  appliedAt: z.string().refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Invalid date'),
  source: z.string().trim().max(100),
  status: z.custom<ApplicationStatus>(),
  notes: z.string().max(5000),
});

type FormValues = z.infer<typeof schema>;

const blank = (): FormValues => ({
  companyName: '',
  jobTitle: '',
  jobUrl: '',
  location: '',
  appliedAt: isoDate(new Date()),
  source: 'Manual',
  status: 'APPLIED',
  notes: '',
});

export function AddApplicationDialog() {
  const { addApplicationOpen, setAddApplicationOpen, addApplicationDefaults } = useAppUI();
  const create = useCreateApplication();
  const facets = useApplicationFacets();
  const navigate = useNavigate();

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: blank() });
  const { register, handleSubmit, formState, reset, control, setError } = form;

  useEffect(() => {
    if (addApplicationOpen) {
      const d = addApplicationDefaults;
      reset({
        ...blank(),
        ...(d?.companyName ? { companyName: d.companyName } : {}),
        ...(d?.jobTitle ? { jobTitle: d.jobTitle } : {}),
        ...(d?.status ? { status: d.status } : {}),
      });
      create.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addApplicationOpen]);

  const onSubmit = handleSubmit(async (v) => {
    try {
      const app = await create.mutateAsync({
        companyName: v.companyName.trim(),
        jobTitle: v.jobTitle.trim(),
        jobUrl: v.jobUrl.trim() || null,
        location: v.location.trim() || null,
        appliedAt: v.appliedAt || null,
        source: v.source.trim() || null,
        status: v.status,
        notes: v.notes.trim() || null,
      });
      setAddApplicationOpen(false);
      navigate(`/applications/${app.id}`);
    } catch (e) {
      if (e instanceof ApiClientError && e.fieldErrors) {
        for (const [field, msg] of Object.entries(e.fieldErrors)) {
          if (field in v) setError(field as keyof FormValues, { message: msg });
        }
      }
    }
  });

  const sources = Array.from(new Set([...SOURCE_OPTIONS, ...(facets.data?.sources ?? [])]));
  const err = formState.errors;

  return (
    <Dialog open={addApplicationOpen} onOpenChange={setAddApplicationOpen}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add application</DialogTitle>
          <DialogDescription>Track an application manually. Matching emails will be linked automatically.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
          <DialogBody className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
            {create.isError && !(create.error instanceof ApiClientError && create.error.fieldErrors) && (
              <ErrorNote className="sm:col-span-2">{errorMessage(create.error)}</ErrorNote>
            )}
            <FormField label="Company" htmlFor="af-company" error={err.companyName?.message} required>
              <Input id="af-company" list="af-company-list" autoFocus placeholder="e.g. Stripe" aria-invalid={!!err.companyName} {...register('companyName')} />
              <datalist id="af-company-list">
                {facets.data?.companies.map((c) => <option key={c.id} value={c.name} />)}
              </datalist>
            </FormField>
            <FormField label="Job title" htmlFor="af-title" error={err.jobTitle?.message} required>
              <Input id="af-title" placeholder="e.g. Senior Frontend Engineer" aria-invalid={!!err.jobTitle} {...register('jobTitle')} />
            </FormField>
            <FormField label="Job URL" htmlFor="af-url" error={err.jobUrl?.message} className="sm:col-span-2">
              <Input id="af-url" type="url" placeholder="https://" aria-invalid={!!err.jobUrl} {...register('jobUrl')} />
            </FormField>
            <FormField label="Location" htmlFor="af-location" error={err.location?.message}>
              <Input id="af-location" list="af-location-list" placeholder="e.g. Berlin · Remote" {...register('location')} />
              <datalist id="af-location-list">
                {facets.data?.locations.map((l) => <option key={l} value={l} />)}
              </datalist>
            </FormField>
            <FormField label="Applied date" htmlFor="af-date" error={err.appliedAt?.message}>
              <Input id="af-date" type="date" max={isoDate(new Date())} {...register('appliedAt')} />
            </FormField>
            <FormField label="Source" htmlFor="af-source" error={err.source?.message} hint="Pick one or type your own">
              <Input id="af-source" list="af-source-list" {...register('source')} />
              <datalist id="af-source-list">
                {sources.map((s) => <option key={s} value={s} />)}
              </datalist>
            </FormField>
            <FormField label="Status" htmlFor="af-status">
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => field.onChange(v as ApplicationStatus)}>
                    <SelectTrigger id="af-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          <StatusDot status={s} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField label="Notes" htmlFor="af-notes" className="sm:col-span-2">
              <Textarea id="af-notes" rows={3} placeholder="Referral from…, salary expectations, anything worth remembering" {...register('notes')} />
            </FormField>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddApplicationOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Add application
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
