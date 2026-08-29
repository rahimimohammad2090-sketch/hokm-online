# v33
Server is authoritative. Each action needs a unique actionId. Duplicate actions are not re-executed. Rate limiting prevents floods. Sequence Guard rejects out-of-order events. v34 can move these states to Redis/PostgreSQL.
