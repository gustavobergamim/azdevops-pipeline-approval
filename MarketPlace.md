# Azure Pipelines Approval

This extension allows you to easily view releases that are pending approval for your user, allowing you to approve them directly from a simple grid view. You can approve them one by one or in batch.

[![Build Status](https://dev.azure.com/gustavobergamim/AzureDevOpsExtensions/_apis/build/status/pipeline-approval/pipeline-approval%20CI?branchName=master)](https://dev.azure.com/gustavobergamim/AzureDevOpsExtensions/_build/latest?definitionId=18&branchName=master)

[![Deployment Status](https://vsrm.dev.azure.com/gustavobergamim/_apis/public/Release/badge/f31d13e6-01cf-43e1-9052-55751776b3ea/2/4)](https://vsrm.dev.azure.com/gustavobergamim/_apis/public/Release/badge/f31d13e6-01cf-43e1-9052-55751776b3ea/2/4)

## Getting started

![Extension home screen](img/extension-home-screenshot.png)

1. From the Pipeline hub, select the **Approve Release** option
2. The grid will display all releases pending approval
3. From each release, you can **approve** or **reject**
   **Note:** If you prefer, you can select more than one release for approval (or rejection) and select **Approve All** (**Reject All**) button.

## Feature Backlog

This release has minimal functionality to perform approvals, but we are working on more features and enhancements to refine and complete the extension.

Here are some features we're working on. Feel free to suggest any other feature.

* **Grid filters:** allows to filter pending approvals by definition, identifier or stage
* **Security validations:** allows only users that has required scopes to view and interact with the extension
* **Comments:** allows you to enter a comment for approval or rejection


## Contributors

Special thanks to Vinicius Moura (Microsoft MVP) for always helping with Azure DevOps related questions and ideas.