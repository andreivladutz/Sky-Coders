import * as mongoose from "mongoose";
import { IslandType } from "./Island";

export interface GameType {
  islands: IslandType[];
  resources: {
    coins: number;
  };
}

const ResourceSchema = new mongoose.Schema({
  coins: Number
});

// Just a subdocument
const GameSubDoc = {
  resources: ResourceSchema,
  islands: [
    {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Island"
    }
  ]
};

export default GameSubDoc;
