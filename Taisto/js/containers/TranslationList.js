import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';


import TranslationList from "../components/TranslationList";

export default graphql(gql`
query {
	translations {
		id
	}	
}
`, { 
	
})(TranslationList);