CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    google_id VARCHAR(30) NOT NULL UNIQUE,
    alias VARCHAR(20),
    email VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE Teams (
    id INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    captain_id INT NOT NULL,
    is_open BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_Teams_Captain FOREIGN KEY (captain_id) REFERENCES Users(id)
);

CREATE TABLE MatchParticipants (
    id INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    user_id INT NOT NULL,
    team_id INT NULL,
    is_barred BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_MatchParticipants_User FOREIGN KEY (user_id) REFERENCES Users(id),
    CONSTRAINT FK_MatchParticipants_Team FOREIGN KEY (team_id) REFERENCES Teams(id)
);

CREATE TABLE Categories (
    id INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE Status (
    id INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    status VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Matches (
    id INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    join_code VARCHAR(10) NOT NULL UNIQUE,
    is_public BIT NOT NULL DEFAULT 1,
    match_creator_id INT NOT NULL,
    team_a_id INT NOT NULL,
    team_b_id INT NOT NULL,
    status_id INT NOT NULL,
    max_participants INT NOT NULL,
    started_datetime DATETIME DEFAULT GETDATE(),
    completed_datetime DATETIME NULL,
    CONSTRAINT FK_Matches_Creator FOREIGN KEY (match_creator_id) REFERENCES Users(id),
    CONSTRAINT FK_Matches_TeamA FOREIGN KEY (team_a_id) REFERENCES Teams(id),
    CONSTRAINT FK_Matches_TeamB FOREIGN KEY (team_b_id) REFERENCES Teams(id),
    CONSTRAINT FK_Matches_Status FOREIGN KEY (status_id) REFERENCES Status(id)
);

CREATE TABLE CategoriesMatches (
    id INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    match_id INT NOT NULL,
    category_id INT NOT NULL,
    CONSTRAINT FK_CategoriesMatches_Match FOREIGN KEY (match_id) REFERENCES Matches(id),
    CONSTRAINT FK_CategoriesMatches_Category FOREIGN KEY (category_id) REFERENCES Categories(id)
);

CREATE TABLE GuessingItems (
    id INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    item_name VARCHAR(100) NOT NULL UNIQUE,
    category_id INT NOT NULL,
    CONSTRAINT FK_GuessingItems_Category FOREIGN KEY (category_id) REFERENCES Categories(id)
);

CREATE TABLE GameRounds (
    id INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    match_id INT NOT NULL,
    team_id INT NOT NULL,
    guessing_item_id INT NOT NULL,
    hint_count INT NOT NULL DEFAULT 1,
    hint_vote_count INT NOT NULL DEFAULT 0,
    points_awarded INT NOT NULL DEFAULT 0,
    time_in_ms INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_GameRounds_Match FOREIGN KEY (match_id) REFERENCES Matches(id),
    CONSTRAINT FK_GameRounds_Team FOREIGN KEY (team_id) REFERENCES Teams(id),
    CONSTRAINT FK_GameRounds_GuessingItem FOREIGN KEY (guessing_item_id) REFERENCES GuessingItems(id)
);

CREATE TABLE MatchGuessedItems (
    id INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    match_id INT NOT NULL,
    guessing_item_id INT NOT NULL,
    CONSTRAINT FK_MatchGuessedItems_Match FOREIGN KEY (match_id) REFERENCES Matches(id),
    CONSTRAINT FK_MatchGuessedItems_GuessingItem FOREIGN KEY (guessing_item_id) REFERENCES GuessingItems(id)
);

CREATE TABLE Hints (
    id INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    guessing_item_id INT NOT NULL,
    hint_text VARCHAR(200) NOT NULL,
    hint_order INT NOT NULL,
    CONSTRAINT FK_Hints_GuessingItem FOREIGN KEY (guessing_item_id) REFERENCES GuessingItems(id)
);
