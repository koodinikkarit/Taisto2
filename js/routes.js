import React from "react";
import {Route, IndexRoute} from "react-router";

import DiagramSettings from "./components/DiagramSettings";
import Diagram from "./components/Diagram";
import Etusivu from "./containers/Etusivu";
import Promode from "./components/Promode";
import Settings from "./containers/Settings";
import NotFound from "./components/404";

import MatrixSettings from "./components/MatrixSettings";
import MatrixList from "./components/MatrixList";
import TimerList from "./containers/TimerList";
import LockList from "./containers/LockList";
import DefaultStatesSettingsList from "./components/DefaultStatesSettingsList";
import DiagramList from "./components/DiagramList";
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
			<Route path="/settings/matriisi/:slug" component={MatrixSettings} />
			<Route path="/settings/matriisit" component={MatrixList} />
			<Route path="/settings/timers" component={TimerList} />
			<Route path="/settings/locks" component={LockList} />
			<Route path="/settings/oletustilat" component={DefaultStatesSettingsList} />
			<Route path="/settings/diagram/:slug" component={DiagramSettings} />
			<Route path="/settings/diagrams" component={DiagramList} />
			<Route path="/settings/translations" component={TranslationList} />
		</Route>
		<Route path="/"  component={Etusivu}/>
		<Route path="*" component={NotFound} />
	</Route>
);