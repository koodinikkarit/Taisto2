import React from 'react';

export default class extends React.Component {
    render() {
        return (
            <html>
                <head> 
                    <title>{this.props.title}</title>
                </head>
                <body>
                    <div id="root"></div>
                    <script src="/js/app.js"></script>
                    <script src="/webpack-dev-server.js"></script>
                </body>
            </html>
        )
    }
}