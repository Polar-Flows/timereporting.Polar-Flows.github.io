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
    //   https://www.polarflows.com/timereport/
    //   http://localhost:8000/timereport/
    redirectUri: 'http://localhost:8000/',
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
