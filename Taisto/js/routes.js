import React from "react";
import {Route, IndexRoute} from "react-router";

import Diagram from "./containers/Diagram";
import Etusivu from "./containers/Etusivu";
import Promode from "./containers/Promode";
import Settings from "./containers/Settings";
import NotFound from "./components/404";

export default (
	<Route>
		<Route path="/diagram/:slug" component={Diagram} />
		<Route path="/promode" component={Promode}>
			<Route path="/promode/:slug" component={Promode}>
				<Route path="/promode/:slug/:mode" component={Promode} />
				<Route path="/promode/:slug/:mode" component={Promode} />
			</Route>
		</Route>
		<Route path="/settings" component={Settings} />
		<Route path="/"  component={Etusivu}/>
		<Route path="*" component={NotFound} />
	</Route>
);