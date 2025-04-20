// Auth0 configuration
export const auth0Config = {
  domain: "dev-27v38h2hsx2b0fle.us.auth0.com",
  clientId: "ybr650BKCqxDWpT5m9RBdra3KagU2UOs",
  authorizationParams: {
    redirect_uri: window.location.origin,
    scope: "openid profile email"
  }
};