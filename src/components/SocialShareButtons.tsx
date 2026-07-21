import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Twitter, Facebook, Linkedin, Mail, Link2, Check, Share2 } from 'lucide-react';

interface SocialShareButtonsProps {
  url?: string;
  title: string;
  description?: string;
  image?: string;
  compact?: boolean;
  className?: string;
}

function getShareUrl(platform: string, url: string, title: string, description?: string): string {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = description ? encodeURIComponent(description.substring(0, 200)) : '';

  switch (platform) {
    case 'twitter':
      return `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case 'whatsapp':
      return `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
    case 'reddit':
      return `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
    case 'email':
      return `mailto:?subject=${encodedTitle}&body=${encodedDesc ? encodedDesc + '%0D%0A%0D%0A' : ''}${encodedUrl}`;
    default:
      return url;
  }
}

const SHARE_PLATFORMS = [
  { key: 'twitter', icon: Twitter, label: 'Twitter', color: 'hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10' },
  { key: 'facebook', icon: Facebook, label: 'Facebook', color: 'hover:text-[#1877F2] hover:bg-[#1877F2]/10' },
  { key: 'linkedin', icon: Linkedin, label: 'LinkedIn', color: 'hover:text-[#0A66C2] hover:bg-[#0A66C2]/10' },
  { key: 'whatsapp', icon: Share2, label: 'WhatsApp', color: 'hover:text-[#25D366] hover:bg-[#25D366]/10' },
  { key: 'reddit', icon: Share2, label: 'Reddit', color: 'hover:text-[#FF4500] hover:bg-[#FF4500]/10' },
  { key: 'email', icon: Mail, label: 'Email', color: 'hover:text-[#246BFF] hover:bg-[#246BFF]/10' },
];

export default function SocialShareButtons({ url, title, description, image, compact, className }: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = currentUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = (platform: string) => {
    const shareUrl = getShareUrl(platform, currentUrl, title, description);
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 ${className || ''}`}>
        {SHARE_PLATFORMS.slice(0, 4).map((p, i) => (
          <motion.button
            key={p.key}
            onClick={() => handleShare(p.key)}
            className={`p-2 rounded-lg transition-all text-slate-400 dark:text-zinc-500 ${p.color}`}
            title={`Share on ${p.label}`}
            aria-label={`Share on ${p.label}`}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <p.icon className="w-4 h-4" />
          </motion.button>
        ))}
        <motion.button
          onClick={handleCopyLink}
          className={`p-2 rounded-lg transition-all text-slate-400 dark:text-zinc-500 hover:text-[#246BFF] hover:bg-[#246BFF]/10`}
          title={copied ? 'Copied!' : 'Copy link'}
          aria-label="Copy link"
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 4 * 0.05 }}
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
        </motion.button>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className || ''}`}>
      <span className="text-xs font-medium text-slate-500 dark:text-zinc-500 mr-1">Share:</span>
      {SHARE_PLATFORMS.map((p, i) => (
        <motion.button
          key={p.key}
          onClick={() => handleShare(p.key)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 dark:border-zinc-700 hover:border-transparent bg-white dark:bg-zinc-800/50 ${p.color}`}
          title={`Share on ${p.label}`}
          aria-label={`Share on ${p.label}`}
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <p.icon className="w-3.5 h-3.5" />
          <span className="text-[10px] font-semibold hidden sm:inline">{p.label}</span>
        </motion.button>
      ))}
      <motion.button
        onClick={handleCopyLink}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all border border-slate-200 dark:border-zinc-700 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 ${
          copied
            ? 'text-green-500 border-green-200 dark:border-green-800'
            : 'text-slate-500 dark:text-zinc-400 hover:text-[#246BFF] hover:border-[#246BFF]/50'
        }`}
        title={copied ? 'Copied!' : 'Copy link'}
        aria-label="Copy link"
        whileHover={{ scale: 1.1, y: -2 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: SHARE_PLATFORMS.length * 0.05 }}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
        <span className="text-[10px] font-semibold hidden sm:inline">{copied ? 'Copied!' : 'Copy Link'}</span>
      </motion.button>
    </div>
  );
}
