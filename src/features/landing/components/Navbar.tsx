import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Dumbbell, 
  Menu, 
  X, 
  Smartphone, 
  LogIn, 
  Flame, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { ThemeSelector } from '@/components/ThemeSelector';

interface NavbarProps {
  onOpenTrialModal: () => void;
  onOpenDownloadModal: () => void;
}

export const Navbar = ({ onOpenTrialModal, onOpenDownloadModal }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  const navLinks = [
    { id: 'courses', label: 'Khóa Tập', href: '#courses' },
    { id: 'coaches', label: 'Đội Ngũ PT', href: '#coaches' },
    { id: 'how-it-works', label: 'Quy Trình', href: '#how-it-works' },
    { id: 'pricing', label: 'Bảng Giá', href: '#pricing' },
    { id: 'mobile-app', label: 'Ứng Dụng', href: '#mobile-app' },
    { id: 'testimonials', label: 'Đánh Giá', href: '#testimonials' },
    { id: 'faq', label: 'FAQ', href: '#faq' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      // 1. Calculate overall scroll progress (0% -> 100%)
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      if (documentHeight > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / documentHeight) * 100));
        setScrollProgress(progress);
      }

      setIsScrolled(window.scrollY > 20);

      // 2. ScrollSpy logic: detect which section is in view
      const sectionIds = ['courses', 'coaches', 'how-it-works', 'pricing', 'mobile-app', 'testimonials', 'faq'];
      const scrollPosition = window.scrollY + 200; // Trigger slightly before reaching the section top

      let currentSection = '';
      for (let i = 0; i < sectionIds.length; i++) {
        const id = sectionIds[i];
        const element = document.getElementById(id);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            currentSection = id;
            break;
          }
        }
      }

      // Check if user reached bottom of page
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80) {
        currentSection = 'faq';
      }

      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-bg-surface/90 backdrop-blur-md border-b border-border-subtle shadow-md py-2.5' 
          : 'bg-bg-surface/75 backdrop-blur-sm border-b border-border-subtle/50 py-4'
      }`}
    >
      {/* Top Scroll Progress Indicator Bar */}
      <div 
        className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-orange-600 via-amber-400 to-orange-500 shadow-[0_0_10px_rgba(255,87,34,0.8)] transition-all duration-150 ease-out z-50"
        style={{ width: `${scrollProgress}%` }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30 group-hover:scale-105 transition-transform">
              <Dumbbell className="w-4 h-4 text-white transform -rotate-45" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight font-heading text-text-primary whitespace-nowrap">
                  APEX<span className="text-primary">FIT</span>
                </span>
                <span className="text-xs uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 whitespace-nowrap">
                  1:1 PT
                </span>
              </div>
              <span className="text-xs text-text-muted tracking-wider whitespace-nowrap hidden sm:inline-block">
                CHUYÊN GIA THỂ HÌNH CÁ NHÂN
              </span>
            </div>
          </a>

          {/* Desktop Nav Links with Real-time Scroll Glow */}
          <nav className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0 p-1 rounded-full bg-bg-surface-muted/90 border border-border-subtle backdrop-blur-sm">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 flex items-center gap-1.5 ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-orange-600 to-amber-500 shadow-[0_0_16px_rgba(255,87,34,0.45)] border border-orange-400/40 scale-105'
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-surface/60'
                  }`}
                >
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                  <span>{link.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Action CTAs */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            {/* Theme Selector */}
            <ThemeSelector />

            {/* Link to Web Portal Login */}
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-text-primary bg-bg-surface-muted hover:bg-border-subtle border border-border-subtle transition-all whitespace-nowrap"
              title="Dành cho Quản lý, Lễ tân & Huấn luyện viên"
            >
              <LogIn className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Cổng Nội Bộ</span>
            </Link>

            {/* Mobile App Download Button */}
            <button
              onClick={onOpenDownloadModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-sky-500 hover:text-sky-600 dark:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition-all cursor-pointer whitespace-nowrap"
            >
              <Smartphone className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span>Tải App</span>
            </button>

            {/* Primary Action Button */}
            <button
              onClick={onOpenTrialModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 glow-button transition-all transform active:scale-95 cursor-pointer whitespace-nowrap shadow-md shadow-orange-600/30"
            >
              <Flame className="w-3.5 h-3.5 shrink-0" />
              <span>Tập Thử Miễn Phí</span>
            </button>
          </div>

          {/* Tablet/Mobile Actions & Hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            <ThemeSelector />
            <button
              onClick={onOpenTrialModal}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-500 shadow-md shadow-orange-600/30 whitespace-nowrap cursor-pointer"
            >
              Tập Thử
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-text-muted hover:text-text-primary bg-bg-surface border border-border-subtle focus:outline-none cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-2 mx-4 p-4 rounded-2xl bg-bg-surface/95 border border-border-subtle backdrop-blur-xl shadow-2xl space-y-3">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-600/20 to-amber-500/20 border border-orange-500/40 text-primary font-bold'
                      : 'text-text-muted hover:bg-bg-surface-muted hover:text-text-primary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isActive && <Sparkles className="w-3.5 h-3.5 text-primary" />}
                    <span>{link.label}</span>
                  </div>
                  {isActive ? (
                    <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded bg-primary text-primary-foreground shadow-sm">
                      Đang Xem
                    </span>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-text-muted" />
                  )}
                </a>
              );
            })}
          </div>

          <div className="pt-3 border-t border-border-subtle grid grid-cols-2 gap-2">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold bg-bg-surface-muted text-text-primary border border-border-subtle"
            >
              <LogIn className="w-4 h-4 text-primary" />
              <span>Cổng Nội Bộ</span>
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenDownloadModal();
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-300 border border-sky-500/30 cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-sky-500" />
              <span>Tải App Hội Viên</span>
            </button>
          </div>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenTrialModal();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-500 shadow-lg shadow-orange-500/30 cursor-pointer"
          >
            <Flame className="w-4 h-4" />
            <span>Đăng Ký Tư Vấn & Tập Thử 1:1</span>
          </button>
        </div>
      )}
    </header>
  );
};
