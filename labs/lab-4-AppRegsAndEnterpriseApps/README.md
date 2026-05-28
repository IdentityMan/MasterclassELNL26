# Lab: App Registrations and Enterprise Applications in Microsoft Entra ID

**Identity Master Class — Experts Live Netherlands 2026**

---

## Overview

In this lab you will register a multi-tenant application in your own Entra ID tenant, configure the required API permissions, and use a hosted demo application to observe exactly what happens in your tenant when a user authenticates through an external application.

By completing this lab you will have practical experience with:

- Creating and configuring an App Registration
- Understanding the relationship between an App Registration and an Enterprise Application (Service Principal)
- Observing multi-tenant consent behaviour
- Reading ID token claims and understanding what they represent
- Calling the Microsoft Graph API with delegated permissions

---

## Prerequisites

Before starting this lab, ensure your environment meets the following requirements.

**Tenant requirements**

A standard Entra ID Free tenant is sufficient to complete all steps.

**Role requirements**

You need one of the following roles in your tenant:

| Task | Minimum required role |
|---|---|
| Create an App Registration | Application Developer or Application Administrator |
| Grant admin consent | Privileged Roles Administrator or Global Administrator |
| View Enterprise Applications | Cloud Application Administrator (read) |

If you are using your own lab or demo tenant, Global Administrator is recommended for the full experience.

**Browser**

Use a modern browser (Edge or Chrome). Open a private/incognito window for any cross-tenant sign-in steps to avoid session conflicts with your primary account.

---

## Architecture Overview

The following diagram shows what you will build and observe in this lab.

```
Your Tenant                          Identity Provider
┌─────────────────────────┐          ┌────────────────────────────┐
│                         │          │                            │
│  App Registration       │          │  login.microsoftonline.com │
│  ┌───────────────────┐  │          │  /common endpoint          │
│  │ Client ID         │──┼──────────┼──────────────────────────► │
│  │ Redirect URI      │  │  Auth    │                            │
│  │ API Permissions   │  │  Request │                            │
│  └───────────────────┘  │          └────────────────────────────┘
│          │              │
│          │ creates      │          Demo Application (GitHub Pages)
│          ▼              │          ┌────────────────────────────┐
│  Enterprise Application │          │                            │
│  (Service Principal)    │          │  nextxpert.github.io/      │
│  ┌───────────────────┐  │          │  entra-demo-app-1          │
│  │ Object ID         │  │◄─────────┤                            │
│  │ Consent state     │  │  Token   │  MSAL.js SPA               │
│  │ Permissions       │  │  Return  │  Auth Code Flow + PKCE     │
│  └───────────────────┘  │          │                            │
│                         │          └────────────────────────────┘
└─────────────────────────┘
```

**Key concept:** An App Registration is a definition — it describes the application and lives in the tenant where it was registered (the home tenant). An Enterprise Application (Service Principal) is an instance of that application in a specific tenant. Every tenant that consents to an application gets its own Enterprise Application. In this lab, you create your own App Registration and then observe both objects.

---

## Part 1 — Create the App Registration

### Step 1.1 — Open App Registrations

1. Navigate to [https://entra.microsoft.com](https://entra.microsoft.com)
2. Sign in with an account that has the Application Developer or Application Administrator role
3. In the left navigation, go to **Identity** → **Applications** → **App registrations**
4. Click **+ New registration**

### Step 1.2 — Configure the registration

Fill in the registration form as follows:

| Field | Value |
|---|---|
| Name | `Entra Demo App — [your name]` |
| Supported account types | **Accounts in any organizational directory (Multitenant)** |
| Redirect URI (platform) | Single-page application (SPA) |
| Redirect URI (value) | `https://nextxpert.github.io/entra-demo-app-1/` |

> **Why multitenant?** Selecting "Accounts in any organizational directory" sets the `signInAudience` property in the app manifest to `AzureADMultipleOrgs`. This allows users from any Entra ID tenant to sign in, not just users from your own tenant. You will observe the effect of this in Part 3.

Click **Register**.

### Step 1.3 — Note the identifiers

After registration, you land on the Overview page. Note the following values — you will need them in later steps and they are useful reference points during the lab:

| Property | Where to find it | What it represents |
|---|---|---|
| Application (client) ID | Overview page | Uniquely identifies the app across all of Azure AD / Entra ID |
| Directory (tenant) ID | Overview page | The tenant where this App Registration lives (your home tenant) |
| Object ID | Overview page | The object ID of the App Registration itself |

---

## Part 2 — Configure API Permissions

### Step 2.1 — Review default permissions

1. In the left menu of your App Registration, click **API permissions**
2. You will see one permission already present: `Microsoft Graph` → `User.Read` (Delegated)

This permission was added automatically. It allows the application to read the profile of the signed-in user. The demo application uses this permission to call the `/me` endpoint on Microsoft Graph.

### Step 2.2 — Verify required permissions

The demo application requires the following delegated permissions on Microsoft Graph:

| Permission | Type | Purpose |
|---|---|---|
| `openid` | Delegated | Required for sign-in; returns an ID token |
| `profile` | Delegated | Allows reading basic profile claims in the ID token |
| `email` | Delegated | Includes the email address claim in the ID token |
| `User.Read` | Delegated | Allows calling `/me` on Microsoft Graph |

The `openid`, `profile`, and `email` permissions are OpenID Connect scopes. They are requested by the application at sign-in time but do not need to be explicitly added in the portal — they are implicit when using the `/common` endpoint with MSAL.js. `User.Read` should already be present.

If `User.Read` is missing, click **+ Add a permission** → **Microsoft Graph** → **Delegated permissions** → search for `User.Read` → **Add permissions**.

### Step 2.3 — Grant admin consent (optional)

If users in your tenant should not see a consent prompt when signing in, you can pre-approve the permissions on their behalf:

1. Click **Grant admin consent for [your tenant name]**
2. Confirm by clicking **Yes**
3. The status column changes to a green checkmark: **Granted for [tenant name]**

> **Note:** If you skip this step, each user will see a consent prompt on their first sign-in. This is expected behaviour and Part 3 of this lab uses the consent prompt intentionally to demonstrate the Enterprise Application creation process.

---

## Part 3 — Observe the Enterprise Application

### Step 3.1 — Locate the Enterprise Application in your tenant

When you created the App Registration, Entra ID automatically created a corresponding Enterprise Application (Service Principal) in your tenant.

1. In the left navigation, go to **Identity** → **Applications** → **Enterprise applications**
2. Search for the name you used in Step 1.2: `Entra Demo App — [your name]`
3. Click on the result

### Step 3.2 — Compare App Registration and Enterprise Application

Open the App Registration and the Enterprise Application side by side (use two browser tabs) and compare the following properties:

| Property | App Registration | Enterprise Application |
|---|---|---|
| Application ID | Present | Present (same value) |
| Object ID | Present | Present (different value) |
| Home tenant | Your tenant | Your tenant |
| Manifest | Full configuration | Limited — only instance properties |
| API permissions | Defined here | Shown here (inherited) |
| Users and groups | Not applicable | Assigned here |
| Sign-in logs | Not applicable | Shown here |

> **Key observation:** The Application ID is the same in both objects — it identifies the application. The Object ID is different — it identifies each object individually within the directory.

### Step 3.3 — Examine the Enterprise Application properties

In the Enterprise Application, explore the following sections:

**Overview**
- Note the **Homepage URL** is empty (the demo app does not declare one)
- Note the **Object ID** — this is the Service Principal object ID, distinct from the App Registration Object ID

**Users and groups**
- Currently empty, as no assignment has been made
- Assignment is only relevant if the application requires user assignment (`appRoleAssignmentRequired`)

**Permissions**
- Shows the delegated permissions that have been consented to
- If you granted admin consent in Step 2.3, the permissions are listed here with the admin consent indicator

**Sign-in logs**
- This section will populate after Part 4 when you sign in through the demo application

---

## Part 4 — Test the Application

### Step 4.1 — Open the demo application

Navigate to: **https://nextxpert.github.io/entra-demo-app-1/**

The application is a hosted single-page application that uses MSAL.js to authenticate against Microsoft Entra ID.

> **Important:** This is a shared demo application. It has its own App Registration in the presenter's tenant (nextxpert.onmicrosoft.com). When you sign in, you are authenticating *to that App Registration* from *your tenant*. You will observe how the `/common` endpoint enables this cross-tenant authentication. In a later optional exercise you will point the app to your own App Registration instead.

### Step 4.2 — Sign in and observe the consent prompt

1. Click **Inloggen**
2. You are redirected to `login.microsoftonline.com/common` — note the `/common` endpoint in the URL. This is the multi-tenant endpoint.
3. Sign in with an account from **your own tenant**
4. If admin consent was not pre-granted for this application in your tenant, you will see a consent prompt

> **Observe the consent prompt carefully.** It shows:
> - The name of the application requesting access
> - The publisher tenant (nextxpert.onmicrosoft.com)
> - The specific permissions being requested
> - Whether you are consenting on behalf of your organisation or just yourself

5. Accept the consent prompt
6. You are redirected back to the application

### Step 4.3 — Read the ID token claims

After sign-in, the application displays the ID token claims. Examine the following claims:

| Claim | Name | What it contains |
|---|---|---|
| `iss` | Issuer | The URL of the token issuer. For multi-tenant apps this contains your tenant ID, not the app's home tenant |
| `tid` | Tenant ID | Your tenant ID — confirms the user signed in from your tenant |
| `oid` | Object ID | The unique object ID of the signed-in user within your tenant |
| `preferred_username` | UPN | The user's user principal name |
| `name` | Display name | The user's display name as stored in your tenant |
| `aud` | Audience | The Application (client) ID of the app — confirms which app the token was issued for |
| `ver` | Version | The token version (1.0 or 2.0) |

> **Key observation:** The `tid` claim contains *your* tenant ID, even though the App Registration lives in a different tenant. This is the fundamental mechanism that makes multi-tenant authentication work — the token always reflects the tenant of the authenticated user, not the tenant of the application.

### Step 4.4 — Read the Graph API response

Below the ID token claims, the application shows the response from `GET https://graph.microsoft.com/v1.0/me`. This call was made using an Access Token obtained with the `User.Read` scope.

Observe that the data returned (display name, UPN, object ID, mail) matches the claims in the ID token.

### Step 4.5 — Verify the Enterprise Application was created in your tenant

1. Return to the Entra portal
2. Go to **Identity** → **Applications** → **Enterprise applications**
3. Search for `Entra Demo App`

You should now see a second Enterprise Application — this one belongs to the *presenter's* App Registration but was instantiated in *your* tenant when you consented. This is the core mechanism of multi-tenant applications: one App Registration, many Service Principals across many tenants.

4. Open this Enterprise Application and inspect:
   - **Permissions** — shows the permissions you consented to
   - **Sign-in logs** — shows your sign-in event from Step 4.2

---

## Part 5 — Optional: Connect the Demo App to Your Own App Registration

In this optional exercise you will clone the demo application locally and configure it to use the App Registration you created in Part 1, rather than the presenter's registration. This demonstrates the full development cycle.

### Step 5.1 — Clone the repository

```bash
git clone https://github.com/nextxpert/entra-demo-app-1.git
cd entra-demo-app-1
npm install
```

### Step 5.2 — Update authConfig.js

Open `authConfig.js` in VSCode and replace the `clientId` value with the Application (client) ID from your App Registration (noted in Step 1.3):

```javascript
export const msalConfig = {
    auth: {
        clientId: "YOUR_APPLICATION_CLIENT_ID",
        authority: "https://login.microsoftonline.com/common",
        redirectUri: "http://localhost:3000"
    },
    ...
};
```

### Step 5.3 — Add localhost as a Redirect URI

1. Return to your App Registration in the Entra portal
2. Go to **Authentication**
3. Under **Single-page application**, click **Add URI**
4. Add: `http://localhost:3000`
5. Click **Save**

### Step 5.4 — Run locally and test

```bash
npm run dev
```

Navigate to `http://localhost:3000`. Sign in using an account from a **different tenant** than your own. Observe:

- The consent prompt now references *your* App Registration and *your* tenant as the publisher
- After consent, a new Enterprise Application for your App Registration appears in the other tenant
- The `tid` claim in the ID token contains the other tenant's tenant ID

---

## Summary

| Concept | What you observed |
|---|---|
| App Registration | A single object in your home tenant that defines the application's identity and permissions |
| Enterprise Application | Automatically created in every tenant that consents to the app — one per tenant |
| `/common` endpoint | Allows users from any Entra ID tenant to sign in to a multi-tenant app |
| Consent | The mechanism by which a user or admin authorises the app to access data in their tenant |
| ID token claims | Carry identity information; `tid` identifies the user's tenant, `aud` identifies the app |
| Access token | Used to call APIs (Graph); scoped to specific permissions consented by the user or admin |
| Multi-tenancy | One App Registration → many Service Principals across many tenants |

---

## References

- [Microsoft identity platform — App registration](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app)
- [Single-page application: Sign-in and Sign-out](https://learn.microsoft.com/en-us/entra/identity-platform/scenario-spa-sign-in)
- [Microsoft identity platform ID tokens](https://learn.microsoft.com/en-us/entra/identity-platform/id-tokens)
- [Multi-tenant application pattern](https://learn.microsoft.com/en-us/entra/identity-platform/howto-convert-app-to-be-multi-tenant)
- [Microsoft Graph — /me endpoint](https://learn.microsoft.com/en-us/graph/api/user-get)
