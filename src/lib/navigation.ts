// Navigation utility for smooth SPA routing and progress bar updates

export const triggerPageLoadProgress = () => {
  window.dispatchEvent(new CustomEvent('page-navigation-start'));
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('page-navigation-end'));
  }, 450);
};

export const navigate = (url: string) => {
  const currentUrl = window.location.pathname + window.location.search;
  if (currentUrl === url) {
    // If clicking same URL, still trigger progress feedback
    triggerPageLoadProgress();
    return;
  }

  window.dispatchEvent(new CustomEvent('page-navigation-start', { detail: { url } }));
  window.history.pushState({}, '', url);
  window.dispatchEvent(new Event('popstate'));

  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('page-navigation-end'));
  }, 400);
};

// Global click handler setup for SPA internal links
export const setupGlobalLinkInterceptor = () => {
  const handleClick = (e: MouseEvent) => {
    const target = (e.target as HTMLElement).closest('a');
    if (!target) return;

    const href = target.getAttribute('href');
    if (
      href &&
      href.startsWith('/') &&
      !href.startsWith('//') &&
      !target.getAttribute('target') &&
      !target.hasAttribute('download') &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.shiftKey
    ) {
      e.preventDefault();
      navigate(href);
    }
  };

  document.addEventListener('click', handleClick);
  return () => document.removeEventListener('click', handleClick);
};
