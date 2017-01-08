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
                    <title>{this.props.title}</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
                    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-alpha.6/css/bootstrap.min.css" crossOrigin="anonymous" />
                </head>
                <body style={{ paddingTop: "60px" }}>
                    <nav className="navbar navbar-toggleable-md navbar-inverse fixed-top bg-inverse">
                        <button className="navbar-toggler navbar-toggler-right hidden-lg-up" type="button" data-toggle="collapse" data-target="#taistoNavBar" aria-controls="taistoNavBar" aria-expanded="false" aria-label="Toggle navigation">
                            <span className="navbar-toggler-icon"></span>
                        </button>
                        <a className="navbar-brand" href="/">Taisto</a>

                        <div className="collapse navbar-collapse" id="taistoNavBar">
                            <ul className="navbar-nav mr-auto">
                                <li className="nav-item active">
                                    <a className="nav-link" href="/">Kaaviot</a>
                                </li>
                                <li className="nav-item active">
                                    <a className="nav-link" href="/promode">Promode<span className="sr-only">(current)</span></a>
                                </li>
                                <li className="nav-item">
                                    <a className="nav-link" href="/settings">Asetukset</a>
                                </li>
                                <li className="nav-item">
                                    <a className="nav-link" href="#">Apua</a>
                                </li>
                            </ul>
                            <a>
                                Kirjaudu
                            </a>
                            <form className="form-inline my-2 my-md-0">
                                <select className="form-control">
                                    <option>Suomi</option>
                                    <option>Ruotsi</option>
                                </select>
                            </form>
                        </div>
                    </nav>
                    <div className="container-fuid" id="root" dangerouslySetInnerHTML={{__html: this.props.content}}></div>
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