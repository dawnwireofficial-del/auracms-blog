// One-shot script: ensure an In-App Feed step exists on the price-drop and
// deal-alert workflows in Knock, for BOTH development and production
// environments, then commit. Requires KNOCK_SERVICE_TOKEN (management API).
//
// Usage:  $env:KNOCK_SERVICE_TOKEN="<service token>"; node knock-fix-workflows.mjs

const token = process.env.KNOCK_SERVICE_TOKEN;
if (!token) {
  console.error('ERROR: KNOCK_SERVICE_TOKEN not set.');
  process.exit(1);
}

const BASE = 'https://control.knock.app/v1';
const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
  'User-Agent': 'auracms-knock-fix/1.0',
};

const READ_ONLY = new Set([
  'sha', 'created_at', 'updated_at', 'valid', 'active', 'environment', 'deleted_at', 'version',
  'created_by', 'updated_by', 'trigger_frequency',
]);

async function api(method, path, query = {}, body) {
  const qs = new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined));
  const res = await fetch(`${BASE}${path}${qs.toString() ? `?${qs}` : ''}`, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = JSON.parse(await res.text()); } catch { data = null; }
  return { status: res.status, data };
}

function stripReadOnly(wf) {
  const out = {};
  for (const [k, v] of Object.entries(wf || {})) {
    if (!READ_ONLY.has(k)) out[k] = v;
  }
  return out;
}

function hasFeedStep(steps) {
  return (steps || []).some((s) => s && (s.channel_type === 'in_app_feed' || (s.template && s.template.type === 'in_app_feed')));
}

const workflows = {
  'price-drop': {
    name: 'Price Drop Alert',
    feedStep: {
      ref: 'feed',
      type: 'channel',
      channel_key: 'in-app',
      name: 'In-App Notification',
      template: {
        type: 'in_app_feed',
        markdown_body:
          "**{{ data.productName }}**{% if data.brand %} by {{ data.brand }}{% endif %} just dropped to **${{ data.newPrice }}**{% if data.savings > 0 %} — save ${{ data.savings }}{% endif %}{% if data.oldPrice > 0 %} (was ${{ data.oldPrice }}){% endif %}",
        action_url: '{{ data.productUrl }}',
      },
    },
  },
  'deal-alert': {
    name: 'Deal Alert',
    feedStep: {
      ref: 'feed',
      type: 'channel',
      channel_key: 'in-app',
      name: 'In-App Notification',
      template: {
        type: 'in_app_feed',
        markdown_body:
          "{% if data.event == 'back_in_stock' %}**{{ data.productName }}** is back in stock{% if data.price > 0 %} — ${{ data.price }}{% endif %}{% else %}Deal on **{{ data.productName }}**{% if data.discountPct > 0 %} — {{ data.discountPct }}% off{% endif %}{% if data.price > 0 %} — now ${{ data.price }}{% endif %}{% endif %}",
        action_url: '{{ data.productUrl }}',
      },
    },
  },
};

const environments = ['development', 'production'];

for (const env of environments) {
  for (const key of Object.keys(workflows)) {
    const { name, feedStep } = workflows[key];

    const get = await api('GET', `/workflows/${key}`, { environment: env });
    let wf;
    if (get.status === 200 && get.data && (get.data.workflow || get.data.key)) {
      wf = stripReadOnly(get.data.workflow || get.data);
      console.log(`[${env}/${key}] existing workflow found (steps=${(wf.steps || []).length})`);
    } else {
      wf = {
        key,
        name,
        settings: { override_preferences: true, is_commercial: true },
        steps: [],
      };
      console.log(`[${env}/${key}] no existing workflow — building fresh`);
    }

    if (hasFeedStep(wf.steps)) {
      console.log(`[${env}/${key}] already has an in_app_feed step — leaving as-is`);
      continue;
    }
    wf.steps = [...(wf.steps || []), feedStep];

    const put = await api('PUT', `/workflows/${key}`, {
      environment: env,
      commit: 'true',
      commit_message: 'Add In-App Feed step (automated)',
      force: 'true',
    }, { workflow: wf });

    if (put.status === 200 || put.status === 201) {
      const sha = put.data?.sha || put.data?.workflow?.sha || 'n/a';
      console.log(`[${env}/${key}] OK — committed (sha=${String(sha).slice(0, 8)})`);
    } else {
      console.log(`[${env}/${key}] FAILED (${put.status}):`, JSON.stringify(put.data).slice(0, 500));
    }
  }
}
console.log('Done.');
