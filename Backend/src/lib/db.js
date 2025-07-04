import mongoose from "mongoose"

export const connectDb = async() => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI)
        console.log(`mongoDb connect: ${conn.connection.host}`)
    } catch (error) {
        console.error("error while connecting to db",error);
        process.exit(1)
    }
}