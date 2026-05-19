# Maester workshop - Custom test

This is part of the [Maester workshop](./README.md#maester-workshop) or check the [previous step](./step-3-exploring-tests.md).

## Designing a test

As [explained](./step-3-exploring-tests.md#pester) all the tests are just PowerShell files "Describing" something that has to have a certain condition.

If the code fails (throws an error) or if you assert something that happens to be not true the test is reported as failed.

[Clayton Tyger](https://devclate.github.io/Custom-Maester-Tests/docs/Getting-Started/create-a-test/) made a good guide to create additional tests. You can also check out the [official documentation](https://maester.dev/docs/writing-tests/)

## Some ideas

### Exactly these global administrators

The [CIS.M365.1.1.1](https://maester.dev/docs/tests/CIS.M365.1.1.1) test validates that all global administrators are cloud only. But what if we want to validate that the list of global administrators is not changed?

### Group for copilot not more then x members

Let's say you have a group that is used for the Copilot license? You might want to check that there are not to many users in. And that it is not empty.

## Create test file

In your `maester` folder, there should be a folder called `Custom` which is for your custom tests.

Lets create a test file called `CustomEntra.Tests.ps1`

> [!IMPORTANT]
> The `.Tests.ps1` part is important. This is automatically picked up when you run Maester.


```ps1
Describe "CustomEntraConfig" -Tag "License", "Custom" {
    It "CT0001: Check 'Copilot' group" -Tag 'Severity:Medium' {

        try {
            # Change to your group ID
            $groupId = "e05d094c-a785-4a7c-b7eb-f0ccebbe009e"

            $memberCount = Get-MgGroupTransitiveMemberCount -GroupId $groupId -ConsistencyLevel eventual

            # Test if the group exists and has members
            $memberCount | Should -BeGreaterThan 0

            # Test if the group has less then 100 members
            $memberCount | Should -BeLessThan 100

        }
        catch {
            Add-MtTestResultDetail -SkippedBecause Error -SkippedError $_
            return $false
        }
    }
}
```

### Assertions

Pester has the `Should` function, which allows you to validate the state of an item. Check out the [Assertion reference](https://pester.dev/docs/assertions/) for more details.

## Run Maester again

Now that you have your custom test ready you can [run](./step-2-running-maester.md) Maester again to see the result with your custom test included:

```ps
Invoke-Maester
```

Or if you want to execute just your custom tests:

```ps
Invoke-Maester -Path .\Custom
```


## Summary

- You have created a custom test
- You have executed Maester with all the custom tests

## Next

Go to the [next step](./step-5-run-on-github.md) or [the overview](./README.md#maester-workshop).
