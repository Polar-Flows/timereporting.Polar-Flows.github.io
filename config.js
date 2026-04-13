// -------------------------------------------------------------------
// Fill in your actual Azure values before deploying.
// None of these values are secrets - they are safe to commit.
// -------------------------------------------------------------------
export const config = {
  auth: {
    // Azure AD App Registration -> Application (client) ID
    clientId: 'YOUR_CLIENT_ID',
    // Azure AD App Registration -> Directory (tenant) ID
    tenantId: 'YOUR_TENANT_ID',
    // Must match a Redirect URI registered in your Azure AD app.
    // Add both of these in Azure AD -> Authentication -> SPA redirect URIs:
    //   https://www.polarflows.com/timereport/
    //   http://localhost:8000/timereport/
    redirectUri: 'https://www.polarflows.com/timereport/',
  },
  adminStorage: {
    // Storage account name only (e.g. 'timereportadmin'), not the full URL
    accountName: 'stpolarfwebsiteprod001',
    containerName: 'config',
  },
  dataStorage: {
    // Storage account name only (e.g. 'timereportdata'), not the full URL
    accountName: 'stpolarfwebsiteprod001',
    containerName: 'entries',
  },
};
