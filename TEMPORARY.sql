.headers on

create table users (
    id integer primary key,
    username TEXT NOT NULL UNIQUE
);
create table transactions (
    id integer primary key,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description TEXT NOT NULL
);
INSERT INTO users (username) values ("u123");
INSERT INTO users (username) values ("u23");
INSERT INTO users (username) values ("u3");

INSERT INTO transactions (owner_id, description) values (1, "tr123");
INSERT INTO transactions (owner_id, description) values (1, "tr23");
INSERT INTO transactions (owner_id, description) values (2, "tr3");