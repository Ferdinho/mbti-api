// index.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000; // Use Heroku's port
const helmet = require("helmet"); // Add this line at the top with your other imports
const rateLimit = require("express-rate-limit"); // Add this line at the top
const winston = require("winston");
const dotenv = require("dotenv"); // Add this line
const winston = require("winston");
const { Loggly } = require("winston-loggly-bulk");
dotenv.config(); // Load environment variables

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(), // Output logs to the console
    new winston.transports.File({ filename: "app.log" }), // Save logs to a file
    new Loggly({
      token: process.env.LOGGLY_TOKEN, // Use your Loggly token here
      subdomain: process.env.LOGGLY_SUBDOMAIN, // Your Loggly subdomain
      tags: ["Winston-NodeJS"], // Tags for filtering in Loggly
      json: true, // Send logs as JSON
    }),
  ],
});
app.set("trust proxy", 1); // Trust the first proxy, which is usually Heroku or similar
app.use((req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  logger.info(`Incoming API Key: ${apiKey}`); // Log the API key
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(403).json({ error: "Forbidden: Invalid API Key" });
  }
  next();
});

// Define the rate limiting rules
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 300, // limit each IP to 300 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes.",
  trustProxy: true,
});

// Apply the rate limiter to all requests
app.use(limiter); // Add this line after initializing your middleware
app.use(helmet()); // Add this line after you initialize your express app
// Middleware to parse JSON requests
app.use(express.json());
// Add enhanced metadata logging
app.use((req, res, next) => {
  const start = process.hrtime(); // Capture the start time

  // Capture necessary details
  const { method, url } = req;
  const userAgent = req.get("User-Agent") || "Unknown";
  const ip = req.ip;
  const queryParams = req.query;
  const requestBody = req.body;

  // Log the request details
  logger.info({
    message: "Incoming request",
    method: method,
    endpoint: url,
    ip: ip,
    userAgent: userAgent,
    queryParams: queryParams,
    requestBody: requestBody,
  });

  // Capture response information after it's sent
  res.on("finish", () => {
    const duration = process.hrtime(start);
    const responseTime = Math.round((duration[0] * 1e9 + duration[1]) / 1e6); // in milliseconds

    // Log the response metadata
    logger.info({
      message: "Response sent",
      method: method,
      endpoint: url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      responseSize: res.get("Content-Length") || "Unknown",
    });
  });

  next();
});

let activeConnections = 0; // Variable for tracking active connections
let server;

function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  server.close(() => {
    logger.info("Closed out remaining connections.");
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Forcing shutdown due to hanging connections.");
    process.exit(1);
  }, 60000); // Timeout set to 60 seconds
}

// Listen for termination signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

const client = require("prom-client"); // Add this line at the top
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

// Create an endpoint for Prometheus to scrape metrics
// Create an endpoint for Prometheus to scrape metrics
app.get("/metrics", async (req, res) => {
  // Check if the API key is provided in the headers
  const apiKey = req.headers["x-api-key"]; // Or whatever header you're using for API keys

  // Validate the API key
  if (apiKey !== process.env.API_KEY) {
    // If API key is missing or invalid, return a 403 Forbidden status
    return res.status(403).json({ message: "Forbidden: Invalid API Key" });
  }

  // If API key is valid, proceed to send the metrics
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

// Load personality data
const loadPersonalityData = (type, langCode) => {
  const personalityTitle = {
    ISFJ: "Defender",
    INFP: "Mediator",
    INFJ: "Advocate",
    INTJ: "Architect",
    ENFP: "Campaigner",
    ENFJ: "Protagonist",
    ENTP: "Debater",
    ESTP: "Dynamo",
    ESTJ: "Executive",
    ESFP: "Performer",
    ESFJ: "Consul",
    ISTP: "Virtuoso",
    ISTJ: "Logistician",
    ISFP: "Adventurer",
    ENTJ: "Commander",
  }[type];

  const filePath = path.join(
    __dirname,
    "answers",
    `${personalityTitle}_${type}.json`
  );

  try {
    const data = fs.readFileSync(filePath, "utf8");
    const parsedData = JSON.parse(data);
    const personalityData = parsedData.personalities.find(
      (personality) => personality.language_code === langCode
    );

    if (!personalityData) {
      console.log(
        `Personality data for type ${type} in language ${langCode} not found.`
      );
    }

    return personalityData || null;
  } catch (error) {
    console.error(`Error reading ${filePath}: `, error);
    return null;
  }
};

// Load questions from JSON files
const loadQuestions = (language) => {
  const filePath = path.join(__dirname, "questions", `${language}.json`);
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${language}.json: `, error);
    return [];
  }
};

// Load scoring values and trait names based on language
const loadMappings = (language) => {
  const scoringFilePath = path.join(
    __dirname,
    "mappings",
    "scoringValues.json"
  );
  const traitFilePath = path.join(__dirname, "mappings", "traitNames.json");

  const scoringValues = JSON.parse(fs.readFileSync(scoringFilePath, "utf8"));
  const traitNames = JSON.parse(fs.readFileSync(traitFilePath, "utf8"));

  return {
    scoringValues: scoringValues[language],
    traitNames: traitNames[language],
  };
};

// Store questions for each language using language codes
const questions = {
  en: loadQuestions("English"),
  es: loadQuestions("Spanish"),
  fr: loadQuestions("French"),
  pt: loadQuestions("Portuguese"),
  ar: loadQuestions("Arabic"),
};

const question_letters = [
  "I",
  "E",
  "N",
  "S",
  "F",
  "T",
  "J",
  "P",
  "I",
  "P",
  "N",
  "S",
  "T",
  "F",
  "J",
  "S",
  "E",
  "I",
  "S",
  "P",
  "F",
  "J",
  "S",
  "F",
  "E",
  "N",
  "T",
  "F",
  "P",
  "E",
  "N",
  "T",
  "J",
  "E",
  "J",
  "P",
  "N",
  "E",
  "N",
  "I",
];

// Endpoint to get questions based on the language code
app.get("/v1/questions/:langCode", (req, res) => {
  const { langCode } = req.params;
  const langQuestions = questions[langCode];

  if (!langQuestions) {
    return res.status(404).json({ message: "Language not supported" });
  }

  res.json(langQuestions);
});

// MBTI test endpoint
app.post("/v1/mbti-test/:langCode", (req, res) => {
  const { langCode } = req.params;
  const { responses } = req.body;

  // Validate that all 40 questions are answered
  if (responses.length !== 40) {
    return res.status(400).json({ message: "Please answer all 40 questions." });
  }

  // Valid answer options (in lowercase)
  const validResponses = [
    "strongly agree",
    "agree",
    "neutral",
    "disagree",
    "strongly disagree",
  ];

  // Load mappings for scoring and trait names
  const { scoringValues, traitNames } = loadMappings(langCode);

  // Initialize scores for each dichotomy
  const scores = {
    I: 0,
    E: 0,
    N: 0,
    S: 0,
    T: 0,
    F: 0,
    J: 0,
    P: 0,
  };

  // Define opposite traits
  const oppositeTraits = {
    I: "E",
    E: "I",
    N: "S",
    S: "N",
    T: "F",
    F: "T",
    J: "P",
    P: "J",
  };

  // Calculate scores based on the responses provided
  responses.forEach((response) => {
    const [questionId, userResponse] = response
      .split(":")
      .map((part) => part.trim());
    const questionID = parseInt(questionId) - 1; // Adjust for zero-based index

    // Normalize user response to lowercase for comparison
    const normalizedResponse = userResponse.toLowerCase();

    // Check for valid response
    if (!validResponses.includes(normalizedResponse)) {
      return res.status(400).json({
        message: `Invalid response for question ${
          questionID + 1
        }. Accepted responses are: ${validResponses.join(", ")}.`,
      });
    }

    // Define the score based on the normalized user response
    const scoreMapping = {
      "strongly agree": 3,
      agree: 1,
      neutral: 0,
      disagree: 1,
      "strongly disagree": 3,
    };

    const score = scoreMapping[normalizedResponse];

    // Find the letter for the question using ID
    const questionLetter = question_letters[questionID];

    // Adjust scores based on the response
    if (
      normalizedResponse === "strongly disagree" ||
      normalizedResponse === "disagree"
    ) {
      // Add score to the opposite trait
      scores[oppositeTraits[questionLetter]] += score; // Increment opposite score
    } else {
      // Otherwise, add score to the current letter
      scores[questionLetter] += score;
    }
  });

  // Log final scores for debugging
  console.log(`Final Scores: ${JSON.stringify(scores)}`);

  // Determine the personality type based on the scores
  const finalType =
    `${scores.I > scores.E ? "I" : "E"}` +
    `${scores.N > scores.S ? "N" : "S"}` +
    `${scores.T > scores.F ? "T" : "F"}` +
    `${scores.J > scores.P ? "J" : "P"}`;

  // Load the personality data using the updated naming convention
  const personalityData = loadPersonalityData(finalType, langCode);
  if (!personalityData) {
    return res.status(404).json({ message: "Personality type data not found" });
  }

  // Calculate the total responses for each dichotomy for percentage calculation
  const totalResponses = {
    E_I: scores.E + scores.I,
    S_N: scores.S + scores.N,
    T_F: scores.T + scores.F,
    J_P: scores.J + scores.P,
  };

  // Calculate percentages based on the winning scores
  const percentages = {
    extraversion:
      totalResponses.E_I > 0
        ? Math.round((scores.E / totalResponses.E_I) * 100)
        : 0,
    introversion:
      totalResponses.E_I > 0
        ? Math.round((Math.abs(scores.I) / totalResponses.E_I) * 100)
        : 0,
    intuition:
      totalResponses.S_N > 0
        ? Math.round((scores.N / totalResponses.S_N) * 100)
        : 0,
    sensing:
      totalResponses.S_N > 0
        ? Math.round((Math.abs(scores.S) / totalResponses.S_N) * 100)
        : 0,
    thinking:
      totalResponses.T_F > 0
        ? Math.round((scores.T / totalResponses.T_F) * 100)
        : 0,
    feeling:
      totalResponses.T_F > 0
        ? Math.round((Math.abs(scores.F) / totalResponses.T_F) * 100)
        : 0,
    judging:
      totalResponses.J_P > 0
        ? Math.round((scores.J / totalResponses.J_P) * 100)
        : 0,
    perceiving:
      totalResponses.J_P > 0
        ? Math.round((Math.abs(scores.P) / totalResponses.J_P) * 100)
        : 0,
  };

  // Construct the response according to your desired structure
  const response = {
    message: "MBTI test completed",
    personalityData: {
      id: personalityData.id,
      language_code: langCode,
      personalityType: finalType,
      extraversion_introversion: `${
        finalType[0] === "I" ? traitNames.I : traitNames.E
      } , ${
        finalType[0] === "I"
          ? percentages.introversion
          : percentages.extraversion
      }%`,
      sensing_intuition: `${
        finalType[1] === "N" ? traitNames.N : traitNames.S
      } , ${
        finalType[1] === "N" ? percentages.intuition : percentages.sensing
      }%`,
      thinking_feeling: `${
        finalType[2] === "F" ? traitNames.F : traitNames.T
      } , ${
        finalType[2] === "F" ? percentages.feeling : percentages.thinking
      }%`,
      perceiving_judging: `${
        finalType[3] === "P" ? traitNames.P : traitNames.J
      } , ${
        finalType[3] === "P" ? percentages.perceiving : percentages.judging
      }%`,
      name: personalityData.name,
      Description: personalityData.Description,
      Strengths: personalityData.Strengths,
      Weaknesses: personalityData.Weaknesses,
      DosInRelationship: personalityData.DosInRelationship,
      DontsInRelationship: personalityData.DontsInRelationship,
      Friendships: personalityData.Friendships,
      CareerPath: personalityData.CareerPath,
      LifeValue: personalityData.LifeValue,
      CompatibleConnections: personalityData.CompatibleConnections,
      HasPotentialConnections: personalityData.HasPotentialConnections,
      ChallengingConnections: personalityData.ChallengingConnections,
      AttractedBy: personalityData.AttractedBy,
      PetPeeves: personalityData.PetPeeves,
      HowToBeCompanion: personalityData.HowToBeCompanion,
      SecretDesire: personalityData.SecretDesire,
      Stereotypes: personalityData.Stereotypes,
      Celebrities: personalityData.Celebrities,
    },
  };

  res.json(response);
});

// Error handler for unhandled routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Server startup
server = app.listen(port, () => {
  logger.info(`MBTI Personality API running on port :${port}`);
});

// Track active connections to the server
server.on("connection", (conn) => {
  activeConnections++;
  logger.info(
    `New connection established. Active connections: ${activeConnections}`
  );

  conn.on("close", () => {
    activeConnections--;
    logger.info(`Connection closed. Active connections: ${activeConnections}`);
  });
});
