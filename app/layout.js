import './globals.css';

export const metadata = {
  title: 'GitHub Actions for FDEs — Learn by Doing',
  description: 'Hands-on exercises to master CI/CD with GitHub Actions.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
