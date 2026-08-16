import React from "react";
import Settings from "../containers/Settings";
import { I18nContext } from "../i18n";

const request = async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error && body.error.message ? body.error.message : "");
  }
  return response.status === 204 ? null : response.json();
};

export default class ConGroupList extends React.Component {
  static contextType = I18nContext;
  state = { groups: [], matrices: [], selectedMatrixId: "", slug: "", selectedPorts: [], useAllInputs: true, selectedInputPorts: [], groupUseAllInputs: {}, groupSelectedInputPorts: {}, executeInputs: {}, error: "", loading: true };

  componentDidMount() { this.load(); }

  async load() {
    try {
      const [groups, matrices] = await Promise.all([request("/rest/con-groups"), request("/rest/matrices")]);
      const groupUseAllInputs = {};
      const groupSelectedInputPorts = {};
      groups.forEach(group => {
        groupUseAllInputs[group.id] = group.useAllCpuPorts !== false;
        groupSelectedInputPorts[group.id] = group.useAllCpuPorts === false ? group.cpuPorts.map(port => port.id) : [];
      });
      this.setState({ groups, matrices, groupUseAllInputs, groupSelectedInputPorts, selectedMatrixId: this.state.selectedMatrixId || (matrices[0] && matrices[0].id) || "", loading: false, error: "" });
    } catch (error) { this.setState({ error: error.message || this.context.t("requestFailed"), loading: false }); }
  }

  selectedMatrix() { return this.state.matrices.find(matrix => matrix.id === this.state.selectedMatrixId); }

  togglePort(id) {
    this.setState(state => ({ selectedPorts: state.selectedPorts.includes(id) ? state.selectedPorts.filter(portId => portId !== id) : [...state.selectedPorts, id] }));
  }

  toggleInputPort(id) {
    this.setState(state => ({ selectedInputPorts: state.selectedInputPorts.includes(id) ? state.selectedInputPorts.filter(portId => portId !== id) : [...state.selectedInputPorts, id] }));
  }

  toggleGroupInputPort(groupId, id) {
    this.setState(state => {
      const selected = state.groupSelectedInputPorts[groupId] || [];
      return { groupSelectedInputPorts: { ...state.groupSelectedInputPorts, [groupId]: selected.includes(id) ? selected.filter(portId => portId !== id) : [...selected, id] } };
    });
  }

  async saveGroupInputs(group) {
    const useAllCpuPorts = this.state.groupUseAllInputs[group.id] !== false;
    const cpuPortIds = useAllCpuPorts ? [] : (this.state.groupSelectedInputPorts[group.id] || []);
    if (!useAllCpuPorts && !cpuPortIds.length) return this.setState({ error: this.context.t("selectAtLeastOneInput") });
    try {
      await request(`/rest/con-groups/${group.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ useAllCpuPorts, cpuPortIds }) });
      this.setState({ error: "" });
      this.load();
    } catch (error) { this.setState({ error: error.message || this.context.t("requestFailed") }); }
  }

  async create(event) {
    event.preventDefault();
    try {
      await request("/rest/con-groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: this.state.slug, matrixId: this.state.selectedMatrixId, conPortIds: this.state.selectedPorts, useAllCpuPorts: this.state.useAllInputs, cpuPortIds: this.state.useAllInputs ? [] : this.state.selectedInputPorts }) });
      this.setState({ slug: "", selectedPorts: [], useAllInputs: true, selectedInputPorts: [], error: "" });
      this.load();
    } catch (error) { this.setState({ error: error.message || this.context.t("requestFailed") }); }
  }

  async execute(group) {
    const cpuPortId = this.state.executeInputs[group.id];
    if (!cpuPortId) return this.setState({ error: this.context.t("selectInputForGroup") });
    try {
      await request(`/rest/con-groups/${group.id}/execute`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cpuPortId }) });
      this.setState({ error: "" });
    } catch (error) { this.setState({ error: error.message || this.context.t("requestFailed") }); }
  }

  async remove(group) {
    if (!window.confirm(`${this.context.t("removeOutputGroupConfirm")} ${group.slug}?`)) return;
    try { await request(`/rest/con-groups/${group.id}`, { method: "DELETE" }); this.load(); }
    catch (error) { this.setState({ error: error.message || this.context.t("requestFailed") }); }
  }

  render() {
    const { t } = this.context;
    const matrix = this.selectedMatrix();
    const selectedCount = this.state.selectedPorts.length;
    const selectedInputCount = this.state.selectedInputPorts.length;
    const outputCountLabel = count => `${count} ${t(count === 1 ? "output" : "outputs")}`;
    const inputCountLabel = count => `${count} ${t(count === 1 ? "input" : "inputs")}`;
    const creationSummary = !selectedCount ? t("selectAtLeastOneOutput") : (!this.state.useAllInputs && !selectedInputCount ? t("selectAtLeastOneInput") : `${outputCountLabel(selectedCount)} · ${this.state.useAllInputs ? t("allInputs") : inputCountLabel(selectedInputCount)}`);
    const styles = {
      page: { maxWidth: "980px", paddingBottom: "48px" },
      intro: { color: "#5d6b78", fontSize: "16px", marginBottom: "24px" },
      card: { border: "1px solid #dfe5eb", borderRadius: "10px", boxShadow: "0 2px 8px rgba(24, 39, 75, .06)", marginBottom: "28px" },
      cardHeader: { padding: "18px 22px", borderBottom: "1px solid #e8edf1", background: "#f8fafc", borderRadius: "10px 10px 0 0" },
      cardBody: { padding: "22px" },
      fieldLabel: { display: "block", fontWeight: 600, marginBottom: "7px", color: "#334155" },
      portGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "10px", marginTop: "10px" },
      port: { display: "flex", alignItems: "center", gap: "10px", padding: "12px", border: "1px solid #d9e1e8", borderRadius: "8px", cursor: "pointer", background: "white", marginBottom: 0 },
      selectedPort: { borderColor: "#1677c8", background: "#eff7ff" },
      muted: { color: "#66788a", fontSize: "14px" },
      group: { border: "1px solid #dfe5eb", borderRadius: "10px", padding: "18px", marginBottom: "12px", background: "white" },
      groupName: { margin: 0, fontSize: "18px", fontWeight: 600 },
      badge: { display: "inline-block", marginTop: "7px", padding: "3px 8px", borderRadius: "999px", background: "#eef2f6", color: "#52606d", fontSize: "13px" }
    };
    return <Settings active="con-groups">
      <div style={styles.page}>
      <h1>{t("outputGroups")}</h1>
      <p style={styles.intro}>{t("outputGroupSettingsIntro")}</p>
      {this.state.error && <div className="alert alert-danger">{this.state.error}</div>}
      <form style={styles.card} onSubmit={event => this.create(event)}>
        <div style={styles.cardHeader}><h2 style={{ margin: 0, fontSize: "22px" }}>{t("newOutputGroup")}</h2><div style={styles.muted}>{t("selectMatrixAndOutputs")}</div></div>
        <div style={styles.cardBody}>
        <div className="row"><div className="col-md-6 mb-3">
        <label style={styles.fieldLabel}>{t("groupName")}</label>
        <input className="form-control" placeholder={t("groupNamePlaceholder")} required value={this.state.slug} onChange={event => this.setState({ slug: event.target.value })} />
        </div><div className="col-md-6 mb-3">
        <label style={styles.fieldLabel}>{t("matrix")}</label>
        <select className="form-control" value={this.state.selectedMatrixId} onChange={event => this.setState({ selectedMatrixId: event.target.value, selectedPorts: [], selectedInputPorts: [] })}>
          {this.state.matrices.map(item => <option key={item.id} value={item.id}>{item.slug}</option>)}
        </select>
        </div></div>
        <div style={styles.fieldLabel}>{t("outputs")} <span style={styles.muted}>— {t("selected")} {selectedCount}</span></div>
        <div style={styles.portGrid}>{matrix && matrix.conPorts.map(port => {
          const selected = this.state.selectedPorts.includes(port.id);
          return <label key={port.id} style={{ ...styles.port, ...(selected ? styles.selectedPort : {}) }}><input type="checkbox" checked={selected} onChange={() => this.togglePort(port.id)} /><span><strong>{port.portNum}.</strong> {port.slug || `Output ${port.portNum}`}</span></label>;
        })}</div>
        <div style={{ ...styles.fieldLabel, marginTop: "22px" }}>{t("inputsInUse")}</div>
        <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", marginBottom: "10px" }}>
          <label style={{ ...styles.port, flex: "1 1 220px" }}><input type="radio" name="input-mode" checked={this.state.useAllInputs} onChange={() => this.setState({ useAllInputs: true })} /><span><strong>{t("allInputs")}</strong><br /><span style={styles.muted}>{t("allInputsHint")}</span></span></label>
          <label style={{ ...styles.port, flex: "1 1 220px", ...(!this.state.useAllInputs ? styles.selectedPort : {}) }}><input type="radio" name="input-mode" checked={!this.state.useAllInputs} onChange={() => this.setState({ useAllInputs: false })} /><span><strong>{t("selectedInputs")}</strong><br /><span style={styles.muted}>{t("selectedInputsHint")}</span></span></label>
        </div>
        {!this.state.useAllInputs && <div style={styles.portGrid}>{matrix && matrix.cpuPorts.map(port => {
          const selected = this.state.selectedInputPorts.includes(port.id);
          return <label key={port.id} style={{ ...styles.port, ...(selected ? styles.selectedPort : {}) }}><input type="checkbox" checked={selected} onChange={() => this.toggleInputPort(port.id)} /><span><strong>{port.portNum}.</strong> {port.slug || `Input ${port.portNum}`}</span></label>;
        })}</div>}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "22px", gap: "12px", flexWrap: "wrap" }}><span style={styles.muted}>{creationSummary}</span><button className="btn btn-success" disabled={!matrix || !selectedCount || (!this.state.useAllInputs && !selectedInputCount)}>{t("createOutputGroup")}</button></div>
        </div>
      </form>
      <h2 style={{ fontSize: "24px", marginBottom: "14px" }}>{t("runOutputGroup")}</h2>
      {this.state.groups.map(group => {
        const groupMatrix = this.state.matrices.find(item => group.matrix && item.id === group.matrix.id);
        const groupUsesAllInputs = this.state.groupUseAllInputs[group.id] !== false;
        const groupSelectedInputs = this.state.groupSelectedInputPorts[group.id] || [];
        return <div style={styles.group} key={group.id}>
          <div className="row align-items-center"><div className="col-md-5 mb-3 mb-md-0"><h3 style={styles.groupName}>{group.slug}</h3><span style={styles.badge}>{outputCountLabel(group.conPorts.length)} · {group.useAllCpuPorts ? t("allInputs") : inputCountLabel(group.cpuPorts.length)}</span><div style={{ ...styles.muted, marginTop: "8px" }}>{group.conPorts.map(port => port.slug || `Output ${port.portNum}`).join(", ")}</div></div>
          <div className="col-md-4 mb-3 mb-md-0"><label style={styles.fieldLabel}>{t("switchToInput")}</label><select className="form-control" value={this.state.executeInputs[group.id] || ""} onChange={event => this.setState(state => ({ executeInputs: { ...state.executeInputs, [group.id]: event.target.value } }))}><option value="">{t("selectInput")}</option>{group.cpuPorts.map(port => <option key={port.id} value={port.id}>{port.portNum}. {port.slug || `Input ${port.portNum}`}</option>)}</select></div>
          <div className="col-md-3"><button className="btn btn-primary mr-2" onClick={() => this.execute(group)}>{t("execute")}</button><button className="btn btn-outline-danger" onClick={() => this.remove(group)}>{t("remove")}</button></div></div>
          <div style={{ borderTop: "1px solid #e8edf1", marginTop: "18px", paddingTop: "16px" }}>
            <div style={styles.fieldLabel}>{t("allowedInputs")}</div>
            <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", marginBottom: "10px" }}>
              <label><input type="radio" name={`group-input-mode-${group.id}`} checked={groupUsesAllInputs} onChange={() => this.setState(state => ({ groupUseAllInputs: { ...state.groupUseAllInputs, [group.id]: true } }))} /> <strong>{t("allInputs")}</strong></label>
              <label><input type="radio" name={`group-input-mode-${group.id}`} checked={!groupUsesAllInputs} onChange={() => this.setState(state => ({ groupUseAllInputs: { ...state.groupUseAllInputs, [group.id]: false } }))} /> <strong>{t("selectedInputs")}</strong></label>
            </div>
            {!groupUsesAllInputs && <div style={styles.portGrid}>{groupMatrix && groupMatrix.cpuPorts.map(port => {
              const selected = groupSelectedInputs.includes(port.id);
              return <label key={port.id} style={{ ...styles.port, ...(selected ? styles.selectedPort : {}) }}><input type="checkbox" checked={selected} onChange={() => this.toggleGroupInputPort(group.id, port.id)} /><span><strong>{port.portNum}.</strong> {port.slug || `Input ${port.portNum}`}</span></label>;
            })}</div>}
            <div style={{ marginTop: "12px", textAlign: "right" }}><button className="btn btn-secondary" disabled={!groupUsesAllInputs && !groupSelectedInputs.length} onClick={() => this.saveGroupInputs(group)}>{t("saveInputs")}</button></div>
          </div>
        </div>;
      })}
      {!this.state.loading && !this.state.groups.length && <div style={{ ...styles.group, ...styles.muted, textAlign: "center", padding: "28px" }}>{t("noOutputGroupsSettings")}</div>}
      </div>
    </Settings>;
  }
}
