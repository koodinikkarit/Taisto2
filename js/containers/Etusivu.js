import React from 'react';
import { graphql } from '@apollo/client/react/hoc';
import gql from 'graphql-tag';

import Etusivu from "../components/Etusivu";


export default graphql(gql`
query {
  diagrams {
    id,
    slug
  }
}
`, {
    props: ({ ownProps, data: { diagrams } }) => ({
        diagrams
    })
})(Etusivu);