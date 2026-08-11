import React from 'react';

// Shimmer pulse utility block
export const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl ${className}`} />
);

// Single Product Card Skeleton
export const ProductCardSkeleton: React.FC<{ viewMode?: 'grid' | 'list' }> = ({ viewMode = 'grid' }) => {
  if (viewMode === 'list') {
    return (
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-6 animate-pulse">
        {/* Image Placeholder */}
        <div className="w-full md:w-48 h-40 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0" />

        {/* Content Placeholder */}
        <div className="flex-1 space-y-3 py-1">
          <div className="flex items-center justify-between">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-5 w-16 rounded-full" />
          </div>
          <SkeletonBlock className="h-6 w-3/4" />
          <SkeletonBlock className="h-4 w-1/2" />
          <div className="flex items-center gap-3 pt-2">
            <SkeletonBlock className="h-8 w-28 rounded-xl" />
            <SkeletonBlock className="h-8 w-32 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 animate-pulse flex flex-col justify-between h-[380px]">
      <div className="space-y-3">
        {/* Top badge & image */}
        <div className="flex items-center justify-between">
          <SkeletonBlock className="h-4 w-20 rounded-full" />
          <SkeletonBlock className="h-4 w-12 rounded-full" />
        </div>
        <div className="w-full h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        {/* Title & Brand */}
        <SkeletonBlock className="h-3 w-20" />
        <SkeletonBlock className="h-5 w-full" />
        <SkeletonBlock className="h-5 w-2/3" />
      </div>

      {/* Footer Price & CTA */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        <div className="space-y-1">
          <SkeletonBlock className="h-3 w-12" />
          <SkeletonBlock className="h-6 w-20" />
        </div>
        <SkeletonBlock className="h-9 w-28 rounded-xl" />
      </div>
    </div>
  );
};

// Full Product Catalog Skeleton Page
export const ProductCatalogSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* Header Banner Skeleton */}
      <div className="bg-gradient-to-r from-[#EAF2FF] via-white to-[#FFF3E6] py-12 px-4 border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto space-y-3">
          <SkeletonBlock className="h-9 w-80 bg-blue-100" />
          <SkeletonBlock className="h-4 w-full max-w-xl bg-blue-50" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Filters Skeleton */}
        <div className="lg:col-span-3 space-y-6">
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <SkeletonBlock className="h-5 w-36" />
            <div className="space-y-2">
              <SkeletonBlock className="h-3 w-24" />
              <SkeletonBlock className="h-9 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="h-9 w-full rounded-xl" />
            </div>
            <div className="space-y-3 pt-2">
              <SkeletonBlock className="h-4 w-44" />
              <SkeletonBlock className="h-4 w-36" />
            </div>
          </div>
        </div>

        {/* Catalog Main Content Skeleton */}
        <div className="lg:col-span-9 space-y-6">
          {/* Controls Bar Skeleton */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
            <SkeletonBlock className="h-4 w-32" />
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-8 w-36 rounded-xl" />
              <SkeletonBlock className="h-8 w-16 rounded-xl" />
            </div>
          </div>

          {/* Cards Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} viewMode="grid" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Full Product Detail Skeleton Page
export const ProductDetailSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-4 w-20" />
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <SkeletonBlock className="h-4 w-28" />
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <SkeletonBlock className="h-4 w-40" />
        </div>

        {/* Hero Product Overview Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          {/* Left Column: Image Gallery Placeholder */}
          <div className="lg:col-span-6 space-y-4">
            {/* Main Image */}
            <div className="w-full h-80 sm:h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
            {/* Thumbnails strip */}
            <div className="flex gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonBlock key={i} className="w-20 h-20 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Right Column: Product Meta & Buying Actions */}
          <div className="lg:col-span-6 space-y-5">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-6 w-24 rounded-full" />
              <SkeletonBlock className="h-6 w-28 rounded-full" />
            </div>

            <SkeletonBlock className="h-9 w-4/5" />
            <SkeletonBlock className="h-9 w-2/3" />

            <div className="flex items-center gap-4 py-1">
              <SkeletonBlock className="h-5 w-32" />
              <SkeletonBlock className="h-5 w-24" />
            </div>

            <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
              <SkeletonBlock className="h-4 w-20" />
              <SkeletonBlock className="h-8 w-36" />
              <SkeletonBlock className="h-3 w-48" />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <SkeletonBlock className="h-12 w-full rounded-2xl" />
              <div className="grid grid-cols-2 gap-3">
                <SkeletonBlock className="h-10 w-full rounded-xl" />
                <SkeletonBlock className="h-10 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Bar Placeholder */}
        <div className="flex gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <SkeletonBlock className="h-10 w-32 rounded-xl" />
          <SkeletonBlock className="h-10 w-32 rounded-xl" />
          <SkeletonBlock className="h-10 w-32 rounded-xl" />
          <SkeletonBlock className="h-10 w-32 rounded-xl" />
        </div>

        {/* Tab Content Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <SkeletonBlock className="h-6 w-48" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-5/6" />
            <SkeletonBlock className="h-4 w-4/6" />
          </div>
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <SkeletonBlock className="h-6 w-36" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
