import Features from "@/components/Features";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Pricing from "@/components/Pricing";
// Temporarily disabled Clerk for testing
// import { currentUser } from "@clerk/nextjs";
// import { redirect } from "next/navigation";

export default async function HomePage() {
  // Temporarily disabled Clerk authentication for testing
  // const user = await currentUser();
  // if (user) {
  //   redirect("/dashboard");
  // }

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
