// The propertoes of the internalBuilding
const BuildsConstructor = "newBuilding";
const InternalBuildingProps = ["isReady", "buildingType", "id"];
export interface InternalBuilding {
  isReady: boolean;
  buildingType: string;
  id: string;
}

interface Indexable {
  id: string;
}

const SELF = "self",
  INTERNAL_OBJ = "__chara__",
  START_INTERNAL_CODE = "__startInternal__",
  END_INTERNAL_CODE = "__endInternal__";

const STRINGIFIED_TOKEN = "#str#";

const CST = {
  // The object that hold all "native" functions
  SELF,
  // The "list" of reserved words
  RESERVED_WORDS: [
    SELF,
    INTERNAL_OBJ,
    START_INTERNAL_CODE,
    END_INTERNAL_CODE
  ].join(","),
  // The names of the functions used to mark internal specialized code
  // START marks that internal code follows in the interpreter
  // and END marks the end of the internal code that can be run in one go
  START_INTERNAL_CODE,
  END_INTERNAL_CODE,
  // Run 2000 steps in interpreter code at a time
  ALLOWED_STEPS: 2000,
  // Name of the api functions
  API_FUNCS: {
    PRINT: "print",
    WALK_TO: "walkTo",
    COLLECT: "collect",
    // Character's current position
    POS_X: "getXCoord",
    POS_Y: "getYCoord",
    REACHABLE: "isCoordReachable",
    /* Added utilities internally: (i.e. defined by string code, not inside the game code on the global object) */

    // Get the list containing all map buildings
    GET_BUILDINGS_LIST: "getAllBuildings"
  },
  INTERNALS: {
    INIT_CODE: internalsInit,
    // The reserved object name that hold the internals related to the game logic
    INTERNAL_OBJ,
    BUILDINGS_DICT: "builds",
    // The function that populates the internal buildings array with buildings
    NEWBUILD_CALL: getConstructorCall<InternalBuilding>(
      InternalBuildingProps,
      BuildsConstructor
    ),
    // Returns the code that updates an internal building
    UPDATE_BUILD: updateBuilding
  },
  // Extensions for dynamic blocks
  BLOCKS_EXTENSIONS: {
    // The extension that generates the buildings dropdown
    GEN_BUILDS_DROPDOWN: "generate_buildings_dropdown"
  },
  // Blocks constants, names and such
  BLOCKS: {
    PROD_READY: {
      // THE NAME OF THE buildings dropdown
      BUILDS_DROPDOWN: "BUILDS_DROPDOWN",
      // Provide an "any" option
      ANY_BKY_MSG_ID: "ENV_BUILD_ANY",
      // A token that doesn't exist in normal code
      ANY_OPTION_ID: "#any#"
    }
  },
  NAVIGATION: {
    // How much time the actor should stay idle before walking again
    // This is useful for stopping immediate walks
    // starting after other walks end and making it look funny
    IDLE_TIME: 250
  },
  /// The toString methods of the internal objects
  STRING_CONVERSIONS: {
    METHOD_DEF: `toString: function() {
      return ${STRINGIFIED_TOKEN};
    }`,
    BUILDINGS: "this.buildingType + '_building(' + this.id + ')'"
  }
};

export default CST;

const INTERN = CST.INTERNALS;
const STRING = CST.STRING_CONVERSIONS;

//
/**
 * Get the code for the function that constructs an object with properties props
 * And adds it to its dedicated dictionary objectsDict
 * @param props the string array of property names of the object
 * @param objectsDict the name of the objects' dictionary
 * @param stringConversion the code that stringifies an object of this type
 */
function getObjectConstructor(
  props: string[],
  objectsDict: string,
  stringConversion: string
) {
  let constructorHead = "function( ";
  let constructedObj = "{ ";

  for (let prop of props) {
    constructorHead += `${prop},`;
    constructedObj += `${prop}: ${prop},`;
  }

  let toStringMet = STRING.METHOD_DEF.replace(
    STRINGIFIED_TOKEN,
    stringConversion
  );

  constructorHead = constructorHead.slice(0, constructorHead.length - 1) + " )";
  constructedObj += ` ${toStringMet} }`;

  return `${constructorHead} {
    ${INTERN.INTERNAL_OBJ}.${objectsDict}[id] = ${constructedObj};
  }`;
}

// Call an already created object constructor
// DOES NOT YET SUPPORT OBJECT PROPERTIES
function getConstructorCall<T extends Indexable>(
  propNames: string[],
  constructorName: string
) {
  return (object: T) => {
    let callHead = "( ";

    for (let prop of propNames) {
      let propValue = object[prop];

      if (typeof propValue === "string") {
        propValue = `"${propValue}"`;
      }

      callHead += `${propValue},`;
    }

    callHead = callHead.slice(0, callHead.length - 1) + " )";

    return `${INTERN.INTERNAL_OBJ}.${constructorName}${callHead};\n`;
  };
}

// Update the internal state of a building
function updateBuilding(buildingCfg: InternalBuilding) {
  let { id, isReady } = buildingCfg;
  let buildsAccessing = `${INTERN.INTERNAL_OBJ}.${INTERN.BUILDINGS_DICT}`;
  return `
    if (${buildsAccessing}["${id}"]) {
      ${buildsAccessing}["${id}"].isReady = ${isReady};
    }
  `;
}

/// Code that initialises the internal state of a code interpreter
function internalsInit() {
  return `
    var ${INTERN.INTERNAL_OBJ} = {
      ${INTERN.BUILDINGS_DICT}: {},
      ${BuildsConstructor}: 
        ${getObjectConstructor(
          InternalBuildingProps,
          INTERN.BUILDINGS_DICT,
          STRING.BUILDINGS
        )}
    };\n

    ${SELF}.${CST.API_FUNCS.GET_BUILDINGS_LIST} = function() {
      var __buildsIds__ = Object.getOwnPropertyNames(${INTERN.INTERNAL_OBJ}.${
    INTERN.BUILDINGS_DICT
  });
      var builds = [];

      for (var i = 0; i < __buildsIds__.length; i++) {
        var key = __buildsIds__[i];
        builds.push(${INTERN.INTERNAL_OBJ}.${INTERN.BUILDINGS_DICT}[key]);
      }

      return builds;
    }
  `;
}
