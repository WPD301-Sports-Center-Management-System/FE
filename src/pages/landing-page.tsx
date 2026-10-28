import { LandingV4 } from '@/features/landing/v4/LandingV4';

// Public website (ApexFIT V4 design). Data comes from the existing public endpoints in
// features/landing/api.ts; styles are scoped to .gc-landing so dashboards are untouched.
export const LandingPage = () => <LandingV4 />;
export default LandingPage;
