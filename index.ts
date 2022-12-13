import * as https from 'https';
import * as fs from 'fs';
import * as cors from 'cors';
import * as swaggerUi from 'swagger-ui-express';
import {OAuth2Client} from 'google-auth-library';
import * as readline from "readline";
import {NextFunction, Response, Request} from 'express';

const port = 8080;
const googleOAuth2Client = new OAuth2Client('230415817594-crmji8nc98jh4v2fg86d4eq1cokp5rv3.apps.googleusercontent.com');
const swaggerDocument = require('./swagger.json');
const express = require('express');

let app = express();

// Declaring custom request interface
import {
    GetBookedTimesResponse,
    GetLogsResponse,
    GetTimeResponse,
    Lines,
    LoggedInUser,
    OAuth2LoginRequest,
    PostSessionRequest,
    PostSessionResponse,
    PostTimeRequest,
    DeleteSessionRequest,
    Session,
    Sessions,
    Time,
    Times,
    User,
    Users,
    Error, PostUserResponse, PostUserRequest, GetBookedTimesRequest, RequireLogin, OAuth2LoginResponse, Ids, Nullable
} from './types';

let loggedInUser: LoggedInUser = {
    email: null, isAdmin: false, password: null, sub: null,
    id: null,
    sessionId: null,
    userIp: null
}
// Store user data
app.use(function (req: Request, res: Response, next: NextFunction) {
    let sessionId: number = parseInt(getSessionId(req) as string)
    if (sessionId) {
        const sessionUser: Session | undefined = sessions.find((session) => session.id === sessionId);
        if (sessionUser) {
            const user: User = users.findById(sessionUser.userId);
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
    } else {
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

function login(user: User, req: Request) {
    const session = createSession(user.id);
    loggedInUser = {...user, sessionId: session.id, userIp: req.headers['x-forwarded-for'] || req.socket.remoteAddress};
}


function log(eventName: string, extraData: string) {

    // Create timestamp
    const timeStamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')

    // Parse extraData and eventName to JSON and escape the delimiter with backslash
    extraData = JSON.stringify(extraData).replace(/　/g, '\\　');

    // trim only quotes from extraData
    extraData = extraData.replace(/^"(.*)"$/, '$1');

    // Write to file
    fs.appendFile('./log.txt', timeStamp + '　' + loggedInUser.userIp + '　' + loggedInUser.id + '　' + eventName + '　' + extraData + ' \r\n', function (err) {
        if (err) throw err;
    });
}

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

let httpsServer = https
    .createServer(
        // Provide the private and public key to the server by reading each
        // file's content with the readFileSync() method.
        {
            key: fs.readFileSync("key.pem"), cert: fs.readFileSync("cert.pem"),
        }, app)

    .listen(port, () => {
        console.log("Server is running at port " + port);
    });
const expressWs = require('express-ws')(app, httpsServer);
app.use(cors())        // Avoid CORS errors in browsers
app.use(express.json()) // Populate req.body
async function getDataFromGoogleJwt(token: string) {
    const ticket = await googleOAuth2Client.verifyIdToken({
        idToken: token, audience: '230415817594-crmji8nc98jh4v2fg86d4eq1cokp5rv3.apps.googleusercontent.com',
    });
    return ticket.getPayload();
}

app.get('/logs', async (req: Request, res: GetLogsResponse) => {
    if (requireAdmin(req, res) !== true) {
        return
    }
    // Read the log file
    const lineReader = readline.createInterface({
        input: fs.createReadStream('./log.txt'), crlfDelay: Infinity
    });

    let lines: Lines = [];
    // Parse the log file
    for await (const line of lineReader) {

        // Split the line into array with '　' as delimiter, except when the delimiter is escaped with backslash
        const fields: RegExpMatchArray | null = line.match(/(\\.|[^　])+/g)

        // Iterate over result
        if (fields) {
            for (let i = 0; i < fields.length; i++) {

                // Remove backslash from escaped '　'
                fields[i] = fields[i].replace(/\\/g, '');
            }

            // Add the line to the lines array
            lines.push({
                timeStamp: fields[0], userIp: fields[1], userId: fields[2], eventName: fields[3], extraData: fields[4]
            });
        }
    }

    // Return the lines array
    return res.send(lines);
});

app.post('/oAuth2Login', async (req: OAuth2LoginRequest, res: OAuth2LoginResponse) => {
    try {
        const dataFromGoogleJwt = await getDataFromGoogleJwt(req.body.credential)
        if (dataFromGoogleJwt) {
            let user: User = users.findBy('sub', dataFromGoogleJwt.sub);
            if (!user) {
                user = createUser(dataFromGoogleJwt.email, null, dataFromGoogleJwt.sub)
            }
            login(user, req);
            log("oAuth2Login", `${dataFromGoogleJwt.name} (${dataFromGoogleJwt.email}) logged in with Google OAuth2 as user ${user["email"]}`);
            let clientBookedTimes = times.filter((time) => time.userId === user["id"]);
            res.status(201).send({
                sessionId: loggedInUser.sessionId,
                isAdmin: user["isAdmin"],
                bookedTimes: JSON.stringify(clientBookedTimes)
            })
        }
    } catch (err) {
        console.log(err)
        return res.status(400).send({error: 'Login unsuccessful'});
    }
});

app.ws('/', function () {
});

let times: Times = [{
    id: 1, day: "2022-02-14", start: "8:00", end: "8:30", bookedBy: null, userId: null, phone: null
}, {
    id: 2, day: "2025-02-15", start: "8:00", end: "8:30", bookedBy: null, userId: null, phone: null
}, {id: 3, day: "2025-02-16", start: "8:30", end: "9:00", bookedBy: null, userId: null, phone: null}, {
    id: 4, day: "2025-02-17", start: "9:00", end: "9:30", bookedBy: null, userId: null, phone: null
}, {id: 5, day: "2025-02-17", start: "9:30", end: "10:00", bookedBy: null, userId: null, phone: null}, {
    id: 6, day: "2025-02-17", start: "10:00", end: "10:30", bookedBy: null, userId: null, phone: null
},]

const users: Users = [{id: 1, email: "Admin", password: "Password", isAdmin: true, sub: "102881469727696684931"}, {
    id: 2, email: "User", password: "Password", isAdmin: false, sub: "",
}]


let sessions: Sessions = [{id: 1, userId: 1}]

function createUser(email: Nullable<string> | undefined, password: Nullable<string>, sub: Nullable<string>) {
    let user: User = {
        id: users.length + 1,
        email: email,
        password: password,
        isAdmin: false,
        sub: sub
    };
    users.push(user)
    return user;
}

function createSession(userId: number) {

    // Find max id from sessions using reduce
    let newSession: Session = {
        id: sessions.reduce((max, p) => p.id > max ? p.id : max, 0) + 1, userId
    }
    sessions.push(newSession)
    return newSession
}

function isValidFutureDate(req: Request) {
    const date = new Date(req.body.day + ' ' + req.body.start);
    if (!date.getDate()) return false;
    return new Date() <= date;
}

function getSessionId(req: Request) {
    const authorization: string | undefined = req.headers.authorization;
    if (!authorization) return null;
    const parts: Array<string> = authorization.split(' ');
    if (parts.length !== 2) return null;
    if (/^Bearer$/i.test(parts[0])) {
        return parts[1];
    }
    return null;
}

function requireAdmin(req: Request, res: Response) {

    const sessionId = getSessionId(req);
    if (!sessionId) {
        return res.status(401).send({error: 'You have to login'})
    }

    const sessionUser = sessions.find((session) => session.id === parseInt(sessionId));
    if (!sessionUser) return res.status(401).json({error: 'Invalid token'});

    // Check that the sessionId in the sessions has user in it
    const user = users.findById(sessionUser.userId);
    if (!user) {
        return res.status(400).send({error: 'SessionId does not have an user associated with it'})
    }

    // Check that the user is an admin
    if (!user["isAdmin"]) {
        return res.status(400).send({error: 'Insufficient permissions'})
    }
    return true
}

function requireLogin(req: RequireLogin, res: Response, next: NextFunction) {

    if (!loggedInUser.sessionId) {
        return res.status(401).send({error: 'You have to login'})
    }

    const sessionUser = sessions.find((session) => session.id === loggedInUser.sessionId);
    if (!sessionUser) return res.status(401).json({error: 'Invalid token'});

    // Check that the sessionId in the sessions has user in it
    const user = users.findById(sessionUser.userId);
    if (!user) {
        return res.status(404).send({error: 'SessionId does not have an user associated with it'})
    }

    req.sessionId = sessionUser.id
    req.isAdmin = user["isAdmin"]
    next()
}

function getTime(id: number) {
    return times.findById(id);
}

function getBookedTimes() {
    return times.filter((time) => time.userId === loggedInUser.id);
}

// Adding findBy and findById functions to Array type
export {};

declare global {
    interface Array<T> {
        findById(value: number): T;

        findBy(field: string, value: string | number): T;
    }
}
if (!Array.prototype.findById) {
    Array.prototype.findById = function (id: number) {
        return this.findBy('id', id);
    };
}
if (!Array.prototype.findBy) {
    Array.prototype.findBy = function (field, value: string | number) {
        return this.find(function (x) {
            return x[field as keyof typeof x] === value;
        })
    }
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
app.get('/times', (req: Request, res: GetTimeResponse) => {
    res.send(times)
})

app.get('/', (req: Request, res: Response) => {
    fs.readFile('./index.html', function (err, html) {
        if (err) {
            throw err;
        }
        res.setHeader('content-type', 'text/html');
        res.send(html)
    });

})

app.patch('/times/:id', requireLogin, (req: Request, res: Response) => {

    // Check that :id is a valid number
    if ((Number.isInteger(req.params.id) && parseInt(req.params.id) > 0)) {
        return res.status(400).send({error: 'Invalid id'})
    }

    let time = getTime(parseInt(req.params.id));

    // Check that time with given id exists
    if (!time) {
        return res.status(404).send({error: 'Time not found'})
    }

    let timeOriginal = JSON.parse(JSON.stringify(time));

    // Change name, day, start, end and phone for given id if provided
    if (req.body.name) {

        // Check that name is valid
        if (!/^\w{2,}/.test(req.body.name)) {
            return res.status(400).send({error: 'Invalid name'})
        }
        time["bookedBy"] = req.body.name
        time["userId"] = loggedInUser.id
    }

    // Check that start is valid
    if (req.body.start) {
        if (requireAdmin(req, res) !== true) {
            return
        }
        if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(req.body.start)) {
            return res.status(400).send({error: 'Invalid start'})
        }
        time["start"] = req.body.start
    }

    // Check that day is valid
    if (req.body.day) {
        if (requireAdmin(req, res) !== true) {
            return
        }
        if (!isValidFutureDate(req)) {
            return res.status(400).send({error: 'Invalid day'})
        }
        time["day"] = req.body.day
    }

    // Check that end is valid
    if (req.body.end) {
        if (requireAdmin(req, res) !== true) {
            return
        }
        if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(req.body.end)) {
            return res.status(400).send({error: 'Invalid end'})
        }

        // Check that end is bigger than start
        if (req.body.end < req.body.start) {
            return res.status(400).send({error: 'Invalid end'})
        }
        time["end"] = req.body.end
    }

    // Check that phone is valid
    if (req.body.phone) {
        if (!req.body.phone || !/^\+?[1-9]\d{6,14}$/.test(req.body.phone)) {
            return res.status(400).send({error: 'Invalid phone'})
        }
        time["phone"] = req.body.phone
        time["userId"] = loggedInUser.id
    }
    if ((!req.body.name && req.body.phone) || (!req.body.phone && req.body.name)) {
        if (requireAdmin(req, res) !== true) {
            return
        }
        time["phone"] = req.body.phone
        time["bookedBy"] = req.body.name
    }
    if (!req.body.name && !req.body.phone) {
        time["bookedBy"] = null
        time["phone"] = null
        time["userId"] = null
    }

    function diff(obj1: object, obj2: object) {

        // function get unique keys from timeOriginal and time
        function getUniqueKeys(obj1: any, obj2: any): string[] {
            let keys = Object.keys(obj1).concat(Object.keys(obj2));
            return keys.filter(function (item, pos) {
                return keys.indexOf(item) === pos;
            });
        }

        let result = {};

        // iterate over unique keys of obj1 and obj2 with TypeScript type guard
        getUniqueKeys(obj1, obj2).forEach((key: string) => {
            if (obj1[key as keyof typeof obj1] !== obj2[key as keyof typeof obj2]) {
                result[key as keyof typeof obj1] = obj2[key as keyof typeof obj2];
            }

        });


        return result;
    }

    log("editTime", `id: ${time["id"]}, diff: ${diff(timeOriginal, time)}`);

    // Distribute change to other clients
    expressWs.getWss().clients.forEach((client: any) => client.send(JSON.stringify(time)));
    if (req.body.name && req.body.phone) {
        expressWs.getWss().clients.forEach((client: any) => client.send(time["id"]));
    }
    res.status(200).send(time)
})

app.post('/times', (req: PostTimeRequest, res: Response) => {
    if (requireAdmin(req, res) !== true) {
        return
    }

    const ids: Ids = times.map(object => {
        return object.id;
    });
    const maxTimeId = Math.max(...ids);
    let newTime: Time = {
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
            return res.status(400).send({error: 'Invalid name'})
        }
        newTime.bookedBy = req.body.name
        newTime.userId = loggedInUser.id
    }

    // Check that start is valid
    if (!req.body.start || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(req.body.start)) {
        return res.status(400).send({error: 'Invalid start'})
    }

    newTime.start = req.body.start

    // Check that day is valid
    if (!req.body.day || !isValidFutureDate(req)) {
        return res.status(400).send({error: 'Invalid day'})
    }

    newTime.day = req.body.day

    // Check that end is valid
    if (!req.body.end || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(req.body.end)) {
        return res.status(400).send({error: 'Invalid end'})
    }

    newTime.end = req.body.end

    // Check that end is bigger than start
    if (req.body.end < req.body.start) {
        return res.status(400).send({error: 'Invalid end'})
    }

    if (req.body.phone) {
        // Check that phone is valid
        if (!/^\+?[1-9]\d{6,14}$/.test(req.body.phone)) {
            return res.status(400).send({error: 'Invalid phone'})
        }
        newTime['phone'] = req.body.phone
        newTime.userId = loggedInUser.id
    }

    times.push(newTime)
    log("addTime", `${newTime}`);
    expressWs.getWss().clients.forEach((client: any) => client.send(JSON.stringify(newTime)));
    res.status(201).end()
})


app.delete('/times/:id', (req: Request, res: Response) => {
    if (requireAdmin(req, res) !== true) {
        return
    }

    // Check that :id is a valid number
    if ((Number.isInteger(req.params.id) && parseInt(req.params.id) > 0)) {
        return res.status(400).send({error: 'Invalid id'})
    }
    let time = times.findById(parseInt(req.params.id))

    // Check that time with given id exists
    if (!time) {
        return res.status(404).send({error: 'Time not found'})
    }
    times = times.filter((time) => time.id !== parseInt(req.params.id));
    log("deleteTime", `Time: ${time["id"]}, ${time["day"]} ${time["start"]}-${time["end"]} for ${time["bookedBy"]} (${time["phone"]}) deleted`);
    expressWs.getWss().clients.forEach((client: any) => client.send(parseInt(req.params.id)));
    res.status(204).end()
})

app.get('/times/available', async (req: Request, res: GetTimeResponse) => {

    // 1-second delay before responding to test front end caching
    await delay(1000);

    let timesAvailable = [];
    let i = 0;
    while (i < times.length) {
        if (!times[i].bookedBy) {
            timesAvailable.push(times[i]);
        }
        i++;
    }
    res.send(timesAvailable)
})

app.get('/times/:id', (req: Request, res: GetTimeResponse) => {
    let time: Time = getTime(parseInt(req.params.id));
    if (!time) {
        return res.status(404).send({error: "Time not found"})
    }
    res.send(time)
})

app.get('/times/booked', requireLogin, (req: GetBookedTimesRequest, res: GetBookedTimesResponse) => {
    let bookedTimes = getBookedTimes();
    if (!bookedTimes) {
        return res.status(404).send({error: "Booked times not found"})
    }
    res.send({bookedTimes: JSON.stringify(bookedTimes), isAdmin: req.isAdmin})
})

app.post('/users', (req: PostUserRequest, res: PostUserResponse) => {
    if (!req.body.email || !req.body.password) {
        return res.status(400).send({error: 'One or all params are missing'})
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
        return res.status(400).send({error: 'Invalid email'})
    }
    let user: User = users.findBy('email', req.body.email);
    if (user) {
        return res.status(409).send({error: 'Conflict: The user already exists. '})
    }

    user = createUser(
        req.body.email, req.body.password, null
    );
    login(user, req)
    log("registration", `User: ${loggedInUser.email} created and logged in`);
    res.status(201).send({sessionId: loggedInUser.sessionId})
})
app.post('/sessions', (req: PostSessionRequest, res: PostSessionResponse) => {
    if (!req.body.email || !req.body.password) {
        return res.status(400).send({error: 'One or all params are missing'})
    }
    const user = users.find((user) => user.email === req.body.email && user.password === req.body.password);
    if (!user) {
        return res.status(401).send({error: 'Unauthorized: email or password is incorrect'})
    }
    login(user, req)
    let clientBookedTimes = times.filter((time) => time.userId === loggedInUser.id);
    log("login", `User: ${loggedInUser.email} logged in`);
    res.status(201).send({
        sessionId: loggedInUser.sessionId, isAdmin: user["isAdmin"], bookedTimes: JSON.stringify(clientBookedTimes)
    })
})
app.delete('/sessions', requireLogin, (req: DeleteSessionRequest, res: Response) => {
    sessions = sessions.filter((session) => session.id !== req.sessionId);
    log("logout", `User: ${loggedInUser.email} logged out`);
    res.status(204).end()
})

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.message, err.stack);
    return res.status(err.statusCode || 500).json({error: err.message});
});