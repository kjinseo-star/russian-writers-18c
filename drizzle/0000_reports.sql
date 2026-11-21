CREATE TABLE reports (
 id TEXT PRIMARY KEY NOT NULL,
 person_id TEXT NOT NULL,
 field_key TEXT NOT NULL,
 payload TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'received',
 decision TEXT NOT NULL DEFAULT '',
 revision INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 sender_hash TEXT NOT NULL,
 notification TEXT NOT NULL DEFAULT 'pending'
);
--> statement-breakpoint
CREATE INDEX reports_created ON reports(created_at);
--> statement-breakpoint
CREATE INDEX reports_sender ON reports(sender_hash, created_at);
--> statement-breakpoint
CREATE TABLE report_history (
 id TEXT PRIMARY KEY NOT NULL,
 report_id TEXT NOT NULL REFERENCES reports(id),
 status TEXT NOT NULL,
 decision TEXT NOT NULL,
 revision INTEGER NOT NULL,
 reviewed_at TEXT NOT NULL
);
