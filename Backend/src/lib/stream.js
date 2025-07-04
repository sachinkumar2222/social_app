import {StreamChat} from "stream-chat";
import "dotenv/config";

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

if(!apiKey ||!apiSecret){
    console.log("Stream api key or Secret is missing");
}

const streamClient = StreamChat.getInstance(apiKey,apiSecret);

export const upsertStreamUser = async (userData) =>{
    try{
        await streamClient.upsertUsers([userData]);
        return userData;
    }catch(err){
        console.log("Error upserting Stream user: ",err);
    }
};

export const generateStreamToken = async (userId) =>{
    try {
        const userIdStr = userId.toSring();
        return await streamClient.createToken(userIdStr);
    } catch (error) {
        console.log("Error in generateStreamToken", error);
    }
}