/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./server/index.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./server/SERVER_CST.ts":
/*!******************************!*\
  !*** ./server/SERVER_CST.ts ***!
  \******************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony default export */ __webpack_exports__[\"default\"] = ({\n    PUBLIC_FOLDER: \"./public\",\n    NO_AUTH_FOLDER: \"./public/no_auth\",\n    WEB_MANIFEST: \"/manifest.webmanifest\",\n    MANIFEST_FILE: \"../../public/manifest.webmanifest\",\n    USERS: {\n        PASS_MINLENGTH: 6,\n        PASS_MAXLENGTH: 20\n    },\n    TEMP_MSG: {\n        SUCCESS: \"success_msg\",\n        ERROR: \"error_msg\",\n        PASSPORT_ERR: \"error\"\n    }\n});\n\n\n//# sourceURL=webpack:///./server/SERVER_CST.ts?");

/***/ }),

/***/ "./server/authentication/authenticateMiddleware.ts":
/*!*********************************************************!*\
  !*** ./server/authentication/authenticateMiddleware.ts ***!
  \*********************************************************/
/*! exports provided: redirectToLogin, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"redirectToLogin\", function() { return redirectToLogin; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"default\", function() { return authenticate; });\n/* harmony import */ var _SERVER_CST__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../SERVER_CST */ \"./server/SERVER_CST.ts\");\n\n// Redirect to the login page, displaying an error / success message\nfunction redirectToLogin(req, res, flashMsg, succesMessage = true) {\n    if (flashMsg) {\n        if (succesMessage) {\n            req.flash(_SERVER_CST__WEBPACK_IMPORTED_MODULE_0__[\"default\"].TEMP_MSG.SUCCESS, flashMsg);\n        }\n        else {\n            req.flash(_SERVER_CST__WEBPACK_IMPORTED_MODULE_0__[\"default\"].TEMP_MSG.ERROR, flashMsg);\n        }\n    }\n    res.redirect(\"/users/login\");\n}\nfunction authenticate(req, res, next) {\n    if (req.isAuthenticated()) {\n        return next();\n    }\n    redirectToLogin(req, res);\n}\n\n\n//# sourceURL=webpack:///./server/authentication/authenticateMiddleware.ts?");

/***/ }),

/***/ "./server/authentication/configurePassport.ts":
/*!****************************************************!*\
  !*** ./server/authentication/configurePassport.ts ***!
  \****************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"default\", function() { return configurePassport; });\n/* harmony import */ var passport_local__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! passport-local */ \"passport-local\");\n/* harmony import */ var passport_local__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(passport_local__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _models_User__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../models/User */ \"./server/models/User.ts\");\n/* eslint-disable no-unused-vars */\n\n\nconst LocalStrategy = passport_local__WEBPACK_IMPORTED_MODULE_0__[\"Strategy\"];\n// Gets the passport instance and defines a local strategy on it\n// Which handles authentication via email and password, searching the db\nfunction configurePassport(passportInstance) {\n    passportInstance.use(new LocalStrategy({ usernameField: \"email\" }, async (email, pass, done) => {\n        // Search if the user exists\n        let user;\n        // Look for the user in the db\n        try {\n            user = (await _models_User__WEBPACK_IMPORTED_MODULE_1__[\"default\"].findOne({ email }));\n        }\n        catch (err) {\n            return done(err);\n        }\n        // No user exists\n        if (!user) {\n            return done(null, false, {\n                message: \"The provided email doesn't belong to any user!\"\n            });\n        }\n        let passMatches = await user.passwordMatches(pass);\n        // The password doesn't match\n        if (!passMatches) {\n            return done(null, false, {\n                message: \"The password is incorrect!\"\n            });\n        }\n        return done(null, user);\n    }));\n    // Make the serialize / deserialize funcs, which provide the data that's stored\n    // in a cookie on the client side, i.e. the id of the user\n    passportInstance.serializeUser((user, done) => {\n        done(null, user.id);\n    });\n    passportInstance.deserializeUser(async (id, done) => {\n        let user;\n        try {\n            user = (await _models_User__WEBPACK_IMPORTED_MODULE_1__[\"default\"].findById(id));\n        }\n        catch (err) {\n            done(err);\n        }\n        done(null, user);\n    });\n}\n\n\n//# sourceURL=webpack:///./server/authentication/configurePassport.ts?");

/***/ }),

/***/ "./server/index.ts":
/*!*************************!*\
  !*** ./server/index.ts ***!
  \*************************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var express__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! express */ \"express\");\n/* harmony import */ var express__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(express__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var express_ejs_layouts__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! express-ejs-layouts */ \"express-ejs-layouts\");\n/* harmony import */ var express_ejs_layouts__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(express_ejs_layouts__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var connect_flash__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! connect-flash */ \"connect-flash\");\n/* harmony import */ var connect_flash__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(connect_flash__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var express_session__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! express-session */ \"express-session\");\n/* harmony import */ var express_session__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(express_session__WEBPACK_IMPORTED_MODULE_3__);\n/* harmony import */ var passport__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! passport */ \"passport\");\n/* harmony import */ var passport__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(passport__WEBPACK_IMPORTED_MODULE_4__);\n/* harmony import */ var _authentication_configurePassport__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./authentication/configurePassport */ \"./server/authentication/configurePassport.ts\");\n/* harmony import */ var _authentication_authenticateMiddleware__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./authentication/authenticateMiddleware */ \"./server/authentication/authenticateMiddleware.ts\");\n/* harmony import */ var _routes_authRouter__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./routes/authRouter */ \"./server/routes/authRouter.ts\");\n/* harmony import */ var _routes_gameRouter__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./routes/gameRouter */ \"./server/routes/gameRouter.ts\");\n/* harmony import */ var _SERVER_CST__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./SERVER_CST */ \"./server/SERVER_CST.ts\");\n/* harmony import */ var mongoose__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! mongoose */ \"mongoose\");\n/* harmony import */ var mongoose__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(mongoose__WEBPACK_IMPORTED_MODULE_10__);\n/* harmony import */ var dotenv__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! dotenv */ \"dotenv\");\n/* harmony import */ var dotenv__WEBPACK_IMPORTED_MODULE_11___default = /*#__PURE__*/__webpack_require__.n(dotenv__WEBPACK_IMPORTED_MODULE_11__);\n/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! path */ \"path\");\n/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_12___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_12__);\n\n\n\n\n\n\n\n\n\n\n\n\n\n// Load the environment config from .env file\nlet { parsed: dotenvCfg } = dotenv__WEBPACK_IMPORTED_MODULE_11__[\"config\"]({\n    path: path__WEBPACK_IMPORTED_MODULE_12__[\"join\"](__dirname, \"/../../config/.env\"),\n    debug: true\n});\nmongoose__WEBPACK_IMPORTED_MODULE_10__[\"connect\"](dotenvCfg.MONGO_URI, {\n    useNewUrlParser: true,\n    useUnifiedTopology: true\n});\nconst PORT = process.env.PORT || 8080;\n// Add the local strategy and serialization / deserialization to passport\nObject(_authentication_configurePassport__WEBPACK_IMPORTED_MODULE_5__[\"default\"])(passport__WEBPACK_IMPORTED_MODULE_4__);\nlet app = express__WEBPACK_IMPORTED_MODULE_0__();\n// Set the ejs view engine\napp.set(\"view engine\", \"ejs\");\napp.use(express_ejs_layouts__WEBPACK_IMPORTED_MODULE_1__);\n// Express session middleware\napp.use(express_session__WEBPACK_IMPORTED_MODULE_3__({\n    secret: \"keyboard cat\",\n    resave: true,\n    saveUninitialized: true\n}));\n// Use passport middleware for auth\napp.use(passport__WEBPACK_IMPORTED_MODULE_4__[\"initialize\"]());\napp.use(passport__WEBPACK_IMPORTED_MODULE_4__[\"session\"]());\n// Connect flash for temporary data\n// Useful for sending messages to the client when redirecting\napp.use(connect_flash__WEBPACK_IMPORTED_MODULE_2___default()());\n// Temporary messages stored with flash\n// Pass them to locals so ejs can render the messages on the page\napp.use((req, res, next) => {\n    // Temp messages coming from the /users/register route\n    res.locals[_SERVER_CST__WEBPACK_IMPORTED_MODULE_9__[\"default\"].TEMP_MSG.SUCCESS] = req.flash(_SERVER_CST__WEBPACK_IMPORTED_MODULE_9__[\"default\"].TEMP_MSG.SUCCESS);\n    res.locals[_SERVER_CST__WEBPACK_IMPORTED_MODULE_9__[\"default\"].TEMP_MSG.ERROR] = req.flash(_SERVER_CST__WEBPACK_IMPORTED_MODULE_9__[\"default\"].TEMP_MSG.ERROR);\n    // The flash error message coming from passport\n    res.locals[_SERVER_CST__WEBPACK_IMPORTED_MODULE_9__[\"default\"].TEMP_MSG.ERROR] = req.flash(_SERVER_CST__WEBPACK_IMPORTED_MODULE_9__[\"default\"].TEMP_MSG.PASSPORT_ERR);\n    next();\n});\napp\n    .get(_SERVER_CST__WEBPACK_IMPORTED_MODULE_9__[\"default\"].WEB_MANIFEST, (req, res) => {\n    res.sendFile(path__WEBPACK_IMPORTED_MODULE_12__[\"join\"](__dirname, _SERVER_CST__WEBPACK_IMPORTED_MODULE_9__[\"default\"].MANIFEST_FILE));\n})\n    // the login / register path\n    .use(\"/users\", _routes_authRouter__WEBPACK_IMPORTED_MODULE_7__[\"default\"])\n    // authenticated game route\n    .use(_authentication_authenticateMiddleware__WEBPACK_IMPORTED_MODULE_6__[\"default\"], _routes_gameRouter__WEBPACK_IMPORTED_MODULE_8__[\"default\"])\n    // static files that do not require authentication\n    //.use(\"/no_auth\", express.static(CST.PUBLIC_FOLDER))\n    .listen(PORT, () => {\n    console.log(`App listening on ${PORT}.`);\n});\n\n\n//# sourceURL=webpack:///./server/index.ts?");

/***/ }),

/***/ "./server/models/User.ts":
/*!*******************************!*\
  !*** ./server/models/User.ts ***!
  \*******************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var mongoose__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! mongoose */ \"mongoose\");\n/* harmony import */ var mongoose__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(mongoose__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _validation_UserValidation__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../validation/UserValidation */ \"./server/validation/UserValidation.ts\");\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! bcryptjs */ \"bcryptjs\");\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(bcryptjs__WEBPACK_IMPORTED_MODULE_2__);\n\n\n// Hash the password before saving it to the db\n\nconst UserSchema = new mongoose__WEBPACK_IMPORTED_MODULE_0__[\"Schema\"]({\n    name: {\n        type: String,\n        trim: true,\n        required: _validation_UserValidation__WEBPACK_IMPORTED_MODULE_1__[\"default\"].required(\"Name\")\n    },\n    email: {\n        type: String,\n        trim: true,\n        lowercase: true,\n        required: _validation_UserValidation__WEBPACK_IMPORTED_MODULE_1__[\"default\"].required(\"Email\")\n    },\n    password: {\n        type: String\n    },\n    date: {\n        type: Date,\n        default: Date.now\n    }\n});\nUserSchema.method({\n    hashPassword: async function () {\n        let salt = await bcryptjs__WEBPACK_IMPORTED_MODULE_2__[\"genSalt\"]();\n        this.password = await bcryptjs__WEBPACK_IMPORTED_MODULE_2__[\"hash\"](this.password, salt);\n    },\n    passwordMatches: async function (plainTextPass) {\n        return await bcryptjs__WEBPACK_IMPORTED_MODULE_2__[\"compare\"](plainTextPass, this.password);\n    }\n});\nconst User = mongoose__WEBPACK_IMPORTED_MODULE_0__[\"model\"](\"User\", UserSchema);\n/* harmony default export */ __webpack_exports__[\"default\"] = (User);\n\n\n//# sourceURL=webpack:///./server/models/User.ts?");

/***/ }),

/***/ "./server/routes/authRouter.ts":
/*!*************************************!*\
  !*** ./server/routes/authRouter.ts ***!
  \*************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var express__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! express */ \"express\");\n/* harmony import */ var express__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(express__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var passport__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! passport */ \"passport\");\n/* harmony import */ var passport__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(passport__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _models_User__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../models/User */ \"./server/models/User.ts\");\n/* harmony import */ var _authentication_authenticateMiddleware__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../authentication/authenticateMiddleware */ \"./server/authentication/authenticateMiddleware.ts\");\n/* harmony import */ var _validation_UserValidation__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../validation/UserValidation */ \"./server/validation/UserValidation.ts\");\n\n\n// eslint-disable-next-line no-unused-vars\n\n\n\nconst router = express__WEBPACK_IMPORTED_MODULE_0__[\"Router\"]();\n// Parse body info from forms\nrouter.use(express__WEBPACK_IMPORTED_MODULE_0__[\"urlencoded\"]({ extended: false }));\nrouter\n    // If the user is already authenticated, redirect him to the game\n    .use((req, res, next) => {\n    if (req.isAuthenticated()) {\n        res.redirect(\"/\");\n        return;\n    }\n    next();\n})\n    .get(\"/login\", (req, res) => res.render(\"login\"))\n    .get(\"/register\", (req, res) => res.render(\"register\"))\n    // Handle login with passport\n    .post(\"/login\", passport__WEBPACK_IMPORTED_MODULE_1___default.a.authenticate(\"local\", {\n    successRedirect: \"/\",\n    failureRedirect: \"login\",\n    failureFlash: true\n}))\n    // Handle registration by validating and saving the user to the db\n    .post(\"/register\", async (req, res) => {\n    const { name, email, password, password_confirm } = req.body;\n    let user = new _models_User__WEBPACK_IMPORTED_MODULE_2__[\"default\"]({\n        name,\n        email,\n        password\n    });\n    // check to see if we find any errors\n    let errorMessages = await _validation_UserValidation__WEBPACK_IMPORTED_MODULE_4__[\"default\"].validateUser(req.body, user);\n    // If there are any errors, stay on the register page\n    // And display the validation errors to the user\n    if (errorMessages.length) {\n        res.render(\"register\", {\n            errorMessages,\n            name,\n            email,\n            password,\n            password_confirm\n        });\n        return;\n    }\n    // Succesful registration, try to save the user\n    try {\n        // Hashes the password internally via mongoose schema method\n        await user.hashPassword();\n        await user.save();\n    }\n    catch (err) {\n        res.statusCode = 500;\n        res.render(\"register\");\n        console.error(`Internal Error! could not save user ${user.name} to the database!`);\n        Object(_authentication_authenticateMiddleware__WEBPACK_IMPORTED_MODULE_3__[\"redirectToLogin\"])(req, res, \"Registration failed! Please try again later!\", false);\n        return;\n    }\n    Object(_authentication_authenticateMiddleware__WEBPACK_IMPORTED_MODULE_3__[\"redirectToLogin\"])(req, res, \"You have been successfully registered!\");\n});\n/* harmony default export */ __webpack_exports__[\"default\"] = (router);\n\n\n//# sourceURL=webpack:///./server/routes/authRouter.ts?");

/***/ }),

/***/ "./server/routes/gameRouter.ts":
/*!*************************************!*\
  !*** ./server/routes/gameRouter.ts ***!
  \*************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var express__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! express */ \"express\");\n/* harmony import */ var express__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(express__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _SERVER_CST__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../SERVER_CST */ \"./server/SERVER_CST.ts\");\n\n\nconst router = express__WEBPACK_IMPORTED_MODULE_0__[\"Router\"]();\nrouter.use(express__WEBPACK_IMPORTED_MODULE_0__[\"static\"](_SERVER_CST__WEBPACK_IMPORTED_MODULE_1__[\"default\"].PUBLIC_FOLDER));\n/* harmony default export */ __webpack_exports__[\"default\"] = (router);\n\n\n//# sourceURL=webpack:///./server/routes/gameRouter.ts?");

/***/ }),

/***/ "./server/validation/UserValidation.ts":
/*!*********************************************!*\
  !*** ./server/validation/UserValidation.ts ***!
  \*********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _SERVER_CST__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../SERVER_CST */ \"./server/SERVER_CST.ts\");\n/* harmony import */ var _models_User__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../models/User */ \"./server/models/User.ts\");\n/* eslint-disable no-inner-declarations */\n\n\nconst PASS = {\n    MIN: _SERVER_CST__WEBPACK_IMPORTED_MODULE_0__[\"default\"].USERS.PASS_MINLENGTH,\n    MAX: _SERVER_CST__WEBPACK_IMPORTED_MODULE_0__[\"default\"].USERS.PASS_MAXLENGTH\n};\nvar UserValidation;\n(function (UserValidation) {\n    // An error message caused by failed validation\n    class ErrorMessage {\n        constructor(fieldName, message) {\n            this.fieldName = fieldName;\n            this.message = message;\n        }\n    }\n    UserValidation.ErrorMessage = ErrorMessage;\n    async function validateUser(reqBody, userDocument) {\n        let duplicateEmailErr = await checkEmailDuplicates(userDocument);\n        if (duplicateEmailErr !== null) {\n            return [duplicateEmailErr];\n        }\n        // First, validate the password\n        let errorMessages = validatePassword(reqBody.password, reqBody.password_confirm);\n        // Use mongoose internal validation to validate name and email\n        let err = userDocument.validateSync();\n        if (typeof err !== \"undefined\") {\n            Object.entries(err.errors).forEach(([fieldName, error]) => {\n                errorMessages.push(new ErrorMessage(fieldName, error.message));\n            });\n        }\n        return errorMessages;\n    }\n    UserValidation.validateUser = validateUser;\n    // creates a required message error for mongoose validation\n    UserValidation.required = (fieldName) => [\n        true,\n        `${fieldName} cannot be empty`\n    ];\n    // Validate the password before creating a mongoose document\n    function validatePassword(password, confirmPassword) {\n        let errorMessages = [];\n        let pushErr = (errMsg) => errorMessages.push(new ErrorMessage(\"password\", errMsg));\n        if (password !== confirmPassword) {\n            pushErr(\"Passwords do not match\");\n        }\n        if (password.length < PASS.MIN) {\n            pushErr(`Password must be longer than ${PASS.MIN} characters`);\n        }\n        if (password.length > PASS.MAX) {\n            pushErr(`Password must be at most ${PASS.MAX} characters long`);\n        }\n        return errorMessages;\n    }\n    // Check if an user with this email already exists in the db\n    async function checkEmailDuplicates(userDocument) {\n        let duplicateUser = await _models_User__WEBPACK_IMPORTED_MODULE_1__[\"default\"].findOne({ email: userDocument.email });\n        if (duplicateUser) {\n            return new ErrorMessage(\"email\", \"There is already an user with that email registered!\");\n        }\n        return null;\n    }\n})(UserValidation || (UserValidation = {}));\n/* harmony default export */ __webpack_exports__[\"default\"] = (UserValidation);\n\n\n//# sourceURL=webpack:///./server/validation/UserValidation.ts?");

/***/ }),

/***/ "bcryptjs":
/*!***************************!*\
  !*** external "bcryptjs" ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"bcryptjs\");\n\n//# sourceURL=webpack:///external_%22bcryptjs%22?");

/***/ }),

/***/ "connect-flash":
/*!********************************!*\
  !*** external "connect-flash" ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"connect-flash\");\n\n//# sourceURL=webpack:///external_%22connect-flash%22?");

/***/ }),

/***/ "dotenv":
/*!*************************!*\
  !*** external "dotenv" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"dotenv\");\n\n//# sourceURL=webpack:///external_%22dotenv%22?");

/***/ }),

/***/ "express":
/*!**************************!*\
  !*** external "express" ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"express\");\n\n//# sourceURL=webpack:///external_%22express%22?");

/***/ }),

/***/ "express-ejs-layouts":
/*!**************************************!*\
  !*** external "express-ejs-layouts" ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"express-ejs-layouts\");\n\n//# sourceURL=webpack:///external_%22express-ejs-layouts%22?");

/***/ }),

/***/ "express-session":
/*!**********************************!*\
  !*** external "express-session" ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"express-session\");\n\n//# sourceURL=webpack:///external_%22express-session%22?");

/***/ }),

/***/ "mongoose":
/*!***************************!*\
  !*** external "mongoose" ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"mongoose\");\n\n//# sourceURL=webpack:///external_%22mongoose%22?");

/***/ }),

/***/ "passport":
/*!***************************!*\
  !*** external "passport" ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"passport\");\n\n//# sourceURL=webpack:///external_%22passport%22?");

/***/ }),

/***/ "passport-local":
/*!*********************************!*\
  !*** external "passport-local" ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"passport-local\");\n\n//# sourceURL=webpack:///external_%22passport-local%22?");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"path\");\n\n//# sourceURL=webpack:///external_%22path%22?");

/***/ })

/******/ });