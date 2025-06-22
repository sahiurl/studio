
# Moviefy - Modern Movie & Webseries Platform

Moviefy is a feature-rich Next.js web application designed for browsing, searching, and discovering movies and webseries. It includes a comprehensive admin panel for content management, site settings configuration, ad management, and user feedback handling. The platform integrates with an external API for a vast media library and also allows for manually curated content.

## Features

-   **Browse & Discover:** Paginated lists for movies and webseries with sorting options (latest, rating, release year, title).
-   **Detailed Media Pages:** Individual pages for each movie/TV show displaying posters, backdrops, descriptions, ratings, genres, languages, runtime/seasons, and download links.
-   **Search Functionality:** Robust search across both API-sourced and locally curated content.
-   **Admin Panel:**
    -   Password-protected access.
    -   **Content Management:** Create, edit, and delete movie/TV show posts. Fetch details from TMDB to auto-populate forms.
    -   **Ad Management:** Create and manage advertisements (image banners with links and expiry dates) displayed on the site.
    -   **Site Settings:** Configure global settings like Telegram channel URL, "How to Download" page content, disclaimer, privacy policy, Telegram bot integration, URL shortener, and a custom "Create Your Own Website" button.
    -   **Feedback Management:** View and manage user feedback and content requests.
-   **Telegram Integration:**
    -   Automatically post new content to configured Telegram channels.
    -   Link to Telegram channel in the header and a custom button.
-   **URL Shortener Integration:** Optionally shorten download/Telegram links using services like Linkcents or GPLinks.
-   **Responsive Design:** User-friendly interface across desktop and mobile devices.
-   **AI Recommender:** A chat-based AI assistant to provide movie and webseries recommendations.
-   **User Feedback System:** Allows users to submit feedback, content requests, or other queries.
-   **Dynamic Theming:** UI styled with ShadCN UI and Tailwind CSS, with theme colors defined in `src/app/globals.css`.
-   **Firebase Integration:** Uses Firestore for storing admin-created posts, ads, site settings, and user feedback.
-   **Firebase Analytics:** Tracks page views and user interactions.

## Tech Stack

-   **Framework:** Next.js (App Router)
-   **Language:** TypeScript
-   **Styling:** Tailwind CSS
-   **UI Components:** ShadCN UI
-   **Generative AI:** Genkit (for AI Recommender)
-   **Database:** Firebase Firestore
-   **Analytics:** Firebase Analytics
-   **Deployment:** Firebase App Hosting (configured via `apphosting.yaml`), Vercel, Netlify, or any Node.js compatible platform.

## Prerequisites

-   Node.js (v18 or newer recommended)
-   npm or yarn
-   Firebase Account (for Firestore, Analytics, and App Hosting if used)
-   TMDB API Key (for fetching movie/TV show metadata)
-   Access to the external Media API (configured via `API_BASE_URL`)
-   (Optional) Telegram Bot Token and Channel ID(s) for Telegram integration.
-   (Optional) URL Shortener API URL and Key (e.g., Linkcents).

## Getting Started (Local Setup)

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd moviefy
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up Firebase:**
    -   Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/).
    -   In your Firebase project, enable **Firestore Database**.
    -   Enable **Firebase Analytics**.
    -   Go to Project Settings > General, and under "Your apps", click the Web icon (`</>`) to register a new web app.
    -   Copy the Firebase configuration object.
    -   Update the `firebaseConfig` in `src/lib/firebase.ts` with your project's configuration.

4.  **Configure Constants/API Keys:**
    -   Open `src/lib/constants.ts`:
        -   `API_BASE_URL`: Set this to the base URL of your external media API.
        -   `ADMIN_ACCESS_PASSWORD`: Change the default admin password. **For production, use an environment variable.**
        -   `TMDB_API_KEY`: Add your TMDB API key. **For production, use an environment variable.**
        -   `TELEGRAM_BOT_USERNAME`: (Optional) If using Telegram file links from the API, set your bot's username.
    -   For production, it's highly recommended to use environment variables for sensitive keys instead of hardcoding them in `constants.ts`. You can create a `.env.local` file for this:
        ```env
        # .env.local
        NEXT_PUBLIC_ADMIN_ACCESS_PASSWORD="your_secure_password"
        NEXT_PUBLIC_TMDB_API_KEY="your_tmdb_api_key"
        NEXT_PUBLIC_API_BASE_URL="your_api_base_url"
        NEXT_PUBLIC_TELEGRAM_BOT_USERNAME="YourTelegramBotUsername"

        # Firebase Config (if not hardcoded in firebase.ts)
        NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
        NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
        # ... and other Firebase config values
        ```
        Then, update `src/lib/constants.ts` and `src/lib/firebase.ts` to read from `process.env`.

5.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The application will be available at `http://localhost:9002` (or your configured port).

6.  **Access Admin Panel:**
    -   Navigate to `/admin/access` (e.g., `http://localhost:9002/admin/access`).
    -   Enter the admin password configured in `src/lib/constants.ts` (or your environment variable).

## Firebase Firestore Database Structure

The application uses Firestore to store various pieces of data. Here are the main collections and their typical document structure:

### `posts`
Stores movie and TV show data manually created or edited via the admin panel.
-   **Document ID:** Auto-generated by Firestore (or could be a custom ID like TMDB ID if preferred).
-   **Fields:**
    -   `title` (string)
    -   `mediaType` (string: 'movie' or 'tv')
    -   `description` (string)
    -   `posterUrl` (string: URL)
    -   `backdropUrl` (string: URL, optional)
    -   `releaseYear` (number)
    -   `rating` (number, optional)
    -   `ripQuality` (string)
    -   `languages` (array of strings, e.g., `['en', 'hi']`)
    -   `genres` (array of strings, genre IDs like `['action', 'comedy']`)
    -   `runtime` (number, minutes, for movies)
    -   `totalSeasons` (number, for TV shows)
    -   `totalEpisodes` (number, for TV shows)
    -   `telegramOptions` (array of objects):
        -   `qualityLabel` (string, e.g., "720p", "1080p S01")
        -   `links` (array of objects):
            -   `name` (string, e.g., "Episode 1", "Season Pack")
            -   `url` (string: Telegram link)
            -   `type` (string: 'telegram')
            -   `size` (string, optional, e.g., "700MB")
    -   `directDownloadOptions` (array of objects, same structure as `telegramOptions` but `type` is 'direct')
    -   `seoKeywords` (array of strings, optional)
    -   `createdAt` (Firebase Timestamp)
    -   `updatedAt` (Firebase Timestamp, optional)

### `ads`
Stores advertisements to be displayed on the site.
-   **Document ID:** Auto-generated.
-   **Fields:**
    -   `title` (string)
    -   `posterImageUrl` (string: URL)
    -   `buttonLabel` (string)
    -   `targetUrl` (string: URL)
    -   `expiryValue` (number)
    -   `expiryUnit` (string: 'minutes', 'hours', or 'days')
    -   `createdAt` (Firebase Timestamp)
    -   `expiresAt` (Firebase Timestamp)

### `siteSettings`
Stores global configuration for the site. Usually, a single document named `global`.
-   **Document ID:** `global`
-   **Fields:**
    -   `appUrl` (string, optional: Base URL of the application)
    -   `telegramChannelUrl` (string, optional: URL to public Telegram channel)
    -   `howToDownloadVideoUrl` (string, optional: URL for "How to Download" video)
    -   `howToDownloadInstructions` (string, optional: Text instructions)
    -   `disclaimerContent` (string, optional)
    -   `privacyPolicyContent` (string, optional)
    -   `telegramBotToken` (string, optional: For auto-posting to channels)
    -   `telegramChannelIds` (string, optional: Comma-separated list of channel IDs/usernames)
    -   `enableUrlShortener` (boolean, optional)
    -   `urlShortenerApiUrl` (string, optional)
    -   `urlShortenerApiKey` (string, optional)
    -   `enableCreateWebsiteButton` (boolean, optional)
    -   `createWebsiteButtonText` (string, optional)

### `feedbacks`
Stores user submissions from the feedback form.
-   **Document ID:** Auto-generated.
-   **Fields:**
    -   `type` (string: 'feedback', 'request', 'other')
    -   `message` (string)
    -   `email` (string, optional)
    -   `status` (string: 'pending', 'approved', 'rejected', 'viewed')
    -   `createdAt` (Firebase Timestamp)
    -   `updatedAt` (Firebase Timestamp, optional)

## API Integration

-   **External Media API:** The application fetches movie and TV show listings and details from an external API configured via `API_BASE_URL` in `src/lib/constants.ts`.
-   **TMDB API:** Used by the admin panel to fetch metadata (title, description, posters, etc.) when creating/editing posts. Requires a `TMDB_API_KEY`.
-   **URL Shortener API:** (Optional) If enabled in site settings, an external URL shortener API (like Linkcents) is used. Configured via `urlShortenerApiUrl` and `urlShortenerApiKey`.
-   **Telegram Bot API:** (Optional) Used to send notifications/posts to Telegram channels. Configured via `telegramBotToken` and `telegramChannelIds`.

## Admin Panel

-   **Access:** `/admin/access`
-   **Password:** Defined in `src/lib/constants.ts` (or environment variable).
-   **Features:**
    -   **Dashboard:** Overview of management sections.
    -   **Posts:** Create, view, edit, and delete movie/TV show posts.
    -   **Ads:** Create, view, and delete ad banners.
    -   **Feedback:** View and manage user feedback.
    -   **Settings:** Configure global site settings.

## Deployment

### General Next.js Deployment
This Next.js application can be deployed to any platform that supports Node.js, such as:
-   Vercel (Recommended for Next.js)
-   Netlify
-   AWS Amplify
-   Google Cloud Run
-   Self-hosted Node.js server

Ensure you set up environment variables on your deployment platform for any sensitive data (API keys, passwords).

### Firebase App Hosting
The project includes an `apphosting.yaml` file, which means it's pre-configured for easy deployment using [Firebase App Hosting](https://firebase.google.com/docs/app-hosting).
To deploy with Firebase App Hosting:
1.  Ensure you have the Firebase CLI installed and configured (`firebase login`).
2.  Select or create a Firebase project.
3.  Initialize App Hosting in your project:
    ```bash
    firebase apphosting:backends:create
    ```
    Follow the prompts to link your GitHub repository (if applicable) or set up manual deployment.
4.  The `apphosting.yaml` file defines the runtime and instance settings.
5.  Deployments can be triggered automatically from GitHub pushes or manually via the Firebase CLI.

Remember to configure your Firebase project (Firestore, Analytics) as described in the "Getting Started" section.

## Customization

Most site-wide customizations can be done through the **Admin Panel > Settings**:
-   **Application Base URL:** Important for generating correct links in Telegram posts.
-   **Telegram Channel Link:** Displayed in the header.
-   **"How to Download" Page:** Customize video and text instructions.
-   **Legal Pages:** Update Disclaimer and Privacy Policy content.
-   **Telegram Bot:** Configure for automatic posting of new content.
-   **URL Shortener:** Enable and configure API details.
-   **Custom Button:** Enable and customize the "Create Your Own Website" button.

For UI theme changes (colors, fonts):
-   Modify CSS variables in `src/app/globals.css`.
-   Update font configurations in `tailwind.config.ts`.

## Project Structure

```
moviefy/
├── public/                   # Static assets (favicon, images)
├── src/
│   ├── app/                  # Next.js App Router (pages, layouts, server actions)
│   │   ├── (user)/           # Routes for regular users (e.g., feedback)
│   │   ├── admin/            # Admin panel routes and components
│   │   ├── details/          # Movie and TV show detail pages
│   │   ├── api/              # (If any Next.js API routes were used, currently not primary)
│   │   ├── globals.css       # Global styles and Tailwind directives
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Homepage
│   ├── components/           # Reusable UI components
│   │   ├── ads/              # Ad banner component
│   │   ├── ai/               # AI-related components (e.g., chatbox)
│   │   ├── feedback/         # Feedback form component
│   │   ├── layout/           # Header, Footer, etc.
│   │   ├── media/            # Media cards, grids, pagination
│   │   ├── skeletons/        # Loading skeletons
│   │   └── ui/               # ShadCN UI components (Button, Card, etc.)
│   ├── ai/                   # Genkit flows and configuration
│   │   ├── flows/            # AI flow implementations (e.g., recommendation)
│   │   ├── dev.ts            # Genkit development server entry
│   │   └── genkit.ts         # Genkit main configuration
│   ├── hooks/                # Custom React hooks (e.g., useToast, useMobile)
│   ├── lib/                  # Core logic, utilities, constants
│   │   ├── api.ts            # Functions for interacting with the external media API
│   │   ├── constants.ts      # Application constants (API URLs, keys - use env vars for production)
│   │   ├── firebase.ts       # Firebase initialization and Firestore interaction functions
│   │   └── utils.ts          # Utility functions (e.g., cn for classnames)
│   ├── services/             # Backend services (e.g., Telegram, URL Shortener)
│   └── types/                # TypeScript type definitions
├── .env.local.example        # Example environment variables file
├── apphosting.yaml           # Firebase App Hosting configuration
├── components.json           # ShadCN UI configuration
├── next.config.ts            # Next.js configuration
├── package.json
├── tailwind.config.ts        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

---

This README provides a solid foundation. You can expand on specific sections as the project evolves.
Remember to replace placeholder values like `<your-repository-url>` and to emphasize moving sensitive keys to environment variables for production.
