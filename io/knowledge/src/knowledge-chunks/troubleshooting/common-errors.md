# Common Errors & Solutions

## Authentication Errors

### 401 Unauthorized
**Cause**: IMS token expired or invalid

**Solutions**:
1. Refresh the page to get new token
2. Sign out and sign back in
3. Clear browser cookies and re-authenticate
4. Check if IMS service is available

### 403 Forbidden
**Cause**: Insufficient permissions

**Solutions**:
1. Verify user has edit permissions for the path
2. Check Admin Console for correct product profile
3. Contact admin to grant fragment editing access

## Fragment Errors

### 404 Fragment Not Found
**Causes**:
- Fragment was deleted
- Path is incorrect
- Wrong environment (stage vs prod)

**Solutions**:
1. Verify fragment exists in AEM
2. Check the full fragment path
3. Ensure you're on correct environment

### 409 Conflict / ETag Mismatch
**Cause**: Fragment was modified by another user

**Solutions**:
1. Refresh to get latest version
2. Review changes made by other user
3. Re-apply your changes
4. Use version history if needed

## CORS Errors

### Cross-Origin Request Blocked
**Cause**: Browser blocking cross-origin requests

**Solutions**:
1. Use approved domains only
2. Check CORS configuration in AEM
3. Ensure proper headers are set
4. Use proxy for local development

## Pricing/WCS Errors

### Prices Not Loading
**Causes**:
- Invalid OSI code
- WCS service unavailable
- Network timeout

**Solutions**:
1. Verify OSI code exists
2. Check WCS service status
3. Try different network
4. Clear browser cache

### Wrong Currency Displayed
**Cause**: Locale mismatch

**Solutions**:
1. Check fragment locale path
2. Verify locale parameter in URL
3. Ensure WCS supports the locale

## Save Errors

### Save Failed - Network Error
**Causes**:
- Connection lost
- Server timeout
- Large payload

**Solutions**:
1. Check internet connection
2. Try saving smaller changes
3. Refresh and retry
4. Check AEM service status

### Validation Error on Save
**Cause**: Required fields missing or invalid

**Solutions**:
1. Review highlighted error fields
2. Fill in required fields
3. Fix invalid values
4. Check field format requirements

## Preview Errors

### Preview Not Updating
**Causes**:
- Cache issues
- JavaScript errors
- Component not loaded

**Solutions**:
1. Hard refresh (Cmd+Shift+R)
2. Check browser console for errors
3. Clear browser cache
4. Verify component is registered

## Variation Errors

### Cannot Create Variation
**Causes**:
- Variation already exists
- Wrong locale selected
- Parent fragment issue

**Solutions**:
1. Check if variation exists for locale
2. Select same-language locale only
3. Verify parent fragment is valid

### Inherited Values Not Showing
**Cause**: Override exists for field

**Solutions**:
1. Reset field to inherit
2. Check variation vs parent values
3. Verify parent fragment content
