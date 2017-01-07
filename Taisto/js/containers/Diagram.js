import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import Diagram from "../components/Diagram";

export default graphql(gql`
query ($slug: String!) {
    diagram(slug: $slug) {
        id
        diagramScreens {
            id
            name
            conPort {
                id
                conNum
            }
            cpuPorts {
                id
                cpuNum
            }
        }
    }
}`, {
        options: (ownProps) => ({
            variables: {
                slug: ownProps.params.slug
            }
        }),
        props: ({ ownProps, data: { diagram } }) => ({
            diagram
        })
})(Diagram);

// export default connect(
//     store => {
//         return {

//         };
//     }
// )(class extends React.Component {
//     render() {
//         return (
//             <div>
//                 <h1>terve {this.props.params.diagramid}</h1>
//                 <CustomableDiagram aspectRatio={16/9} />
//             </div>
//         )
//     }
// });