# Maester workshop - Exploring test

This is part of the [Maester workshop](./README.md#maester-workshop) or check the [previous step](./step-2-running-maester.md).

> [!IMPORTANT]
> This part is technical background on the actual tests, it is completely optional, you can also continue to [creating a custom test](./step-4-custom-test.md).

## Pester

All tests are written using [Pester](https://pester.dev/) which is a "The test framework for Powershell" which describes itself as: "Pester is the ubiquitous test and mock framework for PowerShell".

## Test-MtCisThirdPartyFileSharing.Tests.ps1

Let's take the [CIS.M365.8.1.1](https://maester.dev/docs/tests/CIS.M365.8.1.1) test. If you installed the built-in tests the test file is in `.\cis\Test-MtCisThirdPartyFileSharing.Tests.ps1`

### Describe-block

```ps
Describe "CIS" -Tag "Security", "CIS", "CIS M365 v5.0.0" {
   It "CIS.M365.8.1.1:...." {

   }
}
```

It has a `Describe` part which sets the main category `CIS` and some tags for this specific test. This is to group tests.

### It-block

Then a test file can have one or more `It` blocks.

```ps
It "CIS.M365.8.1.1: Ensure external file sharing in Teams is enabled for only approved cloud storage services" -Tag "CIS.M365.8.1.1", "CIS E3 Level 2" {

    $result = Test-MtCisThirdPartyFileSharing

    if ($null -ne $result) {
        $result | Should -Be $true -Because "file sharing with third-party cloud services is disabled."
    }
}
```

The `It` block starts with the Title of the test, and each individual tests can also have additional tags.

Inside the curly brackets `{` `}`, is the PowerShell code that is run. If this code crashes the test will fail. In this case the tests should return `$true`. Which is tested by the additional "Assertion" in the form of the `Should` statement.

### Actual test code

The code above does not show the actual code that is executed, that is because this code is built into the Maester Module.

The code of the test is in the [Maester module](https://github.com/maester365/maester/), to be specific [Test-MtCisThirdPartyFileSharing.ps1](https://github.com/maester365/maester/blob/main/powershell/public/cis/Test-MtCisThirdPartyFileSharing.ps1)

This test also has the additional documentation in the [Test-MtCisThirdPartyFileSharing.md](https://github.com/maester365/maester/blob/main/powershell/public/cis/Test-MtCisThirdPartyFileSharing.md) file


## Summary

- You have seen one of the built-in tests

## Next

Go to the [next step](./step-4-custom-test.md) or [the overview](./README.md#maester-workshop).