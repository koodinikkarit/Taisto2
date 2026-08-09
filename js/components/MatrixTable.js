import React from 'react';

const baseCell = { border: "1px solid #e2e8f0", minWidth: "88px", height: "48px", textAlign: "center" };

export default class MatrixTable extends React.Component {
    render() {
        const { conPorts, cpuPorts } = this.props;
        if (!conPorts || !cpuPorts) return <p>Matriisin portteja ei voitu ladata.</p>;
        return <div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", marginBottom: "14px", color: "#64748b", fontSize: "13px" }}>
                <span>Vasen klikkaus vaihtaa videon. Oikea klikkaus vaihtaa KVM-yhteyden.</span>
                <span><b style={{ color: "#e67e22" }}>Video</b> &nbsp; <b style={{ color: "#b42318" }}>KVM</b> &nbsp; <b style={{ color: "#16794b" }}>Molemmat</b></span>
            </div>
            <div style={{ overflowX: "auto", border: "1px solid #dfe5eb", borderRadius: "10px" }}>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: "560px" }}>
                    <thead><tr>
                        <th style={{ ...baseCell, position: "sticky", left: 0, zIndex: 1, background: "#edf2f7", color: "#334155", textAlign: "left", padding: "0 12px" }}>{"Output / l\u00e4hde"}</th>
                        {cpuPorts.map(cpu => <th key={cpu.id} style={{ ...baseCell, background: "#edf2f7", color: "#334155", padding: "6px" }}><small>{cpu.portNum}.</small><br />{cpu.slug}</th>)}
                    </tr></thead>
                    <tbody>{conPorts.map(con => <tr key={con.id}>
                        <th style={{ ...baseCell, position: "sticky", left: 0, zIndex: 1, background: "#f8fafc", color: "#334155", textAlign: "left", padding: "0 12px" }}><small>{con.portNum}.</small> {con.slug}</th>
                        {cpuPorts.map(cpu => {
                            const video = this.props.videoConnections && this.props.videoConnections[con.id] === cpu.id;
                            const kwm = this.props.kwmConnections && this.props.kwmConnections[cpu.id] === con.id;
                            const color = video && kwm ? "#16794b" : video ? "#e67e22" : kwm ? "#b42318" : "#f8fafc";
                            const active = video || kwm;
                            const left = () => video ? this.props.onTurnOffVideoConnection && this.props.onTurnOffVideoConnection(con.id) : this.props.onNewVideoConnection && this.props.onNewVideoConnection(con.id, cpu.id);
                            const right = () => kwm ? this.props.onTurnOffKwmConnection && this.props.onTurnOffKwmConnection(cpu.id) : this.props.onNewKwmConnection && this.props.onNewKwmConnection(con.id, cpu.id);
                            return <td key={cpu.id} title={`${cpu.portNum}. ${cpu.slug} → ${con.portNum}. ${con.slug}`} onClick={left} onContextMenu={e => { e.preventDefault(); right(); }} style={{ ...baseCell, background: color, cursor: "pointer", transition: "background .15s", boxShadow: active ? "inset 0 0 0 2px rgba(255,255,255,.45)" : "none" }} />;
                        })}
                    </tr>)}</tbody>
                </table>
            </div>
        </div>;
    }
}
