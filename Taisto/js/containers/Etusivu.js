import React from 'react';
import ReactDOM from 'react-dom';
import { graphql } from 'react-apollo';
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

// export default connect(
//     store => {
//         return {

//         };
//     }
// )(
//     class extends React.Component {
//         componentDidMount() {
//             console.log(`http://${location.hostname}:${location.port}/.`);
//             var socket = io(`http://${location.hostname}:${location.port}`);
//             socket.on("connect", function () {

//             });
//         }
//     render() {
//         return (
//             <EtusivuComponent links={[
//                 {
//                     name: "Ylasali"
//                 },
//                 {
//                     name: "Alasali"
//                 }
//             ]} />
//         )
//     }
// });