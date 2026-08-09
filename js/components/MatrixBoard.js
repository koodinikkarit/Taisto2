import React from 'react';

const styles = {
    intro: { margin: "0 0 18px", color: "#64748b" },
    label: { display: "block", fontSize: "12px", fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "#64748b", marginBottom: "7px" },
    select: { width: "100%", height: "44px", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "0 12px", background: "#fff", marginBottom: "22px" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" },
    source: { minHeight: "76px", textAlign: "left", border: "1px solid #dbe4ee", borderRadius: "9px", background: "#f8fafc", padding: "12px", color: "#1e293b", cursor: "pointer" },
    sourceActive: { borderColor: "#e67e22", background: "#fff7ed", boxShadow: "0 0 0 2px rgba(230,126,34,.12)" },
    port: { display: "block", fontSize: "12px", color: "#64748b", marginBottom: "3px" },
    name: { display: "block", fontWeight: 700 }
};

export default class MatrixBoard extends React.Component {
    constructor(props) {
        super(props);
        this.state = { selectedCon: props.conPorts && props.conPorts[0] ? props.conPorts[0].id : "", connectionType: "video" };
    }

    render() {
        const selectedCon = this.state.selectedCon;
        const connectionType = this.state.connectionType;
        const selectedOutput = (this.props.conPorts || []).find(con => con.id === selectedCon);
        if (!this.props.conPorts || !this.props.cpuPorts) return <p>Matriisin portteja ei voitu ladata.</p>;

        return <div>
            <p style={styles.intro}>{"Valitse ensin output ja sen j\u00e4lkeen l\u00e4hde, joka kytket\u00e4\u00e4n siihen."}</p>
            <label style={styles.label}>Output</label>
            <select style={styles.select} value={selectedCon} onChange={e => this.setState({ selectedCon: e.target.value })}>
                {this.props.conPorts.map(con => <option key={con.id} value={con.id}>{con.portNum}. {con.slug}</option>)}
            </select>
            <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
                <button type="button" className={`btn ${connectionType === "video" ? "btn-primary" : "btn-default"}`} onClick={() => this.setState({ connectionType: "video" })}>Video</button>
                <button type="button" className={`btn ${connectionType === "kwm" ? "btn-danger" : "btn-default"}`} onClick={() => this.setState({ connectionType: "kwm" })}>KVM</button>
            </div>
            <label style={styles.label}>{connectionType === "video" ? "Video" : "KVM"} {"l\u00e4hde"} {selectedOutput ? `outputille ${selectedOutput.portNum}. ${selectedOutput.slug}` : ""}</label>
            <div style={styles.grid}>
                {this.props.cpuPorts.map(cpu => {
                    const active = connectionType === "video"
                        ? this.props.videoConnections && this.props.videoConnections[selectedCon] === cpu.id
                        : this.props.kwmConnections && this.props.kwmConnections[cpu.id] === selectedCon;
                    return <button key={cpu.id} type="button" style={{ ...styles.source, ...(active ? styles.sourceActive : {}) }} onClick={() => {
                        if (!selectedCon) return;
                        if (connectionType === "video" && this.props.onNewVideoConnection) this.props.onNewVideoConnection(selectedCon, cpu.id);
                        if (connectionType === "kwm" && this.props.onNewKwmConnection) this.props.onNewKwmConnection(selectedCon, cpu.id);
                    }}>
                        <span style={styles.port}>{"L\u00e4hde"} {cpu.portNum}{active ? " · aktiivinen" : ""}</span>
                        <span style={styles.name}>{cpu.slug}</span>
                    </button>;
                })}
            </div>
        </div>;
    }
}
