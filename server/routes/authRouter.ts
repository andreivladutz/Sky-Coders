import * as express from "express";
import passport from "passport";
import cryptr from "../utils/cryptr";
import Debug from "debug";

import User, { UserType } from "../models/User";
import { redirectToLogin } from "../authentication/authenticateMiddleware";
import { default as validation } from "../validation/UserValidation";
import CST from "../SERVER_CST";
import GamesManager from "../game/GamesManager";

// If debugging is active this will write logs to the console
const debug = Debug("authRouter");

// Types defined in the UserValidation namespace
type UserRegCfg = validation.UserRegCfg;

// This middleware is called only if the user has succesfully logged in
function setSessionUserId(req: express.Request, res: express.Response) {
  // Encrypt the user _id from the db
  let user = req.user as UserType;
  let encryptedId = cryptr.encrypt(user._id);

  res.cookie(CST.SESSION_COOKIE.ID, encryptedId);
  res.redirect("/");
}

function redirectAuthenticatedMw(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (req.isAuthenticated()) {
    res.redirect("/");
    return;
  }

  next();
}

function logoutMw(req: express.Request, res: express.Response) {
  let user = req.user as UserType;

  if (user) {
    debug(`User ${user.name} logged out.`);
  }

  // Clear the seesion cookie before logging out
  res.clearCookie(CST.SESSION_COOKIE.ID);
  req.logout();

  let logoutMessage = "You have been logged out!",
    reason: string;

  if ((reason = req.query[CST.ROUTES.LOGOUT_PARAM.REASON])) {
    logoutMessage += ` Reason: ${reason}`;
  }

  redirectToLogin(req, res, logoutMessage);
}

async function registrationMw(req: express.Request, res: express.Response) {
  const { name, email, password, password_confirm }: UserRegCfg = req.body;

  let user = new User({
    name,
    email,
    password
  }) as UserType;

  // check to see if we find any errors
  let errorMessages = await validation.validateUser(req.body, user);

  // If there are any errors, stay on the register page
  // And display the validation errors to the user
  if (errorMessages.length) {
    res.render("register", {
      errorMessages,
      name,
      email,
      password,
      password_confirm
    });

    return;
  }
  // Succesful registration, try to save the user

  try {
    // Hashes the password internally via mongoose schema method
    await user.hashPassword();

    await user.save();
  } catch (err) {
    res.statusCode = 500;
    res.render("register");

    console.error(
      `Internal Error! could not save user ${user.name} to the database!`
    );

    redirectToLogin(
      req,
      res,
      "Registration failed! Please try again later!",
      false
    );

    return;
  }

  redirectToLogin(req, res, "You have been successfully registered!");
}

const router = express.Router();

// Parse body info from forms
router.use(express.urlencoded({ extended: false }));

router
  .get("/logout", logoutMw)
  // If the user is already authenticated, redirect him to the game
  .use(redirectAuthenticatedMw)
  .get("/login", (req, res) => res.render("login"))
  .get("/register", (req, res) => res.render("register"))
  // Handle login with passport
  .post(
    "/login",
    passport.authenticate("local", {
      //successRedirect: "/",
      failureRedirect: "login",
      failureFlash: true
    }),
    setSessionUserId
  )
  // Handle registration by validating and saving the user to the db
  .post("/register", registrationMw);

export default router;
