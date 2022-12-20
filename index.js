"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
exports.__esModule = true;
var https = require("https");
var fs = require("fs");
var cors = require("cors");
var swaggerUi = require("swagger-ui-express");
var google_auth_library_1 = require("google-auth-library");
var readline = require("readline");
var port = 8080;
var googleOAuth2Client = new google_auth_library_1.OAuth2Client('230415817594-crmji8nc98jh4v2fg86d4eq1cokp5rv3.apps.googleusercontent.com');
var swaggerDocument = require('./swagger.json');
var express = require('express');
var app = express();
var loggedInUser = {
    email: null, isAdmin: false, password: null, sub: null,
    id: null,
    sessionId: null,
    userIp: null
};
// Store user data
app.use(function (req, res, next) {
    var sessionId = parseInt(getSessionId(req));
    if (sessionId) {
        var sessionUser = sessions.find(function (session) { return session.id === sessionId; });
        if (sessionUser) {
            var user = users.findById(sessionUser.userId);
            loggedInUser = {
                email: user.email,
                isAdmin: user.isAdmin,
                password: user.password,
                sub: user.sub,
                id: user.id,
                sessionId: sessionId,
                userIp: null
            };
        }
    }
    else {
        loggedInUser = {
            email: null, isAdmin: false, password: null, sub: null,
            id: null,
            sessionId: null,
            userIp: null
        };
    }
    loggedInUser.userIp = String(req.headers['x-forwarded-for']) || String(req.socket.remoteAddress);
    next();
});
function login(user, req) {
    var session = createSession(user.id);
    loggedInUser = __assign(__assign({}, user), { sessionId: session.id, userIp: req.headers['x-forwarded-for'] || req.socket.remoteAddress });
}
function log(eventName, extraData) {
    // Create timestamp
    var timeStamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    // Parse extraData and eventName to JSON and escape the delimiter with backslash
    extraData = JSON.stringify(extraData).replace(/　/g, '\\　');
    // trim only quotes from extraData
    extraData = extraData.replace(/^"(.*)"$/, '$1');
    // Write to file
    fs.appendFile('./log.txt', timeStamp + '　' + loggedInUser.userIp + '　' + loggedInUser.id + '　' + eventName + '　' + extraData + ' \r\n', function (err) {
        if (err)
            throw err;
    });
}
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
var httpsServer = https
    .createServer(
// Provide the private and public key to the server by reading each
// file's content with the readFileSync() method.
{
    key: fs.readFileSync("key.pem"), cert: fs.readFileSync("cert.pem")
}, app)
    .listen(port, function () {
    console.log("Server is running at port " + port);
});
var expressWs = require('express-ws')(app, httpsServer);
app.use(cors()); // Avoid CORS errors in browsers
app.use(express.json()); // Populate req.body
function getDataFromGoogleJwt(token) {
    return __awaiter(this, void 0, void 0, function () {
        var ticket;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, googleOAuth2Client.verifyIdToken({
                        idToken: token, audience: '230415817594-crmji8nc98jh4v2fg86d4eq1cokp5rv3.apps.googleusercontent.com'
                    })];
                case 1:
                    ticket = _a.sent();
                    return [2 /*return*/, ticket.getPayload()];
            }
        });
    });
}
app.get('/logs', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var lineReader, lines, _a, lineReader_1, lineReader_1_1, line, fields, i, e_1_1;
    var _b, e_1, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                if (requireAdmin(req, res) !== true) {
                    return [2 /*return*/];
                }
                lineReader = readline.createInterface({
                    input: fs.createReadStream('./log.txt'), crlfDelay: Infinity
                });
                lines = [];
                _e.label = 1;
            case 1:
                _e.trys.push([1, 6, 7, 12]);
                _a = true, lineReader_1 = __asyncValues(lineReader);
                _e.label = 2;
            case 2: return [4 /*yield*/, lineReader_1.next()];
            case 3:
                if (!(lineReader_1_1 = _e.sent(), _b = lineReader_1_1.done, !_b)) return [3 /*break*/, 5];
                _d = lineReader_1_1.value;
                _a = false;
                try {
                    line = _d;
                    fields = line.match(/(\\.|[^　])+/g);
                    // Iterate over result
                    if (fields) {
                        for (i = 0; i < fields.length; i++) {
                            // Remove backslash from escaped '　'
                            fields[i] = fields[i].replace(/\\/g, '');
                        }
                        // Add the line to the lines array
                        lines.push({
                            timeStamp: fields[0], userIp: fields[1], userId: fields[2], eventName: fields[3], extraData: fields[4]
                        });
                    }
                }
                finally {
                    _a = true;
                }
                _e.label = 4;
            case 4: return [3 /*break*/, 2];
            case 5: return [3 /*break*/, 12];
            case 6:
                e_1_1 = _e.sent();
                e_1 = { error: e_1_1 };
                return [3 /*break*/, 12];
            case 7:
                _e.trys.push([7, , 10, 11]);
                if (!(!_a && !_b && (_c = lineReader_1["return"]))) return [3 /*break*/, 9];
                return [4 /*yield*/, _c.call(lineReader_1)];
            case 8:
                _e.sent();
                _e.label = 9;
            case 9: return [3 /*break*/, 11];
            case 10:
                if (e_1) throw e_1.error;
                return [7 /*endfinally*/];
            case 11: return [7 /*endfinally*/];
            case 12: 
            // Return the lines array
            return [2 /*return*/, res.send(lines)];
        }
    });
}); });
app.post('/oAuth2Login', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var dataFromGoogleJwt, user_1, clientBookedTimes, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, getDataFromGoogleJwt(req.body.credential)];
            case 1:
                dataFromGoogleJwt = _a.sent();
                if (dataFromGoogleJwt) {
                    user_1 = users.findBy('sub', dataFromGoogleJwt.sub);
                    if (!user_1) {
                        user_1 = createUser(dataFromGoogleJwt.email, null, dataFromGoogleJwt.sub);
                    }
                    login(user_1, req);
                    log("oAuth2Login", "".concat(dataFromGoogleJwt.name, " (").concat(dataFromGoogleJwt.email, ") logged in with Google OAuth2 as user ").concat(user_1["email"]));
                    clientBookedTimes = times.filter(function (time) { return time.userId === user_1["id"]; });
                    res.status(201).send({
                        sessionId: loggedInUser.sessionId,
                        isAdmin: user_1["isAdmin"],
                        bookedTimes: JSON.stringify(clientBookedTimes)
                    });
                }
                return [3 /*break*/, 3];
            case 2:
                err_1 = _a.sent();
                console.log(err_1);
                return [2 /*return*/, res.status(400).send({ error: 'Login unsuccessful' })];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.ws('/', function () {
});
var times = [{
        id: 1, day: "2022-02-14", start: "8:00", end: "8:30", bookedBy: null, userId: null, phone: null
    }, {
        id: 2, day: "2025-02-15", start: "8:00", end: "8:30", bookedBy: null, userId: null, phone: null
    }, { id: 3, day: "2025-02-16", start: "8:30", end: "9:00", bookedBy: null, userId: null, phone: null }, {
        id: 4, day: "2025-02-17", start: "9:00", end: "9:30", bookedBy: null, userId: null, phone: null
    }, { id: 5, day: "2025-02-17", start: "9:30", end: "10:00", bookedBy: null, userId: null, phone: null }, {
        id: 6, day: "2025-02-17", start: "10:00", end: "10:30", bookedBy: null, userId: null, phone: null
    },];
var users = [{ id: 1, email: "Admin", password: "Password", isAdmin: true, sub: "102881469727696684931" }, {
        id: 2, email: "User", password: "Password", isAdmin: false, sub: ""
    }];
var sessions = [{ id: 1, userId: 1 }];
function createUser(email, password, sub) {
    var user = {
        id: users.length + 1,
        email: email,
        password: password,
        isAdmin: false,
        sub: sub
    };
    users.push(user);
    return user;
}
function createSession(userId) {
    // Find max id from sessions using reduce
    var newSession = {
        id: sessions.reduce(function (max, p) { return p.id > max ? p.id : max; }, 0) + 1,
        userId: userId
    };
    sessions.push(newSession);
    return newSession;
}
function isValidFutureDate(req) {
    var date = new Date(req.body.day + ' ' + req.body.start);
    if (!date.getDate())
        return false;
    return new Date() <= date;
}
function getSessionId(req) {
    var authorization = req.headers.authorization;
    if (!authorization)
        return null;
    var parts = authorization.split(' ');
    if (parts.length !== 2)
        return null;
    if (/^Bearer$/i.test(parts[0])) {
        return parts[1];
    }
    return null;
}
function requireAdmin(req, res) {
    var sessionId = getSessionId(req);
    if (!sessionId) {
        return res.status(401).send({ error: 'You have to login' });
    }
    var sessionUser = sessions.find(function (session) { return session.id === parseInt(sessionId); });
    if (!sessionUser)
        return res.status(401).json({ error: 'Invalid token' });
    // Check that the sessionId in the sessions has user in it
    var user = users.findById(sessionUser.userId);
    if (!user) {
        return res.status(400).send({ error: 'SessionId does not have an user associated with it' });
    }
    // Check that the user is an admin
    if (!user["isAdmin"]) {
        return res.status(400).send({ error: 'Insufficient permissions' });
    }
    return true;
}
function requireLogin(req, res, next) {
    if (!loggedInUser.sessionId) {
        return res.status(401).send({ error: 'You have to login' });
    }
    var sessionUser = sessions.find(function (session) { return session.id === loggedInUser.sessionId; });
    if (!sessionUser)
        return res.status(401).json({ error: 'Invalid token' });
    // Check that the sessionId in the sessions has user in it
    var user = users.findById(sessionUser.userId);
    if (!user) {
        return res.status(404).send({ error: 'SessionId does not have an user associated with it' });
    }
    req.sessionId = sessionUser.id;
    req.isAdmin = user["isAdmin"];
    next();
}
function getTime(id) {
    return times.findById(id);
}
function getBookedTimes() {
    return times.filter(function (time) { return time.userId === loggedInUser.id; });
}
if (!Array.prototype.findById) {
    Array.prototype.findById = function (id) {
        return this.findBy('id', id);
    };
}
if (!Array.prototype.findBy) {
    Array.prototype.findBy = function (field, value) {
        return this.find(function (x) {
            return x[field] === value;
        });
    };
}
var delay = function (ms) { return new Promise(function (res) { return setTimeout(res, ms); }); };
app.get('/times', function (req, res) {
    res.send(times);
});
app.use(express.static(__dirname + '/public'));
app.patch('/times/:id', requireLogin, function (req, res) {
    // Check that :id is a valid number
    if ((Number.isInteger(req.params.id) && parseInt(req.params.id) > 0)) {
        return res.status(400).send({ error: 'Invalid id' });
    }
    var time = getTime(parseInt(req.params.id));
    // Check that time with given id exists
    if (!time) {
        return res.status(404).send({ error: 'Time not found' });
    }
    var timeOriginal = JSON.parse(JSON.stringify(time));
    // Change name, day, start, end and phone for given id if provided
    if (req.body.name) {
        // Check that name is valid
        if (!/^\w{2,}/.test(req.body.name)) {
            return res.status(400).send({ error: 'Invalid name' });
        }
        time["bookedBy"] = req.body.name;
        time["userId"] = loggedInUser.id;
    }
    // Check that start is valid
    if (req.body.start) {
        if (requireAdmin(req, res) !== true) {
            return;
        }
        if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(req.body.start)) {
            return res.status(400).send({ error: 'Invalid start' });
        }
        time["start"] = req.body.start;
    }
    // Check that day is valid
    if (req.body.day) {
        if (requireAdmin(req, res) !== true) {
            return;
        }
        if (!isValidFutureDate(req)) {
            return res.status(400).send({ error: 'Invalid day' });
        }
        time["day"] = req.body.day;
    }
    // Check that end is valid
    if (req.body.end) {
        if (requireAdmin(req, res) !== true) {
            return;
        }
        if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(req.body.end)) {
            return res.status(400).send({ error: 'Invalid end' });
        }
        // Check that end is bigger than start
        if (req.body.end.padStart(5, "0") < req.body.start.padStart(5, "0")) {
            return res.status(400).send({ error: 'Invalid end' });
        }
        time["end"] = req.body.end;
    }
    // Check that phone is valid
    if (req.body.phone) {
        if (!req.body.phone || !/^\+?[1-9]\d{6,14}$/.test(req.body.phone)) {
            return res.status(400).send({ error: 'Invalid phone' });
        }
        time["phone"] = req.body.phone;
        time["userId"] = loggedInUser.id;
    }
    if ((!req.body.name && req.body.phone) || (!req.body.phone && req.body.name)) {
        if (requireAdmin(req, res) !== true) {
            return;
        }
        time["phone"] = req.body.phone;
        time["bookedBy"] = req.body.name;
    }
    if (!req.body.name && !req.body.phone) {
        time["bookedBy"] = null;
        time["phone"] = null;
        time["userId"] = null;
    }
    function diff(obj1, obj2) {
        // function get unique keys from timeOriginal and time
        function getUniqueKeys(obj1, obj2) {
            var keys = Object.keys(obj1).concat(Object.keys(obj2));
            return keys.filter(function (item, pos) {
                return keys.indexOf(item) === pos;
            });
        }
        var result = {};
        // iterate over unique keys of obj1 and obj2 with TypeScript type guard
        getUniqueKeys(obj1, obj2).forEach(function (key) {
            if (obj1[key] !== obj2[key]) {
                result[key] = obj2[key];
            }
        });
        return result;
    }
    log("editTime", "id: ".concat(time["id"], ", diff: ").concat(diff(timeOriginal, time)));
    // Distribute change to other clients
    expressWs.getWss().clients.forEach(function (client) { return client.send(JSON.stringify(time)); });
    if (req.body.name && req.body.phone) {
        expressWs.getWss().clients.forEach(function (client) { return client.send(time["id"]); });
    }
    res.status(200).send(time);
});
app.post('/times', function (req, res) {
    if (requireAdmin(req, res) !== true) {
        return;
    }
    var ids = times.map(function (object) {
        return object.id;
    });
    var maxTimeId = Math.max.apply(Math, ids);
    var newTime = {
        id: maxTimeId + 1,
        day: null,
        start: null,
        end: null,
        bookedBy: null,
        userId: null,
        phone: null
    };
    // Add name, day, start, end and phone if provided
    if (req.body.name) {
        // Check that name is valid
        if (!/^\w{4,}/.test(req.body.name)) {
            return res.status(400).send({ error: 'Invalid name' });
        }
        newTime.bookedBy = req.body.name;
        newTime.userId = loggedInUser.id;
    }
    // Check that start is valid
    if (!req.body.start || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(req.body.start)) {
        return res.status(400).send({ error: 'Invalid start' });
    }
    newTime.start = req.body.start;
    // Check that day is valid
    if (!req.body.day || !isValidFutureDate(req)) {
        return res.status(400).send({ error: 'Invalid day' });
    }
    newTime.day = req.body.day;
    // Check that end is valid
    if (!req.body.end || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(req.body.end)) {
        return res.status(400).send({ error: 'Invalid end' });
    }
    newTime.end = req.body.end;
    // Check that end is bigger than start
    if (req.body.end.padStart(5, "0") < req.body.start.padStart(5, "0")) {
        return res.status(400).send({ error: 'Invalid end' });
    }
    if (req.body.phone) {
        // Check that phone is valid
        if (!/^\+?[1-9]\d{6,14}$/.test(req.body.phone)) {
            return res.status(400).send({ error: 'Invalid phone' });
        }
        newTime['phone'] = req.body.phone;
        newTime.userId = loggedInUser.id;
    }
    times.push(newTime);
    log("addTime", "".concat(newTime));
    expressWs.getWss().clients.forEach(function (client) { return client.send(JSON.stringify(newTime)); });
    res.status(201).end();
});
app["delete"]('/times/:id', function (req, res) {
    if (requireAdmin(req, res) !== true) {
        return;
    }
    // Check that :id is a valid number
    if ((Number.isInteger(req.params.id) && parseInt(req.params.id) > 0)) {
        return res.status(400).send({ error: 'Invalid id' });
    }
    var time = times.findById(parseInt(req.params.id));
    // Check that time with given id exists
    if (!time) {
        return res.status(404).send({ error: 'Time not found' });
    }
    times = times.filter(function (time) { return time.id !== parseInt(req.params.id); });
    log("deleteTime", "Time: ".concat(time["id"], ", ").concat(time["day"], " ").concat(time["start"], "-").concat(time["end"], " for ").concat(time["bookedBy"], " (").concat(time["phone"], ") deleted"));
    expressWs.getWss().clients.forEach(function (client) { return client.send(parseInt(req.params.id)); });
    res.status(204).end();
});
app.get('/times/available', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var timesAvailable, i;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            // 1-second delay before responding to test front end caching
            return [4 /*yield*/, delay(1000)];
            case 1:
                // 1-second delay before responding to test front end caching
                _a.sent();
                timesAvailable = [];
                i = 0;
                while (i < times.length) {
                    if (!times[i].bookedBy) {
                        timesAvailable.push(times[i]);
                    }
                    i++;
                }
                res.send(timesAvailable);
                return [2 /*return*/];
        }
    });
}); });
app.get('/times/:id', function (req, res) {
    var time = getTime(parseInt(req.params.id));
    if (!time) {
        return res.status(404).send({ error: "Time not found" });
    }
    res.send(time);
});
app.get('/times/booked', requireLogin, function (req, res) {
    var bookedTimes = getBookedTimes();
    if (!bookedTimes) {
        return res.status(404).send({ error: "Booked times not found" });
    }
    res.send({ bookedTimes: JSON.stringify(bookedTimes), isAdmin: req.isAdmin });
});
app.post('/users', function (req, res) {
    if (!req.body.email || !req.body.password) {
        return res.status(400).send({ error: 'One or all params are missing' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
        return res.status(400).send({ error: 'Invalid email' });
    }
    var user = users.findBy('email', req.body.email);
    if (user) {
        return res.status(409).send({ error: 'Conflict: The user already exists. ' });
    }
    user = createUser(req.body.email, req.body.password, null);
    login(user, req);
    log("registration", "User: ".concat(loggedInUser.email, " created and logged in"));
    res.status(201).send({ sessionId: loggedInUser.sessionId });
});
app.post('/sessions', function (req, res) {
    if (!req.body.email || !req.body.password) {
        return res.status(400).send({ error: 'One or all params are missing' });
    }
    var user = users.find(function (user) { return user.email === req.body.email && user.password === req.body.password; });
    if (!user) {
        return res.status(401).send({ error: 'Unauthorized: email or password is incorrect' });
    }
    login(user, req);
    var clientBookedTimes = times.filter(function (time) { return time.userId === loggedInUser.id; });
    log("login", "User: ".concat(loggedInUser.email, " logged in"));
    res.status(201).send({
        sessionId: loggedInUser.sessionId, isAdmin: user["isAdmin"], bookedTimes: JSON.stringify(clientBookedTimes)
    });
});
app["delete"]('/sessions', requireLogin, function (req, res) {
    sessions = sessions.filter(function (session) { return session.id !== req.sessionId; });
    log("logout", "User: ".concat(loggedInUser.email, " logged out"));
    res.status(204).end();
});
app.use(function (err, req, res, next) {
    console.error(err.message, err.stack);
    return res.status(err.statusCode || 500).json({ error: err.message });
});
