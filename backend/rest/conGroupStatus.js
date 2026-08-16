export const buildConGroupStatus = (group, cpuPort, getVideoConnection, getCpuPort = () => null) => {
  const outputs = group.conPorts.map(conPort => {
    const currentCpuPortId = getVideoConnection(conPort.id);
    const currentCpuPort = currentCpuPortId ? getCpuPort(currentCpuPortId) : null;
    return {
      conPort: { id: String(conPort.id), slug: conPort.slug, portNum: conPort.portNum },
      cpuPortId: currentCpuPortId ? String(currentCpuPortId) : null,
      cpuPort: currentCpuPort ? { id: String(currentCpuPort.id), slug: currentCpuPort.slug, portNum: currentCpuPort.portNum } : null,
      active: Number(currentCpuPortId) === cpuPort.id
    };
  });
  const active = outputs.length > 0 && outputs.every(output => output.active);
  const currentIds = outputs.map(output => output.cpuPortId);
  const allOutputsKnown = currentIds.length > 0 && currentIds.every(Boolean);
  const singleCurrentInput = allOutputsKnown && new Set(currentIds).size === 1;
  const currentCpuPort = singleCurrentInput ? (outputs[0].cpuPort || (currentIds[0] === String(cpuPort.id) ? cpuPort : null)) : null;
  return {
    conGroup: { id: String(group.id), slug: group.slug },
    cpuPort: { id: String(cpuPort.id), slug: cpuPort.slug, portNum: cpuPort.portNum },
    status: active ? "active" : "inactive",
    active,
    currentInputStatus: singleCurrentInput ? "single" : (currentIds.some(Boolean) ? "mixed" : "unknown"),
    currentCpuPort: currentCpuPort ? { id: String(currentCpuPort.id), slug: currentCpuPort.slug, portNum: currentCpuPort.portNum } : null,
    outputs
  };
};
