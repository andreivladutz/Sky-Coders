// Common constants between the server and the client
export default {
  CONNECTION: {
    // After this time of being disconnected,
    // close the connection completely
    LOGOUT_TIMEOUT: 60 * 1000,
    LOGOUT_PATH: "/users/logout"
  },
  // How many characters a user should have at first
  CHARACTERS: {
    INITIAL_NO: 2,
    // Update the character every ... ms when the Blockly workspace is open
    UPDATES_INTERVAL: 5000
  },
  // CSTs related to users query
  USERS_QUERY: {
    // Limit the results to 10 users
    LEADERBOARD_LIMIT: 5
  }
};
