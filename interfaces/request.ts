import { User } from "./user";
import { Request as ExpressReq } from "express";

export interface Request extends ExpressReq  {
    user?: User;
}
