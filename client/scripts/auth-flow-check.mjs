import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

async function getSettings() {
  const response = await fetch(`${url}/auth/v1/settings`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  if (!response.ok) {
    throw new Error(`settings failed: ${response.status}`);
  }
  return response.json();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

console.log('Checking Supabase auth settings...');
let settings = await getSettings();
console.log('mailer_autoconfirm=', settings.mailer_autoconfirm);

if (!settings.mailer_autoconfirm) {
  console.log(
    'Waiting up to 3 minutes for Confirm email to be disabled (mailer_autoconfirm=true)...',
  );
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline && !settings.mailer_autoconfirm) {
    await sleep(10_000);
    settings = await getSettings();
    console.log('mailer_autoconfirm=', settings.mailer_autoconfirm);
  }
}

if (!settings.mailer_autoconfirm) {
  console.error(
    [
      'BLOCKED: Email confirmation is still enabled in Supabase.',
      'In the Supabase dashboard go to:',
      '  Authentication → Providers → Email → turn OFF “Confirm email” → Save',
      'Then re-run this script.',
    ].join('\n'),
  );
  process.exit(10);
}

const sb = createClient(url, key);
const stamp = Date.now();
const email = `gji.auth.${stamp}@mailinator.com`;
const password = `TestPass${stamp}a1`;

console.log('1) signup', email);
const signUp = await sb.auth.signUp({
  email,
  password,
  options: {
    data: { full_name: 'GJI Auth Tester', role: 'applicant' },
  },
});

if (signUp.error) {
  console.error('SIGNUP_FAIL', signUp.error.message);
  process.exit(1);
}

console.log('signup_ok', {
  user: signUp.data.user?.id,
  session: Boolean(signUp.data.session),
  confirmed: signUp.data.user?.email_confirmed_at ?? null,
});

if (!signUp.data.session) {
  console.error('SIGNUP_FAIL expected a session when mailer_autoconfirm=true');
  process.exit(1);
}

console.log('2) logout after signup');
let signOut = await sb.auth.signOut();
if (signOut.error) {
  console.error('LOGOUT_FAIL', signOut.error.message);
  process.exit(3);
}
console.log('logout_ok');

console.log('3) login');
const signIn = await sb.auth.signInWithPassword({ email, password });
if (signIn.error) {
  console.error('LOGIN_FAIL', signIn.error.message);
  process.exit(2);
}
console.log('login_ok', signIn.data.user?.email);

console.log('4) logout');
signOut = await sb.auth.signOut();
if (signOut.error) {
  console.error('LOGOUT_FAIL', signOut.error.message);
  process.exit(3);
}
console.log('logout_ok');
console.log('ALL_AUTH_FLOWS_PASSED');
