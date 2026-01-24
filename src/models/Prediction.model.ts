import mongoose, { Schema, Document } from 'mongoose';

export interface IPredictionPoint {
  date: Date;
  amount: number;
  lowerBound: number;
  upperBound: number;
}

export interface IModelMetadata {
  name: string;
  parameters?: Record<string, any>;
  training_samples?: number;
  r_squared?: number;
  meanAbsolutePercentageError?: number;
  meanAbsoluteError?: number;
  rootMeanSquaredError?: number;
  [key: string]: any;
}

export interface IPrediction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  modelType: 'linear_regression';
  type: 'income' | 'expense' | 'net';
  predictions: IPredictionPoint[];
  alerts: string[];
  confidence: number;
  metadata: IModelMetadata;
  generatedAt: Date;
  expiresAt: Date;
  createdAt: Date;
}

const predictionPointSchema = new Schema<IPredictionPoint>(
  {
    date: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    lowerBound: {
      type: Number,
      required: true,
    },
    upperBound: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const predictionSchema = new Schema<IPrediction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El ID de usuario es requerido'],
      index: true,
    },
    modelType: {
      type: String,
      required: [true, 'El tipo de modelo es requerido'],
      enum: {
        values: ['linear_regression'],
        message: 'El tipo de modelo debe ser: linear_regression',
      },
      index: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense', 'net'],
      default: 'net',
      index: true,
    },
    predictions: {
      type: [predictionPointSchema],
      required: [true, 'Las predicciones son requeridas'],
      validate: {
        validator: function (value: IPredictionPoint[]) {
          return value.length > 0;
        },
        message: 'Debe haber al menos una predicción',
      },
    },
    confidence: {
      type: Number,
      required: [true, 'El nivel de confianza es requerido'],
      min: [0, 'La confianza debe estar entre 0 y 1'],
      max: [1, 'La confianza debe estar entre 0 y 1'],
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    alerts: {
      type: [String],
      default: [],
    },
    expiresAt: {
      type: Date,
      required: true,

    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

predictionSchema.index({ userId: 1, modelType: 1, type: 1, generatedAt: -1 });
predictionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

predictionSchema.pre('save', function (next) {
  if (!this.expiresAt) {
    const oneDayFromNow = new Date();
    oneDayFromNow.setHours(oneDayFromNow.getHours() + 24);
    this.expiresAt = oneDayFromNow;
  }
  next();
});

predictionSchema.methods.toJSON = function () {
  const prediction = this.toObject();
  return {
    id: prediction._id,
    userId: prediction.userId,
    modelType: prediction.modelType,
    type: prediction.type,
    predictions: prediction.predictions,
    confidence: prediction.confidence,
    metadata: prediction.metadata,
    generatedAt: prediction.generatedAt,
    expiresAt: prediction.expiresAt,
    createdAt: prediction.createdAt,
  };
};

export const Prediction = mongoose.model<IPrediction>('Prediction', predictionSchema);
