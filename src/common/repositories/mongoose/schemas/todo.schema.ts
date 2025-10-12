import { Schema, Document } from 'mongoose';
import { createId } from '@paralleldrive/cuid2';

export interface TodoDocument extends Document {
  cuid: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const TodoSchema = new Schema(
  {
    cuid: {
      type: String,
      required: true,
      unique: true,
      default: () => createId(),
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    completed: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
      default: 'medium',
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    dueDate: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: 'todos',
    versionKey: false, // Disable __v field
  },
);

// Indexes for better query performance
TodoSchema.index({ completed: 1, createdAt: -1 });
TodoSchema.index({ tags: 1, createdAt: -1 });
TodoSchema.index({ priority: 1, completed: 1 });
TodoSchema.index({ dueDate: 1, completed: 1 });

// Virtual for id field (maps to cuid)
TodoSchema.virtual('id').get(function () {
  return this.cuid;
});

// Ensure virtual fields are serialized
TodoSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    (ret as any).id = ret.cuid;
    delete ret._id;
    delete ret.cuid;
    return ret;
  },
});

TodoSchema.set('toObject', {
  virtuals: true,
  transform: function (doc, ret) {
    (ret as any).id = ret.cuid;
    delete ret._id;
    delete ret.cuid;
    return ret;
  },
});