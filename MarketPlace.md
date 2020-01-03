# Azure Pipelines Approval

This extension allows you to easily view releases that are pending approval for your user, allowing you to approve them directly from a simple grid view. You can approve them one by one or in batch.


## Getting started

![Extension home screen](img/extension-home-screenshot.png)

1. From the Pipeline hub, select the **Approve Release** option
2. The grid will display all releases pending approval
3. From each release, you can **approve** or **reject**
   **Note:** If you prefer, you can select more than one release for approval (or rejection) and select **Approve All** (**Reject All**) button.
4. If you want/need, You can schedule deployment for later with deferred deployment feature:

    ![Deferred deployment screen](img/extension-deferreddeployment-screenshot.png)

## Feature Backlog

This release has minimal functionality to perform approvals, but we are working on more features and enhancements to refine and complete the extension.

Here are some features we're working on. Feel free to suggest any other feature.

* **Grid filters:** allows to filter pending approvals by definition, identifier, status or stage/environment.
* **Sortable columns:** allows to sort items.
* **UI improvements**:
  * add theme support for deferred deployment date picker.


## Pipeline

[![Build Status](https://dev.azure.com/gustavobergamim/AzureDevOpsExtensions/_apis/build/status/pipeline-approval/gustavobergamim.azdevops-pipeline-approval?branchName=master) ](https://dev.azure.com/gustavobergamim/AzureDevOpsExtensions/_build/latest?definitionId=20&branchName=master)


## Contributors

Special thanks to Vinicius Moura (Microsoft MVP) for always helping with Azure DevOps related questions and ideas.


## Contribute

This extension is free, but if you enjoyed the work and would like to help the developer stay up:

<a href="https://www.buymeacoffee.com/uRKtsLn" target="_blank"><img src="https://bmc-cdn.nyc3.digitaloceanspaces.com/BMC-button-images/custom_images/black_img.png" alt="Buy Me A Coffee" style="height: auto !important;width: auto !important;" ></a>
