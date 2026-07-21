export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
] as const;

export type LangCode = typeof LANGUAGES[number]['code'];

type TranslationMap = Record<string, Record<LangCode, string>>;

export const translations: TranslationMap = {
  'nav.home': { en: 'Home', es: 'Inicio', fr: 'Accueil', de: 'Start', pt: 'Início', it: 'Home', nl: 'Home', pl: 'Dom', ru: 'Главная', ja: 'ホーム', ko: '홈', zh: '首页', ar: 'الرئيسية', hi: 'होम' },
  'nav.blog': { en: 'Blog', es: 'Blog', fr: 'Blog', de: 'Blog', pt: 'Blog', it: 'Blog', nl: 'Blog', pl: 'Blog', ru: 'Блог', ja: 'ブログ', ko: '블로그', zh: '博客', ar: 'المدونة', hi: 'ब्लॉग' },
  'nav.services': { en: 'Services', es: 'Servicios', fr: 'Services', de: 'Dienstleistungen', pt: 'Serviços', it: 'Servizi', nl: 'Diensten', pl: 'Usługi', ru: 'Услуги', ja: 'サービス', ko: '서비스', zh: '服务', ar: 'الخدمات', hi: 'सेवाएं' },
  'nav.portfolio': { en: 'Portfolio', es: 'Portafolio', fr: 'Portfolio', de: 'Portfolio', pt: 'Portfólio', it: 'Portfolio', nl: 'Portfolio', pl: 'Portfolio', ru: 'Портфолио', ja: 'ポートフォリオ', ko: '포트폴리오', zh: '作品集', ar: 'الأعمال', hi: 'पोर्टफोलियो' },
  'nav.about': { en: 'About', es: 'Acerca de', fr: 'À propos', de: 'Über uns', pt: 'Sobre', it: 'Chi siamo', nl: 'Over ons', pl: 'O nas', ru: 'О нас', ja: '概要', ko: '소개', zh: '关于', ar: 'حول', hi: 'हमारे बारे में' },
  'nav.contact': { en: 'Contact', es: 'Contacto', fr: 'Contact', de: 'Kontakt', pt: 'Contato', it: 'Contatti', nl: 'Contact', pl: 'Kontakt', ru: 'Контакты', ja: 'お問い合わせ', ko: '문의', zh: '联系', ar: 'اتصل بنا', hi: 'संपर्क' },
  'nav.products': { en: 'Reviews', es: 'Reseñas', fr: 'Avis', de: 'Bewertungen', pt: 'Avaliações', it: 'Recensioni', nl: 'Beoordelingen', pl: 'Recenzje', ru: 'Обзоры', ja: 'レビュー', ko: '리뷰', zh: '评测', ar: 'مراجعات', hi: 'समीक्षाएं' },
  'hero.title': { en: 'AI-Powered Platform', es: 'Plataforma impulsada por IA', fr: 'Plateforme alimentée par l\'IA', de: 'KI-gestützte Plattform', pt: 'Plataforma com IA', it: 'Piattaforma basata sull\'IA', nl: 'AI-gestuurde platform', pl: 'Platforma oparta na AI', ru: 'Платформа на базе ИИ', ja: 'AI搭載プラットフォーム', ko: 'AI 기반 플랫폼', zh: 'AI驱动平台', ar: 'منصة مدعومة بالذكاء الاصطناعي', hi: 'AI-संचालित प्लेटफॉर्म' },
  'hero.tagline': { en: 'Content automation, SEO optimization, and affiliate marketing tools working together.', es: 'Automatización de contenido, optimización SEO y herramientas de marketing de afiliados.', fr: 'Automatisation du contenu, optimisation SEO et outils de marketing d\'affiliation.', de: 'Content-Automatisierung, SEO-Optimierung und Affiliate-Marketing-Tools.', pt: 'Automação de conteúdo, otimização de SEO e ferramentas de marketing de afiliados.', it: 'Automazione dei contenuti, ottimizzazione SEO e strumenti di marketing di affiliazione.', nl: 'Content automatisering, SEO optimalisatie en affiliate marketing tools.', pl: 'Automatyzacja treści, optymalizacja SEO i narzędzia marketingu afiliacyjnego.', ru: 'Автоматизация контента, SEO-оптимизация и инструменты партнерского маркетинга.', ja: 'コンテンツ自動化、SEO最適化、アフィリエイトマーケティングツール。', ko: '콘텐츠 자동화, SEO 최적화, 제휴 마케팅 도구.', zh: '内容自动化、SEO优化和联盟营销工具协同工作。', ar: 'أتمتة المحتوى، تحسين محركات البحث، وأدوات التسويق بالعمولة.', hi: 'सामग्री ऑटोमेशन, SEO ऑप्टिमाइज़ेशन और एफिलिएट मार्केटिंग टूल्स।' },
  'systems.active': { en: 'All systems active', es: 'Todos los sistemas activos', fr: 'Tous les systèmes actifs', de: 'Alle Systeme aktiv', pt: 'Todos os sistemas ativos', it: 'Tutti i sistemi attivi', nl: 'Alle systemen actief', pl: 'Wszystkie systemy aktywne', ru: 'Все системы активны', ja: '全システム稼働中', ko: '모든 시스템 활성', zh: '所有系统正常运行', ar: 'جميع الأنظمة نشطة', hi: 'सभी सिस्टम सक्रिय' },
  'search.placeholder': { en: 'Search articles...', es: 'Buscar artículos...', fr: 'Rechercher des articles...', de: 'Artikel suchen...', pt: 'Pesquisar artigos...', it: 'Cerca articoli...', nl: 'Artikelen zoeken...', pl: 'Szukaj artykułów...', ru: 'Поиск статей...', ja: '記事を検索...', ko: '기사 검색...', zh: '搜索文章...', ar: 'بحث عن المقالات...', hi: 'लेख खोजें...' },
  'footer.rights': { en: 'All rights reserved.', es: 'Todos los derechos reservados.', fr: 'Tous droits réservés.', de: 'Alle Rechte vorbehalten.', pt: 'Todos os direitos reservados.', it: 'Tutti i diritti riservati.', nl: 'Alle rechten voorbehouden.', pl: 'Wszelkie prawa zastrzeżone.', ru: 'Все права защищены.', ja: '全著作権所有。', ko: '모든 권리 보유.', zh: '保留所有权利。', ar: 'جميع الحقوق محفوظة.', hi: 'सर्वाधिकार सुरक्षित।' },
  'share.title': { en: 'Share This', es: 'Compartir', fr: 'Partager', de: 'Teilen', pt: 'Compartilhar', it: 'Condividi', nl: 'Delen', pl: 'Udostępnij', ru: 'Поделиться', ja: 'シェア', ko: '공유', zh: '分享', ar: 'مشاركة', hi: 'साझा करें' },
  'comments.title': { en: 'Comments', es: 'Comentarios', fr: 'Commentaires', de: 'Kommentare', pt: 'Comentários', it: 'Commenti', nl: 'Reacties', pl: 'Komentarze', ru: 'Комментарии', ja: 'コメント', ko: '댓글', zh: '评论', ar: 'تعليقات', hi: 'टिप्पणियाँ' },
  'newsletter.title': { en: 'Subscribe', es: 'Suscribirse', fr: 'S\'abonner', de: 'Abonnieren', pt: 'Inscrever-se', it: 'Iscriviti', nl: 'Abonneren', pl: 'Subskrybuj', ru: 'Подписаться', ja: '購読', ko: '구독', zh: '订阅', ar: 'اشترك', hi: 'सदस्यता लें' },
};

export function t(key: string, lang: LangCode): string {
  const map = translations[key];
  if (!map) return key;
  return map[lang] || map['en'] || key;
}
