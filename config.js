// -------------------------------------------------------------------
// Fill in your actual Azure values before deploying.
// None of these values are secrets - they are safe to commit.
// -------------------------------------------------------------------
export const config = {
  auth: {
    // Azure AD App Registration -> Application (client) ID
    clientId: '86c0d36d-d033-4d5d-b2e2-e77dac3a10aa',
    // Azure AD App Registration -> Directory (tenant) ID
    tenantId: '4a6d4bca-b218-44cb-9f2c-3f14b499f6e7',
    // Must match a Redirect URI registered in your Azure AD app.
    // Add both of these in Azure AD -> Authentication -> SPA redirect URIs:
    //   https://timereporting.polarflows.com/
    //   http://localhost:8000/
    redirectUri: 'http://localhost:8000/',
  },
  sharePoint: {
    // Run these once in the browser console (after login) to find your IDs:
    //
    //   Step 1 - siteId:
    //   fetch('https://graph.microsoft.com/v1.0/sites/polarflows.sharepoint.com:/sites/PolarFlowsAB',
    //         { headers: { Authorization: 'Bearer ' + token } })
    //     .then(r => r.json()).then(console.log)
    //
    //   Step 2 - driveId:
    //   fetch('https://graph.microsoft.com/v1.0/sites/<siteId>/drives',
    //         { headers: { Authorization: 'Bearer ' + token } })
    //     .then(r => r.json()).then(console.log)
    //
    //   token = await (await import('./auth.js')).getToken()

    siteId:  'polarflows.sharepoint.com,c46c55f8-4052-421e-8640-92f85b824f13,b0e82982-bb95-4354-99ae-bcb3a3abeb51',
    driveId: 'b!-FVsxFJAHkKGQJL4W4JPE4Ip6LCVu1RDma68s6Or61H6Qx3c4O0uTZNYJ5YFgZGA',

    // Path inside the drive where the app's folders live.
    // No leading or trailing slash.
    // Examples: 'TimeReporting'  or  'Documents/TimeReporting'
    rootPath: 'General/Time Reporting/backend',
  },
};
