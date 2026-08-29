-- v26 migration
-- Idempotency + useful indexes

CREATE UNIQUE INDEX IF NOT EXISTS uq_game_history_id
ON game_history(id);

CREATE INDEX IF NOT EXISTS idx_player_stats_wins
ON player_stats(games_won DESC, total_score DESC);

CREATE INDEX IF NOT EXISTS idx_users_display_name
ON users(display_name);
