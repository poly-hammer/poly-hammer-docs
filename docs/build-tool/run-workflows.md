# Install the Meta-Human DNA Addon

This guide will give you step-by-step instructions on how to download and build a product from Poly Hammer.  As an example, this guide will be using the [Meta-Human DNA Addon](https://www.polyhammer.com/metahuman-addon) workflow to demonstrate how to use the **Poly Hammer Build Tool**

## Set up
At this point, it is assumed that you have successfully purchased your [Poly Hammer workflow](https://www.polyhammer.com/metahuman-addon).

After completing your checkout, you'll recieve an email such as the one below.

<div style="text-align: center;">
    <img class="rounded-image" src="/assets/images/example_email.png" alt="Test email" width="500" />
</div>

!!!Note
    Make sure that you keep track of your **Product ID** as you will need it in order to run the build tool later.

## Run the Build Tool
You will run the Build Tool in your repo that you made in [setup](setup.md) using GitHub Actions.

1. Go to the actions tab and select the `Build` workflow and Click on the `Run workflow` pulldown.  Enter in your `product ID` you recieved in your purchase confirmation email to run the correct workflow.

    <div style="text-align: center;">
        <img class="rounded-image" src="/assets/images/run_workflow.png" alt="Run workflow"/>
    </div>

    !!!Note
        There are 4 inputs needed to run the build tool:

        1. **Workflow (product ID)**: This will be found in your confirmation email you got from Poly Hammer after your purchase.

        2. **Version tag**: latest `default`

        3. **Python Version** 3.11 `default`

        4. **Blender Version** 4.2 `default`

2. Run the workflow.  You can track the workflow's progress in your `Actions` tab were you can see a live progress updates.  This step can take awhile so please be patient.

3. After the Build Tool workflow finishes running, you will see a release on your repository's code page.

    <div style="text-align: center;">
        <img class="rounded-image" src="/assets/images/select_release.png" alt="Select addon release"/>
    </div>

4. Click on this release and download the `meta_human_dna.zip` file.
    
    <div style="text-align: center;">
        <img class="rounded-image" src="/assets/images/download_add_on.png" alt="Download Meta-Human addon"/>
    </div>

<h4>You have built and downloaded the source code for the Poly Hammer Meta-Human DNA Addon</h4>

## Install the Addon in Blender
<h4>You will now install the Addon into Blender</h4>

To install the [Poly Hammer Meta-Human DNA Addon](https://www.polyhammer.com/metahuman-addon) into Blender, simply drag and drop the `.zip` file that you downloaded into an open window of Blender.

<div style="text-align: center;">
    <img class="rounded-image" src="/assets/gifs/install_add_on.gif" alt="Installation GIF"/>
</div>

You will now see a tab on your right-side utility bar called `Meta-Human DNA`

## Congratulations! 🎉 
You have successfully ran a workflow and installed an addon using the **Poly Hammer Build Tool**