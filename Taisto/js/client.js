import ApolloClient, { createNetworkInterface } from 'apollo-client';

export default new ApolloClient({
	initialState: window.__APOLLO_STATE__,
	networkInterface: createNetworkInterface({ uri: `http://${location.hostname}:${location.port}/api` }),
});