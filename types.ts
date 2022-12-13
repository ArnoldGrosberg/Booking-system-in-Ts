import {Request, Response} from "express";

// In TS, interfaces are "open" and can be extended
type TYear = `${number}${number}${number}${number}`;
type TMonth = `${number}${number}`;
type TDay = `${number}${number}`;
type TDateISODate = `${TYear}-${TMonth}-${TDay}`;
export type Nullable<T> = T | null;
export type Ids = number[];
export interface Time {
    id: number;
    day: Nullable<TDateISODate>;
    start: Nullable<string>;
    end: Nullable<string>;
    bookedBy: Nullable<string>;
    userId: Nullable<number>;
    phone: Nullable<number>;
}

export interface Times extends Array<Time> {
}


export interface PostTimeRequest extends Request {
    time: Nullable<Time>
}

export interface OAuth2LoginRequest extends Request {
    credential: string
}

export interface PostSessionRequest extends Request {
    email: string,
    password: string
}

export interface PostSessionResponse extends Response {
    sessionId: string,
    isAdmin: boolean,
    bookedTimes: Times
}

export interface User {
    id: number;
    email: Nullable<string> | undefined;
    password: Nullable<string>;
    isAdmin: Nullable<boolean>;
    sub: Nullable<string>;
}

export interface Users extends Array<User> {
}

export interface Session {
    id: number;
    userId: number;
}

export interface Sessions extends Array<Session> {
}

export interface Line {
    timeStamp: string,
    userIp: string,
    userId: string,
    eventName: string,
    extraData: string
}

export interface Lines extends Array<Line> {
}



export interface GetLogsResponse extends Response {
    lines: Lines
}

export interface GetTimeResponse extends Response {
    times: Times
}

export interface LoggedInUser extends Omit<User,'id'> {
    id: Nullable<number>,
    sessionId: Nullable<number>,
    userIp: string | string[] | undefined | null,
}

export interface GetBookedTimesResponse extends Response {
    bookedTimes: Times,
    isAdmin: boolean
}

export interface GetBookedTimesRequest extends Request {
    bookedTimes: Times,
    isAdmin: boolean
}

export interface Error {
    message: string,
    stack: string,
    statusCode: number
}

export interface DeleteSessionRequest extends Request {
    sessionId: number
}

export interface PostUserResponse extends Response {
    sessionId: number
}

export interface PostUserRequest extends Request {
    email: string,
    password: string
}
export interface RequireLogin extends Request {
    sessionId: number,
    isAdmin: boolean | null
}

export interface OAuth2LoginResponse extends Response {
    sessionId: number,
    isAdmin: boolean,
    bookedTimes: Times

}

export type LoginRequest = PostSessionRequest | OAuth2LoginRequest;