CREATE KEYSPACE IF NOT EXISTS transit_system 
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE transit_system;

CREATE TABLE IF NOT EXISTS transit_events (
    event_id text,
    event_type text,
    line_id text,
    line_name text,
    stop_id text,
    scheduled_time timestamp,
    actual_time timestamp,
    delay_minutes int,
    status text,
    reason text,
    weather text,
    timestamp timestamp,
    PRIMARY KEY ((line_id), timestamp, event_id)
) WITH CLUSTERING ORDER BY (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_event_type ON transit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stop_id ON transit_events(stop_id);