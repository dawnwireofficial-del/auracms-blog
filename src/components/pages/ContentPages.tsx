import React from 'react';

function PageLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-16 md:py-24">
      <h1 className="font-display font-bold text-4xl md:text-5xl text-slate-900 dark:text-white tracking-tight mb-8">{title}</h1>
      <div className="prose prose-sm md:prose-base max-w-none text-slate-500 dark:text-zinc-400 space-y-6">
        {children}
      </div>
    </div>
  );
}

export function EditorialPolicyPage() {
  return (
    <PageLayout title="Editorial Policy">
      <p>DawnWire is committed to publishing useful, accurate, transparent, and reader-focused content. Our editorial process is designed to help readers understand technology products, SEO strategies, affiliate marketing, AI tools, and digital growth topics with clarity.</p>

      <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mt-8 mb-4">Our Standards</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>We aim to publish helpful and practical content.</li>
        <li>We separate editorial opinions from sponsorships.</li>
        <li>We disclose affiliate relationships where applicable.</li>
        <li>We update content when needed.</li>
        <li>We avoid misleading claims.</li>
        <li>We aim to explain both strengths and limitations.</li>
      </ul>

      <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mt-8 mb-4">Product Reviews</h2>
      <p>Our reviews are based on product positioning, available features, use cases, pricing clarity, audience fit, usability, limitations, and overall value.</p>

      <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mt-8 mb-4">Sponsored Content</h2>
      <p>Sponsored content, when published, should be clearly identified where appropriate.</p>

      <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mt-8 mb-4">Corrections</h2>
      <p>If you notice an error, contact us through the Contact page.</p>
    </PageLayout>
  );
}

export function AffiliateDisclosurePage() {
  return (
    <PageLayout title="Affiliate Disclosure">
      <p>Some pages on DawnWire may include affiliate links. This means we may earn a commission if you click a link and make a purchase, at no additional cost to you.</p>
      <p>Affiliate relationships do not guarantee positive coverage. Our goal is to help readers make informed decisions by providing useful, relevant, and transparent information.</p>
      <p>We only recommend tools and resources that we believe are relevant and useful to our readers based on our editorial judgment.</p>
    </PageLayout>
  );
}

export function PrivacyPage() {
  return (
    <PageLayout title="Privacy Policy">
      <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mt-8 mb-4">Information We Collect</h2>
      <p>We collect information you voluntarily provide, such as when you subscribe to our newsletter, submit a contact form, or leave a comment. This may include your name, email address, and any other information you choose to share.</p>

      <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mt-8 mb-4">How We Use Information</h2>
      <p>We use collected information to respond to inquiries, send newsletters (with your consent), improve our content, and analyze site traffic patterns.</p>

      <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mt-8 mb-4">Cookies</h2>
      <p>We may use cookies and similar tracking technologies to understand how visitors use our site and to improve your experience. You can control cookie settings through your browser.</p>

      <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mt-8 mb-4">Analytics</h2>
      <p>We use analytics tools to understand site usage patterns. This data is aggregated and does not personally identify individual visitors.</p>

      <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mt-8 mb-4">Email Newsletter</h2>
      <p>If you subscribe to our newsletter, we will use your email address to send you content updates. You can unsubscribe at any time.</p>

      <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mt-8 mb-4">Affiliate Links</h2>
      <p>Our site may contain affiliate links. Clicking these links may result in us earning a commission at no additional cost to you.</p>

      <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mt-8 mb-4">Third-Party Links</h2>
      <p>Our site may contain links to third-party websites. We are not responsible for the privacy practices or content of these sites.</p>

      <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mt-8 mb-4">Contact</h2>
      <p>If you have questions about this privacy policy, please contact us through our Contact page.</p>

      <p className="text-xs text-slate-500 mt-8 pt-4 border-t border-slate-200 dark:border-zinc-700">This page is for general informational purposes and should be reviewed by a qualified professional to ensure it matches DawnWire's actual business practices and legal requirements.</p>
    </PageLayout>
  );
}

export function TermsPage() {
  return (
    <PageLayout title="Terms of Service">
      <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mt-8 mb-4">Website Use</h2>
      <p>By accessing DawnWire, you agree to these terms. If you do not agree, please do not use our website.</p>

      <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mt-8 mb-4">Informational Content</h2>
      <p>All content on DawnWire is provided for informational and educational purposes only. It should not be construed as professional advice.</p>

      <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mt-8 mb-4">No Professional Advice</h2>
      <p>DawnWire does not provide legal, financial, or technical professional advice. You should consult qualified professionals for advice specific to your situation.</p>

      <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mt-8 mb-4">Affiliate Links</h2>
      <p>Some pages may contain affiliate links. We may earn a commission on purchases made through these links at no additional cost to you.</p>

      <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mt-8 mb-4">Intellectual Property</h2>
      <p>All content on DawnWire is owned by or licensed to us. You may not reproduce, distribute, or modify our content without permission.</p>

      <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mt-8 mb-4">Third-Party Links</h2>
      <p>Our site may link to third-party websites. We are not responsible for their content or practices.</p>

      <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mt-8 mb-4">Limitation of Liability</h2>
      <p>DawnWire is not liable for any damages arising from the use or inability to use our website or content.</p>

      <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mt-8 mb-4">Changes to Terms</h2>
      <p>We reserve the right to update these terms at any time. Changes will be posted on this page.</p>

      <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mt-8 mb-4">Contact</h2>
      <p>If you have questions about these terms, please contact us through our Contact page.</p>

      <p className="text-xs text-slate-500 mt-8 pt-4 border-t border-slate-200 dark:border-zinc-700">This page is for general informational purposes and should be reviewed by a qualified professional to ensure it matches DawnWire's actual business practices and legal requirements.</p>
    </PageLayout>
  );
}

export function NewsletterInfoPage({ onNavigate }: { onNavigate: (route: string, param?: string) => void }) {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-16 md:py-24 text-center">
      <h1 className="font-display font-bold text-4xl md:text-5xl text-slate-900 dark:text-white tracking-tight mb-4">Newsletter</h1>
      <p className="text-lg text-slate-500 dark:text-zinc-400 leading-relaxed max-w-xl mx-auto mb-8">
        Get useful insights on AI tools, affiliate marketing, SEO strategy, product reviews, and technology trends delivered to your inbox.
      </p>
      <button onClick={() => onNavigate('home')} className="inline-flex items-center gap-2 bg-[#246BFF] hover:bg-blue-600 text-white font-semibold text-sm px-6 py-3 rounded-lg transition-all cursor-pointer">
        Subscribe on Homepage
      </button>
    </div>
  );
}
