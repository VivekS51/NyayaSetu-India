import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { I18nProvider } from '../lib/i18n';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export const metadata: Metadata = {
  title: 'NyayaSetu India | Incentive-Based Legal Marketplace & Provider Onboarding',
  description:
    'National digital legal services marketplace for verified advocates, notaries, and mediators. Rule 36 BCI and DPDP Act 2023 compliant justice delivery.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased flex flex-col min-h-screen">
        <I18nProvider>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}

