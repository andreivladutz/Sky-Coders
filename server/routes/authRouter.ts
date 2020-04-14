import * as express from "express";
import passport from "passport";
// eslint-disable-next-line no-unused-vars
import User, { UserType } from "../models/User";

import { redirectToLogin } from "../authentication/authenticateMiddleware";

import { default as validation } from "../validation/UserValidation";
// Types defined in the UserValidation namespace
type UserRegCfg = validation.UserRegCfg;

const router = express.Router();

// Parse body info from forms
router.use(express.urlencoded({ extended: false }));

router
  // If the user is already authenticated, redirect him to the game
  .use((req, res, next) => {
    if (req.isAuthenticated()) {
      res.redirect("/");
      return;
    }

    next();
  })
  .get("/login", (req, res) => res.render("login"))
  .get("/register", (req, res) => res.render("register"))
  // Handle login with passport
  .post(
    "/login",
    passport.authenticate("local", {
      successRedirect: "/",
      failureRedirect: "login",
      failureFlash: true
    })
  )
  // Handle registration by validating and saving the user to the db
  .post("/register", async (req, res) => {
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
  });

export default router;
