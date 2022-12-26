const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbpath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server is runnig at http://localhost:3001/");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDBObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

// ### GET API 1

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
        SELECT
            *
        FROM
            player_details`;
  const playersArray = await db.all(getPlayersQuery);
  const obj = playersArray.map((player) =>
    convertDBObjectToResponseObject(player)
  );
  response.send(obj);
});

// ### GET API 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerDetails = `
    SELECT
        *
    FROM
        player_details
    WHERE
        player_id = ${playerId};`;
  const player = await db.get(getPlayerDetails);
  const obj = convertDBObjectToResponseObject(player);
  response.send(obj);
});

// ### PUT API 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
    UPDATE
        player_details
    SET
        player_name = '${playerName}'
    WHERE 
        player_id = ${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});
// ### GET API 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
    SELECT 
    *
    FROM
        match_details
    WHERE 
        match_id = ${matchId};`;
  const match = await db.get(getMatchDetailsQuery);
  const obj = convertDBObjectToResponseObject(match);
  response.send(obj);
});

// ### GET API 5

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
    SELECT
        match_details.match_id as match_id,
        match,
        year
    FROM match_details LEFT JOIN player_match_score
        ON match_details.match_id = player_match_score.match_id
    WHERE 
        player_id = ${playerId};`;
  const playerMathces = await db.all(getPlayerMatchesQuery);
  const obj = playerMathces.map((match) =>
    convertDBObjectToResponseObject(match)
  );
  response.send(obj);
});

//### GET API 6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersInAMatchQuery = `
    SELECT
    player_details.player_id as player_id,
    player_name
    FROM player_details LEFT JOIN 
        player_match_score ON player_details.player_id =
        player_match_score.player_id
    WHERE 
        match_id = ${matchId};`;
  const playersOfMatch = await db.all(getPlayersInAMatchQuery);
  const obj = playersOfMatch.map((player) =>
    convertDBObjectToResponseObject(player)
  );
  response.send(obj);
});

// ### GET API 7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScoreQuery = `
    SELECT
        player_details.player_id as playerId,
        player_name as playerName,
        SUM(score) as totalScore,
        SUM(fours) as totalFours,
        SUM(sixes) as totalSixes
    FROM player_details LEFT JOIN 
        player_match_score ON player_details.player_id =
        player_match_score.player_id
    WHERE 
        player_match_score.player_id = ${playerId};`;
  const playerStats = await db.get(getPlayerScoreQuery);
  response.send(playerStats);
});

module.exports = app;
