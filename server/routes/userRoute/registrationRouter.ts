import * as express from "express";
import User, { UserType } from "../../models/User";
import { redirectToLogin } from "../../authentication/authenticateMiddleware";
import { default as validation } from "../../validation/UserValidation";
import CST from "../../SERVER_CST";
import LangManager from "../../../public/common/Languages/LangManager";

// Types defined in the UserValidation namespace
type UserRegCfg = validation.UserRegCfg;

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
    password,
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
      password_confirm,
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

router
  .get("/register", handleRegisterGet)
  // Handle registration by validating and saving the user to the db
  .post("/register", registrationMw);

export default router;
