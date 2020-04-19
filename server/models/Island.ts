import * as mongoose from "mongoose";
import Document = mongoose.Document;
import { DbBuildingInfo, BuildNames } from "../../public/common/BuildingTypes";

export interface BuildingType extends DbBuildingInfo {}

export interface IslandType extends Document {
  seed: string;
  buildings: BuildingType[];
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
    ]
  },
  { typePojoToMixed: false }
);

const Island = mongoose.model("Island", IslandSchema);

export default Island;
