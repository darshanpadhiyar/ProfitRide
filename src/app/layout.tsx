import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: 'ProfitRide Delivery Earning Tracker',
  description: 'Smart analytics for delivery partners',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased selection:bg-primary/30 transition-colors duration-300">
        <ThemeProvider defaultTheme="dark">
          <FirebaseClientProvider>
            <div className="flex flex-col min-h-screen pb-20 md:pb-0 md:pt-4">
              <main className="flex-1 w-full max-w-lg mx-auto px-4">
                {children}
              </main>
            </div>
            <Toaster />
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
