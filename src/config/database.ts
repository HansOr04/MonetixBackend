import mongoose from "mongoose";
export const connectDB = async (): Promise<void> => {
    try {
        const mongoUri = process.env.MONGODB_URI || "La direccion de la base de datos";
        await mongoose.connect(mongoUri);
        console.log("mongoDB esta conectado")
    }
    catch (error){
        console.error("Error al conectar a mongoDB: ", error);
        process.exit(1)
    }
}