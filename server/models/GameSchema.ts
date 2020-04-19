import * as mongoose from "mongoose";
import { IslandType } from "./Island";

// The Resources interface
import * as BuildingTypes from "../../public/common/BuildingTypes";
import Resources = BuildingTypes.Resources;

export interface GameType {
  islands: IslandType[];
  resources: Resources;
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
