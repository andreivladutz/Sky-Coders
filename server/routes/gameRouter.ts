import * as express from "express";
import CST from "../SERVER_CST";

const router = express.Router();

router.use(express.static(CST.PUBLIC_FOLDER));

export default router;
