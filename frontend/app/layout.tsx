import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type React from 'react';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FiyatIQ - Akıllı Araç Fiyat Tahmin Platformu',
  description:
    'Gerçek zamanlı pazar verileri kullanarak AI destekli araç fiyat tahmini',
  generator: 'v0.dev'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
