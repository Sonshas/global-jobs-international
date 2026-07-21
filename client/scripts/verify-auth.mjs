/**
 * Live Supabase auth smoke test.
 * Usage: node --env-file=client/.env client/scripts/verify-auth.mjs
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey || url.includes('your-project') || anonKey.includes('your-supabase')) {
  console.error('Missing real VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in client/.env');
  process.exit(1);
}

const supabase = createClient(url, anonKey);
const stamp = Date.now();
const email = `gji.applicant.${stamp}@example.com`;
const password = `TestPass${stamp}!`;
const fullName = 'GJI Test Applicant';

async function main() {
  console.log('1) Signing up', email);
  const signUp = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role: 'applicant' },
    },
  });

  if (signUp.error) {
    throw new Error(`signUp failed: ${signUp.error.message}`);
  }

  console.log(
    '   signup ok · session=',
    Boolean(signUp.data.session),
    '· user=',
    signUp.data.user?.id,
  );

  if (signUp.data.session) {
    console.log('2) Email confirm appears disabled — signing out then signing in');
    await supabase.auth.signOut();
    const signIn = await supabase.auth.signInWithPassword({ email, password });
    if (signIn.error) throw new Error(`signIn failed: ${signIn.error.message}`);
    console.log('   signIn ok · user=', signIn.data.user?.email);
    await supabase.auth.signOut();
  } else {
    console.log(
      '2) Email confirmation required — login before verify should fail with email-not-confirmed (or similar)',
    );
    const signIn = await supabase.auth.signInWithPassword({ email, password });
    if (!signIn.error) {
      console.log('   unexpected: login succeeded without confirmation');
    } else {
      console.log('   expected login block:', signIn.error.message);
    }
  }

  console.log('Auth smoke test completed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
