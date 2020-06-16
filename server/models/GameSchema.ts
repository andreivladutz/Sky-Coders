import * as mongoose from "mongoose";
import { IslandType } from "./Island";
import DocumentArray = mongoose.Types.DocumentArray;
import Document = mongoose.Document;

// The Resources interface
import * as BuildingTypes from "../../public/common/BuildingTypes";
import Resources = BuildingTypes.Resources;

export interface ResourcesType extends Document, Resources {}

export interface GameType {
  islands: DocumentArray<IslandType>;
  resources: ResourcesType;
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
