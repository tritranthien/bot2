import { User } from "./user.js";
import { Request as ExpressReq } from "express";

export interface Request extends ExpressReq  {
    user?: User;
}
