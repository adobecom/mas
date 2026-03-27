# Surface: CCD

> Source: https://wiki.corp.adobe.com/display/adobedotcom/Surface%3A+CCD
> Scraped: 2026-01-06T07:39:37.059Z

---


                           
        - 1.1Figma1.2Build
- 2CCD Surface2.1Charles / How to change cards in ccd content2.2Debug 2.3Consuming code (Git repo)
- 3Debugging Prod3.1CCD Logs

Use cases Wiki: [Merch @ Scale Use cases & Requirements for CCD & Adobe Home](/pages/viewpage.action?pageId=3263727576)

## Figma

To get access: join the GRP-AD-FIGMA-VIEWERRESTRICTED in IAM portal

Figma UX: [https://www.figma.com/design/7tUtNgFelfMjgPoJ5QcE1k/Merch%40Scale-Frameworks?node-id=9-76&node-type=canvas&m=dev](https://www.figma.com/design/7tUtNgFelfMjgPoJ5QcE1k/Merch%40Scale-Frameworks?node-id=9-76&node-type=canvas&m=dev)

Business Figma: [https://www.figma.com/proto/7tUtNgFelfMjgPoJ5QcE1k/Merch%40Scale-Frameworks?node-id=2034-44311&t=8hahWyGISCJhs7SZ-1&show-proto-sidebar=1&starting-point-node-id=2034%3A44311](https://www.figma.com/proto/7tUtNgFelfMjgPoJ5QcE1k/Merch%40Scale-Frameworks?node-id=2034-44311&t=8hahWyGISCJhs7SZ-1&show-proto-sidebar=1&starting-point-node-id=2034%3A44311)

## Build

**Download & Install latest Artifactory build from (#ccd-merch-collaboration channel → Overview tab) OR older version:**

- MacARM : https://artifactory.corp.adobe.com/ui/native/generic-creative-cloud-release/ACCC/6.5.0/Application/macarm64/mul/103.s/WAMB_Local/Creative_Cloud_Installer.dmgMacIntel : https://artifactory.corp.adobe.com/artifactory/generic-creative-cloud-release/ACCC/6.5.0/Application/osx10/mul/103.s/WAMB_Local/Creative_Cloud_Installer.dmgWinIntel : https://artifactory.corp.adobe.com/artifactory/generic-creative-cloud-release/ACCC/6.5.0/Application/win64/mul/103.s/WAMB_Local/Creative_Cloud_Set-Up.exeWinARM : https://artifactory.corp.adobe.com/artifactory/generic-creative-cloud-release/ACCC/6.5.0/Application/winarm64/mul/103.s/WAMB_Local/Creative_Cloud_Set-Up.exe

Test ids to use : 
[vine+US+Free+VISA+MAS+2@adobetest.com](mailto:vine+US+Free+VISA+MAS+2@adobetest.com)
[vine+US+Free+VISA+MAS+3@adobetest.com](mailto:vine+US+Free+VISA+MAS+3@adobetest.com) 
Password - Adobe123#

Wiki for Charles Setup - [https://wiki.corp.adobe.com/display/Suites/Steps+for+Charles+Setup+on+machine](https://wiki.corp.adobe.com/display/Suites/Steps+for+Charles+Setup+on+machine)

Once the installation is done make sure that you are on a `stage` environment.

![image](/download/attachments/3430933006/image-2024-10-15_14-9-14.png?version=1&modificationDate=1740389973327&api=v2)

If not, then click on top `Help -> Switch environment` menu option. CCD should relaunch with the stage environment enabled.
You need to be on VPN!
If you have issues with Installation - try uninstalling the prev. version & restart your system.

# CCD Surface

## Charles / How to change cards in ccd content

[Steps for Charles Setup on machine](/display/Suites/Steps+for+Charles+Setup+on+machine)

If Charles doesn't proxy anything, try to shut it down, switch off VPN, than relaunch Charles first and only then connect to VPN.

To edit Slice cards content filter by 'odinpreview', find Merch-Cards-Mos.cfm.ggl.json. Open Contents tab, copy Json, search for "fragment" and change any of fragment ids to required one. Save file on you disk.

Then right-click on Merch-Cards-Mos.cfm.ggl.json → click Map Local in the bottom of the dropdown.

Go back to ccd app, click Help→ Check for Updates and in Charles verify that request is mapped from local file:

![image](/download/attachments/3430933006/image-2024-11-26_13-28-56.png?version=1&modificationDate=1740389973367&api=v2) ![image](/download/attachments/3430933006/image-2024-11-26_13-29-46.png?version=1&modificationDate=1740389973407&api=v2)

![image](/download/attachments/3430933006/image-2024-11-26_13-32-3.png?version=1&modificationDate=1740389973447&api=v2)

## Debug

debug at  [http://localhost:28282/](http://localhost:28282/)

## Consuming code (Git repo)

[https://git.corp.adobe.com/nest/nest/blob/ccd/6.5/applets/mas/src/view/MASView.tsx#L278](https://git.corp.adobe.com/nest/nest/blob/ccd/6.5/applets/mas/src/view/MASView.tsx#L278)

# Debugging Prod

Run


[?](#)| sudo touch "/Library/Application Support/Adobe/Adobe Desktop Common/HEX/cef.debug" |
|---|


Open [http://localhost:28282/](http://localhost:28282/)

## CCD Logs

```
Go to IAM, Click Access Requests -> Request -> Myself -> "Splunk AWS", select:
```

- GRP-SPLUNK-AWS-DUNAMIS-DEV-PROD
- GRP-SPLUNK-AWS-CCD_DEV_PROD

Query:

| index=dunamis-prod-all producer=dunamis project IN (ccd-win-debug-service, ccd-mac-debug-service) source_version=6.5* ccd_event_source="MAS" ccd_event_subtype="operational" event_type IN ("mas-failed", "mas-error") event_subcategory IN ("on-mount", "on-refresh")| stats count by event_error_desc |
|---|



                
        
    
        