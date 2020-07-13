import * as express from "express";
import passport from "passport";
import cryptr from "../../utils/cryptr";
import CST from "../../SERVER_CST";

import { UserType } from "../../models/User";

// Common code: The language manager
import { LanguageIds } from "../../../public/common/Languages/LangFileInterface";
import LangManager from "../../../public/common/Languages/LangManager";

// This middleware is called only if the user has succesfully logged in
function setSessionUserId(req: express.Request, res: express.Response) {
  // Encrypt the user _id from the db
  let user = req.user as UserType;
  let encryptedId = cryptr.encrypt(user._id);

  res.cookie(CST.SESSION_COOKIE.ID, encryptedId);

  // The login page animation script overrides the normal submit and waits for a json response
  res.send({
    success: true,
  });
}

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
    langs: LanguageIds,
  });
}

const router = express.Router();
router
  .get("/login", handleLoginGet)
  // Handle login with passport
  .post(
    "/login",
    passport.authenticate("local", {
      //successRedirect: "/",
      failureRedirect: "login",
      failureFlash: true,
    }),
    setSessionUserId
  );

export default router;
