const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let db = null;
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("running");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const conDbRespToObjResp = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

// Get the list of all player in player table

app.get("/players/", async (request, response) => {
  const getAllPlayerQuery = `
    SELECT *
    FROM player_details;`;
  const dbResponse = await db.all(getAllPlayerQuery);
  response.send(dbResponse.map((eachItem) => conDbRespToObjResp(eachItem)));
});

// Get player based on Id

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerByIdQuery = `
    SELECT * 
    FROM player_details
    WHERE player_id = ${playerId};`;
  const dbResponse = await db.all(getPlayerByIdQuery);
  response.send(dbResponse.map((eachItem) => conDbRespToObjResp(eachItem)));
});

// Update player Detail

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateDetailOfPlayer = `
    UPDATE 
      player_details 
    SET 
      player_name = '${playerName}'
    WHERE 
      player_id = ${playerId};`;
  const dbResponse = await db.all(updateDetailOfPlayer);
  response.send("Player Details Updated");
});

// return match details of specific match

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetail = `
    SELECT *
    FROM match_details
    WHERE match_id = ${matchId};`;
  const dbResponse = await db.all(getMatchDetail);
  response.send(dbResponse.map((eachItem) => conDbRespToObjResp(eachItem)));
});

// get all matches played by player

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getAllMatches = `
    SELECT match_id,match,year 
    FROM player_match_score 
    NATURAL JOIN match_details
    WHERE player_id = ${playerId};`;
  const dbResponse = await db.all(getAllMatches);
  response.send(dbResponse.map((eachItem) => conDbRespToObjResp(eachItem)));
});

// get all player of specific match

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getAllPlayer = `
    SELECT player_id AS playerId,player_name AS playerName 
    FROM player_match_score NATURAL JOIN player_details
    WHERE match_id = ${matchId};`;
  const dbResponse = await db.all(getAllPlayer);
  response.send(dbResponse);
});

// get statistic of score

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatisticOfMatch = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};`;
  const dbResponse = await db.all(getStatisticOfMatch);
  response.send(dbResponse);
});

module.exports = app;
