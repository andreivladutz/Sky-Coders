import * as express from "express";
import passport from "passport";
import cryptr from "../utils/cryptr";
import Debug from "debug";

import User, { UserType } from "../models/User";
import { redirectToLogin } from "../authentication/authenticateMiddleware";
import { default as validation } from "../validation/UserValidation";
import CST from "../SERVER_CST";
import { LanguageIds } from "../../public/common/Languages/LangFileInterface";
import LangManager from "../../public/common/Languages/LangManager";

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

  // The login page animation script overrides the normal submit and waits for a json response
  res.send({
    success: true
  });
}

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
      debug(
        `User ${user.name} was logged out for connecting on another device/page.`
      );
    } else {
      debug(`User ${user.name} logged out.`);
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

async function registrationMw(req: express.Request, res: express.Response) {
  const { name, email, password, password_confirm }: UserRegCfg = req.body;

  let lang = await LangManager.getInstance().get(
    String(req.cookies[CST.LANGUAGE_COOKIE])
  );
  let loginMsgLang = lang.loginMessages;
  let registerLang = lang.register;

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
      ...registerLang,
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
    res.render("register", registerLang);

    console.error(
      `Internal Error! could not save user ${user.name} to the database!`
    );

    redirectToLogin(req, res, loginMsgLang.registerFailed, false);

    return;
  }

  redirectToLogin(req, res, loginMsgLang.registerSuccessful);
}

// Render the login and register pages keeping count of the user selected language:

async function handleLoginGet(req: express.Request, res: express.Response) {
  let langManager = LangManager.getInstance();
  // The language code saved in a cookie in the browser
  let langCodeCookie = req.cookies[CST.LANGUAGE_COOKIE];
  // The language code set as a query parameter. THIS HAS PRIORITY
  let langCodeQuery = req.query[CST.ROUTES.LOGIN_PARAM.LANG_CODE] as string;

  let langCode: string;

  if (langCodeQuery) {
    langCode = langCodeQuery;
  } else {
    langCode = langCodeCookie || "";
  }

  langCode = langManager.getLangCodeOrDefault(String(langCode));

  // If the user selected another language as his primary language then save the choice in a cookie
  if (langCodeQuery && langCode === langCodeQuery) {
    res.cookie(CST.LANGUAGE_COOKIE, langCode);
  }

  let lang = (await langManager.get(langCode)).login;

  let chosenLanguageId: {
    flagCode: string;
    langName: string;
    langCode: string;
  };
  for (let languageDescr of LanguageIds) {
    if (languageDescr.langCode === langCode) {
      chosenLanguageId = languageDescr;
      break;
    }
  }

  res.render("login", {
    ...lang,
    // The current chosen language
    flagCode: chosenLanguageId.flagCode,
    langName: chosenLanguageId.langName,
    // The rest of the languages and render details
    langs: LanguageIds
  });
}

async function handleRegisterGet(req: express.Request, res: express.Response) {
  // The language code saved in a cookie in the browser
  let lang = (
    await LangManager.getInstance().get(
      String(req.cookies[CST.LANGUAGE_COOKIE])
    )
  ).register;
  res.render("register", lang);
}

const router = express.Router();

// Parse body info from forms
router.use(express.urlencoded({ extended: false }));

router
  .get("/logout", logoutMw)
  // If the user is already authenticated, redirect him to the game
  .use(redirectAuthenticatedMw)
  .get("/login", handleLoginGet)
  .get("/register", handleRegisterGet)
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
