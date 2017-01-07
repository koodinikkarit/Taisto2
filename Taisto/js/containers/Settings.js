import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import Settings from "../components/Settings";

export default graphql(gql`
query {
  diagrams {
    id,
    slug
  }
}`, {

})(Settings);

// export default connect(
//     store => {
//         return {

//         };
//     }
// )(class extends React.Component {
//     render() {
//         return (
//             <h1>terve</h1>
//         )
//     }
// });