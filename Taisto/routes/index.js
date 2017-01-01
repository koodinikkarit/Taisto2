const express = require('express');
const router = express.Router();
const React = require('react');
const ReactDOMServer = require('react-dom/server');

import PageFrame from "../js/components/PageFrame";
import Etusivu from "../js/containers/EtusivuContainer";

function createPageString(component) {
    console.log(component);
    return `
<!DOCTYPE>
${ReactDOMServer.renderToStaticMarkup(component)}
`;
}

router.get('/', function (req, res, next) {
    res.set({
        "content-type": "text/html"
    });
    res.end(createPageString(<PageFrame title="Taisto" />));
});

router.get('/diagram/*', function (req, res, next) {
    res.set({
        "content-type": "text/html"
    });
    res.end(createPageString(<PageFrame title="Taisto" />));
});

router.get('/promode', function (req, res, next) {
    res.set({
        "content-type": "text/html"
    });
    res.end(createPageString(<PageFrame title="Taisto" />));
});

router.get('/settings', function(req, res, next) {
    res.set({
        "content-type": "text/html"
    });
    res.end(createPageString(<PageFrame title="Taisto" />));
});
module.exports = router;