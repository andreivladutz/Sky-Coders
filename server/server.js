let express = require("express");

let app = express();

app.use(express.static("public")).listen(8080, () => {
  console.log("App listening on 8080.");
});
