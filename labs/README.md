# Lab Instructions - Identity Master Class

Read these instructions to prepare for the Identity Master Class at Experts Live Netherlands 2026.

## Bring Your Own Tenant

We won't be able to give the attendees tenants or give the attendees access to the speaker’s own demo tenants at this scale, so to be able to do the hands-on labs you need to bring your own tenant.

There are several options for bringing your own tenant, these are the most common ones:

**- Own Company Dev/Test environments** - If you are part of a Company or Organization and have a work account, you can use that as a starting point for your own lab environment. We do not recommend using your production tenant for following the labs, so you should either have access to a test/dev/demo tenant or have the opportunity to create another tenant. To create another tenant using your work account, [follow the instructions here](https://learn.microsoft.com/nb-no/entra/fundamentals/create-new-tenant). You will need to be assigned the role of Tenant Creator to create a new tenant, or work with your Global Administrator to do this.
**- Microsoft Demo eXperiences** - If you are a Microsoft Partner enrolled in the Partner Network or an Microsoft Employee, you can use the [Microsoft Demo exPeriences](https://cdx.transform.microsoft.com/) portal to create a tenant using the "Microsoft 365 Enterprise Demo Content Pack". Partner users can only have one tenant simultaneously, so you might have to delete any existing expired tenants before you can create a new one.
**- Microsoft 365 Developer Program Subscription** - If you are eligible you can sign up for the [Microsoft 365 Developer Program](https://learn.microsoft.com/en-us/office/developer-program/microsoft-365-developer-program), and create a Microsoft 365 E5 Developer Subscription. To see eligible programs like "Microsoft AI Cloud Partner Program Participants", "Visual Studio Subscribers" etc, [look here](https://learn.microsoft.com/en-us/office/developer-program/microsoft-365-developer-program). When you sign up you can get the option to create a tenant for the Microsoft 365 E5 Developer Sandbox Subscription.
**- Create a Trial Subscription** - If the above options don't work, you can create a Trial Subscription. These options are free for the trial period, but must be guaranteed by a credit card as the services are converted to Pay as you go after trial period ends.
You can sign up for an [Azure free account](https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account) (one time only) or a Pay as you go account. Both options include a lot of free services, and the one-time Azure free account also include $200 in credit for the first month.


## What additional licenses and software do you need?

As the Identity Master Class of course focuses on Microsoft Entra, you will need licenses in addition to Entra Free to follow the lab instructions yourself. The full list of requirements including all licenses is listed below:

•	[Microsoft 365 E3](https://www.microsoft.com/en-us/microsoft-365/enterprise/e3) (if you don’t have this in your tenant you can use the trail license.
•	[Entra Suite Trail](https://entra.microsoft.com/#view/Microsoft_AAD_IAM/TryBuyProductBlade/) (if this is not available, please make sure to at least have [Entra ID Premium P2](https://entra.microsoft.com/#view/Microsoft_AAD_IAM/TryBuyProductBlade/) as trail and [Entra ID Governance](https://www.microsoft.com/en-us/security/business/identity-access/microsoft-entra-id-governance) as trail).
•	Azure Subscription (to run some low code custom extensions, so costs will be very low).
•	CloudFlare Free Plan ([Free Plan Overview | Cloudflare](https://www.cloudflare.com/plans/free/))
•	Laptop with modern browser
o	Optional: Cookie editor extension ([Cookie-Editor - A safe cookie editor for Chrome, Firefox, Safari, Edge and Opera](https://cookie-editor.com/))
•	Powershell 7.5 or higher (and make sure that you can run PowerShell on your machine).
•	(Disposable) Microsoft 365 test account (for phishing lab)
•	Visual Studio Code, because it is the best editor for PowerShell files (optional)
•	GitHub Account (to run Maester automatically) (optional)

## What Privilege do I need?

While we will for each lab instruction provide details on a least-privilege role permission for the task, but you can expect that some tasks will require up to Global Administrator in the Demo Tenant, or at least access to a person that is GA and can do the task for you. Typically, these are Admin Consents and like. We strongly recommend using a member account in the test or lab tenant for testing scenarios to avoid the limitations of B2B users and reduces complexity by potential cross-tenant scenarios.

## What if you cannot bring your own tenant to the Identity Master Class?

You will be able to bring the labs home and do them later. We will strongly encourage attendees to work together with your side-person on the day, so that you can collaborate on the labs if you don't have access yourself