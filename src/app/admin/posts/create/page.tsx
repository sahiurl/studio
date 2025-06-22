
'use client';

import { useEffect, useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Header } from '@/components/layout/header';
// Removed Footer import
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Trash2, Loader2, Wand2, ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import type { AdminPostFormData, TMDBFormattedSearchResult, FormPopulatableDetails } from '@/types';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import { searchTMDBAction, getTMDBDetailsAction } from './actions';
import { sendTelegramPost } from '@/services/telegram-service'; // Added import

const languageOptions = [
  { id: 'en', label: 'English' }, { id: 'hi', label: 'Hindi' },
  { id: 'es', label: 'Spanish' }, { id: 'fr', label: 'French' },
  { id: 'de', label: 'German' }, { id: 'ja', label: 'Japanese' },
  { id: 'ko', label: 'Korean' }, { id: 'ta', label: 'Tamil' },
  { id: 'te', label: 'Telugu' }, { id: 'pa', label: 'Punjabi' },
  { id: 'mr', label: 'Marathi' }, { id: 'gu', label: 'Gujarati' },
  { id: 'bn', label: 'Bengali' }, { id: 'ml', label: 'Malayalam' },
  { id: 'kn', label: 'Kannada' }, { id: 'bho', label: 'Bhojpuri' },
  { id: 'or', label: 'Odia' }, { id: 'as', label: 'Assamese' },
];

const genreOptions = [
  { id: 'new-release', label: 'New Release' }, { id: 'trending', label: 'Trending' },
  { id: 'classic', label: 'Classic' }, { id: 'indie', label: 'Indie' },
  { id: 'award-winning', label: 'Award Winning' }, { id: 'cult-classic', label: 'Cult Classic' },
  { id: 'family-friendly', label: 'Family Friendly' }, { id: 'anime', label: 'Anime' },
  { id: 'documentary', label: 'Documentary' }, { id: 'short-film', label: 'Short Film' },
  { id: 'action', label: 'Action' }, { id: 'adventure', label: 'Adventure' },
  { id: 'comedy', label: 'Comedy' }, { id: 'romance', label: 'Romance' },
  { id: 'drama', label: 'Drama' }, { id: 'horror', label: 'Horror' },
  { id: 'thriller', label: 'Thriller' }, { id: 'sci-fi', label: 'Sci-Fi' },
  { id: 'fantasy', label: 'Fantasy' }, { id: 'mystery', label: 'Mystery' },
  { id: 'crime', label: 'Crime' }, { id: 'biography', label: 'Biography' },
  { id: 'historical', label: 'Historical' }, { id: 'war', label: 'War' },
  { id: 'musical', label: 'Musical' }, { id: 'psychological', label: 'Psychological' },
  { id: 'philosophical', label: 'Philosophical' }, { id: 'noir', label: 'Noir' },
  { id: 'satire', label: 'Satire' }, { id: 'parody', label: 'Parody' },
  { id: 'silent-film', label: 'Silent Film' }, { id: 'experimental', label: 'Experimental' },
  { id: 'period-drama', label: 'Period Drama' }, { id: 'supernatural', label: 'Supernatural' },
  { id: 'kids', label: 'Kids' }, { id: 'teen', label: 'Teen' },
  { id: 'adult', label: 'Adult' }, { id: '18plus', label: '18+' }, // '18+' id changed to be valid
  { id: 'mythology', label: 'Mythology' }, { id: 'patriotic', label: 'Patriotic' },
  { id: 'sports', label: 'Sports' }, { id: 'social-issue', label: 'Social Issue' },
  { id: 'political', label: 'Political' }, { id: 'spiritual', label: 'Spiritual' },
];


const linkItemSchema = z.object({
  name: z.string().min(1, 'Link name is required'),
  url: z.string().url('Must be a valid URL'),
  type: z.enum(['direct', 'telegram']),
  size: z.string().optional(),
});

const qualityOptionSchema = z.object({
  qualityLabel: z.string().min(1, 'Quality label is required'),
  links: z.array(linkItemSchema).min(1, 'At least one link is required per quality section'),
});

const createPostFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  mediaType: z.enum(['movie', 'tv']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  posterUrl: z.string().url('Poster URL must be a valid URL'),
  backdropUrl: z.string().url('Backdrop URL must be a valid URL').optional().or(z.literal('')),
  releaseYear: z.coerce.number().int().min(1800).max(new Date().getFullYear() + 10),
  rating: z.coerce.number().min(0).max(10).optional(),
  ripQuality: z.string().min(1, 'RIP quality is required'),
  languages: z.array(z.string()).min(1, 'At least one language is required'),
  genres: z.array(z.string()).min(1, 'At least one genre/tag is required'),
  runtime: z.coerce.number().int().positive().optional(),
  totalSeasons: z.coerce.number().int().positive().optional(),
  totalEpisodes: z.coerce.number().int().positive().optional(),
  telegramOptions: z.array(qualityOptionSchema).optional(),
  directDownloadOptions: z.array(qualityOptionSchema).optional(),
  seoKeywords: z.array(z.string()).optional(),
}).refine(data => data.mediaType === 'movie' ? data.runtime !== undefined && data.runtime > 0 : true, {
  message: 'Runtime is required for movies',
  path: ['runtime'],
}).refine(data => data.mediaType === 'tv' ? data.totalSeasons !== undefined && data.totalSeasons > 0 : true, {
  message: 'Total seasons are required for TV shows',
  path: ['totalSeasons'],
}).refine(data => data.mediaType === 'tv' ? data.totalEpisodes !== undefined && data.totalEpisodes > 0 : true, {
  message: 'Total episodes are required for TV shows',
  path: ['totalEpisodes'],
}).refine(data => (data.telegramOptions && data.telegramOptions.length > 0) || (data.directDownloadOptions && data.directDownloadOptions.length > 0), {
    message: 'At least one Telegram or Direct Download option is required.',
    path: ['telegramOptions'], 
});


export default function CreatePostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentMediaType, setCurrentMediaType] = useState<'movie' | 'tv'>('movie');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingTMDB, startTMDBTransition] = useTransition();
  const [tmdbSearchResults, setTmdbSearchResults] = useState<TMDBFormattedSearchResult[]>([]);
  const [isSelectTMDBDialogOpen, setIsSelectTMDBDialogOpen] = useState(false);
  const [tmdbSearchQuery, setTmdbSearchQuery] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('isAdminAuthenticated') !== 'true') {
      router.replace('/admin/access');
    }
  }, [router]);

  const { register, control, handleSubmit, formState: { errors }, watch, setValue, reset, getValues } = useForm<AdminPostFormData>({
    resolver: zodResolver(createPostFormSchema),
    defaultValues: {
      title: '',
      mediaType: 'movie',
      description: '',
      posterUrl: '',
      backdropUrl: '',
      releaseYear: new Date().getFullYear(),
      rating: undefined,
      ripQuality: 'WEB-DL',
      languages: ['en'],
      genres: [],
      runtime: undefined,
      totalSeasons: undefined,
      totalEpisodes: undefined,
      telegramOptions: [],
      directDownloadOptions: [],
      seoKeywords: [],
    },
  });

  const watchedMediaType = watch('mediaType');

  useEffect(() => {
    setCurrentMediaType(watchedMediaType);
    if (watchedMediaType === 'movie') {
      setValue('totalSeasons', undefined);
      setValue('totalEpisodes', undefined);
    } else {
      setValue('runtime', undefined);
    }
  }, [watchedMediaType, setValue]);

  const { fields: telegramQualityFields, append: appendTelegramQuality, remove: removeTelegramQuality } = useFieldArray({
    control,
    name: 'telegramOptions',
  });

  const { fields: directQualityFields, append: appendDirectQuality, remove: removeDirectQuality } = useFieldArray({
    control,
    name: 'directDownloadOptions',
  });

  const handleFetchFromTMDB = async () => {
    const title = getValues('title');
    const mediaType = getValues('mediaType');
    if (!title.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a title to search.' });
      return;
    }
    setTmdbSearchQuery(title);
    startTMDBTransition(async () => {
      try {
        const results = await searchTMDBAction(title, mediaType);
        if (results.length === 0) {
          toast({ title: 'No Results', description: `No ${mediaType === 'movie' ? 'movies' : 'TV shows'} found on TMDB for "${title}".` });
          setTmdbSearchResults([]);
        } else if (results.length === 1 && results[0]) { 
          await handleSelectTMDBItem(results[0]);
        }
        else {
          setTmdbSearchResults(results);
          setIsSelectTMDBDialogOpen(true);
        }
      } catch (error) {
        console.error("Error searching TMDB:", error);
        toast({ variant: 'destructive', title: 'TMDB Search Failed', description: 'Could not fetch results from TMDB.' });
      }
    });
  };

  const handleSelectTMDBItem = async (item: TMDBFormattedSearchResult) => {
    setIsSelectTMDBDialogOpen(false);
    startTMDBTransition(async () => {
      try {
        const details = await getTMDBDetailsAction(item.id, item.media_type);
        if (details) {
          populateFormWithTMDBData(details);
          toast({ title: 'Details Populated', description: `Form populated with details for "${details.title}".` });
        } else {
          toast({ variant: 'destructive', title: 'Fetch Failed', description: 'Could not fetch details for the selected item.' });
        }
      } catch (error) {
        console.error("Error fetching TMDB details:", error);
        toast({ variant: 'destructive', title: 'TMDB Details Failed', description: 'Could not fetch full details from TMDB.' });
      }
    });
    setTmdbSearchResults([]); 
  };
  
  const populateFormWithTMDBData = (details: FormPopulatableDetails) => {
    setValue('title', details.title, { shouldValidate: true });
    setValue('mediaType', details.mediaType, { shouldValidate: true });
    setValue('description', details.description, { shouldValidate: true });
    setValue('posterUrl', details.posterUrl, { shouldValidate: true });
    setValue('backdropUrl', details.backdropUrl || '', { shouldValidate: true });
    setValue('releaseYear', details.releaseYear, { shouldValidate: true });
    setValue('rating', details.rating, { shouldValidate: true });
    
    const fetchedLanguages = details.languages.split(',').map(lang => lang.trim()).filter(Boolean);
    const validLanguages = fetchedLanguages.filter(langCode => languageOptions.some(opt => opt.id === langCode));
    setValue('languages', validLanguages.length > 0 ? validLanguages : ['en'], { shouldValidate: true });

    const tmdbGenreNames = details.genres.split(',').map(g => g.trim().toLowerCase());
    const matchedGenreIds = genreOptions
      .filter(opt => tmdbGenreNames.includes(opt.label.toLowerCase()))
      .map(opt => opt.id);
    setValue('genres', matchedGenreIds.length > 0 ? matchedGenreIds : [], { shouldValidate: true });

    if (details.mediaType === 'movie') {
      setValue('runtime', details.runtime, { shouldValidate: true });
      setValue('totalSeasons', undefined);
      setValue('totalEpisodes', undefined);
    } else { 
      setValue('totalSeasons', details.totalSeasons, { shouldValidate: true });
      setValue('totalEpisodes', details.totalEpisodes, { shouldValidate: true });
      setValue('runtime', undefined);
    }
  };


  const onSubmit: SubmitHandler<AdminPostFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const postDataToSave = {
        ...data,
        createdAt: serverTimestamp(),
        backdropUrl: data.backdropUrl || null, 
        rating: data.rating === undefined || isNaN(data.rating) ? null : data.rating,
        runtime: data.mediaType === 'movie' ? (data.runtime === undefined || isNaN(data.runtime) ? null : data.runtime) : null,
        totalSeasons: data.mediaType === 'tv' ? (data.totalSeasons === undefined || isNaN(data.totalSeasons) ? null : data.totalSeasons) : null,
        totalEpisodes: data.mediaType === 'tv' ? (data.totalEpisodes === undefined || isNaN(data.totalEpisodes) ? null : data.totalEpisodes) : null,
        telegramOptions: data.telegramOptions || [],
        directDownloadOptions: data.directDownloadOptions || [],
        seoKeywords: data.seoKeywords || [],
      };

      if (postDataToSave.mediaType === 'movie') {
        delete (postDataToSave as any).totalSeasons;
        delete (postDataToSave as any).totalEpisodes;
      } else {
        delete (postDataToSave as any).runtime;
      }

      const docRef = await addDoc(collection(db, "posts"), postDataToSave);
      toast({
        title: "Success!",
        description: `Post "${data.title}" created successfully with ID: ${docRef.id}.`,
      });
      
      // Attempt to send to Telegram
      if (docRef.id) {
        // Disable button while telegram post is being sent.
        // setIsSubmitting(true); // Already true, maybe a different state for TG?
        const telegramResults = await sendTelegramPost(docRef.id);
        telegramResults.forEach(result => {
          if (result.success) {
            toast({
              title: "Telegram Success",
              description: result.message,
            });
          } else {
            toast({
              variant: "destructive",
              title: "Telegram Error",
              description: result.message,
            });
          }
        });
      }
      reset(); 
    } catch (e) {
      console.error("Error adding document or posting to Telegram: ", e);
      let errorMessage = 'Error creating post.';
      if (e instanceof Error) {
        errorMessage += ` Details: ${e.message}`;
      }
      toast({
        variant: "destructive",
        title: "Error Creating Post",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (typeof window !== 'undefined' && sessionStorage.getItem('isAdminAuthenticated') !== 'true') {
    return null; 
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="w-full max-w-3xl mx-auto shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-4 mb-2">
                <Button variant="outline" size="icon" asChild className="flex-shrink-0">
                  <Link href="/admin/dashboard" aria-label="Back to Admin Dashboard">
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                </Button>
                <CardTitle className="text-2xl font-headline">Create New Post</CardTitle>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              
              <section className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
                
                <div>
                  <Label>Media Type</Label>
                  <Controller
                    name="mediaType"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup
                        onValueChange={(value) => field.onChange(value as 'movie' | 'tv')}
                        defaultValue={field.value}
                        className="flex space-x-4 mt-1"
                        disabled={isFetchingTMDB}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="movie" id="movieType" />
                          <Label htmlFor="movieType">Movie</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="tv" id="tvType" />
                          <Label htmlFor="tvType">TV Show</Label>
                        </div>
                      </RadioGroup>
                    )}
                  />
                   {errors.mediaType && <p className="text-sm text-destructive mt-1">{errors.mediaType.message}</p>}
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex-grow">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" {...register('title')} disabled={isFetchingTMDB} />
                  </div>
                  <Button type="button" onClick={handleFetchFromTMDB} disabled={isFetchingTMDB} variant="outline" size="icon" title="Fetch details from TMDB">
                    {isFetchingTMDB ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
                  </Button>
                </div>
                {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" {...register('description')} rows={4} disabled={isFetchingTMDB}/>
                  {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
                </div>
                <div>
                  <Label htmlFor="posterUrl">Poster URL</Label>
                  <Input id="posterUrl" {...register('posterUrl')} disabled={isFetchingTMDB}/>
                  {errors.posterUrl && <p className="text-sm text-destructive mt-1">{errors.posterUrl.message}</p>}
                </div>
                <div>
                  <Label htmlFor="backdropUrl">Backdrop URL (Optional)</Label>
                  <Input id="backdropUrl" {...register('backdropUrl')} disabled={isFetchingTMDB}/>
                  {errors.backdropUrl && <p className="text-sm text-destructive mt-1">{errors.backdropUrl.message}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="releaseYear">Release Year</Label>
                    <Input id="releaseYear" type="number" {...register('releaseYear')} disabled={isFetchingTMDB}/>
                    {errors.releaseYear && <p className="text-sm text-destructive mt-1">{errors.releaseYear.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="rating">Rating (Optional, 0-10)</Label>
                    <Input id="rating" type="number" step="0.1" {...register('rating')} disabled={isFetchingTMDB}/>
                    {errors.rating && <p className="text-sm text-destructive mt-1">{errors.rating.message}</p>}
                  </div>
                </div>
                <div>
                  <Label htmlFor="ripQuality">RIP Quality (e.g., WEB-DL, BluRay)</Label>
                  <Input id="ripQuality" {...register('ripQuality')} />
                  {errors.ripQuality && <p className="text-sm text-destructive mt-1">{errors.ripQuality.message}</p>}
                </div>
                 <div>
                  <Label>Languages</Label>
                  <Controller
                    name="languages"
                    control={control}
                    render={({ field }) => (
                      <div className="flex flex-wrap gap-x-6 gap-y-3 mt-2">
                        {languageOptions.map((option) => (
                          <div key={option.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`lang-create-${option.id}`}
                              checked={field.value?.includes(option.id)}
                              onCheckedChange={(checked) => {
                                const currentValues = field.value || [];
                                return checked
                                  ? field.onChange([...currentValues, option.id])
                                  : field.onChange(
                                      currentValues.filter(
                                        (value: string) => value !== option.id
                                      )
                                    );
                              }}
                              disabled={isFetchingTMDB}
                            />
                            <Label htmlFor={`lang-create-${option.id}`} className="font-normal cursor-pointer">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                  {errors.languages && <p className="text-sm text-destructive mt-1">{errors.languages.message}</p>}
                </div>
                <div>
                  <Label>Genres/Tags</Label>
                  <Controller
                    name="genres"
                    control={control}
                    render={({ field }) => (
                      <div className="flex flex-wrap gap-x-6 gap-y-3 mt-2">
                        {genreOptions.map((option) => (
                          <div key={option.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`genre-create-${option.id}`}
                              checked={field.value?.includes(option.id)}
                              onCheckedChange={(checked) => {
                                const currentValues = field.value || [];
                                return checked
                                  ? field.onChange([...currentValues, option.id])
                                  : field.onChange(
                                      currentValues.filter(
                                        (value: string) => value !== option.id
                                      )
                                    );
                              }}
                              disabled={isFetchingTMDB}
                            />
                            <Label htmlFor={`genre-create-${option.id}`} className="font-normal cursor-pointer">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                  {errors.genres && <p className="text-sm text-destructive mt-1">{errors.genres.message}</p>}
                </div>
                
                {currentMediaType === 'movie' && (
                  <div>
                    <Label htmlFor="runtime">Runtime (minutes)</Label>
                    <Input id="runtime" type="number" {...register('runtime')} disabled={isFetchingTMDB}/>
                    {errors.runtime && <p className="text-sm text-destructive mt-1">{errors.runtime.message}</p>}
                  </div>
                )}
                {currentMediaType === 'tv' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="totalSeasons">Total Seasons</Label>
                      <Input id="totalSeasons" type="number" {...register('totalSeasons')} disabled={isFetchingTMDB}/>
                      {errors.totalSeasons && <p className="text-sm text-destructive mt-1">{errors.totalSeasons.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="totalEpisodes">Total Episodes</Label>
                      <Input id="totalEpisodes" type="number" {...register('totalEpisodes')} disabled={isFetchingTMDB}/>
                      {errors.totalEpisodes && <p className="text-sm text-destructive mt-1">{errors.totalEpisodes.message}</p>}
                    </div>
                  </div>
                )}
              </section>

              <Separator />

              
              <section className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Telegram Options</h3>
                    <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendTelegramQuality({ qualityLabel: '', links: [{ name: '', url: '', type: 'telegram', size: '' }] })}
                    >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Telegram Quality
                    </Button>
                </div>
                {errors.telegramOptions?.message && <p className="text-sm text-destructive mt-1">{errors.telegramOptions.message}</p>}
                {errors.telegramOptions?.root?.message && !errors.telegramOptions?.message && <p className="text-sm text-destructive mt-1">{errors.telegramOptions.root.message}</p>}

                {telegramQualityFields.map((qualityField, qualityIndex) => (
                  <Card key={qualityField.id} className="p-4 bg-muted/30">
                    <div className="flex justify-between items-center mb-3">
                      <Input
                        placeholder="Quality Label (e.g., 480p, 720p HEVC)"
                        {...register(`telegramOptions.${qualityIndex}.qualityLabel`)}
                        className="flex-grow mr-2"
                      />
                       <Button type="button" variant="ghost" size="icon" onClick={() => removeTelegramQuality(qualityIndex)} aria-label="Remove Telegram Quality Section">
                          <Trash2 className="h-5 w-5 text-destructive" />
                        </Button>
                    </div>
                     {errors.telegramOptions?.[qualityIndex]?.qualityLabel && (
                        <p className="text-sm text-destructive mb-2">{errors.telegramOptions[qualityIndex]?.qualityLabel?.message}</p>
                    )}
                     {errors.telegramOptions?.[qualityIndex]?.links?.root && (
                        <p className="text-sm text-destructive mb-2">{errors.telegramOptions[qualityIndex]?.links?.root?.message}</p>
                    )}
                    <FieldArrayLinks qualityIndex={qualityIndex} control={control} register={register} errors={errors} fieldArrayName="telegramOptions" defaultLinkType="telegram" />
                  </Card>
                ))}
              </section>

              <Separator />

              
              <section className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Direct Download Options</h3>
                    <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendDirectQuality({ qualityLabel: '', links: [{ name: '', url: '', type: 'direct', size: '' }] })}
                    >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Direct Quality
                    </Button>
                </div>
                {errors.directDownloadOptions?.message && <p className="text-sm text-destructive mt-1">{errors.directDownloadOptions.message}</p>}
                 {errors.directDownloadOptions?.root?.message && !errors.directDownloadOptions?.message && <p className="text-sm text-destructive mt-1">{errors.directDownloadOptions.root.message}</p>}

                {directQualityFields.map((qualityField, qualityIndex) => (
                  <Card key={qualityField.id} className="p-4 bg-muted/30">
                    <div className="flex justify-between items-center mb-3">
                      <Input
                        placeholder="Quality Label (e.g., 480p, 720p HEVC)"
                        {...register(`directDownloadOptions.${qualityIndex}.qualityLabel`)}
                        className="flex-grow mr-2"
                      />
                       <Button type="button" variant="ghost" size="icon" onClick={() => removeDirectQuality(qualityIndex)} aria-label="Remove Direct Quality Section">
                          <Trash2 className="h-5 w-5 text-destructive" />
                        </Button>
                    </div>
                     {errors.directDownloadOptions?.[qualityIndex]?.qualityLabel && (
                        <p className="text-sm text-destructive mb-2">{errors.directDownloadOptions[qualityIndex]?.qualityLabel?.message}</p>
                    )}
                     {errors.directDownloadOptions?.[qualityIndex]?.links?.root && (
                        <p className="text-sm text-destructive mb-2">{errors.directDownloadOptions[qualityIndex]?.links?.root?.message}</p>
                    )}
                    <FieldArrayLinks qualityIndex={qualityIndex} control={control} register={register} errors={errors} fieldArrayName="directDownloadOptions" defaultLinkType="direct" />
                  </Card>
                ))}
              </section>

              <Separator />

              <section className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">SEO Information</h3>
                <div>
                  <Label htmlFor="seoKeywords">SEO Keywords</Label>
                  <Controller
                    name="seoKeywords"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        id="seoKeywords"
                        placeholder="Enter comma-separated keywords (e.g., action, thriller, new movie 2025)"
                        rows={3}
                        value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                        onChange={(e) => {
                          const keywords = e.target.value.split(',').map(k => k.trim()).filter(k => k);
                          field.onChange(keywords);
                        }}
                        onBlur={field.onBlur}
                        disabled={isFetchingTMDB}
                      />
                    )}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter comma-separated keywords for search engine optimization.
                  </p>
                  {errors.seoKeywords && <p className="text-sm text-destructive mt-1">{typeof errors.seoKeywords.message === 'string' ? errors.seoKeywords.message : 'Invalid keywords'}</p>}
                </div>
              </section>

            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting || isFetchingTMDB}>
                {(isSubmitting || isFetchingTMDB) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Post
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>

      <Dialog open={isSelectTMDBDialogOpen} onOpenChange={setIsSelectTMDBDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Select TMDB Result for "{tmdbSearchQuery}"</DialogTitle>
            <DialogDescription>
              Choose the correct {getValues('mediaType') === 'movie' ? 'movie' : 'TV show'} from the list below.
            </DialogDescription>
          </DialogHeader>
          {isFetchingTMDB && (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {!isFetchingTMDB && tmdbSearchResults.length > 0 && (
            <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
              {tmdbSearchResults.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectTMDBItem(item)}
                  className="w-full text-left p-3 border rounded-md hover:bg-accent focus:bg-accent focus:outline-none focus:ring-2 focus:ring-ring transition-colors flex items-start gap-3"
                >
                  <div className="flex-shrink-0 w-16 h-24 relative bg-muted rounded overflow-hidden">
                    <Image 
                      src={item.posterUrl || 'https://placehold.co/64x96.png?text=N/A'} 
                      alt={item.title} 
                      fill
                      sizes="64px"
                      className="object-cover"
                      unoptimized={!item.posterUrl || item.posterUrl.includes('placehold.co')}
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.year}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {!isFetchingTMDB && tmdbSearchResults.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No results found to display.</p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => setTmdbSearchResults([])}>
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

interface FieldArrayLinksProps {
  qualityIndex: number;
  control: any; 
  register: any; 
  errors: any; 
  fieldArrayName: "telegramOptions" | "directDownloadOptions";
  defaultLinkType: 'direct' | 'telegram';
}

function FieldArrayLinks({ qualityIndex, control, register, errors, fieldArrayName, defaultLinkType }: FieldArrayLinksProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `${fieldArrayName}.${qualityIndex}.links`,
  });

  return (
    <div className="space-y-3 pl-4 border-l-2 border-primary/50 ml-1">
      {fields.map((linkField, linkIndex) => (
        <div key={linkField.id} className="p-3 border rounded-md bg-card/70 space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs text-muted-foreground">Link #{linkIndex + 1}</Label>
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(linkIndex)} aria-label="Remove Link" className="h-7 w-7">
              <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />
            </Button>
          </div>
          <div>
            <Label htmlFor={`${fieldArrayName}.${qualityIndex}.links.${linkIndex}.name`} className="text-xs">Link Name</Label>
            <Input
              id={`${fieldArrayName}.${qualityIndex}.links.${linkIndex}.name`}
              placeholder="e.g., S01E01 480p / Season Pack"
              {...register(`${fieldArrayName}.${qualityIndex}.links.${linkIndex}.name`)}
            />
            {errors[fieldArrayName]?.[qualityIndex]?.links?.[linkIndex]?.name && (
              <p className="text-sm text-destructive mt-1">{errors[fieldArrayName]?.[qualityIndex]?.links?.[linkIndex]?.name?.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor={`${fieldArrayName}.${qualityIndex}.links.${linkIndex}.url`} className="text-xs">URL</Label>
            <Input
              id={`${fieldArrayName}.${qualityIndex}.links.${linkIndex}.url`}
              placeholder="https://..."
              {...register(`${fieldArrayName}.${qualityIndex}.links.${linkIndex}.url`)}
            />
             {errors[fieldArrayName]?.[qualityIndex]?.links?.[linkIndex]?.url && (
              <p className="text-sm text-destructive mt-1">{errors[fieldArrayName]?.[qualityIndex]?.links?.[linkIndex]?.url?.message}</p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
                <Label htmlFor={`${fieldArrayName}.${qualityIndex}.links.${linkIndex}.type`} className="text-xs">Link Type</Label>
                <Controller
                    name={`${fieldArrayName}.${qualityIndex}.links.${linkIndex}.type`}
                    control={control}
                    defaultValue={defaultLinkType} 
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id={`${fieldArrayName}.${qualityIndex}.links.${linkIndex}.type`}>
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="direct">Direct Download</SelectItem>
                            <SelectItem value="telegram">Telegram File</SelectItem>
                        </SelectContent>
                        </Select>
                    )}
                />
                {errors[fieldArrayName]?.[qualityIndex]?.links?.[linkIndex]?.type && (
                    <p className="text-sm text-destructive mt-1">{errors[fieldArrayName]?.[qualityIndex]?.links?.[linkIndex]?.type?.message}</p>
                )}
            </div>
            <div>
                <Label htmlFor={`${fieldArrayName}.${qualityIndex}.links.${linkIndex}.size`} className="text-xs">File Size (Optional)</Label>
                <Input
                id={`${fieldArrayName}.${qualityIndex}.links.${linkIndex}.size`}
                placeholder="e.g., 700MB"
                {...register(`${fieldArrayName}.${qualityIndex}.links.${linkIndex}.size`)}
                />
                {errors[fieldArrayName]?.[qualityIndex]?.links?.[linkIndex]?.size && (
                    <p className="text-sm text-destructive mt-1">{errors[fieldArrayName]?.[qualityIndex]?.links?.[linkIndex]?.size?.message}</p>
                )}
            </div>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ name: '', url: '', type: defaultLinkType, size: '' })}
        className="mt-2"
      >
        <PlusCircle className="mr-2 h-4 w-4" /> Add Link to this Quality
      </Button>
    </div>
  );
}

