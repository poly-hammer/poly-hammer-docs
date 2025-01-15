# Fine Grain Access Tokens

On GitHub [Fine Grain Access Tokens](https://github.com/settings/personal-access-tokens) are a great way to have very tight control over what permissions are granted to a particular token. In order for the Hammer Build Tool to function, it will need these permissions specifically.

1. Select `Only select repositories` and select your newly created [build tool repo](./setup.md#copy-the-template-repo), as well as the [EpicGames/UnrealEngine](https://github.com/EpicGames/UnrealEngine) repo.

2. Enable the following permissions:
    - **Repository Permissions**
        - Actions `Read-only`
        - Administration `Read-only`
        - Contents `Read and write`
        - Deployments `Read and write`
        - Secrets `Read-only`

    - **Account Permissions**
        - Email Addresses `Read-only`