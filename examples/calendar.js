zimbra = require("./index.js");
var fs = require('fs');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var readline = require('readline');

var SCOPES = ['https://www.googleapis.com/auth/calendar'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'calendar-nodejs-quickstart.json';
var zimbraURL = process.argv[2];
var zimbraLogin = process.argv[3];
var zimbraPassword = process.argv[4];

zimbra.getUserAuthToken(zimbraURL, zimbraLogin, zimbraPassword, function(err, authToken) {
    if(err != null) {
        console.log("Failed to authenticate to Zimbra");
        console.log(err);
    } else {

        /*zimbra.getCalendars(zimbraURL, authToken, function (err, calendars) {
            if (err != null) {
                console.log("Failed load Zimbra calendars");
                console.log(err);
            }
            if (calendars && calendars.length > 0) {
                var cnt = calendars.length;
                for (var i = 0; i < cnt; i++) {
                    console.log(calendars[i].name + " ID: " + calendars[i].id);
                }
                var rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                rl.question('Enter the id of the calendar you want to sync: ', function (calendarID) {
                    rl.close();*/
                    calendarID = 10;
                    var timeInMs = Date.now();
                    var time2Weeks = timeInMs + 14 * 86200000;
                    zimbra.searchAppointments(zimbraURL, authToken, calendarID, timeInMs, time2Weeks, 2, function (err, resp) {
                        if (err) {
                            console.log('Failed to search for appointments. Zimbra returned an error: ' + err);
                            return;
                        }
                        //console.log(resp);
                        if (resp && resp.appt) {
                            var zimbraEvents = resp.appt;
                            var cnt = zimbraEvents.length;
                            for (var i = 0; i < cnt; i++) {
                                //var dateTime = new Date(resp.appt[i].d);
                                var name = zimbraEvents[i].name;
                                var duration = zimbraEvents[i].dur;
                                var instances = zimbraEvents[i].inst;
                                var startMS = 0;
                                if (zimbraEvents[i].s) {
                                    startMS = zimbraEvents[i].s;
                                }
                                if (instances && instances.length && instances[0]) {
                                    startMS = instances[0].s;
                                }
                                var startTime = new Date(startMS);
                                var endMS = startMS + duration;
                                var endTime = new Date(endMS);
                                console.log(i + "." + name + "/" + zimbraEvents[i].uid + ". At " + startTime.toISOString().substr(0, 19) + "Z until " + endTime.toISOString() + " local: " + startTime.toLocaleString());
                                zimbra.getMessage(zimbraURL, authToken, zimbraEvents[i].invId, function(err, resp) {
                                    console.log(JSON.stringify(resp));
                                });

                            }
                            var rl = readline.createInterface({
                                input: process.stdin,
                                output: process.stdout
                            });
                            rl.question('Select the event you want to copy: ', function (eventID) {
                                console.log("Will copy " + zimbraEvents[eventID].name + " with ID " + zimbraEvents[eventID].uid);
                                var duration = zimbraEvents[eventID].dur;
                                var instances = zimbraEvents[eventID].inst;
                                var startMS = 0;
                                if (zimbraEvents[eventID].s) {
                                    startMS = zimbraEvents[eventID].s;
                                }
                                if (instances && instances.length && instances[0]) {
                                    startMS = instances[0].s;
                                }
                                var startTime = new Date(startMS);
                                var endMS = startMS + duration;
                                var endTime = new Date(endMS);

                                var sourceEvent = {
                                    "summary": zimbraEvents[eventID].name,
                                    "location": zimbraEvents[eventID].loc,
                                    "description": zimbraEvents[eventID].fr,
                                    "start": {
                                        "dateTime": startTime.toISOString().substr(0, 19) + "Z"
                                    },
                                    "end": {
                                        "dateTime": endTime.toISOString().substr(0, 19) + "Z"
                                    },
                                    "extendedProperties": {
                                        "private": {
                                            "zimbraid": zimbraEvents[eventID].uid
                                        }
                                    }
                                };
                                //console.log(TOKEN_PATH);
                                // Load client secrets from a local file.
                                fs.readFile('client_secret.json', function processClientSecrets(err, content) {
                                    if (err) {
                                        console.log('Error loading client secret file: ' + err);
                                        return;
                                    }
                                    // Authorize a client with the loaded credentials, then call the
                                    // Google Calendar API.
                                    //authorize(JSON.parse(content), listEvents);
                                    authorize(JSON.parse(content), function (auth) {
                                        var calendar = google.calendar('v3');
                                        calendar.calendarList.list({
                                            auth: auth,
                                            minAccessRole: "writer"
                                        }, function (err, resp) {
                                            if (err) {
                                                console.log('The API returned an error: ' + err);
                                                return;
                                            } else {
                                                if (resp && resp.items) {
                                                    var cnt = resp.items.length;
                                                    for (var i = 0; i < cnt; i++) {
                                                        console.log(i + ": " + resp.items[i].summary + " / " + resp.items[i].id);
                                                    }
                                                }
                                                var rl = readline.createInterface({
                                                    input: process.stdin,
                                                    output: process.stdout
                                                });
                                                rl.question('Select calendar: ', function (ix) {
                                                    rl.close();
                                                    var targetCalendar = resp.items[ix];
                                                    console.log("Selected calendar: " + targetCalendar.summary);
                                                    calendar.events.list({
                                                        auth: auth,
                                                        calendarId: targetCalendar.id,
                                                        maxResults: 10,
                                                        singleEvents: true,
                                                        orderBy: 'startTime',
                                                        privateExtendedProperty: "zimbraid=" + zimbraEvents[eventID].uid
                                                    }, function (err, response) {
                                                        if (err) {
                                                            console.log('The API returned an error: ' + err);
                                                            return;
                                                        }
                                                        var events = response.items;
                                                        if (events.length == 0) {
                                                            console.log('No upcoming events found. Adding an event');
                                                            console.log(sourceEvent);
                                                            console.log(sourceEvent.start);
                                                            console.log(sourceEvent.end);
                                                            calendar.events.insert({
                                                                auth: auth,
                                                                calendarId: targetCalendar.id,
                                                                resource: sourceEvent
                                                            }, function (err, event) {
                                                                if (err) {
                                                                    console.log('There was an error contacting the Calendar service: ' + err);
                                                                    return;
                                                                }
                                                                console.log('Event created: %s', event.htmlLink);
                                                            })
                                                        } else {
                                                            console.log('Foud matching event: ' + events[0].summary);

                                                        }
                                                    });
                                                });
                                            }
                                        })
                                    });
                                });
                            });
                        }
                    });
                //});
            //}
        //})
    }
});




/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function(err, token) {
        if (err) {
            getNewToken(oauth2Client, callback);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            callback(oauth2Client);
        }
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
    var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function(code) {
        rl.close();
        oauth2Client.getToken(code, function(err, token) {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                return;
            }
            oauth2Client.credentials = token;
            storeToken(token);
            callback(oauth2Client);
        });
    });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code != 'EEXIST') {
            throw err;
        }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + TOKEN_PATH);
}

function listCalendars(auth) {
    var calendar = google.calendar('v3');
    calendar.calendarList.list({auth:auth, minAccessRole:"writer"}, function(err, resp) {
        if(err) {
            console.log('The API returned an error: ' + err);
            return;
        } else {
            if(resp && resp.items) {
                var cnt = resp.items.length;
                for(var i = 0; i < cnt; i++) {
                    console.log(i + ": " + resp.items[i].summary);
                }
            }
            var rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            rl.question('Select calendar: ', function(ix) {
                rl.close();
                console.log("Selected calendar: " + resp.items[ix].summary);
                calendar.events.list({
                    auth: auth,
                    calendarId: resp.items[ix].id,
                    maxResults: 10,
                    singleEvents: true,
                    orderBy: 'startTime',
                    privateExtendedProperty:"zimbraid='7c59ff63-7dfa-4627-8e34-4b5267d8c996'"
                }, function(err, response) {
                    if (err) {
                        console.log('The API returned an error: ' + err);
                        return;
                    }
                    var events = response.items;
                    if (events.length == 0) {
                        console.log('No upcoming events found.');
                    } else {
                        console.log('Upcoming 10 events:');
                        for (var i = 0; i < events.length; i++) {
                            var event = events[i];
                            var start = event.start.dateTime || event.start.date;
                            console.log('%s - %s', start, event.summary);
                        }
                    }
                });
            });
        }
    })
}