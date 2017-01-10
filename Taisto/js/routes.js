import React from "react";
import {Route, IndexRoute} from "react-router";

import Diagram from "./containers/Diagram";
import Etusivu from "./containers/Etusivu";
import Promode from "./containers/Promode";
import Settings from "./containers/Settings";
import NotFound from "./components/404";

import MatrixList from "./containers/MatrixList";
import TimerList from "./containers/TimerList";
import LockList from "./containers/LockList";
import DefaultStates from "./containers/DefaultStates";
import DiagramList from "./containers/DiagramList";
import TranslationList from "./containers/TranslationList";

export default (
	<Route>
		<Route path="/diagram/:slug" component={Diagram} />
		<Route path="/promode" component={Promode}>
			<Route path="/promode/:slug" component={Promode}>
				<Route path="/promode/:slug/:mode" component={Promode} />
				<Route path="/promode/:slug/:mode" component={Promode} />
			</Route>
		</Route>
		<Route>
			<Route path="/settings" component={MatrixList} />
			<Route path="/settings/matriisit" component={MatrixList} />
			<Route path="/settings/timers" component={TimerList} />
			<Route path="/settings/locks" component={LockList} />
			<Route path="/settings/oletustilat" component={DefaultStates} />
			<Route path="/settings/diagrams" component={DiagramList} />
			<Route path="/settings/translations" component={TranslationList} />
		</Route>
		<Route path="/"  component={Etusivu}/>
		<Route path="*" component={NotFound} />
	</Route>
);