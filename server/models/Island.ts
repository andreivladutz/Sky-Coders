import * as mongoose from "mongoose";
import Document = mongoose.Document;

export interface IslandType extends Document {
  seed: string;
}

const IslandSchema = new mongoose.Schema({
  seed: String
});

const Island = mongoose.model("Island", IslandSchema);

export default Island;
