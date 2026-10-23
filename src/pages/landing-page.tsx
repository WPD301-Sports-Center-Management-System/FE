import { useState } from 'react';
import { Navbar } from '@/features/landing/components/Navbar';
import { HeroSection } from '@/features/landing/components/HeroSection';
import { FeaturesSection } from '@/features/landing/components/FeaturesSection';
import { CoursesSection } from '@/features/landing/components/CoursesSection';
import { CoachesSection } from '@/features/landing/components/CoachesSection';
import { HowItWorksSection } from '@/features/landing/components/HowItWorksSection';
import { PricingSection } from '@/features/landing/components/PricingSection';
import { MobileAppSection } from '@/features/landing/components/MobileAppSection';
import { TestimonialsSection } from '@/features/landing/components/TestimonialsSection';
import { FaqSection } from '@/features/landing/components/FaqSection';
import { CtaBanner } from '@/features/landing/components/CtaBanner';
import { Footer } from '@/features/landing/components/Footer';
import { TrialModal } from '@/features/landing/components/TrialModal';
import { CoachModal } from '@/features/landing/components/CoachModal';
import { AppDownloadModal } from '@/features/landing/components/AppDownloadModal';
import type { TrainingCourse, Coach, PtPackage, MembershipPlan } from '@/features/landing/data/landingData';

export const LandingPage = () => {
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [selectedCoachForModal, setSelectedCoachForModal] = useState<Coach | null>(null);
  const [selectedCourseForTrial, setSelectedCourseForTrial] = useState<TrainingCourse | null>(null);
  const [selectedPtPackageForTrial, setSelectedPtPackageForTrial] = useState<PtPackage | null>(null);
  const [selectedMembershipForTrial, setSelectedMembershipForTrial] = useState<MembershipPlan | null>(null);

  const handleOpenGeneralTrial = () => {
    setSelectedCourseForTrial(null);
    setSelectedPtPackageForTrial(null);
    setSelectedMembershipForTrial(null);
    setTrialModalOpen(true);
  };

  const handleSelectCourse = (course: TrainingCourse) => {
    setSelectedCourseForTrial(course);
    setSelectedPtPackageForTrial(null);
    setSelectedMembershipForTrial(null);
    setTrialModalOpen(true);
  };

  const handleSelectCoach = (coach: Coach) => {
    setSelectedCoachForModal(coach);
  };

  const handleOpenTrialWithCoach = () => {
    setSelectedCoachForModal(null);
    setSelectedCourseForTrial(null);
    setSelectedPtPackageForTrial(null);
    setSelectedMembershipForTrial(null);
    setTrialModalOpen(true);
  };

  const handleSelectPtPackage = (pkg: PtPackage) => {
    setSelectedPtPackageForTrial(pkg);
    setSelectedCourseForTrial(null);
    setSelectedMembershipForTrial(null);
    setTrialModalOpen(true);
  };

  const handleSelectMembership = (plan: MembershipPlan) => {
    setSelectedMembershipForTrial(plan);
    setSelectedCourseForTrial(null);
    setSelectedPtPackageForTrial(null);
    setTrialModalOpen(true);
  };

  return (
    <div className="landing-page min-h-screen bg-[#070a11] text-slate-100 selection:bg-orange-500 selection:text-white relative">
      
      {/* Top Navbar */}
      <Navbar 
        onOpenTrialModal={handleOpenGeneralTrial} 
        onOpenDownloadModal={() => setDownloadModalOpen(true)} 
      />

      {/* Main Sections */}
      <main className="pb-20 md:pb-0">
        <HeroSection 
          onOpenTrialModal={handleOpenGeneralTrial} 
          onOpenDownloadModal={() => setDownloadModalOpen(true)} 
        />
        
        <FeaturesSection />
        
        <CoursesSection onSelectCourse={handleSelectCourse} />
        
        <CoachesSection onSelectCoach={handleSelectCoach} />
        
        <HowItWorksSection onOpenTrialModal={handleOpenGeneralTrial} />
        
        <PricingSection 
          onSelectPtPackage={handleSelectPtPackage} 
          onSelectMembership={handleSelectMembership} 
        />
        
        <MobileAppSection onOpenDownloadModal={() => setDownloadModalOpen(true)} />
        
        <TestimonialsSection />
        
        <FaqSection />
        
        <CtaBanner 
          onOpenTrialModal={handleOpenGeneralTrial} 
          onOpenDownloadModal={() => setDownloadModalOpen(true)} 
        />
      </main>

      {/* Footer */}
      <Footer onOpenDownloadModal={() => setDownloadModalOpen(true)} />

      {/* Mobile-first conversion bar: keeps the main action available without
          forcing users to scroll back to the hero. */}
      <div className="landing-mobile-cta fixed inset-x-0 bottom-0 z-40 border-t border-slate-700/80 bg-[#0b101a]/95 px-4 py-3 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-md items-center gap-2">
          <button
            type="button"
            onClick={handleOpenGeneralTrial}
            className="flex-1 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-950/40 transition-transform active:scale-[.98]"
          >
            Đăng ký tập thử
          </button>
          <button
            type="button"
            onClick={() => setDownloadModalOpen(true)}
            className="rounded-xl border border-slate-600 bg-slate-800/80 px-4 py-3 text-sm font-semibold text-slate-200"
          >
            Tải app
          </button>
        </div>
      </div>

      {/* Modals */}
      <TrialModal 
        isOpen={trialModalOpen}
        onClose={() => setTrialModalOpen(false)}
        initialCourse={selectedCourseForTrial}
        initialPtPackage={selectedPtPackageForTrial}
        initialMembership={selectedMembershipForTrial}
      />

      <CoachModal 
        coach={selectedCoachForModal}
        onClose={() => setSelectedCoachForModal(null)}
        onOpenTrialWithCoach={handleOpenTrialWithCoach}
      />

      <AppDownloadModal 
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
      />

    </div>
  );
};
export default LandingPage;
