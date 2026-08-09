import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

export default new ApolloClient({
  cache: new InMemoryCache().restore(window.__APOLLO_STATE__ || {}),
  link: new HttpLink({ uri: "/api" })
});
