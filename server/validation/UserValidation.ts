/* eslint-disable no-inner-declarations */
import CST from "../SERVER_CST";

import * as mongoose from "mongoose";
/* eslint-disable no-unused-vars */
// Use the validation errors from mongoose
import ValidationError = mongoose.Error.ValidationError;

import User, { UserType } from "../models/User";

const PASS = {
  MIN: CST.USERS.PASS_MINLENGTH,
  MAX: CST.USERS.PASS_MAXLENGTH
};

namespace UserValidation {
  // An error message caused by failed validation
  export class ErrorMessage {
    fieldName: string;
    message: string;

    constructor(fieldName: string, message: string) {
      this.fieldName = fieldName;
      this.message = message;
    }
  }

  // How a received request body looks like
  export interface UserRegCfg {
    name: string;
    email: string;
    password: string;
    password_confirm: string;
  }

  export async function validateUser(
    reqBody: UserRegCfg,
    userDocument: UserType
  ): Promise<ErrorMessage[]> {
    let duplicateEmailErr = await checkEmailDuplicates(userDocument);

    if (duplicateEmailErr !== null) {
      return [duplicateEmailErr];
    }

    // First, validate the password
    let errorMessages = validatePassword(
      reqBody.password,
      reqBody.password_confirm
    );

    // Use mongoose internal validation to validate name and email
    let err: ValidationError = userDocument.validateSync();

    if (typeof err !== "undefined") {
      Object.entries(err.errors).forEach(([fieldName, error]) => {
        errorMessages.push(new ErrorMessage(fieldName, error.message));
      });
    }

    return errorMessages;
  }

  // creates a required message error for mongoose validation
  export const required = (fieldName: string) => [
    true,
    `${fieldName} cannot be empty`
  ];

  // Validate the password before creating a mongoose document
  function validatePassword(
    password: string,
    confirmPassword: string
  ): ErrorMessage[] {
    let errorMessages = [];

    let pushErr = (errMsg: string) =>
      errorMessages.push(new ErrorMessage("password", errMsg));

    if (password !== confirmPassword) {
      pushErr("Passwords do not match");
    }

    if (password.length < PASS.MIN) {
      pushErr(`Password must be longer than ${PASS.MIN} characters`);
    }

    if (password.length > PASS.MAX) {
      pushErr(`Password must be at most ${PASS.MAX} characters long`);
    }

    return errorMessages;
  }

  // Check if an user with this email already exists in the db
  async function checkEmailDuplicates(
    userDocument: UserType
  ): Promise<ErrorMessage> {
    let duplicateUser = await User.findOne({ email: userDocument.email });

    if (duplicateUser) {
      return new ErrorMessage(
        "email",
        "There is already an user with that email registered!"
      );
    }

    return null;
  }
}

export default UserValidation;
