/**
 * Created by gsolovyev on 5/3/15.
 */
var request = require('request');
var js2xmlparser = require('js2xmlparser');
var ERR_UNKNOWN = "UNKNOWN";
var USER_AGENT = "zmsoap";
var AUTH_EXPIRED = "service.AUTH_EXPIRED";
var ID_AUTO_INCREMENT = -1;
var ID_FOLDER_USER_ROOT = 1;
var ID_FOLDER_INBOX = 2;
var ID_FOLDER_TRASH = 3;
var ID_FOLDER_SPAM = 4;
var ID_FOLDER_SENT = 5;
var ID_FOLDER_DRAFTS = 6;
var ID_FOLDER_CONTACTS = 7;
var ID_FOLDER_TAGS = 8;
var ID_FOLDER_CONVERSATIONS = 9;
var ID_FOLDER_CALENDAR = 10;
var ID_FOLDER_ROOT = 11;
var ITEM_TYPE_APPOINTMENT = 'appointment';

getAdminAuthToken = function(hostName,adminLogin,adminPassword,cb) {
    var adminURL = getAdminURL(hostName);
    var authRequestObject = {
        "AuthRequest": {
            "@": {
                "xmlns": "urn:zimbraAdmin"
            },
            name: adminLogin,
            password: adminPassword
        }
    };
    var req = makeSOAPEnvelope(authRequestObject,"",USER_AGENT);
    request({
            method:"POST",
            uri:adminURL,
            headers: {
                "Content-Type": "application/soap+xml; charset=utf-8"
            },
            body: req,
            strictSSL: false,
            jar: false,
            timeout: 10000
        },
        function(err,resp,body) {
            if(err != null) {
                cb(err,null);
            } else {
                processResponse(body, function(result) {
                    if(result.err != null) {
                        cb(err,null);
                    } else if(result.payload.Body.AuthResponse != null) {
                        cb(null,result.payload.Body.AuthResponse.authToken[0]._content);
                    } else {
                        cb({"message":"Error: could node parse admin AuthResponse from Zimbra","resp":resp,"body":body});
                    }
                });
            }
        });
}

getUserAuthToken = function(hostName,login,password,cb) {
    var soapURL = getUserSoapURL(hostName);
    var authRequestObject = {
        "AuthRequest": {
            "@": {
                "xmlns": "urn:zimbraAccount"
            },
            account: {
                "@":{
                    "by":"name"
                },
                "#":login
            },
            password: password
        }
    };
    var req = makeSOAPEnvelope(authRequestObject,"",USER_AGENT);
    request({
            method:"POST",
            uri:soapURL,
            headers: {
                "Content-Type": "application/soap+xml; charset=utf-8"
            },
            body: req,
            strictSSL: false,
            jar: false,
            timeout: 10000
        },
        function(err,resp,body) {
            if(err != null) {
                cb(err,null);
            } else {
                processResponse(body, function(result) {
                    if(result.err != null) {
                        cb(err,null);
                    } else if(result.payload.Body.AuthResponse != null) {
                        cb(null,result.payload.Body.AuthResponse.authToken[0]._content);
                    } else {
                        cb({"message":"Error: could node parse AuthResponse from Zimbra","resp":resp,"body":body});
                    }
                });
            }

        });
}

createAccount = function(hostName, user, adminAuthToken, cb) {
    var adminURL = getAdminURL(hostName);
    var createAccountRequestObj = {
        "CreateAccountRequest":user
    };
    createAccountRequestObj.CreateAccountRequest["@"] = {"xmlns": "urn:zimbraAdmin"};
    var req = makeSOAPEnvelope(createAccountRequestObj,adminAuthToken,USER_AGENT);
    request({
            method:"POST",
            uri:adminURL,
            headers: {
                "Content-Type": "application/soap+xml; charset=utf-8"
            },
            body: req,
            strictSSL: false,
            jar: true,
            timeout: 10000
        },
        function(err,resp,body) {
            if(err != null) {
                cb(err,null);
            } else {
                processResponse(body, function(result) {
                    if(result.err != null) {
                        cb(result.err,null);
                    } else if(result.payload.Body.CreateAccountResponse != null &&
                        result.payload.Body.CreateAccountResponse.account != null &&
                        result.payload.Body.CreateAccountResponse.account[0] != null) {
                        cb(null,result.payload.Body.CreateAccountResponse.account[0]);
                    } else {
                        cb({"message":"Error: could node parse CreateAccountResponse from Zimbra ","resp":resp,"body":body,code:ERR_UNKNOWN}, null);
                    }
                });
            }
        });
}

adminRequest = function(hostName, requestName, reqObject, adminAuthToken, cb) {
    var adminURL = getAdminURL(hostName);
    var wrapperObj = {};
    var responseName = requestName.replace("Request", "Response");
    wrapperObj[requestName] = reqObject;

    var defaultRequestAttribute = { "xmlns": "urn:zimbraAdmin" };

    if (wrapperObj[requestName]["@"]) {
        for (var attrname in defaultRequestAttribute) {
            wrapperObj[requestName]["@"][attrname] = defaultRequestAttribute[attrname];
        }
    }else{
        wrapperObj[requestName]["@"] = defaultRequestAttribute;
    }

    request({
            method:"POST",
            uri:adminURL,
            headers: {
                "Content-Type": "application/soap+xml; charset=utf-8"
            },
            body: req,
            strictSSL: false,
            jar: true,
            timeout: 10000
        },
        function(err,resp,body) {
            if(err != null) {
                cb(err,null);
            } else {

                processResponse(body, function(result) {
                    if(result.err != null) {
                        cb(result.err,null);
                    } else if(result.payload.Body[responseName] != null) {
                        cb(null,result.payload.Body[responseName]);
                    } else {
                        cb({"message":"Error: could node parse adminresponse from Zimbra. Expecting " + responseName,"resp":resp,"body":body,code:ERR_UNKNOWN}, null);
                    }
                });

            }

        });
}

getUserAuthTokenByName = function(hostName, login, seconds, adminAuthToken, cb) {
    delegateAuth(hostname, "name", login, seconds, adminAuthToken, cb);
}

getUserAuthTokenById = function(hostName, id, seconds, adminAuthToken, cb) {
    delegateAuth(hostname, "id", id, seconds, adminAuthToken, cb);
}

delegateAuth = function(hostName, by, val, seconds, adminAuthToken, cb) {
    var adminURL = getAdminURL(hostName);
    var delegateAuthObj = {
        "DelegateAuthRequest":{
            "@":{
                "xmlns":"urn:zimbraAdmin",
                "duration":seconds
            },
            "account":{
                "@":{
                    "by":by
                },
                "#":val
            }
        }
    };
    var req = makeSOAPEnvelope(delegateAuthObj,adminAuthToken,USER_AGENT);
    request({
            method:"POST",
            uri:adminURL,
            headers: {
                "Content-Type": "application/soap+xml; charset=utf-8"
            },
            body: req,
            strictSSL: false,
            jar: true,
            timeout: 10000
        },
        function(err,resp,body) {
            if(err != null) {
                cb(err,null);
            } else {

                processResponse(body, function(result) {
                    if(result.err != null) {
                        cb(result.err,null);
                    } else if(result.payload.Body["DelegateAuthResponse"] != null
                        && result.payload.Body["DelegateAuthResponse"].authToken != null) {
                        cb(null,result.payload.Body["DelegateAuthResponse"].authToken);
                    } else {
                        cb({"message":"Error: could node parse DelegateAuthResponse from Zimbra","resp":resp,"body":body,code:ERR_UNKNOWN}, null);
                    }
                });

            }

        });
}

createDomain = function(hostName, domainName, domainAttrs, adminAuthToken, cb) {
    var adminURL = getAdminURL(hostName);
    var createDomainObj = {"CreateDomainRequest":{name:domainName}};
    createDomainObj.CreateDomainRequest["@"] = {"xmlns": "urn:zimbraAdmin"};
    if(domainAttrs != null && domainAttrs.length > 0) {
        createDomainObj.CreateDomainRequest["a"] = [];
        for(var name in domainAttrs) {
            createDomainObj.CreateDomainRequest.a.push({"@":{"name":name},"#":domainAttrs[name]});
        }
    }
    var req = makeSOAPEnvelope(createDomainObj,adminAuthToken,USER_AGENT);
    request({
            method:"POST",
            uri:adminURL,
            headers: {
                "Content-Type": "application/soap+xml; charset=utf-8"
            },
            body: req,
            strictSSL: false,
            jar: true,
            timeout: 10000
        },
        function(err,resp,body) {
            if(err != null) {
                cb(err,null);
            } else {

                processResponse(body, function(result) {
                    if(result.err != null) {
                        cb(result.err,null);
                    } else if(result.payload.Body.CreateDomainResponse != null &&
                        result.payload.Body.CreateDomainResponse.domain != null &&
                        result.payload.Body.CreateDomainResponse.domain[0] != null) {
                        cb(null,result.payload.Body.CreateDomainResponse.domain[0]);
                    } else {
                        cb({"message":"Error: could node parse CreateDomainResponse from Zimbra","resp":resp,"body":body,code:ERR_UNKNOWN}, null);
                    }
                });

            }

        });
}


getFolder = function(hostName, authToken, rootFolderID, viewConstraint, cb) {
    var soapURL = getUserSoapURL(hostName);
    var getFolderObj = {"GetFolderRequest":{"@":{"xmlns":"urn:zimbraMail", "view":viewConstraint},"folder":{"@":{"l":rootFolderID}}}};
    var req = makeSOAPEnvelope(getFolderObj, authToken, USER_AGENT);
    request({
            method:"POST",
            uri:soapURL,
            headers: {
                "Content-Type": "application/soap+xml; charset=utf-8"
            },
            body: req,
            strictSSL: false,
            jar: false,
            timeout: 10000
        },
        function(err,resp,body) {
            responseCallback(err, resp, body, "GetFolderResponse", cb);
        });
}

parseFolders = function(respBody, cb) {
    var calendars = [];
    if (respBody && respBody.folder && respBody.folder.length > 0 && respBody.folder[0]) {
        if(respBody.folder[0].folder) {
            var subfolders = respBody.folder[0].folder;
            for(var i in subfolders ) {
                calendars.push(subfolders[i]);
                if(subfolders[i].folder) {
                    for(var j in subfolders[i].folder) {
                        calendars.push(subfolders[i].folder[j]);
                    }
                }
            }
        }
        if(respBody.folder[0].link) {
            var subfolders = respBody.folder[0].link;
            for(var i in subfolders ) {
                calendars.push(subfolders[i]);
            }
        }
        cb(null, calendars);
    }
}
getCalendars = function(hostName, authToken, cb) {
    getFolder(hostName, authToken, ID_FOLDER_USER_ROOT, ITEM_TYPE_APPOINTMENT, function(err, resp) {
         if(err != null) {
            cb(err, null);
         } else {
             parseFolders(resp, cb);
         }
     });
}

searchAppointments = function(hostName, authToken, folderID, start, end, limit, cb) {
    var soapURL = getUserSoapURL(hostName);
    var searchReqObj = {"SearchRequest":{"@":{"xmlns":"urn:zimbraMail","types":ITEM_TYPE_APPOINTMENT},"query":"inid:" + folderID}};
    if(start != null) {
        searchReqObj["SearchRequest"]["@"]["calExpandInstStart"] = start;
    }
    if(end != null) {
        searchReqObj["SearchRequest"]["@"]["calExpandInstEnd"] = end;
    }
    searchReqObj["SearchRequest"]["@"]["fetch"] = "all";

    if(typeof (limit) == "function") {
        cb = limit;
        limit = 100;
    } else if(!limit) {
        limit = 100;
    }

    searchReqObj["SearchRequest"]["@"]["limit"] = limit;
    var req = makeSOAPEnvelope(searchReqObj, authToken, USER_AGENT);
    //console.log(req);
    request({
            method:"POST",
            uri:soapURL,
            headers: {
                "Content-Type": "application/soap+xml; charset=utf-8"
            },
            body: req,
            strictSSL: false,
            jar: false,
            timeout: 10000
        },
        function(err,resp,body) {
            responseCallback(err, resp, body, "SearchResponse", cb);
        });
}

getMessage = function(hostName, authToken, messageId, html, ridZ, cb) {
    var soapURL = getUserSoapURL(hostName);
    var getMsgReqObj = {"GetMsgRequest":{"@":{"xmlns":"urn:zimbraMail"},"m":{"id":messageId}}};
    if(typeof (html) == "function") {
        cb = html;
        html = 0;
        ridZ = null;
    } else if(typeof(ridZ) == "function") {
        cb = ridZ;
        ridZ = null;
    }

    if(ridZ) {
        getMsgReqObj.GetMsgRequest.m.ridZ = ridZ;
    }
    if(html) {
        getMsgReqObj.GetMsgRequest.m.html = html;
    }
    var req = makeSOAPEnvelope(getMsgReqObj, authToken, USER_AGENT);
    //console.log(req);
    request({
            method:"POST",
            uri:soapURL,
            headers: {
                "Content-Type": "application/soap+xml; charset=utf-8"
            },
            body: req,
            strictSSL: false,
            jar: false,
            timeout: 10000
        },
        function(err,resp,body) {
            responseCallback(err, resp, body, "GetMsgResponse", cb);
        });
};

function responseCallback(err, resp, body, respName, cb) {
    if(err) {
        cb(err,null);
    } else {
        processResponse(body, function(result) {
            if(result.err) {
                cb(result.err,null);
            } else if(result.payload.Body[respName]) {
                cb(null,result.payload.Body[respName]);
            } else {
                cb({"message":"Error: could node parse response from Zimbra. Expecting " + respName,"resp":resp,"body":body}, null);
            }
        });

    }

}

function processJSONResponse(respJSON, cb) {
    var errcode = ERR_UNKNOWN;
    if (respJSON && respJSON.Body && respJSON.Body.Fault) {
        if(respJSON.Body.Fault.Detail != null && respJSON.Body.Fault.Detail.Error != null &&
            respJSON.Body.Fault.Detail.Error.Code != null) {
            errcode = respJSON.Body.Fault.Detail.Error.Code;
        } else if (respJSON.Body.Fault && respJSON.Body.Fault.Detail && respJSON.Body.Fault.Detail.Error && respJSON.Body.Fault.Detail.Error.Code) {
            errcode = respJSON.Body.Fault.Detail.Error.Code;
        }
        cb({err:{"message":respJSON.Body.Fault.Reason.Text,"body":respJSON,code:errcode}, payload:null});
    } else {
        cb({err:null, payload:respJSON,code:errcode});
    }
}

function processXMLResponse(body, cb) {
    var errcode = ERR_UNKNOWN;
    var parser = require('xml2js');
    parser.parseString(body, {
        tagNameProcessors: [parser.processors.stripPrefix],
        normalize: true,
        explicitArray: false
    }, function (err, result) {
        if (err) {
            cb({
                err: {
                    "message": "Error: could node parse response XML from Zimbra ",
                    "body": body,
                    code: errcode
                }, payload: null
            });
        } else {
            if (result && result.Envelope) {
                processJSONResponse(result.Envelope, cb);
            } else {
                cb({
                    err: {
                        "message": "Error: unexpected response format received from Zimbra ",
                        "body": body,
                        code: errcode
                    }, payload: null
                });
            }
        }
    });
}

function processBadJSONResponse(body, cb) {
    try {
        var jsonic = require('jsonic');
        respJSON = jsonic(body);
        if(respJSON != null) {
            processJSONResponse(respJSON, cb);
        } else {
            console.log("JSONIC parsing failed. Falling back to XML parsing.")
            processXMLResponse(body,cb);
        }
    } catch (ex) {
        console.log("JSONIC threw an exception. Falling back to XML parsing.")
        processXMLResponse(body,cb);
    }
}

function processResponse(body, cb) {
    //console.log(body);
    try {
        var respJSON = JSON.parse(body);
        if(respJSON != null) {
            processJSONResponse(respJSON, cb);
        } else {
            console.log("JSON.parse returned null. Trying to parse bad JSON response");
            processBadJSONResponse(body, cb);
        }
    } catch (ex) {
        console.log("JSON.parse threw an exception. Trying to parse bad JSON response");
        processBadJSONResponse(body, cb);
    }
}

function getAdminURL(hostName) {
    return "https://" + hostName + ":7071/service/admin/soap";
}

function getUserSoapURL(hostName) {
    return "https://" + hostName + "/service/soap";
}

function makeSOAPEnvelope(requestObject, authToken, userAgent, session) {
    var soapReq = {
        "@":{
            "xmlns:soap":"http://www.w3.org/2003/05/soap-envelope"
        },
        "soap:Header":{
            "context":{
                "@":{
                    "xmlns":"urn:zimbra"
                },
                "authToken":authToken,
                "userAgent":{
                    "@":{
                        "name":userAgent
                    }
                },

                "format":{
                    "@":{
                        "xmlns":"",
                        "type":"js"
                    }
                }
            }
        },
        "soap:Body":requestObject
    };
    if(!session) {
        soapReq["soap:Header"].context.nosession = "";
    } else {
        soapReq["soap:Header"].context.session = "";
    }
    return js2xmlparser.parse("soap:Envelope",soapReq);
}

/**
 * All module exports are declared below this line
 */
exports.AUTH_EXPIRED = AUTH_EXPIRED;
exports.ERR_UNKNOWN = ERR_UNKNOWN;
exports.ROOT_FOLDER_ID = ID_FOLDER_USER_ROOT;
exports.CALENDAR_FOLDER_ID = ID_FOLDER_CALENDAR;
exports.adminRequest = adminRequest;
exports.createAccount = createAccount;
exports.getAdminAuthToken = getAdminAuthToken;
exports.createDomain = createDomain;
exports.getUserAuthToken = getUserAuthToken;
exports.getFolder = getFolder;
exports.getCalendars = getCalendars;
exports.searchAppointments = searchAppointments;
exports.getMessage = getMessage;
exports.processResponse = processResponse;
exports.parseFolders = parseFolders;
exports.responseCallback = responseCallback;
