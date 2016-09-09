/**
 * Created by gsolovyev on 9/9/16.
 */
var assert = require('assert');
describe('zimbra', function() {
    describe('#processResponse()', function() {
        it('should error object with error code service.AUTH_EXPIRED', function() {
            var soapXml = "<soap:Envelope xmlns:soap=\"http://www.w3.org/2003/05/soap-envelope\"><soap:Body><soap:Fault><soap:Code><soap:Value>soap:Sender</soap:Value></soap:Code><soap:Reason><soap:Text>auth credentials have expired</soap:Text></soap:Reason><soap:Detail><Error xmlns=\"urn:zimbra\"><Code>service.AUTH_EXPIRED</Code><Trace>qtp509886383-581407:https://204.14.158.50:443/service/soap:1473443427011:3f9bfed7c7ea230f:SoapEngine266</Trace></Error></soap:Detail></soap:Fault></soap:Body></soap:Envelope>";
            zimbra = require("../index.js");
            zimbra.processResponse(soapXml,
                function(response) {
                    assert.equal(zimbra.AUTH_EXPIRED, response.err.code);
                });

        });
    });
});