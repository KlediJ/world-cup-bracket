import { relations } from "drizzle-orm";
import { integer, jsonb, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import type { GroupPick, ScorePick } from "@/types/bracket";

export type StoredKnockoutPicks = Record<string, string>;
export type StoredKnockoutScores = Record<string, ScorePick>;
export type StoredGroupPicks = Record<string, GroupPick>;
export type StoredPredictionPayload = Record<string, unknown>;

export const pools = pgTable(
  "pools",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    code: varchar("code", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("pools_code_unique").on(table.code)],
);

export const players = pgTable(
  "players",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    poolId: uuid("pool_id")
      .notNull()
      .references(() => pools.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("players_pool_email_unique").on(table.poolId, table.email)],
);

export const brackets = pgTable("brackets", {
  id: uuid("id").defaultRandom().primaryKey(),
  poolId: uuid("pool_id")
    .notNull()
    .references(() => pools.id, { onDelete: "cascade" }),
  playerId: uuid("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  submissionType: varchar("submission_type", { length: 32 }).default("classic").notNull(),
  championTeamId: varchar("champion_team_id", { length: 80 }).notNull(),
  groupPicks: jsonb("group_picks").$type<StoredGroupPicks>().notNull(),
  thirdPlaceAdvancers: jsonb("third_place_advancers").$type<string[]>().default([]).notNull(),
  knockoutPicks: jsonb("knockout_picks").$type<StoredKnockoutPicks>().notNull(),
  knockoutScores: jsonb("knockout_scores").$type<StoredKnockoutScores>().default({}).notNull(),
  officialKnockoutPicks: jsonb("official_knockout_picks").$type<StoredKnockoutPicks>().default({}).notNull(),
  officialChampionTeamId: varchar("official_champion_team_id", { length: 80 }),
  officialKnockoutSubmittedAt: timestamp("official_knockout_submitted_at", { withTimezone: true }),
  predictionPayload: jsonb("prediction_payload").$type<StoredPredictionPayload>().default({}).notNull(),
  points: integer("points").default(0).notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const playersRelations = relations(players, ({ one, many }) => ({
  pool: one(pools, {
    fields: [players.poolId],
    references: [pools.id],
  }),
  brackets: many(brackets),
}));

export const bracketsRelations = relations(brackets, ({ one }) => ({
  pool: one(pools, {
    fields: [brackets.poolId],
    references: [pools.id],
  }),
  player: one(players, {
    fields: [brackets.playerId],
    references: [players.id],
  }),
}));

export const schema = {
  pools,
  players,
  brackets,
};
