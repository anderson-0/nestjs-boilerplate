import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';

export const todos = pgTable(
  'todos',
  {
    id: text('id').primaryKey().$defaultFn(() => {
      const { createId } = require('@paralleldrive/cuid2');
      return createId();
    }),
    title: text('title').notNull(),
    description: text('description'),
    completed: boolean('completed').notNull().default(false),
    priority: text('priority').default('medium'),
    dueDate: timestamp('due_date', { withTimezone: true }),
    tags: text('tags').array().notNull().default([]),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    completedIdx: index('todos_completed_idx').on(table.completed),
    dueDateIdx: index('todos_due_date_idx').on(table.dueDate),
    createdAtIdx: index('todos_created_at_idx').on(table.createdAt),
  }),
);