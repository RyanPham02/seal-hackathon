USE SealHackathonDB;

DECLARE @Event1Id UNIQUEIDENTIFIER = NEWID();
DECLARE @Event2Id UNIQUEIDENTIFIER = NEWID();
DECLARE @Event3Id UNIQUEIDENTIFIER = NEWID();
DECLARE @Event4Id UNIQUEIDENTIFIER = NEWID();

INSERT INTO Events (EventId, EventName, StartDate, EndDate, Status, Description, CreatedAt)
VALUES 
(@Event1Id, 'SEAL Hackathon 1', GETDATE(), DATEADD(day, 30, GETDATE()), 1, 'Event 1', GETDATE()),
(@Event2Id, 'SEAL Hackathon 2', GETDATE(), DATEADD(day, 30, GETDATE()), 1, 'Event 2', GETDATE()),
(@Event3Id, 'SEAL Hackathon 3', GETDATE(), DATEADD(day, 30, GETDATE()), 1, 'Event 3', GETDATE()),
(@Event4Id, 'SEAL Hackathon 4', GETDATE(), DATEADD(day, 30, GETDATE()), 1, 'Event 4', GETDATE());

INSERT INTO Categories (CategoryId, EventId, CategoryName, Description)
VALUES
(NEWID(), @Event1Id, 'Track 1', 'Track 1 Desc'),
(NEWID(), @Event2Id, 'Track 2', 'Track 2 Desc'),
(NEWID(), @Event3Id, 'Track 3', 'Track 3 Desc'),
(NEWID(), @Event4Id, 'Track 4', 'Track 4 Desc');
