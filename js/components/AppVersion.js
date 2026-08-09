import React from "react";
import packageInfo from "../../package.json";

export default function AppVersion() {
  return <small style={{ position: "fixed", right: "12px", bottom: "8px", color: "#6c757d", zIndex: 1100 }}>
    v{packageInfo.version}
  </small>;
}
