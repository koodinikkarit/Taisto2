import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import Promode from "../components/Promode";

export default graphql(gql`
query {
    matrixs {
        id
        slug
        conPorts {
            id
            portNum
        }
        cpuPorts {
            id
            portNum
        }
    }
}
`, {
        props: ({ ownProps, data: { matrixs }}) => ({
            matrixs
        })
})(Promode);


// export default connect(
//     store => {
//         return {

//         };
//     }
// )(class extends React.Component {
//     render() {
//         return (
//             <div>
//                 <Promode />
//             </div>
//         )
//     }
//     });

