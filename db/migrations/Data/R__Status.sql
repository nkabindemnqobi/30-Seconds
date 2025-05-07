WITH StatusData AS (
    SELECT N'Active' AS status
    UNION ALL
    SELECT N'Pending'
    UNION ALL
    SELECT N'Completed'
    UNION ALL
    SELECT N'Canceled'
)
MERGE INTO Status AS Target
USING StatusData AS Source
ON Source.status = Target.status
WHEN NOT MATCHED BY TARGET THEN
    INSERT (status)
    VALUES (Source.status)
OUTPUT $action, inserted.*, deleted.*;
