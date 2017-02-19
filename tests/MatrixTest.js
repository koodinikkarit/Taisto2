import Matrix from "../backend/records/Matrix";

var testiMatti = new Matrix({
    id: 1,
    ip: "192.168.180.201",
    port: 5555,
    numberOfConPorts: 16, 
    numberOfCpuPorts: 16
});

testiMatti.on("REQUEST_ALL_STATES", (conConnections, cpuConnections) => {
    console.log("conConnections", conConnections, "cpuConnections", cpuConnections);
});

// testiMatti.setVideoConnection(1, 1);
// testiMatti.setKwmConnection(1, 1);
// testiMatti.turnOffVideoConnection(1);
// testiMatti.turnOffKwmConnection(1);
testiMatti.requestAllStates();