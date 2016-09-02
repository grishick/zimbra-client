#  zimbra-client #
## Overview ##
zimbra-client is a Node.js module that implements a SOAP client for Zimbra SOAP API

## Features ##
So far this module supports 5 methods
* `getAdminAuthToken`
* `createAccount`
* `adminRequest`
* `createDomain`
* `getUserAuthToken`
* `getFolder`
* `getCalendars`
* `searchAppointments`

## Usage ##
Following example demonstrates creating a new Zimbra account using zimbra-client. In this example, the code assumes Zimbra is running on localhost, admin username is "admin" and admin password is "test123"

### Example 1: Creating a new account ###

    zimbra = require("zimbra-client");
    zimbra.getAuthToken("localhost", "admin", "test123",
        function(err, authToken) {
            if(err != null) {
                console.log(err.message);
            }
            zimbra.createAccount("localhost",{sn:"Solovyev",givenName:"Greg",displayName:"Greg Solovyev",password:"test123",name:"greg4@gregs-mbp.local"},authToken,
                function(err1,accountObj) {
                    if(err1 != null) {
                        if(err1.code == "account.ACCOUNT_EXISTS") {
                            console.log("an account with this name already exists");
                        } else {
                            console.log(err1.message);
                        }
                    } else {
                        console.log("new account ID" + accountObj.id);
                    }
                }
            );
        })

### Example 2: Creating a domain ###
    zimbra = require("zimbra-client");
    zimbra.getAuthToken("localhost", "admin", "test123",
        function(err, authToken) {
            if(err != null) {
                console.log(err.message);
            } else {
                zimbra.createDomain("localhost", "gregs-mbp2.local", {description:"test domain"}, authToken,
                    function (err1, respObj) {
                        if (err1 != null) {
                            if (err1.code == "account.DOMAIN_EXISTS") {
                                console.log("Domain with this name already exists");
                            } else {
                                console.log(err1.message);
                            }
                        } else {
                            console.log("response object: " + JSON.stringify(respObj));
                        }
                    });
            }
        });

### Example 3: Sending a custom admin SOAP request ###
    zimbra = require("zimbra-client");
    zimbra.getAuthToken("localhost", "admin", "test123",
        function(err, authToken) {
            if(err != null) {
                console.log(err.message);
            } else {
            zimbra.adminRequest("localhost", "GetAllAdminAccountsRequest", {}, authToken,
                function (err1, respObj) {
                    if(err1 != null) {
                        console.log(err1.message);
                    } else {
                        console.log("response object: " + JSON.stringify(respObj));
                    }
                });
           }
        });
        
### Example 4: Chain domain and account creation ###
    var ZIMBRA_HOST = "localhost";
    var ADMIN_LOGIN = "admin";
    var ADMIN_PWD = "test123";
    var domain = "testdomain.com";
    var userEmail = "user1@testdomain.com";
    zimbra = require("zimbra-client");
    //get an authtoken
    zimbra.getAuthToken(ZIMBRA_HOST, ADMIN_LOGIN, ADMIN_PWD,
    function(err, authToken) {
        if(err != null) {
            console.log(err.message);
        } else {
            //create a damain using authtoken passed on by getAuthToken
            zimbra.createDomain(ZIMBRA_HOST, domain, {description:"test domain"}, authToken,
                function (err1, respObj) {
                    if (err1 != null) {
                        if (err1.code == "account.DOMAIN_EXISTS") {
                            console.log("Domain with this name already exists");
                        } else {
                            console.log(err1.message);
                        }
                    } else {
                        console.log("Created domain: " + respObj.name);
                        //create an account using the same authtoken passed on buy getAuthToken
                        createAccount(ZIMBRA_HOST,{sn:"Solovyev",givenName:"Greg",displayName:"Greg Solovyev",password:"test123",name:userEmail},authToken,
                            function(err1,accountObj) {
                                if(err1 != null) {
                                    if(err1.code == "account.ACCOUNT_EXISTS") {
                                        console.log("an account with this name already exists");
                                    } else
                                    {
                                        console.log(err1.message);
                                    }
                                } else {
                                    console.log("new account ID" + accountObj.id);
                                }
                            }
                        );
                    }
                });
        }
    });
    
## License ##
zimbra-client is licensed under Apache 2. See LICENSE.txt

