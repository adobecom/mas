# Merch at Scale (M@S) IAM Groups & Permissions

> Source: https://wiki.corp.adobe.com/pages/viewpage.action?pageId=3330873329
> Scraped: 2026-01-06T07:39:37.060Z

---


                           
        



**CONTENTS:  //<![CDATA[

jQuery(document).ready(function() {
    jQuery(".wiki-content a").attr("target", "_blank");
});

//]]>**

- 1Content Management & Authoring Permissions - Odin/M@S
- 2Ops & Monitoring
- 3Odin/CCD Access (Legacy Cards)





###### Back to Top

**See Also:**
[IAM Groups: Subscribe](https://iam.corp.adobe.com/#/groupSubscribe)

![image](/download/thumbnails/3303331292/slack%20icon.png?version=1&modificationDate=1727188314807&api=v2) [#merch-at-scale](https://adobe.enterprise.slack.com/archives/C02RZERR9CH)

**Other suraces:**

![image](/download/thumbnails/3303331292/Confluence%20Logo.png?version=1&modificationDate=1727799868377&api=v2) [Request access to adobe.com SharePoint (Milo)](/display/WP4/Request+access+to+adobe.com+SharePoint)

![image](/download/thumbnails/3610111831/DMe%20Platform%20Icon.png?version=1&modificationDate=1757368364087&api=v2) [Request access to AUP Catalog Odin content](https://main--abpdocs--adobecom.hlx.page/commerce/plans/merchandising/onboarding)

- Offer & Promo Onboarding, Universal Promo Terms, etc.  Details here.










---



# Content Management & Authoring Permissions - Odin/M@S







New User Steps

1. Join the appropriate IAM group from the list below.Please reach out to the owners of your IAM group if you don't receive approval.
2. IAM updates sync with Odin once per day, so approved users should expect access the day following their approval.

The platform engineering team can't bypass the publishing leads for each surface and grant users permission to publish content to production.





Permissions Troubleshooting

- Confirm you membership in IAM groupDraft an email to the group then expand members to verify.
- Make sure you use correct studio urlProd: https://mas.adobe.com/studio.htmlDev: The one Dev shared with you and confirmed its up-to-date
- Make sure you are logging in with correct user
- Try incognito tab & re-login
- When logging in use 'Company Account'
- When logging in use 'Adobe Corp' or 'Adobe Inc' profile
- Still doesn't work - write to #merch-at-scale specifying what doesn't work (can't see card/ can't edit/save/publish), add screenshot if possible







| Team | IAM Group | Write Access | Roles | Owners / Approvers | Engineering(Does not approve requests) |
|---|---|---|---|---|---|
| Adobe.com | GRP-ODIN-MAS-ACOM-EDITORS | /content/dam/mas/acom | A.com Global web production team members.Select engineers and non web producers who need to edit files in A.com | Gabriela Andrade Gordon Lee Jim Jones | Mariia Lukianets(doesn't approve requests) |
| Adobe.com | GRP-ODIN-MAS-ACOM-CURATORS | /mas/acom/en_US/dictionary | Edit access for curators responsible for updating placeholders. | Gabriela Andrade Gordon Lee Jim Jones Geri Wittig (she, her) to be added:Fred Welterlin Kunwar Amitesh Singh Ravneet Kaur | Mariia Lukianets(doesn't approve requests) |
| Adobe Home | GRP-ODIN-MAS-AH-EDITORS | /content/dam/mas/ah | Adobe Home Authors | Ashish Mishra. Ritvik Kapoor Sumit Gulati Amanpreet Kaur Rohit Bansal Ayan Mazumdar Priyesh Kumar Gunda Himaja | Ilyas Stephane Turkben(doesn't approve requests) |
| Creative Cloud Desktop | GRP-ODIN-MAS-CCD-EDITORS | /content/dam/mas/ccd | Creative Cloud Desktop Authors | Primary:Rikio KanekoSecondary:Gordon LeeJim JonesDipanshu Handoo | Ilyas Stephane Turkben(doesn't approve requests) |
| Commerce & Unified Checkout | GRP-ODIN-MAS-COMMERCE-EDITORS |  | Adobe Business Platform (Commerce) Authors | Primary:Jesus Carrera | Nicolas Peltier(doesn't approve requests) |
| Express | GRP-ODIN-MAS-EXPRESS-EDITORS | /content/dam/mas/express | Express global web production team members.Select engineers and non web producers who need to edit files in Express. | Primary:Ernest Sallee Secondary:Gordon LeeJim JonesDipanshu Handoo | Ilyas Stephane TurkbenAxel Cureno BasurtoMariia LukianetsNicolas PeltierVolodymyr KniazievNate Yolles |
| Any team | GRP-ODIN-MAS-SANDBOX-EDITORS | /content/dam/mas/sandbox | Anyone at Adobe that needs to create and update test files.This content is segregated from any production content. |  |  |
| Any team | GRP-ODIN-MAS-READ-ONLY | None - no write access | Any Stakeholders | Rikio Kaneko Gabriela Andrade Gordon Lee Jim Jones Dipanshu Handoo | Mariia Lukianets Unknown User (astatescu) Axel Cureno Basurto Nicolas Peltier Ilyas Stephane TurkbenVolodymyr Kniaziev |
| M@S Platform Team | GRP-ODIN-MAS-EDITORS |  | Engineering | Axel Cureno Basurto Ilyas Stephane Turkben Mariia Lukianets Milica Micic Nicolas Peltier Volodymyr Kniaziev |
| M@S Platform Team | GRP-ODIN-MAS-ADMINS |  | Engineering |
| M@S Platform Team | GRP-ODIN-MAS-MODELS |  | Engineering |
| M@S Platform Team | GRP-ODIN-MAS-NALA-EDITORS | /content/dam/mas/nala | Engineering |













**Jira Tickets Reference:**
Click here to expand...[MWPW-162766](https://jira.corp.adobe.com/browse/MWPW-162766)
                            -
            Getting issue details...
                                                STATUS

[ODIN-173](https://jira.corp.adobe.com/browse/ODIN-173)
                            -
            Getting issue details...
                                                STATUS

[ODIN-174](https://jira.corp.adobe.com/browse/ODIN-174)
                            -
            Getting issue details...
                                                STATUS

[ODIN-175](https://jira.corp.adobe.com/browse/ODIN-175)
                            -
            Getting issue details...
                                                STATUS

[ODIN-319](https://jira.corp.adobe.com/browse/ODIN-319)
                            -
            Getting issue details...
                                                STATUS

[MWPW-169673](https://jira.corp.adobe.com/browse/MWPW-169673)
                            -
            Getting issue details...
                                                STATUS

[ODIN-384](https://jira.corp.adobe.com/browse/ODIN-384)
                            -
            Getting issue details...
                                                STATUS

[ODIN-517](https://jira.corp.adobe.com/browse/ODIN-517)
                            -
            Getting issue details...
                                                STATUS














---









# Ops & Monitoring







Used for notifications when monitoring alerts are triggered.

| Group | Roles | Approvers |
|---|---|---|
| GRP-MAS-CCD-ALERT | Core support team membersAny stakeholders with dependencies on CCD services | N/A Open Group |
| GRP-MAS-STUDIO-ALERT | Core support team membersAny stakeholders with dependencies on Studio services | N/A Open Group |
| Access to Splunk | Engineering, Ops & Support | See Splunk |





**Jira Tickets Reference:**
[MWPW-158980](https://jira.corp.adobe.com/browse/MWPW-158980)
                            -
            Getting issue details...
                                                STATUS










---









# Odin/CCD Access (Legacy Cards)

Join group to view legacy CCD cards and non-merch CCD cards.

![(warning)](/s/-gahb51/9012/1t6dj0k/_/images/icons/emoticons/warning.svg) Note that most content cannot be viewed without a parallel Sophia campaign

| Group | Roles | Approvers |
|---|---|---|
| GRP-AEMH-CCSURFACES-READ-ONLY | Any Stakeholders | N/A Open Group |













---



[ 1[Back to Top](#MerchatScale(M@S)IAMGroups&Permissions-BacktoTop) ]
	

		
						Page
							viewed 344 times
		
	
	
	
			
	




















                
        
    
        