# Setup

Welcome to the hammer build tool setup guide. You can also view our [video tutorial](https://youtu.be/BAyCV8GwmCM) here as well.

## Why do I need this?

Some of our tools require additional dependencies that we are not allowed to be re-distributed with our code. However, these dependencies can be complex to compile. That's why we created this build tool. You can run a GitHub workflow and compile all the dependencies needed for our tools yourself. Once you have it configured, it makes it super easy!

![1](/assets/images/hammer-build-tool/setup/1.gif){: class="rounded-image"}


## What are the dependencies?

1. You must be a part of the [Poly Hammer GitHub org](https://github.com/poly-hammer). Individuals, Small Teams, and Enterprise customers can [purchase access](https://www.polyhammer.com) for a particular build workflow and gain access to the Poly Hammer Org.

2. You must be a part of the [Epic Games GitHub org](https://github.com/EpicGames). The build tool needs to be able to pull down Unreal Engine source code, so it can compile parts of it for you and your tools.

3. Copy the template repo and configure its permissions.


## What are the steps?


### Join Poly Hammer GitHub Org

1. Purchase a product from the [Poly Hammer website](https://www.polyhammer.com) and open the confirmation email.

2. Verify your GitHub account by clicking on the `GitHub Verification` button. 

<div style="text-align: center;">
    <img class="rounded-image" src="/assets/images/hammer-build-tool/setup/2.png" alt="GitHub verify" width="500" />
</div>

3. Authorize the Poly Hammer org to read your primary email tied to your GitHub account.
<div style="text-align: center;">
    <img class="rounded-image" src="/assets/images/hammer-build-tool/setup/3.png" alt="GitHub authorize" width="500" />
</div>
!!! Warning
    Your email tied to your GitHub account must match the one you used when you purchased the product from the Poly Hammer website.


4. After a successful authorization, you will see the page below.
<div style="text-align: center;">
    <img class="rounded-image" src="/assets/images/hammer-build-tool/setup/4.png" alt="GitHub authentication success" width="500" />
</div>

5. Now check your email and accept the invitation to join the [GitHub Poly Hammer Org](https://github.com/poly-hammer).
<div style="text-align: center;">
    <img class="rounded-image" src="/assets/images/hammer-build-tool/setup/5.png" alt="GitHub join organization" width="500" />
</div>

Your GitHub account has been verified and you are now a member of the Poly Hammer Org!

### Join Epic Games GitHub Org

1. Here is a [detailed guide](https://www.unrealengine.com/ue-on-github) on how to get access to the [Epic Games GitHub Org](https://github.com/EpicGames).
2. Verify that you can now access the source code for [Unreal Engine](https://github.com/EpicGames/UnrealEngine).

!!! Warning
    If you receive a 404 when clicking on [this link](https://github.com/EpicGames/UnrealEngine) while you are logged into GitHub, then your account is not linked correctly to the Epic Games Org, and the build tool will fail.


### Copy the Template Repo
1. Go to the [Template](https://github.com/poly-hammer/poly-hammer-build-tool-workflow) repository and click on the `Use this template` button and select the `Create a new repository` option.

<div style="text-align: center;">
    <img class="rounded-image" src="/assets/images/hammer-build-tool/setup/6.png" alt="Use template example" width="500" />
</div>

2. Give your repo a name, select `Private` on the visibility section,  then hit the `Create repository` button.
<div style="text-align: center;">
    <img class="rounded-image" src="/assets/images/hammer-build-tool/setup/7.png" alt="Create new repository" width="700" />
</div>

3. Now create a GitHub access token that gives the build tool the proper permissions. To make things simple, you can use this **<a href="https://github.com/settings/tokens/new?description=poly-hammer-build-tool&scopes=repo,read:packages,read:org,read:user,user:email" target="_blank">pre-configured link</a>** to generate a classic token. Copy your token and **hold on to it for a future step**.

4. Add your newly generated GitHub Token as a secret in your build tool's repo settings.  
<div style="text-align: center;">
    <img class="rounded-image" src="/assets/images/hammer-build-tool/setup/8.png" alt="Repository settings" />
</div>

Navigate to `Secrets and variables > Actions > New repository secret`.
<div style="text-align: center;">
    <img class="rounded-image" src="/assets/images/hammer-build-tool/setup/9.png" alt="GitHub actions tab"/>
</div>

Give your token the name `GH_PAT` and paste in your **personal access token that you created in step 3** and click on `Add secret`.
<div style="text-align: center;">
    <img class="rounded-image" src="/assets/images/hammer-build-tool/setup/10.png" alt="Create actions secret" width="550"/>
</div>

You now have an actions secret named `GH_PAT`.
<div style="text-align: center;">
    <img class="rounded-image" src="/assets/images/hammer-build-tool/setup/11.png" alt="GitHub actions secret" width="550"/>
</div>

### Start Building!
:confused: If you still need help configuring your build tool after reading this guide, try watching our [video](https://youtu.be/BAyCV8GwmCM) about it, which goes through the process step by step.

Whew! :sweat_smile: If you have made it this far, congratulations! You are ready to start [creating your own releases](./create-releases.md)!