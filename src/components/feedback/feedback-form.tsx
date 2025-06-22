
'use client';

import { useState } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Send } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { FeedbackFormData, FeedbackType } from '@/types';
import { submitFeedbackAction } from '@/app/(user)/feedback/actions';

const feedbackFormSchema = z.object({
  type: z.enum(['feedback', 'request', 'other'], { required_error: 'Please select a type.' }),
  message: z.string().min(10, 'Message must be at least 10 characters.').max(2000, 'Message must be less than 2000 characters.'),
  email: z.string().email('Please enter a valid email address.').optional().or(z.literal('')),
});

const typeOptions: { value: FeedbackType; label: string }[] = [
  { value: 'feedback', label: 'Feedback' },
  { value: 'request', label: 'Content Request' },
  { value: 'other', label: 'Other' },
];

export function FeedbackForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit, formState: { errors }, reset } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      type: 'feedback',
      message: '',
      email: '',
    },
  });

  const onSubmit: SubmitHandler<FeedbackFormData> = async (data) => {
    setIsSubmitting(true);
    const result = await submitFeedbackAction(data);
    if (result.success) {
      toast({
        title: "Submitted!",
        description: result.message,
      });
      reset();
    } else {
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: result.message,
      });
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label className="mb-2 block">Type of Submission</Label>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              className="flex flex-col sm:flex-row gap-4"
            >
              {typeOptions.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`type-${option.value}`} />
                  <Label htmlFor={`type-${option.value}`} className="font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        />
        {errors.type && <p className="text-sm text-destructive mt-1">{errors.type.message}</p>}
      </div>

      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          {...register('message')}
          placeholder="Tell us what you think or what you'd like to see..."
          rows={5}
          className="bg-card/50 focus:bg-card"
        />
        {errors.message && <p className="text-sm text-destructive mt-1">{errors.message.message}</p>}
      </div>

      <div>
        <Label htmlFor="email">Your Email (Optional)</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="your.email@example.com"
          className="bg-card/50 focus:bg-card"
          suppressHydrationWarning={true} 
        />
        {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
        <p className="text-xs text-muted-foreground mt-1">We'll only use this to contact you about your submission if needed.</p>
      </div>

      <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        Submit
      </Button>
    </form>
  );
}
