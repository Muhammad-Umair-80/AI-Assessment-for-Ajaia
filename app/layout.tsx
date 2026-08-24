import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ajaia Document Editor',
  description: 'Collaborative Document Editor MVP',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
