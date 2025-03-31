import { GenerativeModel } from "@google/generative-ai";
import { Message } from "discord.js";
import { Chat } from "../../models/chat";
import { Config } from "../../config";

export interface ExecuteParams {
    message: Message;
    args: string[];
    config: Config;
    logModAction: Function;
    sendEmbedMessage: Function;
    client: any;
    model: GenerativeModel;
    chatM: Chat;
}
export interface ChatMessage {
    role: string;
    content: string;
}

export interface ChatHistory {
    role: string;
    parts: { text: string }[];
}
interface Command {
    name: string;
    description: string;
    execute: (message: Message) => Promise<void>;
}