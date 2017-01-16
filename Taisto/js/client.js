import ApolloClient, { createNetworkInterface } from 'apollo-client';

export default new ApolloClient({
	dataIdFromObject: o => {
		console.log("o", o, `${o.__typename}-${o.id},`);
		 return `${o.__typename}-${o.id},`
	},
	initialState: window.__APOLLO_STATE__,
	networkInterface: createNetworkInterface({ uri: `http://${location.hostname}:${location.port}/api` }),
});