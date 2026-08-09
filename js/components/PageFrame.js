import React from 'react';

export default class extends React.Component {
    render() {

        var styles = {
            dropdown: {
                position: "relative"
            }
        };

        return (
            <html>
                <head>
					<meta charSet="utf-8" />
                    <title>{this.props.title}</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
                    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-alpha.6/css/bootstrap.min.css" crossOrigin="anonymous" />
					<link rel="stylesheet" href="/static/theme.css?v=2" />
                </head>
                <body style={{ paddingTop: "72px" }}>
                    <div className="container-fluid taisto-app" id="root" dangerouslySetInnerHTML={{__html: this.props.content}}></div>
                    <script dangerouslySetInnerHTML={{
                        __html: `window.__APOLLO_STATE__=${JSON.stringify(this.props.state)};`,
                    }} />                  
                    <script src="/socket.io/socket.io.js"></script>
                    <script src="https://code.jquery.com/jquery-3.1.1.slim.min.js" crossOrigin="anonymous"></script>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/tether/1.4.0/js/tether.min.js" crossOrigin="anonymous"></script>
                    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-alpha.6/js/bootstrap.min.js" crossOrigin="anonymous"></script>
                    <script src="/js/app.js"></script>
                </body>
            </html>
        )
    }
}

//<script src="/socket.io/socket.io.js"></script>

                    // {this.props.dev ? <script src="/webpack-dev-server.js"></script> : ""}
