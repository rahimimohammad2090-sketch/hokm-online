CREATE TABLE IF NOT EXISTS hokm_events(
match_id TEXT NOT NULL,seq BIGINT NOT NULL,type TEXT NOT NULL,
payload JSONB NOT NULL DEFAULT '{}'::jsonb,ts BIGINT NOT NULL,
PRIMARY KEY(match_id,seq));
CREATE TABLE IF NOT EXISTS hokm_snapshots(
match_id TEXT PRIMARY KEY,state JSONB NOT NULL,ts BIGINT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_hokm_events_match_seq ON hokm_events(match_id,seq);
