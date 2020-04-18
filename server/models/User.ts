import * as mongoose from "mongoose";
import GameSubDoc, { GameType } from "./GameSchema";

import { default as validate } from "../validation/UserValidation";
// Hash the password before saving it to the db
import * as bcrypt from "bcryptjs";

type Document = mongoose.Document;

export interface UserType extends Document {
  name: string;
  email: string;
  password: string;
  date?: Date;
  game?: GameType;

  hashPassword(): Promise<void>;
  // Check if the stored password matches the plaintext one
  passwordMatches(plainTextPass: string): Promise<boolean>;
}

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: validate.required("Name")
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    required: validate.required("Email")
  },
  password: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  },
  game: GameSubDoc
});

UserSchema.method({
  hashPassword: async function() {
    let salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
  },
  passwordMatches: async function(plainTextPass: string): Promise<boolean> {
    return await bcrypt.compare(plainTextPass, this.password);
  }
});

const User = mongoose.model("User", UserSchema);

export default User;
