import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Use system fonts instead of Google Fonts to avoid Turbopack TLS issues
// The fonts are defined in globals.css using CSS variables

export const metadata: Metadata = {
  title: "StudyFlow - Your Personal Study Companion",
  description: "Transform your markdown checklists into a powerful study app with progress tracking, Pomodoro timer, statistics, and more!",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "StudyFlow",
  },
  openGraph: {
    title: "StudyFlow - Your Personal Study Companion",
    description: "Transform your markdown checklists into a powerful study app",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check if Clerk is properly configured
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkConfigured = clerkKey && !clerkKey.includes("your_");

  const content = (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );

  // Only wrap with ClerkProvider if properly configured
  if (isClerkConfigured) {
    return (
      <ClerkProvider
        appearance={{
          variables: {
            colorPrimary: "#f97316",
            colorText: "#1f2937",
            colorTextSecondary: "#6b7280",
            colorBackground: "#ffffff",
            colorInputBackground: "#f9fafb",
            colorInputText: "#1f2937",
          },
          elements: {
            card: "bg-white shadow-xl border",
            headerTitle: "text-gray-900",
            headerSubtitle: "text-gray-600",
            socialButtonsBlockButton: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
            formButtonPrimary: "bg-orange-500 hover:bg-orange-600 text-white",
            formFieldLabel: "text-gray-700",
            formFieldInput: "bg-white border-gray-300 text-gray-900",
            footerActionLink: "text-orange-500 hover:text-orange-600",
            identityPreview: "bg-gray-50 border-gray-200",
            identityPreviewText: "text-gray-900",
            identityPreviewEditButton: "text-orange-500",
            userButtonPopoverCard: "bg-white shadow-xl border",
            userButtonPopoverActionButton: "text-gray-700 hover:bg-gray-100",
            userButtonPopoverActionButtonText: "text-gray-700",
            userButtonPopoverFooter: "border-t border-gray-200",
            userPreviewMainIdentifier: "text-gray-900",
            userPreviewSecondaryIdentifier: "text-gray-500",
            profileSectionTitle: "text-gray-900",
            profileSectionTitleText: "text-gray-900",
            profileSectionContent: "text-gray-700",
            navbarButton: "text-gray-700 hover:bg-gray-100",
            navbarButtonIcon: "text-gray-500",
            accordionTriggerButton: "text-gray-700 hover:bg-gray-100",
            formFieldInputShowPasswordButton: "text-gray-500",
            badge: "bg-orange-100 text-orange-600",
            menuButton: "text-gray-700 hover:bg-gray-100",
            menuList: "bg-white border shadow-lg",
            menuItem: "text-gray-700 hover:bg-gray-100",
          },
        }}
      >
        {content}
      </ClerkProvider>
    );
  }

  return content;
}
