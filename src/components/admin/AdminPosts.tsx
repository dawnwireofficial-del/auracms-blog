import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Edit2, Trash2, Image as ImageIcon, X } from 'lucide-react';
import { Post, Category } from '../../types';
import SeoScoreChecker from '../SeoScoreChecker';
import InternalLinkSuggestions from '../InternalLinkSuggestions';
import AutoAffiliateLinker from '../AutoAffiliateLinker';
import SeoAssistant from '../SeoAssistant';

interface AdminPostsProps {
  token: string;
  categories: Category[];
  onRefresh: () => void;
  posts: Post[];
  setPosts: (posts: Post[]) => void;
}

const makeSlug = (text: string) => {
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default function AdminPosts({ token, categories, onRefresh, posts, setPosts }: AdminPostsProps) {
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postSlug, setPostSlug] = useState('');
  const [postExcerpt, setPostExcerpt] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState('');
  const [postCategory, setPostCategory] = useState('');
  const [postTagsString, setPostTagsString] = useState('');
  const [postStatus, setPostStatus] = useState<'draft' | 'pending' | 'published' | 'scheduled'>('draft');
  const [postScheduledAt, setPostScheduledAt] = useState('');
  const [postLanguage, setPostLanguage] = useState('en');
  const [postVisibility, setPostVisibility] = useState<'public' | 'private'>('public');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [isEditorsPick, setIsEditorsPick] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');

  const handleOpenCreatePost = () => {
    setEditingPost(null);
    setPostTitle('');
    setPostSlug('');
    setPostExcerpt('');
    setPostContent('');
    setPostImage('');
    setPostCategory(categories[0]?.id || '');
    setPostTagsString('');
    setPostStatus('draft');
    setPostScheduledAt('');
    setPostLanguage('en');
    setPostVisibility('public');
    setIsFeatured(false);
    setIsTrending(false);
    setIsEditorsPick(false);
    setAllowComments(true);
    setSeoTitle('');
    setSeoDescription('');
    setSeoKeywords('');
    setIsCreatingPost(true);
  };

  const handleOpenEditPost = (post: Post) => {
    setEditingPost(post);
    setPostTitle(post.title);
    setPostSlug(post.slug);
    setPostExcerpt(post.excerpt);
    setPostContent(post.content);
    setPostImage(post.featuredImage || '');
    setPostCategory(post.categoryId);
    setPostTagsString(post.tags.join(', '));
    setPostStatus(post.status === 'draft' ? 'draft' : post.status === 'scheduled' ? 'scheduled' : 'published');
    setPostScheduledAt(post.scheduledAt || '');
    setPostLanguage(post.language || 'en');
    setPostVisibility(post.visibility);
    setIsFeatured(post.isFeatured);
    setIsTrending(post.isTrending);
    setIsEditorsPick(post.isEditorsPick);
    setAllowComments(post.allowComments);
    setSeoTitle(post.seoTitle || '');
    setSeoDescription(post.seoDescription || '');
    setSeoKeywords(post.seoKeywords || '');
    setIsCreatingPost(true);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle || !postSlug || !postContent) {
      alert('Title, slug, and content are required.');
      return;
    }

    const payload = {
      title: postTitle,
      slug: postSlug,
      excerpt: postExcerpt,
      content: postContent,
      featuredImage: postImage,
      categoryId: postCategory,
      tags: postTagsString.split(',').map(t => t.trim()).filter(Boolean),
      status: postStatus,
      scheduledAt: postStatus === 'scheduled' ? postScheduledAt : null,
      language: postLanguage,
      visibility: postVisibility,
      isFeatured,
      isTrending,
      isEditorsPick,
      allowComments,
      seoTitle,
      seoDescription,
      seoKeywords
    };

    const url = editingPost ? `/api/admin/posts/${editingPost.id}` : '/api/admin/posts';
    const method = editingPost ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setIsCreatingPost(false);
        setEditingPost(null);
        onRefresh();
      } else {
        alert(data.error || 'Failed to save post.');
      }
    } catch (e: any) {
      alert(e.message || 'Error occurred while publishing.');
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this post and its comments?')) return;
    try {
      const res = await fetch(`/api/admin/posts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        onRefresh();
      } else {
        alert('Failed to delete.');
      }
    } catch (e) {
      alert('Error occurred.');
    }
  };

  return (
    <div id="admin-workspace-posts">
      {isCreatingPost ? (
        <form onSubmit={handleSavePost} className="bg-white dark:bg-zinc-800/50 rounded-2xl br-card border border-slate-100 dark:border-zinc-700/50 shadow-sm p-6 space-y-6" id="post-editor-form">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-700/50 pb-4">
            <h3 className="font-display font-bold text-slate-800 dark:text-zinc-100 text-sm">
              {editingPost ? 'Edit Blog Article' : 'Write New Blog Article'}
            </h3>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsCreatingPost(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 dark:text-zinc-300 text-xs font-semibold px-4 py-2 rounded-xl br-btn transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#246BFF] hover:bg-[#1A5AD6] text-white text-xs font-semibold px-4 py-2 rounded-xl br-btn transition-all shadow-sm"
                id="save-post-submit"
              >
                {editingPost ? 'Save Updates' : 'Publish Article'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Post Title</label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => {
                    setPostTitle(e.target.value);
                    if (!editingPost) setPostSlug(makeSlug(e.target.value));
                  }}
                  placeholder="e.g. Master React in 2026: Hands-On Guide"
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] br-input"
                  id="form-post-title"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Slug URL Path</label>
                  <input
                    type="text"
                    value={postSlug}
                    onChange={(e) => setPostSlug(makeSlug(e.target.value))}
                    placeholder="master-react-2026"
                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] br-input font-mono"
                    id="form-post-slug"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Category</label>
                  <select
                    value={postCategory}
                    onChange={(e) => setPostCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] br-input bg-white dark:bg-zinc-800/50"
                    id="form-post-category"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Excerpt Summary</label>
                <textarea
                  value={postExcerpt}
                  onChange={(e) => setPostExcerpt(e.target.value)}
                  placeholder="Provide a highly clickable search excerpt description..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] br-input"
                  id="form-post-excerpt"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Article Body Content (Markdown format)</label>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Write your article in markdown here..."
                  rows={14}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] br-input font-mono"
                  id="form-post-content"
                  required
                />
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">
                  Tip: Render affiliate cards in your markdown using the shortcode: <code>[affiliate-card:slug]</code>
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-zinc-900 p-5 rounded-xl border border-slate-100 dark:border-zinc-700/50 space-y-4">
                <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-200 border-b border-slate-200 dark:border-zinc-700 pb-2">Publication State</h4>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-2">Status</label>
                  <select
                    value={postStatus}
                    onChange={(e: any) => setPostStatus(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs bg-white dark:bg-zinc-800/50 focus:outline-none br-input"
                    id="form-post-status"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>

                {postStatus === 'scheduled' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-2">Schedule Publish Date</label>
                    <input
                      type="datetime-local"
                      value={postScheduledAt ? (() => { try { return new Date(postScheduledAt).toISOString().slice(0, 16); } catch { return ''; } })() : ''}
                      onChange={(e) => { try { setPostScheduledAt(new Date(e.target.value).toISOString()); } catch { setPostScheduledAt(''); } }}
                      className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs bg-white dark:bg-zinc-800/50 focus:outline-none br-input"
                      id="form-post-scheduled"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-2">Visibility</label>
                  <select
                    value={postVisibility}
                    onChange={(e: any) => setPostVisibility(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs bg-white dark:bg-zinc-800/50 focus:outline-none br-input"
                    id="form-post-visibility"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-300 font-medium">
                    <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="rounded text-[#246BFF]" />
                    Featured Post (Hero)
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-300 font-medium">
                    <input type="checkbox" checked={isTrending} onChange={(e) => setIsTrending(e.target.checked)} className="rounded text-[#246BFF]" />
                    Trending Post
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-300 font-medium">
                    <input type="checkbox" checked={isEditorsPick} onChange={(e) => setIsEditorsPick(e.target.checked)} className="rounded text-[#246BFF]" />
                    Editor's Choice Pick
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-300 font-medium">
                    <input type="checkbox" checked={allowComments} onChange={(e) => setAllowComments(e.target.checked)} className="rounded text-[#246BFF]" />
                    Enable Comments
                  </label>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-zinc-900 p-5 rounded-xl border border-slate-100 dark:border-zinc-700/50 space-y-4">
                <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-200 border-b border-slate-200 dark:border-zinc-700 pb-2">Image & Tags</h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-2">Featured Image URL</label>
                  <input
                    type="text"
                    value={postImage}
                    onChange={(e) => setPostImage(e.target.value)}
                    placeholder="https://picsum.photos/800/400"
                    className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs focus:outline-none bg-white dark:bg-zinc-800/50 br-input"
                    id="form-post-image"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={postTagsString}
                    onChange={(e) => setPostTagsString(e.target.value)}
                    placeholder="ai, gear, software"
                    className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs focus:outline-none bg-white dark:bg-zinc-800/50 font-mono br-input"
                    id="form-post-tags"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-2">Language</label>
                  <select
                    value={postLanguage}
                    onChange={(e) => setPostLanguage(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs bg-white dark:bg-zinc-800/50 focus:outline-none br-input"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="pt">Português</option>
                    <option value="it">Italiano</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-zinc-900 p-5 rounded-xl border border-slate-100 dark:border-zinc-700/50 space-y-4">
                <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-200 border-b border-slate-200 dark:border-zinc-700 pb-2">SEO & Metadata</h4>

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-2">Focus Keyword</label>
                    <input
                      type="text"
                      value={seoKeywords}
                      onChange={(e) => setSeoKeywords(e.target.value)}
                      placeholder="e.g. affiliate marketing, AI tools"
                      className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs focus:outline-none bg-white dark:bg-zinc-800/50 br-input"
                      id="form-post-focuskw"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!seoTitle) setSeoTitle(postTitle.substring(0, 60));
                      if (!seoDescription && postExcerpt) setSeoDescription(postExcerpt.substring(0, 160));
                      else if (!seoDescription && postContent) setSeoDescription(postContent.replace(/[#*[\]]/g, '').trim().substring(0, 160));
                      if (!seoKeywords && postTagsString) setSeoKeywords(postTagsString.split(',').slice(0, 3).join(', '));
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:text-zinc-300 text-xs rounded-lg transition-all mb-0.5"
                    title="Auto-fill empty SEO fields from post content"
                  >
                    Auto-Generate
                  </button>
                </div>

                <SeoAssistant
                  token={token}
                  postTitle={postTitle}
                  postContent={postContent}
                  currentFocus={seoKeywords}
                  onApply={(s) => {
                    setSeoTitle(s.title);
                    setSeoDescription(s.metaDescription);
                    setSeoKeywords(s.focusKeyword);
                    setPostTagsString(s.tags.join(', '));
                    setPostSlug(s.slug);
                  }}
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-2">
                    Meta Title
                    <span className={`ml-2 font-normal ${seoTitle.length >= 30 && seoTitle.length <= 60 ? 'text-green-600' : seoTitle.length > 0 ? 'text-amber-600' : 'text-slate-400 dark:text-zinc-500'}`}>
                      ({seoTitle.length}/60)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    maxLength={70}
                    className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs focus:outline-none bg-white dark:bg-zinc-800/50 br-input"
                    id="form-post-seotitle"
                  />
                  {seoTitle.length > 0 && seoTitle.length < 30 && (
                    <p className="text-amber-600 text-[10px] mt-1">Recommended: at least 30 characters</p>
                  )}
                  {seoTitle.length > 60 && seoTitle.length <= 70 && (
                    <p className="text-amber-600 text-[10px] mt-1">Title may be truncated in search results (max 60 chars)</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-2">
                    Meta Description
                    <span className={`ml-2 font-normal ${seoDescription.length >= 120 && seoDescription.length <= 160 ? 'text-green-600' : seoDescription.length > 0 ? 'text-amber-600' : 'text-slate-400 dark:text-zinc-500'}`}>
                      ({seoDescription.length}/160)
                    </span>
                  </label>
                  <textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    rows={2}
                    maxLength={180}
                    className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs focus:outline-none bg-white dark:bg-zinc-800/50 br-input"
                    id="form-post-seodesc"
                  />
                  {seoDescription.length > 0 && seoDescription.length < 120 && (
                    <p className="text-amber-600 text-[10px] mt-1">Recommended: at least 120 characters</p>
                  )}
                  {seoDescription.length > 160 && (
                    <p className="text-amber-600 text-[10px] mt-1">Description may be truncated in search results (max 160 chars)</p>
                  )}
                </div>

                {(seoTitle || seoDescription) && (
                  <div className="bg-white dark:bg-zinc-800/50 rounded-lg border border-slate-200 dark:border-zinc-700 p-3 mt-2">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2">Search Result Preview</p>
                    <div className="font-sans">
                      <p className="text-[14px] text-[#1a0dab] hover:underline cursor-pointer leading-tight mb-0.5 font-medium">
                        {(seoTitle || postTitle || 'Post Title').substring(0, 60)}
                      </p>
                      <p className="text-[12px] text-[#006621] leading-tight mb-0.5">
                        dawnwire.com {'>'} {(postSlug || 'post-slug')}
                      </p>
                      <p className="text-[13px] text-[#545454] leading-normal">
                        {(seoDescription || postExcerpt || '').substring(0, 160)}
                      </p>
                    </div>
                  </div>
                )}

                {(seoTitle || seoDescription || seoKeywords || postContent) && (
                  <SeoScoreChecker
                    title={seoTitle || postTitle}
                    description={seoDescription}
                    focusKeyword={seoKeywords}
                    content={postContent}
                    slug={postSlug}
                  />
                )}

                {postContent && <InternalLinkSuggestions posts={posts} currentPostTitle={postTitle} currentPostContent={postContent} />}

                {postContent && editingPost && (
                  <AutoAffiliateLinker token={token} postId={editingPost.id} content={postContent} onContentUpdate={setPostContent} />
                )}
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="space-y-6" id="posts-list-tab">
          <div className="flex justify-between items-center">
            <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Manage, write, and audit published or drafted articles.</p>
            <button
              onClick={handleOpenCreatePost}
              className="bg-[#246BFF] hover:bg-[#1A5AD6] text-white text-xs font-semibold px-4 py-2.5 rounded-xl br-btn transition-all shadow-sm flex items-center gap-1.5"
              id="write-new-post-btn"
            >
              <Plus className="h-4 w-4" />
              Write Post
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-800/50 rounded-2xl br-card border border-slate-100 dark:border-zinc-700/50 shadow-sm overflow-hidden" id="posts-list-table">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-900 text-slate-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-zinc-700/50">
                  <th className="p-4 pl-6">Post Details</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 dark:text-zinc-500">No blog posts found. Write your first article today!</td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post.id} className="hover:bg-slate-50 dark:bg-zinc-900/50">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          {post.featuredImage ? (
                            <img
                              src={post.featuredImage}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="h-10 w-16 object-cover rounded-md bg-slate-100 shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-16 rounded-md bg-slate-100 shrink-0 flex items-center justify-center text-slate-300">
                              <ImageIcon className="h-4 w-4" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-800 dark:text-zinc-100 leading-tight line-clamp-1">{post.title}</p>
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono mt-0.5 block">{post.slug}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-600 dark:text-zinc-300 px-2 py-0.5 rounded text-[11px] font-medium">
                          {categories.find(c => c.id === post.categoryId)?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 dark:text-zinc-400">
                        {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditPost(post)}
                            title="Edit Post"
                            className="p-1.5 hover:bg-slate-100 rounded-lg br-btn text-slate-600 dark:text-zinc-300 hover:text-slate-900"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            title="Delete Post"
                            className="p-1.5 hover:bg-red-50 rounded-lg br-btn text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
