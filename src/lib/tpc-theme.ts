/**
 * TPC UI theme contract: the preference is shared across TPC apps through the
 * `tpc_theme` cookie (legacy `politogy_theme` is written too). react-zen keeps
 * its own localStorage copy; call this next to every `setTheme`.
 */
const COOKIE_DOMAINS = ['.theportlandcompany.com', '.politogyvrm.com', '.agentswarmapp.com'];
const ONE_YEAR = 60 * 60 * 24 * 365;

export function persistTpcTheme(theme: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  const host = location.hostname;
  const domain = COOKIE_DOMAINS.find(d => host === d.slice(1) || host.endsWith(d));
  const attrs = `; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax${domain ? `; Domain=${domain}` : ''}${
    location.protocol === 'https:' ? '; Secure' : ''
  }`;
  document.cookie = `tpc_theme=${theme}${attrs}`;
  document.cookie = `politogy_theme=${theme}${attrs}`;
  // tokens.css keys dark values on .dark and system dark on :not(.light).
  document.documentElement.classList.toggle('light', theme === 'light');
}
