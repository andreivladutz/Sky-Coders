import express from "express";
import CST from "../SERVER_CST";

// Redirect to the login page, displaying an error / success message
export function redirectToLogin(
  req: express.Request,
  res: express.Response,
  flashMsg?: string,
  succesMessage: boolean = true
) {
  if (flashMsg) {
    if (succesMessage) {
      req.flash(CST.TEMP_MSG.SUCCESS, flashMsg);
    } else {
      req.flash(CST.TEMP_MSG.ERROR, flashMsg);
    }
  }

  res.redirect("/users/login");
}

export default function authenticate(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (req.isAuthenticated()) {
    return next();
  }

  redirectToLogin(req, res);
}
