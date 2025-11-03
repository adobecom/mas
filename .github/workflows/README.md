# SSH into GH actions

## action code

If you need to debug your action you can add this snippet to the workflow:

```
- name: Setup tmate session
    uses: mxschmitt/action-tmate@v3
    with:
        limit-access-to-actor: true
```

once you push to the branch you can find an ssh connection string in action logs.
test

## github account setup

you will need to have generated pair of SSH keys on your machine.
Follow this docu: https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account
check for existing keys, if doesn't exist generate a pair and add a public one to your github account.

## SSH out!

If you are in the office network or using VPN - don't forget to SSH out:

1. Go to this site
   http://sanjose-ssh-out.corp.adobe.com/ (HTTP not HTTPS)
2. Log in using your adobenet ID and "One time password token"
3. After logging in, you should get the confirmation message saying that "Authentication successfully. You may now SSH or SCP to an Internet host...."
