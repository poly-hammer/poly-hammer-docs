# Setup the Poly Hammer Build Tool

This guide will give you step-by-step instructions on how to setup the **Poly Hammer Build Tool** so that you can successfully run your purchased workflows to build you addons.

## Verify Github Account
At this point, it is assumed that you have successfully purchased [a product from the Poly Hammer website](https://www.polyhammer.com/metahuman-addon) and have received the confirmation email for your product.


1. Start the verification process by clicking on the `GitHub Verification` button in your confirmation email.
    <div style="text-align: center;">
        <img class="rounded-image" src="/assets/images/gh_verify.png" alt="GitHub verify" width="500" />
    </div>

2. If **you have not signed in** to your GitHub account, you will be prompted to do so.

    If **you are signed in** to multiple accounts, select the account that has the *same email as the one that you used to purchase the workflow with.*
    <div style="text-align: center;">
        <img class="rounded-image" src="/assets/images/gh_account_select.png" alt="GitHub account select" width="300" />
    </div>
    !!! Warning
        You must use your GitHub account that has the same email as the one that you used for purchasing the addon workflow.


3. Authorize the Poly Hammer org to read your primary email tied to your GitHub account.
    <div style="text-align: center;">
        <img class="rounded-image" src="/assets/images/gh_authorize.png" alt="GitHub authorize" width="500" />
    </div>

4. After a successful authorization, you will see the page below.
    <div style="text-align: center;">
        <img class="rounded-image" src="/assets/images/gh_auth_success.png" alt="GitHub authentication success" width="500" />
    </div>

5. Check your email for an invitation to join the [GitHub Poly Hammer Org](https://github.com/poly-hammer).

6. Accept your invitation to join the [GitHub Poly Hammer Org](https://github.com/poly-hammer).
    <div style="text-align: center;">
        <img class="rounded-image" src="/assets/images/gh_join_org.png" alt="GitHub join organization" width="500" />
    </div>

<h4>Your GitHub account has been verified and you are now a member of the Poly Hammer Org</h4>

## Join the Epic Games GitHub Org
The build tool has some workflows that require access to the [Unreal Engine Source Code](https://github.com/EpicGames/UnrealEngine).  You will need to connect your [Epic Games account](https://store.epicgames.com/) to your GitHub in order to join the [Epic Games GitHub Org](https://github.com/EpicGames).

Here is a [detailed guide](https://www.unrealengine.com/ue-on-github) on how to get access to the [Epic Games GitHub Org](https://github.com/EpicGames).

!!! Warning
    You must be member of the [Epic Games GitHub Org](https://github.com/EpicGames) or else the Build Tool will fail when it is run.  Please follow this [detailed guide](https://www.unrealengine.com/ue-on-github) to gain access to the org.


## Create Personal Build Tool Repo
<h4>You will need to create your own private repository that you will use to run the Build Tool.</h4>
1. Go to the [Poly Hammer Build Tool Workflow](https://github.com/poly-hammer/poly-hammer-build-tool-workflow) repository and click on the `Use this template` button and select the `Create a new repository` option.

    <div style="text-align: center;">
        <img class="rounded-image" src="/assets/images/use_template.png" alt="Use template example" width="500" />
    </div>

2. Give your repo a name and then select `Private` on the visibility section.  The repo must be private in order for the build tool to work properly.  Finally, hit the `Create repository` button to create your own copy of the [Poly Hammer Build Tool Workflow](https://github.com/poly-hammer/poly-hammer-build-tool-workflow) repo.

    <div style="text-align: center;">
        <img class="rounded-image" src="/assets/images/create_new_repo.png" alt="Create new repository" width="700" />
    </div>

    !!! Warning
        The repository must be PRIVATE in order for the build tool to work properly.

3. After your repo is created, you need to create a GitHub access token in order to give the Build Tool the proper permissions.  

    Use this **<a href="https://github.com/settings/tokens/new?description=poly-hammer-build-tool&scopes=repo,read:packages,read:org,read:user,user:email" target="_blank">preconfigured link</a>** to generate a classic token.  Copy your token and **hold on to it for a future step**.

    !!!Tip
        If you would like for the Build Tool to have access to your newly created repository and ONLY that repository, then you can use a [**Fine Grain Access Token**](https://github.com/settings/personal-access-tokens).
        
        To generate the token:
        
        1. Select `Only select repositories` and select your newly created build tool repo
        
        2. Enable the following permissions:
            - **Repository Permissions**
                - Actions `Read-only`
                - Administration `Read-only`
                - Contents `Read and write`
                - Deployments `Read and write`
                - Secrets `Read-only`

            - **Account Permissions**
                - Email Addresses `Read-only`

4. Add your newly generated GitHub Token as a secret to your build tool repo's actions.  First go to your build tool repo and open its settings.
    <div style="text-align: center;">
        <img class="rounded-image" src="/assets/images/repo_settings.png" alt="Repository settings" />
    </div>

    In the security section, select `Secrets and variables / Actions` and then click on `New repository secret`.
    <div style="text-align: center;">
        <img class="rounded-image" src="/assets/images/actions_tab.png" alt="GitHub actions tab"/>
    </div>

    Give your token the name `GH_PAT` and paste in your **personal access token that you created in step 3**.  Finally, click on `Add secret`.
    <div style="text-align: center;">
        <img class="rounded-image" src="/assets/images/create_actions_secret.png" alt="Create actions secret" width="550"/>
    </div>

    You now have an actions secret named `GH_PAT`.
    <div style="text-align: center;">
        <img class="rounded-image" src="/assets/images/actions_secret.png" alt="GitHub actions secret" width="550"/>
    </div>

## Congratulations! 🎉 
You have configured a personal repo where you can run the **Poly Hammer Build Tool**.