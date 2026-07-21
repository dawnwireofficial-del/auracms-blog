import { dbInstance } from './db';

export async function processScheduledPosts(): Promise<{ published: number; errors: number }> {
  try {
    const posts = await dbInstance.getPosts() as any[];
    const now = new Date().toISOString();
    const due = posts.filter(
      (p: any) => p.status === 'scheduled' && p.scheduledAt && p.scheduledAt <= now
    );

    let published = 0;
    let errors = 0;

    for (const post of due) {
      try {
        await dbInstance.updatePost(post.id, {
          status: 'published',
          publishedAt: now,
          updatedAt: now,
        });
        published++;
      } catch {
        errors++;
      }
    }

    return { published, errors };
  } catch {
    return { published: 0, errors: 0 };
  }
}
