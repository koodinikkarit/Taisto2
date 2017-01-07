import React from "react";
import {Route} from "react-router";

import Diagram from "./containers/Diagram";
import Etusivu from "./containers/Etusivu";
import Promode from "./containers/Promode";
import Settings from "./containers/Settings";

export default (
	<Route>
		<Route path="/diagram/:slug" component={Diagram} />
		<Route path="/promode" component={Promode} />
		<Route path="/settings" component={Settings} />
		<Route path="/"  component={Etusivu}/>
	</Route>
);