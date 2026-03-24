import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://pipkhcgizgrfxnwuiqin.supabase.co';
const ANON_KEY = __ENV.SUPABASE_ANON_KEY || '';

export default function () {
  // Test: Read campaigns
  const res = http.get(`${SUPABASE_URL}/rest/v1/cc_campaigns?select=id,name&limit=10`, {
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
