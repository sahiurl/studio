
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Header } from '@/components/layout/header';
// Removed Footer import
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { AdFormData, AdExpiryUnit } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { createAdAction } from './actions';

const adFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  posterImageUrl: z.string().url('Poster Image URL must be a valid URL'),
  buttonLabel: z.string().min(1, 'Button label is required'),
  targetUrl: z.string().url('Target URL must be a valid URL'),
  expiryValue: z.coerce.number().int().positive('Expiry value must be a positive number'),
  expiryUnit: z.enum(['minutes', 'hours', 'days'], { required_error: 'Expiry unit is required' }),
});

const expiryUnitOptions: { value: AdExpiryUnit; label: string }[] = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
];

export default function CreateAdPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('isAdminAuthenticated') !== 'true') {
      router.replace('/admin/access');
    }
  }, [router]);

  const { register, control, handleSubmit, formState: { errors }, reset } = useForm<AdFormData>({
    resolver: zodResolver(adFormSchema),
    defaultValues: {
      title: '',
      posterImageUrl: '',
      buttonLabel: 'Learn More',
      targetUrl: '',
      expiryValue: 1,
      expiryUnit: 'days',
    },
  });

  const onSubmit: SubmitHandler<AdFormData> = async (data) => {
    setIsSubmitting(true);
    const result = await createAdAction(data);
    if (result.success) {
      toast({
        title: "Success!",
        description: result.message,
      });
      reset();
      router.push('/admin/ads/manage');
    } else {
      toast({
        variant: "destructive",
        title: "Error Creating Ad",
        description: result.message,
      });
    }
    setIsSubmitting(false);
  };

  if (typeof window !== 'undefined' && sessionStorage.getItem('isAdminAuthenticated') !== 'true') {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="w-full max-w-xl mx-auto shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-4 mb-2">
              <Button variant="outline" size="icon" asChild className="flex-shrink-0">
                <Link href="/admin/dashboard" aria-label="Back to Admin Dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <CardTitle className="text-2xl font-headline">Create New Ad</CardTitle>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">Ad Title</Label>
                <Input id="title" {...register('title')} />
                {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <Label htmlFor="posterImageUrl">Poster Image URL</Label>
                <Input id="posterImageUrl" {...register('posterImageUrl')} placeholder="https://..." />
                {errors.posterImageUrl && <p className="text-sm text-destructive mt-1">{errors.posterImageUrl.message}</p>}
              </div>
              <div>
                <Label htmlFor="buttonLabel">Button Label</Label>
                <Input id="buttonLabel" {...register('buttonLabel')} />
                {errors.buttonLabel && <p className="text-sm text-destructive mt-1">{errors.buttonLabel.message}</p>}
              </div>
              <div>
                <Label htmlFor="targetUrl">Target URL (On Button Click)</Label>
                <Input id="targetUrl" {...register('targetUrl')} placeholder="https://..." />
                {errors.targetUrl && <p className="text-sm text-destructive mt-1">{errors.targetUrl.message}</p>}
              </div>
              
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium mb-1">Ad Expiry</legend>
                <div className="flex items-start gap-3">
                  <div className="flex-grow">
                    <Label htmlFor="expiryValue" className="sr-only">Expiry Value</Label>
                    <Input
                      id="expiryValue"
                      type="number"
                      {...register('expiryValue')}
                      min="1"
                    />
                  </div>
                  <div className="w-1/2">
                  <Controller
                    name="expiryUnit"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger id="expiryUnit">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {expiryUnitOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  </div>
                </div>
                 {(errors.expiryValue || errors.expiryUnit) && (
                    <div className="grid grid-cols-2 gap-3">
                        {errors.expiryValue && <p className="text-sm text-destructive mt-1">{errors.expiryValue.message}</p>}
                        {errors.expiryUnit && <p className="text-sm text-destructive mt-1 col-start-2">{errors.expiryUnit.message}</p>}
                    </div>
                )}
              </fieldset>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Ad
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
      {/* Footer component usage removed from here, it's handled by layout.tsx */}
    </div>
  );
}
