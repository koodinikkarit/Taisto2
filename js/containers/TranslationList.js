import React from 'react';
import { graphql } from '@apollo/client/react/hoc';
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