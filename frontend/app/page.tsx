import { currentUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Pricing from '@/components/Pricing';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default async function HomePage() {
  const user = await currentUser();

  // Redirect authenticated users to dashboard
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Features />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}