import * as taisto from "../TaistoService";

// Commands are queued through the same service paths as the web UI. A queued
// command is not a confirmation that a physical matrix has switched.
export function createTelegramService() {
  return {
    listMatrices() {
      return taisto.db.matrixs.valueSeq().map(matrix => ({ id: matrix.id, name: matrix.slug })).toArray();
    },
    listDefaultStates() {
      return taisto.db.defaultStates.valueSeq().map(state => ({ id: state.id, name: state.slug })).toArray();
    },
    executeDefaultState(id) {
      const numericId = Number(id);
      if (!Number.isSafeInteger(numericId) || !taisto.db.defaultStates.has(numericId)) return false;
      taisto.executeDefaultState(numericId);
      return true;
    },
    listGroups() {
      return taisto.db.conGroups.valueSeq().map(group => ({
        id: group.id,
        name: group.slug,
        inputs: group.cpuPorts.map(input => ({ id: input.id, name: `${input.portNum}. ${input.slug}` }))
      })).toArray();
    },
    executeGroup(groupId, inputId) {
      const numericGroupId = Number(groupId);
      const numericInputId = Number(inputId);
      if (!Number.isSafeInteger(numericGroupId) || !Number.isSafeInteger(numericInputId)) return false;
      return taisto.executeConGroup(numericGroupId, numericInputId);
    }
  };
}
