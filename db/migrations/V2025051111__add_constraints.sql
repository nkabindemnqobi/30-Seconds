ALTER TABLE Matches
ADD CONSTRAINT UQ_LobbyName UNIQUE (lobby_name);
