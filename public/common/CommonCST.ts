// Common constants between the server and the client
export default {
  CONNECTION: {
    // After this time of being disconnected,
    // close the connection completely
    LOGOUT_TIMEOUT: 60 * 1000,
    LOGOUT_PATH: "/users/logout"
  }
};
