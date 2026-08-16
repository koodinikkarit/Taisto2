import React from "react";
import { Route, Switch } from "react-router-dom";

import DiagramSettings from "./components/DiagramSettings";
import Diagram from "./components/Diagram";
import Etusivu from "./containers/Etusivu";
import Promode from "./components/Promode";
import NotFound from "./components/404";
import DefaultStatesList from "./components/DefaultStatesList";
import MatrixSettings from "./components/MatrixSettings";
import MatrixList from "./components/MatrixList";
import TimerList from "./components/TimerList";
import LockList from "./containers/LockList";
import DefaultStatesSettings from "./components/DefaultStateSettings";
import DefaultStatesSettingsList from "./components/DefaultStatesSettingsList";
import DiagramList from "./components/DiagramList";
import TranslationList from "./containers/TranslationList";
import Help from "./components/Help";
import ConGroupList from "./components/ConGroupList";
import ApiKeySettings from "./components/ApiKeySettings";
import AuditLogs from "./components/AuditLogs";
import ConGroupRunner from "./components/ConGroupRunner";

export default function Routes() {
  return (
    <Switch>
      <Route exact path="/diagram/:slug" component={Diagram} />
      <Route exact path="/promode/:slug/:mode" component={Promode} />
      <Route exact path="/promode/:slug" component={Promode} />
      <Route exact path="/promode" component={Promode} />
      <Route exact path="/oletustilat" component={DefaultStatesList} />
      <Route exact path="/output-groups" component={ConGroupRunner} />
      <Route exact path="/settings/matriisi/:slug" component={MatrixSettings} />
      <Route exact path="/settings/matriisit" component={MatrixList} />
      <Route exact path="/settings/timers" component={TimerList} />
      <Route exact path="/settings/locks" component={LockList} />
      <Route exact path="/settings/oletustila/:slug" component={DefaultStatesSettings} />
      <Route exact path="/settings/oletustilat" component={DefaultStatesSettingsList} />
	  <Route exact path="/settings/output-groups" component={ConGroupList} />
	  <Route exact path="/settings/api-key" component={ApiKeySettings} />
	  <Route exact path="/settings/audit-logs" component={AuditLogs} />
      <Route exact path="/settings/diagram/:slug" component={DiagramSettings} />
      <Route exact path="/settings/diagrams" component={DiagramList} />
      <Route exact path="/settings/translations" component={TranslationList} />
      <Route exact path="/apua" component={Help} />
      <Route exact path="/settings" component={MatrixList} />
      <Route exact path="/" component={Etusivu} />
      <Route component={NotFound} />
    </Switch>
  );
}
