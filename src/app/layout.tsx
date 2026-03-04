
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Braingig LLC - Agency Profit & Partner Management',
  description: 'The ultimate tool for tracking income, expenses, and profit shares for modern agency partners.',
};

import { AuthProvider } from '@/components/AuthContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3B3BDA" />
      </head>
      <body className="font-body antialiased selection:bg-primary/20">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
