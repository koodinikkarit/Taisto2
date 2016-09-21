import React from 'react';

var Button = require('react-bootstrap').Button;
var Link = require('react-router').Link;

var PageLayout = require('./PageLayout');


class Matrixs extends React.Component {

    render() {
        return (
            <PageLayout header="Matriisit">
                <Link style={{ clear: "both" }} to={"/matriisi"}><Button>Yhdistä matriisi</Button></Link>
                <Matrix />
            </PageLayout>
        )
    }
}

class Matrix extends React.Component {
    render() {


        return (
            <div>
                <h3>Matriisi1</h3>
                <h4>Cpu portit</h4>
                <div>
                   <input value="asda" /> 
                </div>
                <div>

                </div>
                <h4>Con portit</h4>
            </div>
        )
    }
}

module.exports = Matrixs;