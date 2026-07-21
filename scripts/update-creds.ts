import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nzghdxvbrndzkkoqdlqw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56Z2hkeHZicm5kemtrb3FkbHF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjc0Mzg4NiwiZXhwIjoyMDk4MzE5ODg2fQ.SlKJ1Oq38f6rZaEhexXqETi4Cuq3awK-tBiHlsDAE4c';

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function tryListUsers() {
  try {
    const { data, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 100 });
    if (error) {
      console.error('listUsers error:', JSON.stringify(error));
      return null;
    }
    return data?.users || null;
  } catch (e: any) {
    console.error('listUsers exception:', e.message);
    return null;
  }
}

async function main() {
  const email = 'atif@dawnwire.com';
  const password = 'Atif@123';
  const name = 'Atif Nadeem';

  // Strategy: update the existing known admin user (af59e58d) email+password
  const adminUserId = 'af59e58d-96ca-4159-b6ad-b87831087892';
  
  console.log(`Updating admin user ${adminUserId} to email=${email} password=${password}`);
  
  // Update the auth user email + password
  const { error: updateErr } = await sb.auth.admin.updateUserById(adminUserId, {
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  
  if (updateErr) {
    console.error('Update user error:', updateErr.message);
    
    // If email already exists, we need to delete the conflicting user first
    // Try to delete by creating a new email first
    if (updateErr.message.includes('already been registered') || updateErr.message.includes('already exists')) {
      console.log('Email already taken. Trying to delete old admin user and recreate...');
      
      // Delete old admin profile from public.users first
      await sb.from('users').delete().eq('id', adminUserId);
      console.log('Deleted old public.users profile');
      
      // Try to update just the password (keep old email)
      const { error: pwErr } = await sb.auth.admin.updateUserById(adminUserId, {
        password,
        email_confirm: true,
      });
      if (pwErr) {
        console.error('Password update error:', pwErr.message);
        return;
      }
      console.log('Password updated on old admin user');
      
      // Create public.users for the old admin user
      await sb.from('users').insert({
        id: adminUserId,
        name,
        email: 'admin@dawnwire.com',
        role: 'super_admin',
        status: 'active',
        created_at: new Date().toISOString(),
      });
      console.log('Created public.users profile for admin@dawnwire.com');
      console.log('Done! User can sign in with admin@dawnwire.com / Atif@123');
      console.log('Then we need to update ADMIN_EMAIL to admin@dawnwire.com');
    }
    return;
  }
  
  console.log('User updated successfully!');
  
  // Update public.users
  const { data: existing } = await sb.from('users').select('id').eq('email', email).single();
  
  if (existing) {
    await sb.from('users').update({
      name,
      role: 'super_admin',
      status: 'active',
    }).eq('email', email);
    console.log('Updated public.users profile');
  } else {
    await sb.from('users').insert({
      id: adminUserId,
      name,
      email,
      role: 'super_admin',
      status: 'active',
      created_at: new Date().toISOString(),
    });
    console.log('Created public.users profile');
  }
  
  console.log('Done!');
}

main().catch(console.error);
