globalThis.WORKER_CST = {
  MSG: {
    PATH_FOUND: 0,
    INIT: 1,
    FIND_PATH: 2
  },
  // Format of a message
  MESSAGE_TYPE: "messageType",
  DATA: "dataSent",
  ITERATIONS_PER_CALCULATION: 5000
};

// a little hack so this is an importable script both in normal modules
// as well in web workers, which do not support modules yet
if (typeof module !== "undefined") {
  module.exports = globalThis.WORKER_CST;
}
