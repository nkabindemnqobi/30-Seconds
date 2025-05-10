CREATE TABLE Users (
    id INT PRIMARY KEY IDENTITY(1,1),
    google_id VARCHAR(30) NOT NULL UNIQUE,
    alias VARCHAR(20),
    email VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE MatchStatus (
    id INT PRIMARY KEY IDENTITY(1,1),
    status VARCHAR(50) NOT NULL UNIQUE
);


CREATE TABLE MatchParticipantsStatus (
    id INT PRIMARY KEY IDENTITY(1,1),
    status VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Matches (
    id INT PRIMARY KEY IDENTITY(1,1),
    join_code VARCHAR(10) NOT NULL UNIQUE,
    lobby_name VARCHAR(100) NOT NULL,
    is_public BIT NOT NULL DEFAULT 1,
    max_participants INT NOT NULL,
    started_datetime DATETIME DEFAULT GETDATE(),
    completed_datetime DATETIME,
    status_id INT NOT NULL REFERENCES MatchStatus(id)
);

CREATE TABLE MatchParticipants (
    id INT PRIMARY KEY IDENTITY(1,1),
    match_id INT NOT NULL REFERENCES Matches(id),
    user_id INT NOT NULL REFERENCES Users(id),
    match_participants_status_id INT NOT NULL REFERENCES MatchParticipantsStatus(id),
    CONSTRAINT UQ_Match_User UNIQUE (match_id, user_id)
);

CREATE TABLE Categories (
    id INT PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE CategoriesMatches (
    id INT PRIMARY KEY IDENTITY(1,1),
    match_id INT NOT NULL REFERENCES Matches(id),
    category_id INT NOT NULL REFERENCES Categories(id)
);

CREATE TABLE GuessingItems (
    id INT PRIMARY KEY IDENTITY(1,1),
    item_name VARCHAR(100) NOT NULL UNIQUE,
    category_id INT NOT NULL REFERENCES Categories(id)
);

CREATE TABLE GameRounds (
    id INT PRIMARY KEY IDENTITY(1,1),
    match_id INT NOT NULL REFERENCES Matches(id),
    guessing_item_id INT NOT NULL REFERENCES GuessingItems(id),
    guessing_user_id INT NOT NULL REFERENCES Users(id),
    hint_count INT NOT NULL DEFAULT 1,
    points_awarded INT NOT NULL DEFAULT 0,
    time_in_ms INT NOT NULL DEFAULT 0,
);

CREATE TABLE Hints (
    id INT PRIMARY KEY IDENTITY(1,1),
    guessing_item_id INT NOT NULL REFERENCES GuessingItems(id),
    hint_text VARCHAR(200) NOT NULL,
    hint_order INT NOT NULL
);
