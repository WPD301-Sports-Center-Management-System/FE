import { renderToString } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeContext'
import { LandingV4 } from '@/features/landing/v4/LandingV4'

export { FAQ, LANDING_DESCRIPTION, LANDING_TITLE } from '@/features/landing/v4/content'

/**
 * Build-time only (scripts/prerender-landing.mjs): static HTML of the landing so H1, sections,
 * FAQ and links exist before JavaScript runs. API sections render their loading state; nothing
 * is fetched or invented at build time. The client app then renders over it (not hydration).
 */
// oxlint-disable-next-line react/only-export-components -- build entry, never fast-refreshed
export function render() {
  const client = new QueryClient({ defaultOptions: { queries: { enabled: false } } })
  return renderToString(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/']}>
        <ThemeProvider><LandingV4 /></ThemeProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
