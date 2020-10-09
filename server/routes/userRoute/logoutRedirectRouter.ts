import * as express from "express";
import { redirectToLogin } from "../../authentication/authenticateMiddleware";
import CST from "../../SERVER_CST";
// The user model's type
import { UserType } from "../../models/User";
// Common code: The language manager
import LangManager from "../../../public/common/Languages/LangManager";

import { NamespaceDebugger } from "../../utils/debug";
// If debugging is active this will write logs to the console
let debug = new NamespaceDebugger("logoutRedirectRouter");

function redirectAuthenticatedMw(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  let userKicked = req.query[CST.ROUTES.LOGOUT_PARAM.KICK];

  // If the user is kicked, stay on the login page
  // Do not redirect
  if (userKicked || !req.isAuthenticated()) {
    return next();
  }

  res.redirect("/");
}

async function logoutMw(req: express.Request, res: express.Response) {
  let user = req.user as UserType;
  // If the user gets kicked we mimic logout without actually deleting the session
  let userKicked = req.query[CST.ROUTES.LOGOUT_PARAM.KICK];

  if (user) {
    if (userKicked) {
      debug.userHas(user, "logged out for connecting on another device/page.");
    } else {
      debug.userHas(user, "logged out.");
    }
  }

  // Being logged out for good
  if (!userKicked) {
    // Clear the seesion cookie before logging out
    res.clearCookie(CST.SESSION_COOKIE.ID);
    req.logout();
  }

  let lang = await LangManager.getInstance().get(
    String(req.cookies[CST.LANGUAGE_COOKIE])
  );
  let loginMsgs = lang.loginMessages,
    logoutMsgs = lang.logout;

  let logoutMessage = loginMsgs.logoutMessage,
    reason: any;

  if ((reason = req.query[CST.ROUTES.LOGOUT_PARAM.REASON])) {
    switch (reason) {
      case CST.ROUTES.LOGOUT_REASONS.OTHER_DEVICE:
        reason = logoutMsgs.anotherDeviceReason;
        break;
      default:
        reason = "";
    }

    if (reason) logoutMessage += ` ${loginMsgs.reason}: ${reason}`;
  }

  // Tell the redirection function the user is being kicked if there's a query param
  redirectToLogin(req, res, logoutMessage, true, !!userKicked);
}

const router = express.Router();
router
  .get("/logout", logoutMw)
  // If the user is already authenticated, redirect him to the game
  .use(redirectAuthenticatedMw);

export default router;
