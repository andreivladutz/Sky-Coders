import * as Cryptr from "cryptr";
import * as dotenv from "dotenv";
import path from "path";

// Load the environment config from .env file
dotenv.config({
  path: path.join(__dirname, "/../../config/.env")
});

const cryptrInstance = new Cryptr(process.env.DB_ID_SECRET);

export default cryptrInstance;
