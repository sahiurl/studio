
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save, Bot, LinkIcon, Zap, Globe, ShieldAlert } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { updateSiteSettingsAction, getPublicSiteSettingsAction } from './actions';
import type { AdminSiteSettingsFormData } from '@/types';
import { Separator } from '@/components/ui/separator';

// Client-side Zod schema for form validation
const settingsFormSchema = z.object({
  appUrl: z.string().url("Application URL must be a valid URL (e.g., https://example.com)").or(z.literal("")).optional(),
  telegramChannelUrl: z.string().url("Telegram URL must be valid (e.g., https://t.me/yourchannel)").or(z.literal("")).optional(),
  howToDownloadVideoUrl: z.string().url("Video URL must be valid (e.g., YouTube, Vimeo)").or(z.literal("")).optional(),
  howToDownloadInstructions: z.string().min(10, "Instructions must be at least 10 characters").or(z.literal("")).optional(),
  disclaimerContent: z.string().min(20, "Disclaimer content must be at least 20 characters").or(z.literal("")).optional(),
  privacyPolicyContent: z.string().min(20, "Privacy Policy content must be at least 20 characters").or(z.literal("")).optional(),
  telegramBotToken: z.string().optional().or(z.literal("")),
  telegramChannelIds: z.string().optional().or(z.literal("")), 
  enableUrlShortener: z.boolean().optional(),
  urlShortenerApiUrl: z.string().url("Shortener API URL must be a valid URL").or(z.literal("")).optional(),
  urlShortenerApiKey: z.string().optional().or(z.literal("")),
  enableCreateWebsiteButton: z.boolean().optional(),
  createWebsiteButtonText: z.string().optional().or(z.literal("")),
  disableButtonPasswordAttempt: z.string().optional(), // For client-side validation if needed, primarily server-checked
}).refine(data => {
  if (data.enableUrlShortener) {
    return !!data.urlShortenerApiUrl && data.urlShortenerApiUrl.trim() !== '' &&
           !!data.urlShortenerApiKey && data.urlShortenerApiKey.trim() !== '';
  }
  return true;
}, {
  message: "If URL Shortener is enabled, API URL and API Key are required.",
  path: ['enableUrlShortener'],
}).refine(data => {
  // If the button is enabled, text is required
  if (data.enableCreateWebsiteButton && (!data.createWebsiteButtonText || data.createWebsiteButtonText.trim() === '')) {
    return false; 
  }
  return true;
}, {
  message: "Button text is required if 'Create Your Own Website' button is enabled.",
  path: ['createWebsiteButtonText'],
});

export default function SiteSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [authDetermined, setAuthDetermined] = useState(false);
  const [isClientAuthed, setIsClientAuthed] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [initialEnableCreateWebsiteButton, setInitialEnableCreateWebsiteButton] = useState<boolean | undefined>(undefined);
  const [showDisablePasswordInput, setShowDisablePasswordInput] = useState(false);


  const { register, handleSubmit, formState: { errors }, reset, setValue, control, watch } = useForm<AdminSiteSettingsFormData>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      appUrl: '',
      telegramChannelUrl: '',
      howToDownloadVideoUrl: '',
      howToDownloadInstructions: '',
      disclaimerContent: '',
      privacyPolicyContent: '',
      telegramBotToken: '',
      telegramChannelIds: '',
      enableUrlShortener: false,
      urlShortenerApiUrl: '',
      urlShortenerApiKey: '',
      enableCreateWebsiteButton: false,
      createWebsiteButtonText: 'Create Your Own Website',
      disableButtonPasswordAttempt: '',
    },
  });
  const enableUrlShortenerWatched = watch('enableUrlShortener');
  const enableCreateWebsiteButtonWatched = watch('enableCreateWebsiteButton');

  useEffect(() => {
    if (sessionStorage.getItem('isAdminAuthenticated') === 'true') {
      setIsClientAuthed(true);
    }
    setAuthDetermined(true);
  }, []);

  useEffect(() => {
    if (authDetermined && !isClientAuthed) {
      router.replace('/admin/access');
    }
  }, [authDetermined, isClientAuthed, router]);

  useEffect(() => {
    async function fetchInitialSettings() {
      setIsLoadingData(true);
      try {
        const settings = await getPublicSiteSettingsAction();
        if (settings) {
          setValue('appUrl', settings.appUrl || '');
          setValue('telegramChannelUrl', settings.telegramChannelUrl || '');
          setValue('howToDownloadVideoUrl', settings.howToDownloadVideoUrl || '');
          setValue('howToDownloadInstructions', settings.howToDownloadInstructions || '');
          setValue('disclaimerContent', settings.disclaimerContent || '');
          setValue('privacyPolicyContent', settings.privacyPolicyContent || '');
          setValue('telegramBotToken', settings.telegramBotToken || '');
          setValue('telegramChannelIds', settings.telegramChannelIds || '');
          setValue('enableUrlShortener', settings.enableUrlShortener || false);
          setValue('urlShortenerApiUrl', settings.urlShortenerApiUrl || '');
          setValue('urlShortenerApiKey', settings.urlShortenerApiKey || '');
          setValue('enableCreateWebsiteButton', settings.enableCreateWebsiteButton || false);
          setInitialEnableCreateWebsiteButton(settings.enableCreateWebsiteButton || false); // Store initial state
          setValue('createWebsiteButtonText', settings.createWebsiteButtonText || 'Create Your Own Website');
        }
      } catch (error) {
        console.error("Failed to fetch initial settings", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load current settings." });
      } finally {
        setIsLoadingData(false);
      }
    }
    if (isClientAuthed) {
      fetchInitialSettings();
    }
  }, [isClientAuthed, setValue, toast]);

  // Effect to manage visibility of the disable password input
  useEffect(() => {
    if (initialEnableCreateWebsiteButton === true && enableCreateWebsiteButtonWatched === false) {
      setShowDisablePasswordInput(true);
    } else {
      setShowDisablePasswordInput(false);
      setValue('disableButtonPasswordAttempt', ''); // Clear password if not needed
    }
  }, [enableCreateWebsiteButtonWatched, initialEnableCreateWebsiteButton, setValue]);


  const onSubmit: SubmitHandler<AdminSiteSettingsFormData> = async (data) => {
    setIsSubmitting(true);
    const result = await updateSiteSettingsAction(data); // data now includes disableButtonPasswordAttempt
    if (result.success) {
      toast({ title: "Success!", description: result.message });
      // Re-fetch initial state for the disable button logic after successful save
      const settings = await getPublicSiteSettingsAction();
      if (settings) setInitialEnableCreateWebsiteButton(settings.enableCreateWebsiteButton || false);
    } else {
      toast({ variant: "destructive", title: "Error Updating Settings", description: result.message });
    }
    setIsSubmitting(false);
  };

  if (!authDetermined || (isClientAuthed && isLoadingData)) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!isClientAuthed) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow flex items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </main>
        </div>
    );
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
              <CardTitle className="text-2xl font-headline">Site Settings</CardTitle>
            </div>
            <CardDescription>Manage global settings for your application.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <section>
                <h3 className="text-lg font-semibold mb-3 border-b pb-2">General Settings</h3>
                 <div className="space-y-4">
                    <div>
                        <Label htmlFor="appUrl">Application Base URL</Label>
                        <Input 
                            id="appUrl" 
                            {...register('appUrl')} 
                            placeholder="https://yourdomain.com"
                        />
                        {errors.appUrl && <p className="text-sm text-destructive mt-1">{errors.appUrl.message}</p>}
                        <p className="text-xs text-muted-foreground mt-1">The main URL for your website. Used for generating absolute links.</p>
                    </div>
                    <div>
                    <Label htmlFor="telegramChannelUrl">Main Telegram Channel URL (Public Link)</Label>
                    <Input 
                        id="telegramChannelUrl" 
                        {...register('telegramChannelUrl')} 
                        placeholder="https://t.me/yourmainchannel"
                    />
                    {errors.telegramChannelUrl && <p className="text-sm text-destructive mt-1">{errors.telegramChannelUrl.message}</p>}
                    <p className="text-xs text-muted-foreground mt-1">Public link to your main Telegram channel. Displayed in header/footer.</p>
                    </div>
                 </div>
              </section>

              <Separator />

              <section>
                 <h3 className="text-lg font-semibold mb-3 border-b pb-2 flex items-center">
                    <Bot className="mr-2 h-5 w-5 text-primary" /> Telegram Bot (for Auto-Posting)
                </h3>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="telegramBotToken">Telegram Bot Token</Label>
                        <Input 
                            id="telegramBotToken" 
                            type="password"
                            {...register('telegramBotToken')} 
                            placeholder="Enter your Telegram Bot Token"
                        />
                        {errors.telegramBotToken && <p className="text-sm text-destructive mt-1">{errors.telegramBotToken.message}</p>}
                        <p className="text-xs text-muted-foreground mt-1">Token for your bot to enable auto-posting new content.</p>
                    </div>
                    <div>
                        <Label htmlFor="telegramChannelIds">Telegram Channel IDs/Usernames for Bot</Label>
                        <Input 
                            id="telegramChannelIds" 
                            {...register('telegramChannelIds')} 
                            placeholder="@channel1, -1001234567890, @anotherchannel"
                        />
                        {errors.telegramChannelIds && <p className="text-sm text-destructive mt-1">{errors.telegramChannelIds.message}</p>}
                        <p className="text-xs text-muted-foreground mt-1">Comma-separated list of channel IDs or public usernames where the bot should post.</p>
                    </div>
                </div>
              </section>

              <Separator />
              
              <section>
                <h3 className="text-lg font-semibold mb-3 border-b pb-2 flex items-center">
                  <Zap className="mr-2 h-5 w-5 text-primary" /> URL Shortener (e.g., Linkcents)
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Controller
                        name="enableUrlShortener"
                        control={control}
                        render={({ field }) => (
                            <Switch
                            id="enableUrlShortener"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            aria-labelledby="enableUrlShortenerLabel"
                            />
                        )}
                    />
                    <Label htmlFor="enableUrlShortener" id="enableUrlShortenerLabel" className="cursor-pointer">
                      Enable URL Shortener
                    </Label>
                  </div>
                  {errors.enableUrlShortener && <p className="text-sm text-destructive -mt-2 mb-2">{errors.enableUrlShortener.message}</p>}

                  {enableUrlShortenerWatched && (
                    <>
                      <div>
                        <Label htmlFor="urlShortenerApiUrl">Shortener API URL</Label>
                        <Input
                          id="urlShortenerApiUrl"
                          {...register('urlShortenerApiUrl')}
                          placeholder="e.g., https://linkcents.com/api"
                        />
                        {errors.urlShortenerApiUrl && <p className="text-sm text-destructive mt-1">{errors.urlShortenerApiUrl.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="urlShortenerApiKey">Shortener API Key</Label>
                        <Input
                          id="urlShortenerApiKey"
                          type="password"
                          {...register('urlShortenerApiKey')}
                          placeholder="Enter your API Key"
                        />
                        {errors.urlShortenerApiKey && <p className="text-sm text-destructive mt-1">{errors.urlShortenerApiKey.message}</p>}
                      </div>
                    </>
                  )}
                </div>
              </section>

              <Separator />
               <section>
                <h3 className="text-lg font-semibold mb-3 border-b pb-2 flex items-center">
                  <Globe className="mr-2 h-5 w-5 text-primary" /> "Create Your Own Website" Button
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Controller
                        name="enableCreateWebsiteButton"
                        control={control}
                        render={({ field }) => (
                            <Switch
                            id="enableCreateWebsiteButton"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            aria-labelledby="enableCreateWebsiteButtonLabel"
                            />
                        )}
                    />
                    <Label htmlFor="enableCreateWebsiteButton" id="enableCreateWebsiteButtonLabel" className="cursor-pointer">
                      Enable This Button
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground -mt-2">This button links to a pre-defined Telegram URL: <code>https://telegram.me/crazydeveloperr</code></p>
                  
                  {enableCreateWebsiteButtonWatched && (
                    <div>
                      <Label htmlFor="createWebsiteButtonText">Button Text</Label>
                      <Input
                        id="createWebsiteButtonText"
                        {...register('createWebsiteButtonText')}
                        placeholder="e.g., Get Your Own Site"
                      />
                      {errors.createWebsiteButtonText && <p className="text-sm text-destructive mt-1">{errors.createWebsiteButtonText.message}</p>}
                    </div>
                  )}

                  {showDisablePasswordInput && (
                    <div className="p-4 border-l-4 border-destructive bg-destructive/10 rounded-r-md">
                      <Label htmlFor="disableButtonPasswordAttempt" className="font-semibold text-destructive flex items-center">
                        <ShieldAlert className="h-5 w-5 mr-2" /> Enter Password to Disable
                      </Label>
                      <Input
                        id="disableButtonPasswordAttempt"
                        type="password"
                        {...register('disableButtonPasswordAttempt')}
                        placeholder="Password for disabling this button"
                        className="mt-1 border-destructive/50 focus:border-destructive"
                      />
                      {errors.disableButtonPasswordAttempt && <p className="text-sm text-destructive mt-1">{errors.disableButtonPasswordAttempt.message}</p>}
                       <p className="text-xs text-destructive/80 mt-1">This button has special protection. Enter the correct password to disable it.</p>
                    </div>
                  )}
                </div>
              </section>

              <Separator />

              <section>
                <h3 className="text-lg font-semibold mb-3 border-b pb-2">"How to Download" Page</h3>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="howToDownloadVideoUrl">Tutorial Video URL (Optional)</Label>
                        <Input 
                        id="howToDownloadVideoUrl" 
                        {...register('howToDownloadVideoUrl')} 
                        placeholder="https://www.youtube.com/embed/your_video_id"
                        />
                        {errors.howToDownloadVideoUrl && <p className="text-sm text-destructive mt-1">{errors.howToDownloadVideoUrl.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="howToDownloadInstructions">Tutorial Instructions</Label>
                        <Textarea
                        id="howToDownloadInstructions"
                        {...register('howToDownloadInstructions')}
                        placeholder="Enter detailed download instructions here..."
                        rows={8}
                        />
                        {errors.howToDownloadInstructions && <p className="text-sm text-destructive mt-1">{errors.howToDownloadInstructions.message}</p>}
                    </div>
                </div>
              </section>

              <Separator />

              <section>
                <h3 className="text-lg font-semibold mb-3 border-b pb-2">Legal Pages Content</h3>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="disclaimerContent">Disclaimer Page Content</Label>
                        <Textarea
                        id="disclaimerContent"
                        {...register('disclaimerContent')}
                        placeholder="Enter full disclaimer text here..."
                        rows={10}
                        />
                        {errors.disclaimerContent && <p className="text-sm text-destructive mt-1">{errors.disclaimerContent.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="privacyPolicyContent">Privacy Policy Page Content</Label>
                        <Textarea
                        id="privacyPolicyContent"
                        {...register('privacyPolicyContent')}
                        placeholder="Enter full privacy policy text here..."
                        rows={10}
                        />
                        {errors.privacyPolicyContent && <p className="text-sm text-destructive mt-1">{errors.privacyPolicyContent.message}</p>}
                    </div>
                </div>
              </section>

            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting || !isClientAuthed || isLoadingData}>
                {(isSubmitting || (!isClientAuthed && authDetermined) || isLoadingData) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Settings
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}

    