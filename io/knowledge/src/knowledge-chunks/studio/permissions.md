# Studio Permissions and Access Control

## Overview

MAS Studio uses Adobe's IAM (Identity and Access Management) system to control who can view and edit content on each surface. Access is granted through Odin IAM group memberships, following a per-surface editor model.

## IAM Group Pattern

Every surface in MAS Studio has a dedicated editor group following this naming convention:

```
GRP-ODIN-MAS-{SURFACE}-EDITORS
```

### Surface Editor Groups

| Surface | IAM Group |
|---------|-----------|
| Adobe.com | GRP-ODIN-MAS-ACOM-EDITORS |
| Creative Cloud Desktop | GRP-ODIN-MAS-CCD-EDITORS |
| Express | GRP-ODIN-MAS-EXPRESS-EDITORS |
| Commerce | GRP-ODIN-MAS-COMMERCE-EDITORS |
| Adobe Home | GRP-ODIN-MAS-AH-EDITORS |

Each group grants read and write access to the corresponding surface folder in Studio. A user who belongs to GRP-ODIN-MAS-ACOM-EDITORS can view, create, edit, and publish cards under the acom surface, but cannot see or modify cards on other surfaces unless they also belong to those groups.

## Power Users and Admins

Two elevated groups exist for users who need cross-surface visibility:

### GRP-ODIN-MAS-POWERUSERS

- Can view and edit content across all surfaces
- Intended for team leads, QA engineers, and cross-functional collaborators
- Does not grant administrative configuration access

### GRP-ODIN-MAS-ADMINS

- Full access to all surfaces and all Studio features
- Can manage settings, configurations, and advanced operations
- Intended for MAS platform engineers and administrators

Both power user and admin groups bypass the per-surface filtering, showing all surfaces in the Studio navigation panel.

## How Surface Filtering Works

When a user logs into MAS Studio:

1. Studio authenticates via IMS (Adobe Identity Management Service)
2. The user's IMS profile includes their IAM group memberships
3. Studio reads these group memberships to determine which surfaces to display
4. Only surfaces matching the user's groups appear in the left navigation
5. API requests are scoped to the user's permitted surfaces

A regular user sees only their assigned surfaces. A power user or admin sees all surfaces.

## Requesting Access

To gain access to a surface in MAS Studio:

1. Go to the Odin IAM portal at https://iam.corp.adobe.com
2. Search for the appropriate group (e.g., GRP-ODIN-MAS-ACOM-EDITORS)
3. Click "Subscribe" to request membership
4. Wait for group admin approval
5. Once approved, log out and back into Studio to pick up the new group membership

Access requests typically require manager approval. For urgent requests, reach out in the #merch-at-scale Slack channel.

## Common Access Issues

### "I can't see any cards"

This is the most frequently reported issue. Common causes:

1. **Missing IAM group**: The user has not subscribed to any surface editor group. Solution: subscribe to the appropriate GRP-ODIN-MAS-{SURFACE}-EDITORS group via Odin.
2. **Wrong org or profile**: The user is logged in with a personal Adobe ID instead of their corporate account, or is signed into the wrong org. Solution: sign out, then sign back in with corporate credentials and select the correct organization.
3. **Group not yet propagated**: IAM group changes can take up to 30 minutes to propagate. Solution: wait and try again, or clear browser cache and re-authenticate.
4. **Expired IMS token**: The authentication token may have expired during a long session. Solution: sign out and sign back in.

### "I can see cards but can't edit them"

- Verify you have EDITORS group membership, not just a read-only group
- Check that the fragment is not locked by another user (ETag conflict)
- Ensure you are looking at the correct landscape (DRAFT vs PUBLISHED)

### "I can only see some surfaces"

This is expected behavior for regular users. You only see surfaces for which you have an editor group membership. If you need access to additional surfaces, subscribe to the corresponding IAM group.

### "Cards are visible but actions fail"

- Your IMS token may need refreshing (sign out and back in)
- CSRF token may have expired; Studio auto-refreshes these on 403 errors
- Check browser console for specific error messages

## Surface-Specific Access Details

### Adobe.com (ACOM)

- Group: GRP-ODIN-MAS-ACOM-EDITORS
- Content path: /content/dam/mas/acom/
- Largest surface with the most active editors
- Cards appear on adobe.com product pages via the Milo framework

### Creative Cloud Desktop (CCD)

- Group: GRP-ODIN-MAS-CCD-EDITORS
- Content path: /content/dam/mas/ccd/
- Cards render in the Creative Cloud Desktop application
- Supports CCD-specific variants: ccd-slice, ccd-suggested

### Express

- Group: GRP-ODIN-MAS-EXPRESS-EDITORS
- Content path: /content/dam/mas/express/
- Cards render on Adobe Express web surfaces
- Uses simplified-pricing and full-pricing-express variants

### Commerce

- Group: GRP-ODIN-MAS-COMMERCE-EDITORS
- Content path: /content/dam/mas/commerce/
- Cards appear in the unified checkout recommendation flow
- Typically managed by a smaller, focused team

### Adobe Home

- Group: GRP-ODIN-MAS-AH-EDITORS
- Content path: /content/dam/mas/adobe-home/
- Cards render in the Adobe Home application
- Supports ah-promoted-plans and ah-try-buy-widget variants

## IMS Authentication Flow

1. User clicks "Sign in with Adobe ID" in Studio
2. Studio redirects to IMS login page
3. User authenticates with corporate credentials
4. IMS returns an access token containing user profile and group memberships
5. Studio stores the token and uses it for all AEM API requests
6. Token auto-refreshes before expiration during active sessions

## Best Practices

- Subscribe only to the surface groups you actively work with
- If you change roles or teams, update your IAM group subscriptions
- When onboarding new team members, ensure they subscribe to the correct groups before their first Studio session
- Use #merch-at-scale Slack for access troubleshooting
- Never share IMS tokens or attempt to bypass group-based access controls
