# M@S TROUBLESHOOTING GUIDE

## COMMON ISSUES & SOLUTIONS

### Studio Access Issues

**Problem: "Cannot log in to M@S Studio"**

**Symptoms:**
- Login button does nothing
- Redirect loop
- 401/403 errors
- Blank white screen

**Solutions:**
1. **Check IAM Groups:**
   - Go to https://iam.corp.adobe.com
   - Verify membership in GRP-AEMCMS-MAS-STUDIO-USERS-PROD
   - Verify surface-specific group (acom, ccd, adobe-home, commerce)
   - If not a member, request access

2. **Clear Browser Data:**
   - Clear cookies for adobe.com domain
   - Clear sessionStorage
   - Hard refresh (Cmd+Shift+R or Ctrl+Shift+F5)

3. **Check IMS Token:**
   - Open browser DevTools → Application → Session Storage
   - Look for \