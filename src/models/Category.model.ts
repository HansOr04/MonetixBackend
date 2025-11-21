import { boolean } from "joi";
import mongoose, {Schema, Document} from "mongoose";

export interface ICategory extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    type: 'income' | 'expense';
    icon?: string;
    color?: string;
    descripcion?: string;
    userId?: mongoose.Types.ObjectId
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const categorySchema = new Schema <ICategory>({
        name: {
            type: String,
            required: [true, 'El nombre de la categoria es requerido'],
            trim: true,
            minlength: [2, 'El nombre debe de contener al menos 2 caracteres'],
            maxlength: [50, 'El nombre no debe de exceder los 50 caracteres'],
        },
        type: {
            type: String,
            required: [true, 'El tipo de categoria es requerido'],
            enum: {
                values: ['icome', 'expense'],
                message: 'El tipo debe de ser "income" o "expense"',
            },
        },
        icon: {
            type: String,
            trim: true,
            default: '💰'
        },
        color: {
            type: String,
            trim: true,
            default: '#6D9C71',
            match: [/^#[0-9A-Fa-f]{6}$/, 'El colo debe de ser un codigo hexadecimal valido'],
        },
        descripcion: {
            type: String,
            trim: true,
            maxlenght: [200, 'La descripcion no puede exceder los 200 caracteres'],
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
    },   
    {
        timestamps: true,
        versionKey: false,
    }
);

categorySchema.index({name: 1, useedId: 1, type: 1}, {unique: true});

categorySchema.pre('save', function (next) {
    if (this.name) {
        this.name = this.name.charAt(0).toUpperCase() + this.name.slice(1).toLowerCase();
    }
     next();
});

categorySchema.methods.to.JSON = function(){
    const category = this.toObject();
    return {
        id: category._id,
        name: category.name,
        type: category.type,
        icon: category.color,
        descripcion: category.descripcion,
        isDefault: category.isDefault,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
    };
};

export const Category = mongoose.model<ICategory>('Category', categorySchema);