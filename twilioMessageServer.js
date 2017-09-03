const http = require("http");
const express = require("express");
const MessagingResponse = require('twilio').twiml.MessagingResponse;
// body-parser reads the request stream into a string object and
// adds it to the body ... this is good for simple HTTP requests
const bodyParser = require('body-parser');

//
// This method parses messages that may contain multiple semi-colon
// separated commands:
//  commands [; commands]...
//
// Each command has an action, may have a target and sub-targets,
// and may have one or more arguments:
//
//  [target [.subtarget]... .]action [arguments [, argument]... ]
//
// where argument is
//  name [ = value ]
//
// The separators, semi-colon, period, comma, and equals, can be escaped
// with backslash (\).  Spaces around the separators are optional.
//
// Possible Examples:
//  red
//  royals
//  trees 1=red, 3=blue, 5=white
//  black; trees 1=orange, 3=orange, 5=orange, 7=orange, 9=orange
//  tree.1.setColor green
//  pig color=pink
//  pig.color pink
//  star.flash color=white
//
function parseMessage(message) {
  // hide escaped semicolons
  const contortedMessage = message.replace("\;", "```")
  const parts = contortedMessage.split(";");
  const commands = [];
  for (const temp of parts) {
    let commandString = temp.trim().replace("```", ";");
    let command = parseCommand(commandString);
    commands.push(command);
  }
  return commands;
}

function parseCommand(commandString) {
  let target = null;
  let action = null;
  let properties = null;

  const indexOfFirstSpace = commandString.trim().indexOf(" ");
  let actionString = null;
  if (indexOfFirstSpace < 0) {
    actionString = commandString;
  } else {
    actionString = commandString.substring(0, indexOfFirstSpace);
  }
  let parts = actionString.split(".");
  if (parts.length === 1) {
    action = parts[0].trim();
  } else if (parts.length === 2) {
    target = parts[0].trim();
    action = parts[1].trim();
  } else {
    targets = parts.slice(0, parts.length-1);
    action = parts[parts.length-1].trim();
  }

  if (indexOfFirstSpace > 0) {
    const propertiesString = commandString.substring(indexOfFirstSpace+1);
    properties = parseProperites(propertiesString);
  }

  let command = null;
  if (target && properties) {
    command = { target, action, properites };
  } else if (target) {
    command = { target, action };
  } else if (properties) {
    command = { action, properties };
  } else {
    command = { action };
  }
  
  return command;
}

function parseProperites(propertiesString) {
  const properties = [];

  // hide escacped commas
  const contorted = propertiesString.replace("\,", "```");
  const parts = contorted.split(",");

  for (const temp of parts) {
    const propertyString = temp.trim().replace("```", ",");
    const property = parseProperty(propertyString)
    properties.push(property);
  }
  return properties;
}

function parseProperty(propertyString) {
  let property = null;

  // hide escaped equal signs
  const contorted = propertyString.replace("\=", "```");
  const parts = contorted.split("=");

  const name = parts[0].trim().replace("```", "=");
  if (parts.length === 1) {
    property = { name, value: true };
  } else if (parts.length === 2) {
    const value = parts[1].trim().replace("```", "=");
    property = { name, value };
  } else {
    throw new Error("Too many equal signs, Use \=", propertyString);
  }
  return property;
}

const unrecongizedRequest = "I do not understand your request.";

function runCommands(commands) {
  for (const command of commands) {
    if (command.target) {
      switch (command.target) {
        case "trees":
        case "tree":
          doTreeAction(command);
          break;
        case "star":
          doStarAction(command);
          break;
        case "chicken":
        case "cow":
        case "pig":
        case "goat":
        case "sheep":
          doAnimalAction(command);
          break;
        default:
          throw new Error(unrecongizedRequest);
      }
    } else {
      switch (command.action) {
        case "red":
        case "yellow":
        case "blue":
        case "white":
        case "black":
        case "pink":
        case "orange":
        case "green":
        case "purple":
          doColorAction(command.action);
          break;
        case "royals":
        case "chiefs":
        case "santa":
        case "sporting":
        // case "ku":
        // case "kstate":
        // case "mu":
          doTeamAction(command.action);
          break;
        default:
          throw new Error(unrecongizedRequest);
      }
    }
  }
}

function doTreeAction(command) {
  console.log("doTreeAction", command);
  for (const property of command.properites) {
    const treeNumber = property.name;
    const color = property.value;
    // TODO ...
  } 
}

function doStarAction(command) {
  console.log("doStarAction", command);
  // TODO ... 
}

function doTreeAction(command) {
  console.log("doTreeAction", command);
  // TODO ...
}

function doColorAction(color) {
  console.log("doColorAction", color);
  // TODO ...
}

function doTeamAction(team) {
  console.log("doTeamAction", team);
  // TODO ...
}

const usageMessage = "Try sending me the name of a color or your favorite team!";

const app = express();
app.use(bodyParser.urlencoded({extended: true}));

app.post("/sms", function (request, response) {
  const twiml = new MessagingResponse();

  let note = "";
  try {
    let message = request.body.Body.trim().toLowerCase();
    console.log(message);
    const commands = parseMessage(message);
    console.log(commands);

    runCommands(commands);
 
    const commandsAsJSon = JSON.stringify(commands, null, 2);
    console.log(commandsAsJSon);
  } catch (error) {
    if (error.message === unrecongizedRequest) {
      note += " " + unrecongizedRequest + " " + usageMessage;
    } else {
      note += " Whoops! Trouble in the barn! (" + error.message + ")";
    }
    console.log(error.message);
  }

  twiml.message("Thank you for your message!" + note);
  response.writeHead(200, { "Content-Type": "text/xml" });
  response.end(twiml.toString());
});

const port = 8080;

http.createServer(app).listen(port, function () {
  console.log("Express server listening on port " + port);
});
