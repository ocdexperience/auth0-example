import React from "react";
import { StyleSheet, Text, View, Button, Alert } from "react-native";
import { AuthSession } from "expo";
import * as WebBrowser from "expo-web-browser";
import jwtDecode from "jwt-decode";

/*
  You need to swap out the Auth0 client id and domain with
  the one from your Auth0 client.
  In your Auth0 client, you need to also add a url to your authorized redirect urls.

  You can open this app in the Expo client and check your logs to find out your redirect URL.
*/
const auth0ClientId = "GOlzSdOsOvjOL0jP1f6f79OWEJStxOeb";
const auth0Domain = "https://ocdexperience-engineering.auth0.com";
const returnUrl = "https://www.ocdexperience.com/";

/**
 * Converts an object to a query string.
 */
function toQueryString(params) {
  return (
    "?" +
    Object.entries(params)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join("&")
  );
}

const AuthenticatedApp = ({ name, logout }) => (
  <View style={styles.container}>
    <Text style={styles.title}>You are logged in, {name}!</Text>
    <Button title="Log out" onPress={logout} />
  </View>
);

const UnauthenticatedApp = ({ login }) => (
  <View style={styles.container}>
    <Button title="Log in with Auth0" onPress={login} />
  </View>
);

export default class App extends React.Component {
  state = {
    name: null
  };

  login = async () => {
    // Retrieve the redirect URL, add this to the callback URL list
    // of your Auth0 application.
    const redirectUrl = AuthSession.getRedirectUrl();
    console.log(`Redirect URL: ${redirectUrl}`);

    // Structure the auth parameters and URL
    const queryParams = toQueryString({
      client_id: auth0ClientId,
      redirect_uri: redirectUrl,
      response_type: "id_token", // id_token will return a JWT token
      scope: "openid profile", // retrieve the user's profile
      nonce: Math.random().toString(36) // ideally, this will be a random value
    });
    const authUrl = `${auth0Domain}/authorize` + queryParams;

    // Perform the authentication
    console.log("Authentication request")
    const response = await AuthSession.startAsync({ authUrl });
    console.log("Authentication response", response);

    if (response.type === "success") {
      this.handleResponse(response.params);
    }
  };

  logout = async () => {
    const queryParams = toQueryString({
      returnTo: returnUrl,
      client_id: auth0ClientId
    });
    const logoutUrl = `${auth0Domain}/v2/logout` + queryParams;

    // Log out
    const response = await WebBrowser.openBrowserAsync(logoutUrl);
    console.log("Logout response", response);

    if (response.type === "cancel") {
      this.setState({ name: null });
    }
  };

  handleResponse = response => {
    if (response.error) {
      Alert(
        "Authentication error",
        response.error_description || "something went wrong"
      );
      return;
    }

    // Retrieve the JWT token and decode it
    const jwtToken = response.id_token;
    const decoded = jwtDecode(jwtToken);
    // Id token format: https://auth0.com/docs/api-auth/tutorials/adoption/api-tokens#access-vs-id-tokens
    console.log("Id token", JSON.stringify(decoded, null, 2));

    const { name } = decoded;
    this.setState({ name });
  };

  render() {
    const { name } = this.state;
    return name ? (
      <AuthenticatedApp name={name} logout={this.logout} />
    ) : (
      <UnauthenticatedApp login={this.login} />
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    fontSize: 20,
    textAlign: "center",
    marginTop: 40
  }
});
