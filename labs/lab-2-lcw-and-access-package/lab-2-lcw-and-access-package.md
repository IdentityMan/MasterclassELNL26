# Lab 2 - Lifecycle Workflows and Access Packages

The activities in this lab will all be executed within the [Lifecycle Workflows](https://entra.microsoft.com/#view/Microsoft_AAD_LifecycleManagement/CommonMenuBlade/~/overview) and [Entitlement Management](https://entra.microsoft.com/#view/Microsoft_AAD_ERM/DashboardBlade/~/GettingStarted) blade in Entra ID. For this you need at a bear minimum the 'Lifecycle Workflow Administrator' and 'Identity Governance Administrator' admin roles assigned. In Azure you need to have at least contributor permission to an Azure Subscription.

Within this lab you will create multiple Entra Lifecycle Workflows and an Access Package with a customer extenion which will create a separate privileged accounts based on your office account, and that request will (upon approval and successful delivery) provision a separate privileged account for the requestor. Important to note is that this lab will use the API-driven Provisioning API created in the previous lab exercise.

**NOTE #1:** Creating a Logic App requires access to an Azure Subscription for your Test/Demo tenant. If you don't have access to any Azure subscription at all, skip the access package lab exercise but instead use the [privileged-user.json](../../resources/resource-1-scim-sample-payloads/privileged-user.json) file which you can find here and create a privileged user account directly via Graph Explorer with the Provisioning API, similar to what you did in the previous lab.

## Lab 1.1 - Create pre-hire workflow

Now the user has been created let's create a pre-hire workflow in lifecycle workflows and scope the pre-hire workflow to be executed for users with the department 'ELNL 2026' 7 days prior to the employeeHireDate. For this you need to have, at a bear mnimimum, the Lifecycle Workflow Administrator role assigned. Within this workflow make sure the following actions are set:

- Generate TAP and Send Email to manager
- Assign at least a mailbox license to the end user

Microsoft Learn source: [Lifecycle Workflows - Create](https://learn.microsoft.com/en-us/entra/id-governance/create-lifecycle-workflow)

&nbsp;

## Lab 1.2 - Create new hire workflow

After the pre-hire workflow has been created, create a new-hire workflow which is triggered based on the employeeHireDate and scoped to users with the departmet 'ELNL 2026'. Within this workflow make sure the following tasks are set:

- Enable Account
- Send Welcome email (feel free to customize on your own)
- Make the user a member of a security group for ELDK 2026
- Make the user a member of a MS Teams group for ELDK 2026

Microsoft Learn source:  [Lifecycle Workflows - Create](https://learn.microsoft.com/en-us/entra/id-governance/create-lifecycle-workflow)

&nbsp;

## Lab 1.3 - Run the workflows one-by-one

Make sure that all tasks are exectued successfully.

**NOTE #1:** Be aware that for some tasks the manager need to be configured on the user account and both should have a mailbox assigned.

**NOTE #2:** Be aware that the Temporary Access Pass authentication method should be configured within your tenant to generate the Temporary Access Pass with Lifecycle Workflows.

Microsoft Learn source:  [Lifecycle Workflows - Run on Demand](https://learn.microsoft.com/en-us/entra/id-governance/on-demand-workflow)

&nbsp;

## Lab 1.4 - Onboard the user with their TAP and register for MFA

If you've succesfully completed all the earlier steps in this lab you should be able to onboard the end user account by:

- Retrieving the Temporary Access Pass from the mailbox of the manager
- Sign-in with the user via a web-browser and enroll for MFA via [My Sign-ins](https://mysignins.microsoft.com/security-info)

&nbsp;

## Lab 2.5 - Create an access package which is using a custom extension

In lots of sceanrios you want to add more advanced scenario's with low code to an access package or lifecycle workflow, for that you can use custom extensions. For the next lab create a custom extension for requesting a privileged account and create a new access package which uses the custom extension on the 'assignment granted' stage. To do this:

- Create a custom extension with Logic App for 'privileged account requests' in the 'ELDK 2026' catalog (or if you completed lab 2.4.1 successfully, use the pre-created logic apps).
- Create an accesss package for 'privileged account requests' in the 'ELDK 2026' catalog.
- The Access Package should not provide access to resources.
- Can be requested by all members in your directory (excluding guests and prefferaby a dynamic group which only contains enabled users with an employeeID).
- Doesn't have an approval process (prefferably it has, but for lab and testing purposes you can skip this step).
- Has no lifecycle or access review configured.
- Configure the custom extension created earlier to be triggered after the 'Assignment has been granted' stage.
- If you've skipped lab 2.4.1. make sure to enable a system assigned managed identity on the logic app created within this lab exercise.

Microsoft Learn source: [Entitlement Management - Custom Extension](https://learn.microsoft.com/en-us/entra/id-governance/entitlement-management-logic-apps-integration)

&nbsp;

## Lab 2.6 - Edit Logic App with HTTP Requests for Getting User Details from Target and Build SCIM Payload

Since the logic app and custom extension have now been created but don't contain the low code steps, let's make sure to add these in. For that we have generated example source code which you can 'copy and paste' into the logic app which has been created via the UI or Bicep. The source code for the logic app can be found at [LogicAppExample.json](../../resources/resource-6-logicapp-example/LogicAppExample.json).

Once the source code is copied in, open the designer in logic apps and make sure to change the following details:
- Edit the ObjectID in the first condition to match the of the **'ELDK 2026'** Catalog objectID.
- Edit the URI to reffer to your own API endpoint within the step **'HTTP - Provision admin account'**.
- Change the users objectID to an ObjectID in your tenant which is used as from address for the email being send out within the step **'HTTP - Send an email'**.
- Verify the HTML Body within the step **'HTTP - Send an email'** and alter it to your needs.
- Verify both 'HTTP - Resume...' steps at the end of the logic app and make sure the 'customExtensionStageInstanceDetail' are matching your needs (this information is written back within the access pacakge request in Entitlement Management).

Once all the above steps are completed don't forget to hit **save** on the logic app and proceed to the next lab exercise.

&nbsp;

## Lab 2.7 - Provide the managed identity the right MSGraph permissions and Entra roles

To make sure that the managed identity has the right permissions within Microsoft Graph and Microsoft Entra we need to apply the following permissions:

| Target | Permissions or role | Reasoning |
| --- | --- | --- |
| Microsoft Graph | User.ReadWrite.All, Mail.Send, AuditLog.Read.All, SynchronizationData-User.Upload | Required to grab the user details and set the email address to plus addressing, execute the API call against the Inbound Provisioning API and being able to send an email via a Microsoft Graph API call. |
| Microsoft Entra | Authentication Administrator, Access Package Assignment Administrator (on ELDK 2026 Catalog). | Required to generate the temporary access pass for a non-privileged user account and execute the API callback against the access package request in Entitlement Management |

For the Microsoft Graph permissions the following script can be used: [Configure-MsGRaphPermissions.ps1](../../resources/resource-5-msgraph-permissions/Configure-MsGraphPermissions.ps1)
For the Microsoft Entra permissions the two roles need to be manually assigned.

Once you're ready, verify if the MS Graph permissions and roles have been configured successfully on the managed identity and continue to the next lab exercise.

&nbsp;

## Lab 2.8 - Test the Access Package by requesting access

Now the access package has been configured correctly lets verify if it's fully operational. This can be done by requesting the access package via [MyAccess](https://myaccess.microsoft.com) and make sure the entire process completes successfully and the callback of the custom extension is registered correctly.

If this all succeeds the privileged account is created and enabled, the regular office account should have received an email with the Temporary Access Pass for onboarding which you will use in the 3rd next lab exercise.

&nbsp;

## Lab 2.9 - Summary & Discussion

To finish the lab, turn to your sideperson and discuss or reflect over the following questions.

- What happens if you want to onboard a user in lifecycle workflows with a 'Generate TAP' step while the user already has sign-ins on their account?
- Identify what the 'glue' is between the regular user object and the just created privileged account object (e.g. how do we know these belong together)?
- What is the reasoning for using Exchange Online Plus addressing on admin accounts?
- Should access packages being created as well to request individual roles or should role-assignable groups be used within access pacakages?
- How should the offboarding of privileged accounts be handeld, via lifecycle workflows or access packages?

## Advanced Lab 2.10 - (OPTIONAL) Create an access package which can be requested for internal users only

As access packages are an easy way to request access to multiple resources in one go, let's create an access package which:

- Is created within the 'ELDK 2026' catalog
- Provides access to two or more resources
- Can be requested by all members in your directory (excluding guests)
- Doesn't have an approval process
- Has a lifecycle configured to either expire after 6 months or runs an Access Review bi-annualy.

**NOTE:** Please make sure that the access package can be requested by end users as we will use this access package within the lifecycle workflows tasks.

Microsoft Learn source: [Entitlement Management - Access Package Create](https://learn.microsoft.com/en-us/entra/id-governance/entitlement-management-access-package-create)

&nbsp;

## Advanced Lab 2.11 - (OPTIONAL) Add the assignment of this access package to the pre-hire workflow as a task

Now the access package has been created successfully, let's make sure to add it to a lifecycle workflow which has been created in the previous lab. We do this to make sure that for new joiners the access request is already put into the system and they don't have to request it theirselves in their first week of work.

For that edit the 'pre-hire' workflow and add 'request access to an access package' as a taks and select the previously created access package and make sure to **save** your edited workflow. Now run the workflow on demand and make sure that the access request is being made to the access package.

**NOTE**: If you have active sign-ins on the account which is targeted during the run on demand the 'Generate and send TAP' step will fail, therefore make sure that on this task you temporarily tick the 'Continue on error' checkbox within the workflow.

Microsoft Learn source: [Lifecycle Workflow Tasks - Request User Access Package Assignment](https://learn.microsoft.com/en-us/entra/id-governance/lifecycle-workflow-tasks#request-user-access-package-assignment)

&nbsp;

## Advanced Lab 2.12 - (OPTIONAL) Create an access package with an auto assignment policy

Now you've seen that access packages are an easy way to request access to multiple resources in one go, let's create another access package which will auto-assign users to the access package which:

- Is created within the 'ELDK 2026' catalog
- Provides access to two or more resources (different resources than used in the previous access package)
- Can be requested by no one (administrator direct assignments only)
- Doesn't have an approval process
- Doesn't have a lifecycle configured

Once the access package is created, open the access package and add a new 'auto assignment policy' underneath policies. Scope the auto assignment policy to the department 'ELDK 2026'.

Microsoft Learn source: [Entitlement Management - Access Package Auto Assignment Policy](https://learn.microsoft.com/en-us/entra/id-governance/entitlement-management-access-package-auto-assignment-policy)

&nbsp;

## Advanced Lab 1.13 - (OPTIONAL) Create a custom extension for lifecycle workflows

In some cases you perhaps want to add more advanced scenario's with low code to a lifecycle workflow, for that you can use custom extensions. If you've got time left during the lab you can create a custom extension which can be used within one of the lifecycle workflows created earlier. To do this:

- Create a custom extension within Lifecycle Workflows
- Configure one of the workflows to run a custom task extension which is created earlier

Microsoft Learn source: [Lifecycle Workflows - Custom Task Extension](https://learn.microsoft.com/en-us/entra/id-governance/lifecycle-workflow-extensibility)

&nbsp;