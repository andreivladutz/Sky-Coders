import * as express from "express";

import logoutRedirectRouter from "./logoutRedirectRouter";
import authRouter from "./authRouter";
import registrationRouter from "./registrationRouter";

const router = express.Router();

router
  // Parse body info from forms
  .use(express.urlencoded({ extended: false }))
  .use(logoutRedirectRouter)
  .use(authRouter)
  .use(registrationRouter);

export default router;
