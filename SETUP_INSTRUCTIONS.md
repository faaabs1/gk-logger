# Database Setup Instructions

Copy and paste these SQL commands into your Supabase SQL Editor to create all necessary tables. Run them in order.

## 1. Team Table
```sql
CREATE TABLE Team (
  teamID BIGSERIAL PRIMARY KEY,
  team_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_team_name ON Team(team_name);
```

## 2. Player Table
```sql
CREATE TABLE Player (
  id BIGSERIAL PRIMARY KEY,
  player_firstname TEXT NOT NULL,
  player_lastname TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_player_name ON Player(player_lastname, player_firstname);
```

## 3. Game Table
This table stores the match information including opponent, location, date/time, and starting goalkeeper.

```sql
CREATE TABLE Game (
  gameID BIGSERIAL PRIMARY KEY,
  game_location INT NOT NULL CHECK (game_location IN (0, 1)),
  game_opponent BIGINT NOT NULL REFERENCES Team(teamID) ON DELETE CASCADE,
  game_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  goalkeeper BIGINT NOT NULL REFERENCES Player(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_game_opponent ON Game(game_opponent);
CREATE INDEX idx_game_goalkeeper ON Game(goalkeeper);
CREATE INDEX idx_game_datetime ON Game(game_datetime);
```

## 4. EventLog Table (Simplified Event Logging)
This table logs events during the match with timestamp, category, and subcategory only - no ratings required.

```sql
CREATE TABLE EventLog (
  id BIGSERIAL PRIMARY KEY,
  game_id BIGINT NOT NULL REFERENCES Game(gameID) ON DELETE CASCADE,
  event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_eventlog_game_id ON EventLog(game_id);
CREATE INDEX idx_eventlog_category ON EventLog(category);
```

## 5. MatchPeriod Table
This table tracks when each half (1st and 2nd) starts and ends during a game.

```sql
CREATE TABLE MatchPeriod (
  id BIGSERIAL PRIMARY KEY,
  game_id BIGINT NOT NULL REFERENCES Game(gameID) ON DELETE CASCADE,
  period INT NOT NULL CHECK (period IN (1, 2)),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, period)
);

CREATE INDEX idx_matchperiod_game_id ON MatchPeriod(game_id);
```

## 6. GoalkeeperChange Table
This table tracks every time you change the goalkeeper during a match.

```sql
CREATE TABLE GoalkeeperChange (
  id BIGSERIAL PRIMARY KEY,
  game_id BIGINT NOT NULL REFERENCES Game(gameID) ON DELETE CASCADE,
  old_goalkeeper_id BIGINT REFERENCES Player(id) ON DELETE SET NULL,
  new_goalkeeper_id BIGINT NOT NULL REFERENCES Player(id) ON DELETE CASCADE,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  period INT NOT NULL CHECK (period IN (1, 2)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_goaleeperchange_game_id ON GoalkeeperChange(game_id);
```

## Sample Data (Optional)
After creating the tables, you can add sample teams and players:

```sql
-- Insert sample teams
INSERT INTO Team (team_name) VALUES 
  ('Bayern Munich'),
  ('Borussia Dortmund'),
  ('FC Schalke 04'),
  ('Hamburger SV');

-- Insert sample players
INSERT INTO Player (player_firstname, player_lastname) VALUES 
  ('Manuel', 'Neuer'),
  ('Robert', 'Lewandowski'),
  ('Jamal', 'Musiala'),
  ('Alphonso', 'Davies'),
  ('Jude', 'Bellingham'),
  ('Marco', 'Reus'),
  ('Mats', 'Hummels');
```

## Features Implemented

### 1. Game Metadata Display
When you open a match, you'll now see:
- **Opponent**: Team name
- **Location**: Home or Away
- **Date/Time**: When the game was scheduled
- **Starting Goalkeeper**: Who started the match

### 2. Period Control (Half Start/End)
- **Start 1. Halbzeit**: Records when the first half begins (saves timestamp to database)
- **End 1. Halbzeit**: Records when the first half ends (saves timestamp to database)
- **Start 2. Halbzeit**: Records when the second half begins (saves timestamp to database)
- **End 2. Halbzeit**: Records when the second half ends (saves timestamp to database)

### 3. Goalkeeper Changes
- **Change Button**: Click to open the goalkeeper selector
- **Select New Goalkeeper**: Choose from the list of available players
- The app automatically tracks:
  - Who was the old goalkeeper
  - Who is the new goalkeeper
  - When the change happened
  - Which period (1st or 2nd half) it occurred in

### 4. Event Logging
Continue using the existing event logger which now saves to the EventLog table (if you update the component).

## How to Use

1. **Create a new game** - Fill in opponent, location, date/time, and starting goalkeeper
2. **Open the match** - Click on the match ID to view the match detail page
3. **Start 1st Half** - Click "Start" to record when the first half begins
4. **End 1st Half** - Click "End" to record when the first half ends
5. **Start 2nd Half** - Click "Start" to record when the second half begins (or use the "2. Halbzeit starten" button)
6. **Change Goalkeeper** - Click "Change" in the goalkeeper selector to swap players
7. **End Match** - Click "Spiel beenden" to finish and return to home

All timestamps are saved automatically to the database!
