ALTER TABLE Teams
ADD team_name VARCHAR(255) UNIQUE;

ALTER TABLE Matches DROP CONSTRAINT FK_Matches_TeamA;
ALTER TABLE Matches DROP CONSTRAINT FK_Matches_TeamB;
ALTER TABLE Teams ALTER COLUMN captain_id INT NULL;

ALTER TABLE Matches DROP COLUMN team_a_id;
ALTER TABLE Matches DROP COLUMN team_b_id;

CREATE TABLE MatchTeams (
    id INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    match_id INT NOT NULL,
    team_id INT NOT NULL,
    CONSTRAINT UQ_MatchTeams_Match_Team UNIQUE (match_id, team_id),
    CONSTRAINT FK_MatchTeams_Match FOREIGN KEY (match_id) REFERENCES Matches(id),
    CONSTRAINT FK_MatchTeams_Team FOREIGN KEY (team_id) REFERENCES Teams(id)
);
