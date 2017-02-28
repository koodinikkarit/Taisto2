import React from 'react';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

import Settings from "../containers/Settings";

class DefaultStateSettings extends React.Component {
    constructor(props) {
        super(props);

    }

    render() {
        return (
            <Settings>
                {this.props.defaultState ? this.props.defaultState.slug : ""}
            </Settings>
        )
    }
}


export default compose(
    graphql(gql`
    query defaultState($slug: String!) {
        defaultState: defaultStateBySlug(slug: $slug) {
            id
            slug
        }
    }`, {
        options: (ownProps) => ({
            variables: {
                slug: ownProps.params.slug
            }
        }),
        props: ({ ownProps, data: { defaultState } }) => ({
            defaultState
        })
    })
)(DefaultStateSettings);