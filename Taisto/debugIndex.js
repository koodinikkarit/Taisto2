

module.exports = function render(locals) {
	console.log(locals.path);
  return Promise.resolve(
`<!DOCTYPE>
<html>
    <head>
    	<title>Taisto</title>
    </head>
	<body>
    	<div id="root"></div>
        <script src="/app.js"></script>
		<script src="/webpack-dev-server.js"></script>
	</body>
</html>`);
};