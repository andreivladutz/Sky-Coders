// A token emitted by the server's/client's MessageBuffer for the client's/server's MessageBuffer
// when an ack function is passed by the user to emit() on MessageBuffer
export let providedAckToken = "tokenHasProvidedAck";

// A token emited by a MessageBuffer when it is used over the socket
// So we can identify that a custom ack is being used
export let customAckToken = "tokenHasCustomAck";
