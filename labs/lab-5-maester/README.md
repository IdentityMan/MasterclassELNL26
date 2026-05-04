# Microsoft Identity Masterclass at Experts Live Netherlands 2026 - Maester

Welcome to the Maester workshop of this masterclass! If you want to have another look at the slides, you can check out the [PowerPoint](./experts_live_masterclass_identity_Maester.pptx) or the [PDF](./experts_live_masterclass_identity_Maester.pdf) version here.

Feel free to ask questions, or connect with [Stephan](https://linkedin.com/in/stephanvanrooij) during the event or on LinkedIn.

## Goals

1. Install Maester
2. Install built-in tests
3. Run Maester against your **test** tenant
4. View the report
5. Fix one of the issues 😉
6. (optionally) Automatically run Maester on GitHub Actions
7. (optionally) Publish Maester report to Azure Static Web Apps

## Pre-requisites

1. Windows laptop or Mac
2. Microsoft Tenant
3. Account with enough permissions to grant apps
4. PowerShell >= 7.5 (can be installed on a mac)

<details>

<summary>optional pre-requisites:</summary>

5. Visual Studio Code, because it is the best editor for PowerShell files.
6. GitHub Account (to run Maester automatically)
7. Azure Subscription (to create an Azure Static Web App)

</details>

## Commands

Throughout this workshop you will see a lot of code blocks like this one. In the browser they should show a copy button which will allow pasting the code into your own terminal.

```ps
Invoke-Maester
```

## Maester workshop

1. [**Setup Maester**](./step-1-setup.md)
1. [**Run Maester**](./step-2-running-maester.md)
1. [Exploring tests](./step-3-exploring-tests.md) (optional, test reference)
1. [Custom tests](./step-4-custom-test.md) (optional)
