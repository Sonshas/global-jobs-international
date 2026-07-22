import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { StatsSection } from '@/components/home/StatsSection';
import { JobSearchSection } from '@/components/home/JobSearchSection';
import { ApplicationSeason } from '@/components/home/ApplicationSeason';
import { LiveRecruitmentCampaign } from '@/components/home/LiveRecruitmentCampaign';
import { FeaturedCountries } from '@/components/home/FeaturedCountries';
import { InteractiveWorldMap } from '@/components/home/InteractiveWorldMap';
import { FeaturedJobs } from '@/components/home/FeaturedJobs';
import { VerifiedEmployers } from '@/components/home/VerifiedEmployers';
import { WhyChooseUs } from '@/components/home/WhyChooseUs';
import { RecruitmentProcess } from '@/components/home/RecruitmentProcess';
import { Testimonials } from '@/components/home/Testimonials';
import { PremiumHomeExtras } from '@/components/home/PremiumHomeExtras';
import { ServicesSection } from '@/components/home/ServicesSection';
import { Newsletter } from '@/components/home/Newsletter';

export function HomePage() {
  const { t } = useTranslation();
  useDocumentTitle(`${t('app.name')} | ${t('home.heroTitle')}`);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const handleSelectCountry = (countryName: string | null) => {
    setSelectedCountry(countryName);
    if (countryName) {
      document.getElementById('jobs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <StatsSection />
        <JobSearchSection />
        <ApplicationSeason />
        <LiveRecruitmentCampaign />
        <FeaturedCountries />
        <InteractiveWorldMap
          selectedCountry={selectedCountry}
          onSelectCountry={handleSelectCountry}
        />
        <FeaturedJobs selectedCountry={selectedCountry} onSelectCountry={setSelectedCountry} />
        <PremiumHomeExtras />
        <VerifiedEmployers />
        <WhyChooseUs />
        <ServicesSection />
        <RecruitmentProcess />
        <Testimonials />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
