// src/lib/firebase.ts
// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc, collection, query, where, orderBy, getDocs, Timestamp, type DocumentData, limit, setDoc, updateDoc, serverTimestamp, addDoc } from "firebase/firestore";
import type { FirestorePostData, AdminPostFormQualityOption, AdminPostFormLinkItem, APIListItem, FirestoreAdData, SiteSettings, FirestoreFeedbackData, FeedbackStatus } from "@/types";
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBd-HCV8MMs1YLUzGzGjzmDXyvOYBUQPh0",
  authDomain: "reborn-ec4d2.firebaseapp.com",
  projectId: "reborn-ec4d2",
  storageBucket: "reborn-ec4d2.appspot.com",
  messagingSenderId: "901927222527",
  appId: "1:901927222527:web:4b71afd9d8683b277720ca"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);

export async function getPostById(postId: string): Promise<FirestorePostData | null> {
  try {
    const postDocRef = doc(db, "posts", postId);
    const postDocSnap = await getDoc(postDocRef);

    if (postDocSnap.exists()) {
      const data = postDocSnap.data() as FirestorePostData;

      const mapQualityOptions = (options: any[] | undefined): AdminPostFormQualityOption[] => {
        return (Array.isArray(options) ? options : []).map(
          (opt: any): AdminPostFormQualityOption => ({
            qualityLabel: opt.qualityLabel || '',
            links: (Array.isArray(opt.links) ? opt.links : []).map(
              (link: any): AdminPostFormLinkItem => ({
                name: link.name || '',
                url: link.url || '',
                type: link.type === 'telegram' ? 'telegram' : 'direct',
                size: link.size || undefined,
              })
            ),
          })
        );
      };

      let telegramOptions = mapQualityOptions(data.telegramOptions);
      let directDownloadOptions = mapQualityOptions(data.directDownloadOptions);
      let oldDownloadOptions: AdminPostFormQualityOption[] | undefined = undefined;


      if ((!telegramOptions || telegramOptions.length === 0) &&
          (!directDownloadOptions || directDownloadOptions.length === 0) &&
          data.downloadOptions) {
        oldDownloadOptions = [];
        (data.downloadOptions as AdminPostFormQualityOption[]).forEach(opt => {
          const tempTelegramLinks: AdminPostFormLinkItem[] = [];
          const tempDirectLinks: AdminPostFormLinkItem[] = [];
          opt.links.forEach(link => {
            if (link.type === 'telegram') {
              tempTelegramLinks.push(link);
            } else {
              tempDirectLinks.push(link);
            }
          });
          if (tempTelegramLinks.length > 0) {
            telegramOptions.push({ qualityLabel: opt.qualityLabel, links: tempTelegramLinks });
          }
          if (tempDirectLinks.length > 0) {
            directDownloadOptions.push({ qualityLabel: opt.qualityLabel, links: tempDirectLinks });
          }
          oldDownloadOptions.push(opt);
        });
      }


      return {
        id: postDocSnap.id,
        title: data.title || '',
        mediaType: data.mediaType === 'tv' ? 'tv' : 'movie',
        description: data.description || '',
        posterUrl: data.posterUrl || '',
        backdropUrl: data.backdropUrl || null,
        releaseYear: data.releaseYear || new Date().getFullYear(),
        rating: typeof data.rating === 'number' ? data.rating : null,
        ripQuality: data.ripQuality || '',
        languages: Array.isArray(data.languages) ? data.languages.map(String) : [],
        genres: Array.isArray(data.genres) ? data.genres.map(String) : [],
        runtime: data.mediaType === 'movie' && typeof data.runtime === 'number' ? data.runtime : null,
        totalSeasons: data.mediaType === 'tv' && typeof data.totalSeasons === 'number' ? data.totalSeasons : null,
        totalEpisodes: data.mediaType === 'tv' && typeof data.totalEpisodes === 'number' ? data.totalEpisodes : null,
        telegramOptions: telegramOptions,
        directDownloadOptions: directDownloadOptions,
        downloadOptions: oldDownloadOptions,
        seoKeywords: Array.isArray(data.seoKeywords) ? data.seoKeywords.map(String) : [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as FirestorePostData;
    } else {
      console.log("No such document in Firestore with ID:", postId);
      return null;
    }
  } catch (error) {
    console.error("Error fetching post from Firestore:", error);
    return null;
  }
}

export async function getFirestorePosts(mediaType: 'movie' | 'tv'): Promise<APIListItem[]> {
  try {
    const postsCol = collection(db, 'posts');
    const q = query(
      postsCol,
      where('mediaType', '==', mediaType)
    );
    const querySnapshot = await getDocs(q);

    const docs = querySnapshot.docs;

    // Client-side sorting as a fallback if composite index is not yet available/propagated
    const sortedDocs = docs.sort((a, b) => {
      const dataA = a.data() as DocumentData;
      const dataB = b.data() as DocumentData;
      const timestampA = dataA.createdAt as Timestamp | undefined;
      const timestampB = dataB.createdAt as Timestamp | undefined;

      if (timestampA && timestampB) {
        return timestampB.toMillis() - timestampA.toMillis(); 
      }
      if (timestampA) return -1; 
      if (timestampB) return 1;  
      return 0; 
    });

    return sortedDocs.map((doc) => {
      const data = doc.data() as FirestorePostData;
      return {
        tmdb_id: doc.id,
        title: data.title || 'Untitled',
        poster: data.posterUrl || null,
        rating: data.rating ?? undefined,
        release_year: data.releaseYear || undefined,
        media_type: data.mediaType || (mediaType === 'movie' ? 'movie' : 'tv'),
        description: data.description || undefined,
        rip: data.ripQuality || undefined,
        backdrop: data.backdropUrl ?? undefined,
        languages: data.languages || [],
        total_seasons: data.totalSeasons ?? undefined,
        total_episodes: data.totalEpisodes ?? undefined,
        status: undefined, 
        updated_on: undefined, 
      };
    });
  } catch (error) {
    console.error(`Error fetching Firestore posts for ${mediaType}:`, error);
     if (error instanceof Error && (error.message.includes("firestore/indexes") || error.message.includes("Query requires an index"))) {
        console.warn("*********************************************************************************");
        console.warn("Firebase is requesting a composite index for optimal query performance.");
        console.warn("Please create the index in your Firebase console for the 'posts' collection:");
        console.warn("Fields: 'mediaType' (Ascending), 'createdAt' (Descending).");
        console.warn("The application is currently performing client-side sorting as a fallback.");
        console.warn("You might have received an error link from Firebase in the server logs like:");
        console.warn("https://console.firebase.google.com/v1/r/project/YOUR_PROJECT_ID/firestore/indexes?create_composite=...");
        console.warn("*********************************************************************************");
    }
    return [];
  }
}

export async function searchFirestorePosts(queryText: string): Promise<APIListItem[]> {
  if (!queryText.trim()) {
    return [];
  }
  const lowercaseQuery = queryText.toLowerCase().trim();

  try {
    const postsCol = collection(db, 'posts');
    // Fetch all posts. For larger datasets, this is inefficient.
    // Consider a dedicated search service like Algolia for production.
    const querySnapshot = await getDocs(postsCol); 
    
    const allPosts: FirestorePostData[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<FirestorePostData, 'id'>),
    }));

    const filteredPosts = allPosts.filter(post => {
      const titleMatch = post.title?.toLowerCase().includes(lowercaseQuery);
      const descriptionMatch = post.description?.toLowerCase().includes(lowercaseQuery);
      const seoKeywordsMatch = post.seoKeywords?.some(keyword => keyword.toLowerCase().includes(lowercaseQuery));
      const genreMatch = post.genres?.some(genreId => {
        // Assuming genre IDs in post.genres need to be looked up or matched against a known list if searching by genre label
        // For simplicity, if genres are stored as human-readable strings, this works:
        return genreId.toLowerCase().includes(lowercaseQuery);
      });
      return titleMatch || descriptionMatch || seoKeywordsMatch || genreMatch;
    });

    return filteredPosts.map(data => ({
      tmdb_id: data.id, // Firestore document ID
      title: data.title || 'Untitled',
      poster: data.posterUrl || null,
      backdrop: data.backdropUrl || null,
      rating: data.rating ?? undefined,
      release_year: data.releaseYear,
      media_type: data.mediaType,
      description: data.description || undefined,
      rip: data.ripQuality || undefined,
      languages: data.languages || [],
    }));
  } catch (error) {
    console.error('Error searching Firestore posts:', error);
    return [];
  }
}


export async function getActiveAds(): Promise<FirestoreAdData[]> {
  try {
    const adsCol = collection(db, 'ads');
    const now = Timestamp.now();
    const adsQuery = query(
      adsCol,
      where('expiresAt', '>', now),
      orderBy('expiresAt', 'asc') // Order by expiry, can also use createdAt or a priority field
    );
    const querySnapshot = await getDocs(adsQuery);
    const activeAds: FirestoreAdData[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const expiresAtDate = (data.expiresAt as Timestamp)?.toDate();
      activeAds.push({
        id: docSnap.id,
        title: data.title || '',
        posterImageUrl: data.posterImageUrl || '',
        buttonLabel: data.buttonLabel || '',
        targetUrl: data.targetUrl || '',
        expiryValue: data.expiryValue || 0,
        expiryUnit: data.expiryUnit || 'days',
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        expiresAt: expiresAtDate || new Date(),
        isActive: expiresAtDate ? expiresAtDate > new Date() : false, 
      } as FirestoreAdData);
    });
    return activeAds;
  } catch (error) {
    console.error("Error fetching active ads:", error);
    return [];
  }
}


const SITE_SETTINGS_COLLECTION = 'siteSettings';
const GLOBAL_SETTINGS_DOC_ID = 'global';

export async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    const settingsDocRef = doc(db, SITE_SETTINGS_COLLECTION, GLOBAL_SETTINGS_DOC_ID);
    const settingsDocSnap = await getDoc(settingsDocRef);
    if (settingsDocSnap.exists()) {
      return settingsDocSnap.data() as SiteSettings;
    }
    return null; // No settings found, or not yet created
  } catch (error) {
    console.error("Error fetching site settings from Firestore:", error);
    return null;
  }
}

export async function updateSiteSettings(settings: Partial<SiteSettings>): Promise<void> {
  try {
    const settingsDocRef = doc(db, SITE_SETTINGS_COLLECTION, GLOBAL_SETTINGS_DOC_ID);
    await setDoc(settingsDocRef, settings, { merge: true });
  } catch (error) {
    console.error("Error updating site settings in Firestore:", error);
    throw error; 
  }
}

// Feedback specific functions
const FEEDBACKS_COLLECTION = 'feedbacks';

export async function getFeedbacksForAdmin(): Promise<FirestoreFeedbackData[]> {
  try {
    const feedbacksQuery = query(collection(db, FEEDBACKS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(feedbacksQuery);
    return querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        type: data.type || 'other',
        message: data.message || '',
        email: data.email || null,
        status: data.status || 'pending',
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
      } as FirestoreFeedbackData;
    });
  } catch (error) {
    console.error("Error fetching feedbacks for admin:", error);
    return [];
  }
}

export async function updateFeedbackStatus(feedbackId: string, status: FeedbackStatus): Promise<void> {
  try {
    const feedbackDocRef = doc(db, FEEDBACKS_COLLECTION, feedbackId);
    await updateDoc(feedbackDocRef, {
      status: status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error updating feedback status for ${feedbackId}:`, error);
    throw error;
  }
}


export { app, db };

