/**
 * Created by gsolovyev on 9/9/16.
 */
/*
zimbra = require("../index.js");
var fs = require('fs');
var readline = require('readline');

var zimbraURL = process.argv[2];
var zimbraLogin = process.argv[3];
var zimbraPassword = process.argv[4];
zimbra.getUserAuthToken(zimbraURL, zimbraLogin, zimbraPassword, function(err, authToken) {
    if(err != null) {
        console.log("Failed to authenticate to Zimbra");
        console.log(err);
    } else {
        zimbra.getCalendars(zimbraURL, authToken, function (err, calendars) {
            for(var i in calendars) {
                console.log(calendars[i].name);
            }

        })
    }
    })*/

var assert = require('assert');
describe('zimbra', function() {
    describe('#processResponse()', function() {
        it('should extract auth token', function() {
            var token = "0_2938aee79e3fda8fbaab05cd099f3864d0efb1e4_69643d33363a37333233306433322d363636342d313164392d383539652d6631333962633564623339333b6578703d31333a313437333634313537393130363b76763d323a31303b747970653d363a7a696d6272613b753d313a613b7469643d393a3233333436363032373b76657273696f6e3d31333a382e372e305f47415f313635393b";
            var authResponse = '{"Header":{"context":{"change":{"token":2824223},"_jsns":"urn:zimbra"}},"Body":{"AuthResponse":{"authToken":[{"_content":"0_2938aee79e3fda8fbaab05cd099f3864d0efb1e4_69643d33363a37333233306433322d363636342d313164392d383539652d6631333962633564623339333b6578703d31333a313437333634313537393130363b76763d323a31303b747970653d363a7a696d6272613b753d313a613b7469643d393a3233333436363032373b76657273696f6e3d31333a382e372e305f47415f313635393b"}],"lifetime":172799997,"skin":[{"_content":"harmony"}],"_jsns":"urn:zimbraAccount"}},"_jsns":"urn:zimbraSoap"}';
            zimbra = require("../index.js");
            zimbra.processResponse(authResponse,
                function(result) {
                    assert.equal(token, result.payload.Body.AuthResponse.authToken[0]._content);
                });

        });
    });
});

describe('zimbra', function() {
    describe('#processResponse()', function() {
        it('should return error object with error code service.AUTH_EXPIRED', function() {
            var soapXml = "<soap:Envelope xmlns:soap=\"http://www.w3.org/2003/05/soap-envelope\"><soap:Body><soap:Fault><soap:Code><soap:Value>soap:Sender</soap:Value></soap:Code><soap:Reason><soap:Text>auth credentials have expired</soap:Text></soap:Reason><soap:Detail><Error xmlns=\"urn:zimbra\"><Code>service.AUTH_EXPIRED</Code><Trace>qtp509886383-581407:https://204.14.158.50:443/service/soap:1473443427011:3f9bfed7c7ea230f:SoapEngine266</Trace></Error></soap:Detail></soap:Fault></soap:Body></soap:Envelope>";
            zimbra = require("../index.js");
            zimbra.processResponse(soapXml,
                function(response) {
                    assert.equal(zimbra.AUTH_EXPIRED, response.err.code);
                });

        });
    });
});

describe('zimbra', function() {
    describe('#parseFolders()', function() {
        it("Should return 8 folders", function() {
            var jsonString = String("{\"Header\":{\"context\":{\"change\":{\"token\":2824223},\"_jsns\":\"urn:zimbra\"}},\"Body\":{\"GetFolderResponse\":{\"folder\":[{\"id\":\"1\",\"name\":\"USER_ROOT\",\"folder\":[{\"id\":\"10\",\"uuid\":\"eff76a9c-f658-4767-b044-7817f712ab57\",\"name\":\"Calendar\",\"absFolderPath\":\"/Calendar\",\"l\":\"1\",\"luuid\":\"d99f3418-6545-41ce-b66c-ce34b7bf24b0\",\"f\":\"#i\",\"color\":1,\"view\":\"appointment\",\"rev\":1,\"ms\":2824218,\"webOfflineSyncDays\":0,\"activesyncdisabled\":false,\"n\":1211,\"s\":86984818,\"i4ms\":2821883,\"i4next\":675111,\"acl\":{\"grant\":[{\"gt\":\"pub\",\"perm\":\"r\"}]}},{\"id\":\"147314\",\"uuid\":\"c80fccbe-73e2-49a3-bbf8-549897d13738\",\"name\":\"Home\",\"absFolderPath\":\"/Home\",\"l\":\"1\",\"luuid\":\"d99f3418-6545-41ce-b66c-ce34b7bf24b0\",\"f\":\"#i\",\"view\":\"appointment\",\"rev\":1739024,\"ms\":2824219,\"webOfflineSyncDays\":0,\"activesyncdisabled\":false,\"n\":8,\"s\":12809,\"i4ms\":2792979,\"i4next\":658134,\"acl\":{}},{\"id\":\"3\",\"uuid\":\"2527dfff-abb9-48b0-a538-309f3695c255\",\"name\":\"Trash\",\"absFolderPath\":\"/Trash\",\"l\":\"1\",\"luuid\":\"d99f3418-6545-41ce-b66c-ce34b7bf24b0\",\"f\":\"*\",\"rev\":1,\"ms\":1775734,\"webOfflineSyncDays\":30,\"activesyncdisabled\":false,\"n\":2191,\"s\":1002525027,\"i4ms\":2821337,\"i4next\":675933},{\"id\":\"270214\",\"uuid\":\"a952045b-9220-4f8c-aaf5-7dc48a0ef454\",\"name\":\"US Holidays\",\"absFolderPath\":\"/US Holidays\",\"l\":\"1\",\"luuid\":\"d99f3418-6545-41ce-b66c-ce34b7bf24b0\",\"f\":\"#i\",\"color\":5,\"view\":\"appointment\",\"rev\":1961729,\"ms\":2824222,\"webOfflineSyncDays\":0,\"activesyncdisabled\":false,\"n\":331,\"s\":0,\"i4ms\":2275202,\"i4next\":417410,\"url\":\"webcal://ical.mac.com/ical/US32Holidays.ics\",\"acl\":{}},{\"id\":\"147313\",\"uuid\":\"e016640f-eb46-43d2-a8a6-7c9e6eacd315\",\"name\":\"Work\",\"absFolderPath\":\"/Work\",\"l\":\"1\",\"luuid\":\"d99f3418-6545-41ce-b66c-ce34b7bf24b0\",\"f\":\"#i\",\"view\":\"appointment\",\"rev\":1739023,\"ms\":2824221,\"webOfflineSyncDays\":0,\"activesyncdisabled\":false,\"n\":0,\"s\":0,\"i4ms\":1739023,\"i4next\":147314,\"acl\":{}}],\"link\":[{\"id\":\"594514\",\"uuid\":\"a9bb48c4-88b1-4e1a-a11b-a598416b8c8a\",\"name\":\"Prashant Surana's Platform Team Resource's Calendar\",\"absFolderPath\":\"/Prashant Surana's Platform Team Resource's Calendar\",\"l\":\"1\",\"luuid\":\"d99f3418-6545-41ce-b66c-ce34b7bf24b0\",\"color\":4,\"view\":\"appointment\",\"rev\":2649458,\"ms\":2824213,\"webOfflineSyncDays\":0,\"activesyncdisabled\":false,\"zid\":\"0bcac68a-0940-4882-933d-3305c1cfa105\",\"rid\":1388059,\"ruuid\":\"84439fd0-ff55-4e90-8ccf-2c9fdffd1fe3\",\"owner\":\"psurana@zimbra.com\",\"reminder\":false},{\"id\":\"455012\",\"uuid\":\"5421aaba-4539-4f4b-9387-214e5e194844\",\"name\":\"Product Development Resource's Engineering Milestones\",\"absFolderPath\":\"/Product Development Resource's Engineering Milestones\",\"l\":\"1\",\"luuid\":\"d99f3418-6545-41ce-b66c-ce34b7bf24b0\",\"f\":\"#\",\"color\":1,\"view\":\"appointment\",\"rev\":2358985,\"ms\":2721945,\"webOfflineSyncDays\":0,\"activesyncdisabled\":false,\"zid\":\"f0418056-624c-4972-92f0-cfe208fd3d2d\",\"rid\":257,\"ruuid\":\"0a01fe78-e114-47f0-a8a4-12bfdbc5cbe5\",\"owner\":\"pd-resource@zimbra.com\",\"reminder\":false},{\"id\":\"421101\",\"uuid\":\"af6627ce-5b9e-42f9-b417-8ccec53884de\",\"name\":\"zimbra-leads's Calendar\",\"absFolderPath\":\"/zimbra-leads's Calendar\",\"l\":\"1\",\"luuid\":\"d99f3418-6545-41ce-b66c-ce34b7bf24b0\",\"f\":\"#\",\"color\":3,\"view\":\"appointment\",\"rev\":2289621,\"ms\":2824216,\"webOfflineSyncDays\":0,\"activesyncdisabled\":false,\"zid\":\"6bea122c-44c1-11da-9a9e-cf3f68de0323\",\"rid\":10,\"ruuid\":\"b8db51bc-ec3d-41f8-b5d0-b0b6cc4081d7\",\"owner\":\"zimbra-leads@zimbra.com\",\"reminder\":false}]}],\"_jsns\":\"urn:zimbraMail\"}},\"_jsns\":\"urn:zimbraSoap\"}");

            zimbra.responseCallback(null, null, jsonString, "GetFolderResponse", function (err, respBody) {
                assert.ok(!err);
                zimbra.parseFolders(respBody, function (err, calendars) {
                    assert.ok(!err);
                    assert.ok(calendars);
                    assert.equal(8, calendars.length);
                });
            });
        });
    });
});