/* eslint-disable no-unused-vars */
import * as PassportLocal from "passport-local";
import * as passport from "passport";
import User, { UserType } from "../models/User";

const LocalStrategy = PassportLocal.Strategy;

// Gets the passport instance and defines a local strategy on it
// Which handles authentication via email and password, searching the db
export default function configurePassport(
  passportInstance: passport.PassportStatic
) {
  passportInstance.use(
    new LocalStrategy({ usernameField: "email" }, async (email, pass, done) => {
      // Search if the user exists
      let user: UserType;

      // Look for the user in the db
      try {
        user = (await User.findOne({ email })) as UserType;
      } catch (err) {
        return done(err);
      }

      // No user exists
      if (!user) {
        return done(null, false, {
          message: "The provided email doesn't belong to any user!"
        });
      }

      let passMatches = await user.passwordMatches(pass);

      // The password doesn't match
      if (!passMatches) {
        return done(null, false, {
          message: "The password is incorrect!"
        });
      }

      return done(null, user);
    })
  );

  // Make the serialize / deserialize funcs, which provide the data that's stored
  // in a cookie on the client side, i.e. the id of the user

  passportInstance.serializeUser((user: UserType, done) => {
    done(null, user.id);
  });

  passportInstance.deserializeUser(async (id: string, done) => {
    let user: UserType;

    try {
      user = (await User.findById(id)) as UserType;
    } catch (err) {
      done(err);
    }

    done(null, user);
  });
}
