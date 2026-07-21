import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { StatsSection } from '@/components/home/StatsSection';
import { JobSearchSection } from '@/components/home/JobSearchSection';
import { FeaturedCountries } from '@/components/home/FeaturedCountries';
import { FeaturedJobs } from '@/components/home/FeaturedJobs';
import { WhyChooseUs } from '@/components/home/WhyChooseUs';
import { RecruitmentProcess } from '@/components/home/RecruitmentProcess';
import { Testimonials } from '@/components/home/Testimonials';
import { Newsletter } from '@/components/home/Newsletter';

export function HomePage() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60] focus:inline-flex focus:h-auto focus:w-auto focus:overflow-visible focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink focus:shadow focus:ring-2 focus:ring-brand"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <StatsSection />
        <JobSearchSection />
        <FeaturedCountries />
        <FeaturedJobs />
        <WhyChooseUs />
        <RecruitmentProcess />
        <Testimonials />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
