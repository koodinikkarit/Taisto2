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
                    
                    {this.props.dev ? <script src="/webpack-dev-server.js"></script> : ""}
                    {this.props.dev ? <script src="/js/app.js"></script> : <script src="/app.js"></script>}
                    
                </body>
            </html>
        )
    }
}