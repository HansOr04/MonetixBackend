import mongoose from "mongoose";
export const connectToDatabase = async (): Promise<void> => {
    try {
        const mongoConnectionString = process.env.MONGO_URI || "La direccion de la base de datos";
        await mongoose.connect(mongoConnectionString);
        console.log("mongoDB esta conectado")
    }
    catch (error) {
        console.error("Error al conectar a mongoDB: ", error);
        process.exit(1)
    }
}