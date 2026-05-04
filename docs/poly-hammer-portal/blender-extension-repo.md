# Blender Extension Repository

<div style="text-align: center;">
    <iframe width="800" height="450" src="https://www.youtube.com/embed/WvJCRUxT5c0?si=xNvKp8uWGr9XyGV9" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</div>

The [Poly Hammer Portal](https://dashboard.portal.polyhammer.com) hosts a Blender extension repository so you can install and stay up to date with your purchased add-ons directly from Blender.
!!! info "Note:"
    This is how you will install our addons. You will need to create an account, or activate your account based on an email you would have received when you made your purchase.


## Get an API Key

1. Sign in to the [Poly Hammer Portal](https://portal.polyhammer.com) and open the product you own from the **Products** page.
2. Click **Install Now** to go to the **Keys** page.
    <div style="text-align: center;">
        <img class="rounded-image" src="/assets/images/poly-hammer-portal/blender-extension-repo/1.png" alt="GitHub verify" width="800" />
    </div>
3. Create a new API key and copy it.
    <div style="text-align: center;">
        <img class="rounded-image" src="/assets/images/poly-hammer-portal/blender-extension-repo/2.png" alt="GitHub verify" width="800" />
    </div>

## Add the Repository in Blender

1. In Blender, open `Edit > Preferences > Extensions`.
2. Add a new **Remote Repository**.
3. Paste your API key into the **Access Token** field.
4. Paste the repository URL shown on the portal's **Keys** page into the **URL** field.
5. (Optional) Enable **Check for updates on startup**.
6. Click **Create**.

<div style="text-align: center;">
    <img class="rounded-image" src="/assets/images/poly-hammer-portal/blender-extension-repo/3.png" alt="GitHub verify" width="800" />
</div>

## Install an Add-on

1. In the **Extensions** preferences, select your new remote repository and click **Refresh**.
2. Search for the add-on (for example, `Character Control Rig`) and click **Install**.

<div style="text-align: center;">
    <img class="rounded-image" src="/assets/images/poly-hammer-portal/blender-extension-repo/4.png" alt="GitHub verify" width="800" />
</div>

## Update an Add-on

When a new release is available, refresh the repository (or let Blender check on startup) and click **Update** next to the add-on to get the latest version.
