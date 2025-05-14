-- Drop foreign key constraints if they exist

IF OBJECT_ID('FK_GameRounds_Users', 'F') IS NOT NULL
    ALTER TABLE GameRounds DROP CONSTRAINT FK_GameRounds_Users;

IF OBJECT_ID('FK_GameRounds_GuessingItems', 'F') IS NOT NULL
    ALTER TABLE GameRounds DROP CONSTRAINT FK_GameRounds_GuessingItems;

IF OBJECT_ID('FK_GameRounds_Matches', 'F') IS NOT NULL
    ALTER TABLE GameRounds DROP CONSTRAINT FK_GameRounds_Matches;

IF OBJECT_ID('FK_Hints_GuessingItems', 'F') IS NOT NULL
    ALTER TABLE Hints DROP CONSTRAINT FK_Hints_GuessingItems;

IF OBJECT_ID('FK_CategoriesMatches_Categories', 'F') IS NOT NULL
    ALTER TABLE CategoriesMatches DROP CONSTRAINT FK_CategoriesMatches_Categories;

IF OBJECT_ID('FK_CategoriesMatches_Matches', 'F') IS NOT NULL
    ALTER TABLE CategoriesMatches DROP CONSTRAINT FK_CategoriesMatches_Matches;

IF OBJECT_ID('FK_MatchParticipants_Status', 'F') IS NOT NULL
    ALTER TABLE MatchParticipants DROP CONSTRAINT FK_MatchParticipants_Status;

IF OBJECT_ID('FK_MatchParticipants_Users', 'F') IS NOT NULL
    ALTER TABLE MatchParticipants DROP CONSTRAINT FK_MatchParticipants_Users;

IF OBJECT_ID('FK_MatchParticipants_Matches', 'F') IS NOT NULL
    ALTER TABLE MatchParticipants DROP CONSTRAINT FK_MatchParticipants_Matches;

IF OBJECT_ID('FK_Matches_MatchStatus', 'F') IS NOT NULL
    ALTER TABLE Matches DROP CONSTRAINT FK_Matches_MatchStatus;

IF OBJECT_ID('FK_GuessingItems_Categories', 'F') IS NOT NULL
    ALTER TABLE GuessingItems DROP CONSTRAINT FK_GuessingItems_Categories;

-- Drop tables in reverse dependency order

DROP TABLE IF EXISTS Hints;
DROP TABLE IF EXISTS GameRounds;
DROP TABLE IF EXISTS GuessingItems;
DROP TABLE IF EXISTS CategoriesMatches;
DROP TABLE IF EXISTS MatchParticipants;
DROP TABLE IF EXISTS Matches;
DROP TABLE IF EXISTS Categories;
DROP TABLE IF EXISTS MatchParticipantsStatus;
DROP TABLE IF EXISTS MatchStatus;
DROP TABLE IF EXISTS Users;

-- Recreate tables with named constraints

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
    started_at DATETIME DEFAULT GETDATE(),
    completed_at DATETIME,
    status_id INT NOT NULL,
    CONSTRAINT FK_Matches_MatchStatus FOREIGN KEY (status_id) REFERENCES MatchStatus(id)
);

CREATE TABLE MatchParticipants (
    id INT PRIMARY KEY IDENTITY(1,1),
    match_id INT NOT NULL,
    user_id INT NOT NULL,
    match_participants_status_id INT NOT NULL,
    CONSTRAINT FK_MatchParticipants_Matches FOREIGN KEY (match_id) REFERENCES Matches(id),
    CONSTRAINT FK_MatchParticipants_Users FOREIGN KEY (user_id) REFERENCES Users(id),
    CONSTRAINT FK_MatchParticipants_Status FOREIGN KEY (match_participants_status_id) REFERENCES MatchParticipantsStatus(id),
    CONSTRAINT UQ_Match_User UNIQUE (match_id, user_id)
);

CREATE TABLE Categories (
    id INT PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE CategoriesMatches (
    id INT PRIMARY KEY IDENTITY(1,1),
    match_id INT NOT NULL,
    category_id INT NOT NULL,
    CONSTRAINT FK_CategoriesMatches_Matches FOREIGN KEY (match_id) REFERENCES Matches(id),
    CONSTRAINT FK_CategoriesMatches_Categories FOREIGN KEY (category_id) REFERENCES Categories(id)
);

CREATE TABLE GuessingItems (
    id INT PRIMARY KEY IDENTITY(1,1),
    item_name VARCHAR(100) NOT NULL UNIQUE,
    category_id INT NOT NULL,
    CONSTRAINT FK_GuessingItems_Categories FOREIGN KEY (category_id) REFERENCES Categories(id)
);

CREATE TABLE GameRounds (
    id INT PRIMARY KEY IDENTITY(1,1),
    match_id INT NOT NULL,
    guessing_item_id INT NOT NULL,
    guessing_user_id INT NOT NULL,
    hint_count INT NOT NULL DEFAULT 1,
    points_awarded INT NOT NULL DEFAULT 0,
    time_in_ms INT NOT NULL DEFAULT 0,
    timer_started_at DATETIME DEFAULT GETDATE(),
    ended_at DATETIME NULL,
    CONSTRAINT FK_GameRounds_Matches FOREIGN KEY (match_id) REFERENCES Matches(id),
    CONSTRAINT FK_GameRounds_GuessingItems FOREIGN KEY (guessing_item_id) REFERENCES GuessingItems(id),
    CONSTRAINT FK_GameRounds_Users FOREIGN KEY (guessing_user_id) REFERENCES Users(id)
);

CREATE TABLE Hints (
    id INT PRIMARY KEY IDENTITY(1,1),
    guessing_item_id INT NOT NULL,
    hint_text VARCHAR(200) NOT NULL,
    hint_order INT NOT NULL,
    CONSTRAINT FK_Hints_GuessingItems FOREIGN KEY (guessing_item_id) REFERENCES GuessingItems(id)
);
