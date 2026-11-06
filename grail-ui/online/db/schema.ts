// Authoritative online rooms and hashed participant sessions.
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const gameRooms = sqliteTable('game_rooms', {
  code: text('code').primaryKey(),
  state: text('state').notNull(),
  revision: integer('revision').notNull().default(0),
  operationId: text('operation_id').notNull().default(''),
  expiresAt: integer('expires_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, t => [index('game_rooms_expiry').on(t.expiresAt)]);

export const gameSessions = sqliteTable('game_sessions', {
  tokenHash: text('token_hash').primaryKey(),
  roomCode: text('room_code').notNull().references(() => gameRooms.code, {onDelete:'cascade'}),
  playerId: text('player_id').notNull(),
  expiresAt: integer('expires_at').notNull(),
}, t => [index('game_sessions_expiry').on(t.expiresAt)]);
