import React from "react";
import { gql, useMutation } from "@apollo/client";
import { useI18n } from "../i18n";

const EXECUTE_CON_GROUP = gql`
  mutation executeConGroup($id: String!, $cpuPortId: String!) {
    executeConGroup(id: $id, cpuPortId: $cpuPortId)
  }
`;

const request = async url => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

export default function ConGroupRunner() {
  const { t } = useI18n();
  const [executeConGroup] = useMutation(EXECUTE_CON_GROUP);
  const [groups, setGroups] = React.useState([]);
  const [selectedInputs, setSelectedInputs] = React.useState({});
  const [statuses, setStatuses] = React.useState({});
  const [executing, setExecuting] = React.useState("");
  const [cooldowns, setCooldowns] = React.useState({});
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const selectedInputsRef = React.useRef(selectedInputs);
  const groupsRef = React.useRef(groups);
  const cooldownsRef = React.useRef({});
  const cooldownTimersRef = React.useRef([]);

  React.useEffect(() => { selectedInputsRef.current = selectedInputs; }, [selectedInputs]);
  React.useEffect(() => () => cooldownTimersRef.current.forEach(clearTimeout), []);

  const refreshStatuses = React.useCallback(async () => {
    const selections = groupsRef.current.map(group => [
      String(group.id),
      selectedInputsRef.current[group.id] || (group.cpuPorts[0] && group.cpuPorts[0].id)
    ]).filter(([, cpuPortId]) => cpuPortId);
    if (!selections.length) return;
    const results = await Promise.all(selections.map(async ([groupId, cpuPortId]) => {
      try {
        const status = await request(`/rest/con-groups/${encodeURIComponent(groupId)}/status?cpuPortId=${encodeURIComponent(cpuPortId)}`);
        return [groupId, status];
      } catch (_) {
        return [groupId, null];
      }
    }));
    setStatuses(current => ({ ...current, ...Object.fromEntries(results) }));
  }, []);

  React.useEffect(() => {
    let active = true;
    request("/rest/con-groups")
      .then(loadedGroups => {
        if (!active) return;
        const nextGroups = Array.isArray(loadedGroups) ? loadedGroups : [];
        groupsRef.current = nextGroups;
        setGroups(nextGroups);
        setLoading(false);
        refreshStatuses();
      })
      .catch(loadError => {
        if (!active) return;
        setError(loadError.message);
        setLoading(false);
      });
    const timer = setInterval(refreshStatuses, 1500);
    return () => { active = false; clearInterval(timer); };
  }, [refreshStatuses]);

  const execute = async group => {
    const cpuPortId = selectedInputs[group.id];
    if (!cpuPortId) return setError(t("selectInput"));
    if (cooldownsRef.current[group.id]) return;
    cooldownsRef.current = { ...cooldownsRef.current, [group.id]: true };
    setCooldowns(cooldownsRef.current);
    cooldownTimersRef.current.push(setTimeout(() => {
      const nextCooldowns = { ...cooldownsRef.current };
      delete nextCooldowns[group.id];
      cooldownsRef.current = nextCooldowns;
      setCooldowns(nextCooldowns);
    }, 2000));
    setExecuting(group.id);
    setError("");
    setStatuses(current => { const next = { ...current }; delete next[group.id]; return next; });
    try {
      const result = await executeConGroup({ variables: { id: String(group.id), cpuPortId: String(cpuPortId) } });
      if (!result.data || result.data.executeConGroup !== true) throw new Error(t("executionFailed"));
      setTimeout(refreshStatuses, 400);
    } catch (executeError) {
      setError(executeError.message);
    } finally {
      setExecuting("");
    }
  };

  return <main className="taisto-runner-page">
    <header className="jumbotron taisto-runner-hero">
      <h1>{t("outputGroups")}</h1>
      <p>{t("outputGroupsIntro")}</p>
    </header>
    {error && <div className="alert alert-danger">{error}</div>}
    <div className="taisto-runner-grid">{groups.map(group => {
      const selectedInput = selectedInputs[group.id] || "";
      const selectedPort = group.cpuPorts.find(port => String(port.id) === String(selectedInput));
      const groupStatus = statuses[group.id];
      const hasStatus = Boolean(groupStatus);
      const statusClass = !selectedInput || !hasStatus ? "is-idle" : (groupStatus.active ? "is-on" : "is-off");
      const statusText = !selectedInput ? t("selectInputForStatus") : (!hasStatus ? t("refreshing") : (groupStatus.active ? t("activeForSelectedInput") : t("inactiveForSelectedInput")));
      const currentInputText = !hasStatus ? t("refreshing") : (groupStatus.currentInputStatus === "single" && groupStatus.currentCpuPort ? `${groupStatus.currentCpuPort.portNum}. ${groupStatus.currentCpuPort.slug || `Input ${groupStatus.currentCpuPort.portNum}`}` : (groupStatus.currentInputStatus === "mixed" ? t("mixedActiveInputs") : t("unknownActiveInput")));
      const currentInputClass = !hasStatus ? "is-pending" : (groupStatus.currentInputStatus === "single" ? "is-known" : "is-mixed");
      return <article className="taisto-runner-card" key={group.id}>
        <div className="taisto-runner-card-header">
          <h2>{group.slug}</h2>
          <span className={`taisto-runner-status ${statusClass}`}><span className="taisto-runner-status-dot" aria-hidden="true" />{statusText}</span>
        </div>
        <section className="taisto-runner-output-section">
          <div className="taisto-runner-section-title"><span>{t("outputListLabel")}</span><span className="taisto-runner-count">{group.conPorts.length}</span></div>
          <ul className="taisto-runner-output-list">{group.conPorts.map(port => <li key={port.id}><span className="taisto-runner-port-number">{port.portNum}</span><span>{port.slug || `Output ${port.portNum}`}</span></li>)}</ul>
        </section>
        <div className={`taisto-runner-active-input ${currentInputClass}`}><span>{t("currentActiveInputLabel")}</span><strong>{currentInputText}</strong></div>
        {selectedPort && <div className="taisto-runner-selected-input"><span>{t("selectedInputLabel")}</span><strong>{selectedPort.portNum}. {selectedPort.slug || `Input ${selectedPort.portNum}`}</strong></div>}
        <label htmlFor={`output-group-input-${group.id}`}>{t("selectInput")}</label>
        <select id={`output-group-input-${group.id}`} className="form-control" value={selectedInput} onChange={event => {
          const cpuPortId = event.target.value;
          const nextSelections = { ...selectedInputsRef.current, [group.id]: cpuPortId };
          selectedInputsRef.current = nextSelections;
          setSelectedInputs(nextSelections);
          setStatuses(current => { const next = { ...current }; delete next[group.id]; return next; });
          setTimeout(refreshStatuses, 0);
        }}>
          <option value="">{t("selectInput")}</option>
          {group.cpuPorts.map(port => <option key={port.id} value={port.id}>{port.portNum}. {port.slug || `Input ${port.portNum}`}</option>)}
        </select>
        <button className="btn btn-primary btn-block" disabled={!selectedInput || executing === group.id || cooldowns[group.id]} onClick={() => execute(group)}>{executing === group.id ? t("executing") : (cooldowns[group.id] ? t("wait") : t("execute"))}</button>
      </article>;
    })}</div>
    {loading && <div className="taisto-runner-empty">{t("refreshing")}</div>}
    {!loading && !groups.length && !error && <div className="taisto-runner-empty">{t("noOutputGroups")}</div>}
  </main>;
}
