'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

// shared types
import { leadSchema, LeadInput } from '@/schemas/lead';
import { ApiResponse } from '@/schemas/api';

export default function LeadSubmissionPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      email: '',
      website: '',
    },
  });

  async function onSubmit(data: LeadInput) {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit lead');
      }

      toast.success('Lead Submitted!', {
        description: result.message || 'We have received your information.',
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />
      });

      form.reset();
    } catch (error: any) {
      toast.error('Submission Failed', {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 px-4 py-12">
      <div className="text-center space-y-3">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
          Lead Intake <span className="text-primary">System</span>
        </h1>
        {/* <p className="text-muted-foreground max-w-md mx-auto text-sm md:text-base">
          Submit your details to get qualified instantly by our AI-powered engine.
        </p> */}
      </div>

      <Card className="w-full max-w-md border-muted bg-card/50 backdrop-blur-sm shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Submit New Lead</CardTitle>
          <CardDescription>
            Enter the prospect's details below.
          </CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base">Full Name</Label>
              <Input
                id="name"
                placeholder="Ex. Jane Doe"
                {...form.register('name')}
                disabled={isSubmitting}
                className={`h-12 ${form.formState.errors.name ? 'border-destructive' : ''}`}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Ex. jane@company.com"
                {...form.register('email')}
                disabled={isSubmitting}
                className={`h-12 ${form.formState.errors.email ? 'border-destructive' : ''}`}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            {/* Website Field */}
            <div className="space-y-2">
              <Label htmlFor="website" className="text-base">Website (Optional)</Label>
              <Input
                id="website"
                placeholder="https://company.com"
                {...form.register('website')}
                disabled={isSubmitting}
                className={`h-12 ${form.formState.errors.website ? 'border-destructive' : ''}`}
              />
              {form.formState.errors.website && (
                <p className="text-xs text-destructive">{form.formState.errors.website.message}</p>
              )}
            </div>

          </CardContent>
          <CardFooter className="flex flex-col-reverse sm:flex-row mt-4 justify-between gap-4 sm:gap-0">
            <Button
              variant="ghost"
              type="button"
              onClick={() => form.reset()}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Reset
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-32 h-11 text-base">
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Submit <Send className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="text-sm text-muted-foreground">
        <a href="/dashboard" className="hover:text-primary transition-colors underline underline-offset-4">
          View Admin Dashboard →
        </a>
      </div>
    </div>
  );
}
