
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserCog, Send, Download, Globe } from 'lucide-react'; // Added Globe
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getPublicSiteSettingsAction } from '@/app/admin/settings/actions'; 
import type { SiteSettings } from '@/types';

const mainNavItems = [
  { href: '/movies', label: 'Movies' },
  { href: '/tv', label: 'Webseries' },
];

const adminNavItem = { href: '/admin/access', label: 'Admin', icon: UserCog };
const howToDownloadNavItem = { href: '/how-to-download', label: 'How to Download', icon: Download };

// Fixed URL for the "Create Your Own Website" button
const CREATE_YOUR_WEBSITE_TELEGRAM_URL = 'https://telegram.me/crazydeveloperr';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    async function fetchSiteSettingsForHeader() {
      try {
        const settings = await getPublicSiteSettingsAction();
        setSiteSettings(settings);
      } catch (error) {
        console.error("Failed to fetch site settings for header:", error);
      }
    }
    fetchSiteSettingsForHeader();
  }, []);

  // Get relevant settings for conditional rendering
  const generalTelegramChannelUrl = siteSettings?.telegramChannelUrl;
  const enableCreateWebsiteFeature = siteSettings?.enableCreateWebsiteButton;
  const createWebsiteButtonTextFromSettings = siteSettings?.createWebsiteButtonText || "Create Your Own Website";

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchText = formData.get('search') as string;
    if (searchText && searchText.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchText.trim())}`);
    }
    if (mobileMenuOpen) { 
      setMobileMenuOpen(false);
    }
  };

  const NavLinksContent = ({ forSheet = false }: { forSheet?: boolean }) => (
    <nav className={cn(
      "flex items-center",
      forSheet ? "flex-col items-start space-y-2 w-full" : "gap-x-6" 
    )}>
      {mainNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "font-medium transition-colors hover:text-primary",
            pathname === item.href ? "text-primary" : "text-muted-foreground",
            forSheet ? "text-lg p-2 hover:bg-accent/10 rounded-md w-full" : "text-sm"
          )}
          onClick={() => forSheet && setMobileMenuOpen(false)}
        >
          {item.label}
        </Link>
      ))}
      {forSheet && ( 
        <>
          <Link
            href={howToDownloadNavItem.href}
            className="font-medium transition-colors hover:text-primary text-muted-foreground text-lg p-2 hover:bg-accent/10 rounded-md w-full flex items-center gap-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            <howToDownloadNavItem.icon className="h-5 w-5" />
            {howToDownloadNavItem.label}
          </Link>
          {generalTelegramChannelUrl && generalTelegramChannelUrl.trim() !== '' && (
             <Link
              href={generalTelegramChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium transition-colors hover:text-primary text-muted-foreground text-lg p-2 hover:bg-accent/10 rounded-md w-full flex items-center gap-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Send className="h-5 w-5" /> Join Channel
            </Link>
          )}
          {enableCreateWebsiteFeature && (
            <Link
              href={CREATE_YOUR_WEBSITE_TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium transition-colors hover:text-primary text-muted-foreground text-lg p-2 hover:bg-accent/10 rounded-md w-full flex items-center gap-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Globe className="h-5 w-5" /> {createWebsiteButtonTextFromSettings}
            </Link>
          )}
          <Link
            href={adminNavItem.href}
            className={cn(
              "font-medium transition-colors hover:text-primary text-muted-foreground text-lg p-2 hover:bg-accent/10 rounded-md w-full flex items-center gap-2"
            )}
            onClick={() => setMobileMenuOpen(false)}
          >
            <adminNavItem.icon className="h-5 w-5" />
            {adminNavItem.label}
          </Link>
        </>
      )}
    </nav>
  );

  return (
    <header className="w-full border-b border-border/40 bg-background">
      <div className="container flex flex-col max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-3 gap-3">
        {/* Top Bar: Logo, Main Nav (Desktop and specific mobile), Admin (Desktop) / Mobile Menu Trigger */}
        <div className="flex h-12 items-center justify-between w-full">
          <div className="flex items-center gap-x-2 sm:gap-x-3 md:gap-x-6">
            <Logo />
            {/* Desktop Main Nav */}
            <div className="hidden md:flex">
              <NavLinksContent forSheet={false} />
            </div>
            {/* Mobile Main Nav (inline next to logo) */}
            <div className="flex md:hidden items-center gap-x-3 ml-1 sm:ml-2">
              {mainNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "font-semibold transition-colors hover:text-primary text-xs sm:text-sm",
                    pathname === item.href ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side of Top Bar */}
          <div className="flex items-center">
            {/* Admin Icon for Desktop */}
            <div className="hidden md:block">
              <Link href={adminNavItem.href} className="text-muted-foreground hover:text-primary" aria-label={adminNavItem.label}>
                <adminNavItem.icon className="h-6 w-6" />
              </Link>
            </div>
            {/* Mobile Menu Trigger (uses Admin icon) */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Open menu and admin options">
                    <adminNavItem.icon className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[340px] p-6 bg-background">
                  <SheetHeader className="mb-6">
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <NavLinksContent forSheet={true} />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Search Bar Row */}
        <div className="w-full flex justify-center">
          <form onSubmit={handleSearch} className="w-full max-w-xl relative">
            <Input
              type="search"
              name="search"
              placeholder="Search movies & webseries..."
              className="pl-10 h-10 rounded-full bg-muted/50 focus:bg-muted focus:ring-1 focus:ring-primary text-sm"
              aria-label="Search"
            />
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          </form>
        </div>

        {/* Buttons Row: Join Channel, How to Download, Create Your Own Website */}
        <div className="w-full flex justify-center items-center flex-wrap gap-2 sm:gap-3 mt-3">
          {generalTelegramChannelUrl && generalTelegramChannelUrl.trim() !== '' && (
            <Button asChild variant="outline" size="sm">
              <Link href={generalTelegramChannelUrl} target="_blank" rel="noopener noreferrer">
                <Send className="mr-2 h-4 w-4" /> Join Channel
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href={howToDownloadNavItem.href}>
              <Download className="mr-2 h-4 w-4" /> {howToDownloadNavItem.label}
            </Link>
          </Button>
          {enableCreateWebsiteFeature && (
             <Button asChild variant="outline" size="sm">
                <Link href={CREATE_YOUR_WEBSITE_TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
                  <Globe className="mr-2 h-4 w-4" /> {createWebsiteButtonTextFromSettings}
                </Link>
            </Button>
          )}
        </div>

      </div>
    </header>
  );
}
