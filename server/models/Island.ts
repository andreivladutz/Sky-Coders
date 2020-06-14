import * as mongoose from "mongoose";
import Document = mongoose.Document;
import { DbBuildingInfo, BuildNames } from "../../public/common/BuildingTypes";
import {
  ACTOR_NAMES_ARR,
  CharacterDbInfo
} from "../../public/common/CharacterTypes";

export interface BuildingType extends DbBuildingInfo {}
export interface CharacterType extends CharacterDbInfo {}

export interface IslandType extends Document {
  seed: string;
  buildings: BuildingType[];
  characters: CharacterType[];
}

const IslandSchema = new mongoose.Schema(
  {
    seed: String,
    buildings: [
      {
        // The building type allows only types defined in BuildNames
        buildingType: { type: String, enum: Object.values(BuildNames) },
        position: { x: Number, y: Number },
        lastProdTime: Number
      }
    ],
    characters: [
      {
        actorKey: { type: String, enum: ACTOR_NAMES_ARR },
        position: { x: Number, y: Number },
        workspaceBlockly: String
      }
    ]
  },
  { typePojoToMixed: false }
);

const Island = mongoose.model("Island", IslandSchema);

export default Island;
