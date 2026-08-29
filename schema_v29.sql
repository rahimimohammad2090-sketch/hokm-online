CREATE TABLE IF NOT EXISTS game_sessions (
 match_id UUID PRIMARY KEY, room_code VARCHAR(6) UNIQUE NOT NULL,
 mode VARCHAR(20) NOT NULL DEFAULT 'classic',
 status VARCHAR(24) NOT NULL DEFAULT 'WAITING_FOR_PLAYERS',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), started_at TIMESTAMPTZ, ended_at TIMESTAMPTZ);
CREATE TABLE IF NOT EXISTS game_session_players (
 match_id UUID REFERENCES game_sessions(match_id) ON DELETE CASCADE,
 user_id UUID REFERENCES users(id) ON DELETE CASCADE,
 seat SMALLINT NOT NULL CHECK (seat BETWEEN 0 AND 3),
 join_token_hash TEXT NOT NULL, connected BOOLEAN NOT NULL DEFAULT FALSE,
 joined_at TIMESTAMPTZ, PRIMARY KEY(match_id,user_id), UNIQUE(match_id,seat));
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_game_session_players_user ON game_session_players(user_id);
