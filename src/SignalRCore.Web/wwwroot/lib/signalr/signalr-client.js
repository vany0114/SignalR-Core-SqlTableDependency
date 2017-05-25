(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.signalR = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./Transports", "./HttpClient"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Transports_1 = require("./Transports");
    const HttpClient_1 = require("./HttpClient");
    var ConnectionState;
    (function (ConnectionState) {
        ConnectionState[ConnectionState["Initial"] = 0] = "Initial";
        ConnectionState[ConnectionState["Connecting"] = 1] = "Connecting";
        ConnectionState[ConnectionState["Connected"] = 2] = "Connected";
        ConnectionState[ConnectionState["Disconnected"] = 3] = "Disconnected";
    })(ConnectionState || (ConnectionState = {}));
    class Connection {
        constructor(url, queryString = "", options = {}) {
            this.url = url;
            this.queryString = queryString || "";
            this.httpClient = options.httpClient || new HttpClient_1.HttpClient();
            this.connectionState = ConnectionState.Initial;
        }
        start(transport = Transports_1.TransportType.WebSockets) {
            return __awaiter(this, void 0, void 0, function* () {
                if (this.connectionState != ConnectionState.Initial) {
                    return Promise.reject(new Error("Cannot start a connection that is not in the 'Initial' state."));
                }
                this.connectionState = ConnectionState.Connecting;
                this.startPromise = this.startInternal(transport);
                return this.startPromise;
            });
        }
        startInternal(transportType) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    this.connectionId = yield this.httpClient.get(`${this.url}/negotiate?${this.queryString}`);
                    // the user tries to stop the the connection when it is being started
                    if (this.connectionState == ConnectionState.Disconnected) {
                        return;
                    }
                    if (this.queryString) {
                        this.queryString += "&";
                    }
                    this.queryString += `id=${this.connectionId}`;
                    this.transport = this.createTransport(transportType);
                    this.transport.onDataReceived = this.onDataReceived;
                    this.transport.onClosed = e => this.stopConnection(true, e);
                    yield this.transport.connect(this.url, this.queryString);
                    // only change the state if we were connecting to not overwrite
                    // the state if the connection is already marked as Disconnected
                    this.changeState(ConnectionState.Connecting, ConnectionState.Connected);
                }
                catch (e) {
                    console.log("Failed to start the connection. " + e);
                    this.connectionState = ConnectionState.Disconnected;
                    this.transport = null;
                    throw e;
                }
                ;
            });
        }
        createTransport(transport) {
            if (transport === Transports_1.TransportType.WebSockets) {
                return new Transports_1.WebSocketTransport();
            }
            if (transport === Transports_1.TransportType.ServerSentEvents) {
                return new Transports_1.ServerSentEventsTransport(this.httpClient);
            }
            if (transport === Transports_1.TransportType.LongPolling) {
                return new Transports_1.LongPollingTransport(this.httpClient);
            }
            if (this.isITransport(transport)) {
                return transport;
            }
            throw new Error("No valid transports requested.");
        }
        isITransport(transport) {
            return "connect" in transport;
        }
        changeState(from, to) {
            if (this.connectionState == from) {
                this.connectionState = to;
                return true;
            }
            return false;
        }
        send(data) {
            if (this.connectionState != ConnectionState.Connected) {
                throw new Error("Cannot send data if the connection is not in the 'Connected' State");
            }
            return this.transport.send(data);
        }
        stop() {
            return __awaiter(this, void 0, void 0, function* () {
                let previousState = this.connectionState;
                this.connectionState = ConnectionState.Disconnected;
                try {
                    yield this.startPromise;
                }
                catch (e) {
                    // this exception is returned to the user as a rejected Promise from the start method
                }
                this.stopConnection(/*raiseClosed*/ previousState == ConnectionState.Connected);
            });
        }
        stopConnection(raiseClosed, error) {
            if (this.transport) {
                this.transport.stop();
                this.transport = null;
            }
            this.connectionState = ConnectionState.Disconnected;
            if (raiseClosed && this.onClosed) {
                this.onClosed(error);
            }
        }
    }
    exports.Connection = Connection;
});

},{"./HttpClient":3,"./Transports":6}],2:[function(require,module,exports){
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./Message"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Message_1 = require("./Message");
    let knownTypes = {
        "T": Message_1.MessageType.Text,
        "B": Message_1.MessageType.Binary,
        "C": Message_1.MessageType.Close,
        "E": Message_1.MessageType.Error
    };
    function splitAt(input, searchString, position) {
        let index = input.indexOf(searchString, position);
        if (index < 0) {
            return [input.substr(position), input.length];
        }
        let left = input.substring(position, index);
        return [left, index + searchString.length];
    }
    var ServerSentEventsFormat;
    (function (ServerSentEventsFormat) {
        function parse(input) {
            // The SSE protocol is pretty simple. We just look at the first line for the type, and then process the remainder.
            // Binary messages require Base64-decoding and ArrayBuffer support, just like in the other formats below
            if (input.length == 0) {
                throw new Error("Message is missing header");
            }
            let [header, offset] = splitAt(input, "\n", 0);
            let payload = input.substring(offset);
            // Just in case the header used CRLF as the line separator, carve it off
            if (header.endsWith('\r')) {
                header = header.substr(0, header.length - 1);
            }
            // Parse the header
            var messageType = knownTypes[header];
            if (messageType === undefined) {
                throw new Error(`Unknown type value: '${header}'`);
            }
            if (messageType == Message_1.MessageType.Binary) {
                // We need to decode and put in an ArrayBuffer. Throw for now
                // This will require our own Base64-decoder because the browser
                // built-in one only decodes to strings and throws if invalid UTF-8
                // characters are found.
                throw new Error("TODO: Support for binary messages");
            }
            // Create the message
            return new Message_1.Message(messageType, payload);
        }
        ServerSentEventsFormat.parse = parse;
    })(ServerSentEventsFormat = exports.ServerSentEventsFormat || (exports.ServerSentEventsFormat = {}));
    var TextMessageFormat;
    (function (TextMessageFormat) {
        const InvalidPayloadError = new Error("Invalid text message payload");
        const LengthRegex = /^[0-9]+$/;
        function hasSpace(input, offset, length) {
            let requiredLength = offset + length;
            return input.length >= requiredLength;
        }
        function parseMessage(input, position) {
            var offset = position;
            // Read the length
            var [lenStr, offset] = splitAt(input, ":", offset);
            // parseInt is too leniant, we need a strict check to see if the string is an int
            if (!LengthRegex.test(lenStr)) {
                throw new Error(`Invalid length: '${lenStr}'`);
            }
            let length = Number.parseInt(lenStr);
            // Required space is: 3 (type flag, ":", ";") + length (payload len)
            if (!hasSpace(input, offset, 3 + length)) {
                throw new Error("Message is incomplete");
            }
            // Read the type
            var [typeStr, offset] = splitAt(input, ":", offset);
            // Parse the type
            var messageType = knownTypes[typeStr];
            if (messageType === undefined) {
                throw new Error(`Unknown type value: '${typeStr}'`);
            }
            // Read the payload
            var payload = input.substr(offset, length);
            offset += length;
            // Verify the final trailing character
            if (input[offset] != ';') {
                throw new Error("Message missing trailer character");
            }
            offset += 1;
            if (messageType == Message_1.MessageType.Binary) {
                // We need to decode and put in an ArrayBuffer. Throw for now
                // This will require our own Base64-decoder because the browser
                // built-in one only decodes to strings and throws if invalid UTF-8
                // characters are found.
                throw new Error("TODO: Support for binary messages");
            }
            return [offset, new Message_1.Message(messageType, payload)];
        }
        function parse(input) {
            if (input.length == 0) {
                return [];
            }
            if (input[0] != 'T') {
                throw new Error(`Unsupported message format: '${input[0]}'`);
            }
            let messages = [];
            var offset = 1;
            while (offset < input.length) {
                let message;
                [offset, message] = parseMessage(input, offset);
                messages.push(message);
            }
            return messages;
        }
        TextMessageFormat.parse = parse;
    })(TextMessageFormat = exports.TextMessageFormat || (exports.TextMessageFormat = {}));
});

},{"./Message":5}],3:[function(require,module,exports){
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class HttpClient {
        get(url, headers) {
            return this.xhr("GET", url, headers);
        }
        post(url, content, headers) {
            return this.xhr("POST", url, headers, content);
        }
        xhr(method, url, headers, content) {
            return new Promise((resolve, reject) => {
                let xhr = new XMLHttpRequest();
                xhr.open(method, url, true);
                if (headers) {
                    headers.forEach((value, header) => xhr.setRequestHeader(header, value));
                }
                xhr.send(content);
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(xhr.response);
                    }
                    else {
                        reject({
                            status: xhr.status,
                            statusText: xhr.statusText
                        });
                    }
                };
                xhr.onerror = () => {
                    reject({
                        status: xhr.status,
                        statusText: xhr.statusText
                    });
                };
            });
        }
    }
    exports.HttpClient = HttpClient;
});

},{}],4:[function(require,module,exports){
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./Connection", "./Connection", "./Transports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Connection_1 = require("./Connection");
    var Connection_2 = require("./Connection");
    exports.Connection = Connection_2.Connection;
    var Transports_1 = require("./Transports");
    exports.TransportType = Transports_1.TransportType;
    class HubConnection {
        static create(url, queryString) {
            return new this(new Connection_1.Connection(url, queryString));
        }
        constructor(connectionOrUrl, queryString) {
            this.connection = typeof connectionOrUrl === "string" ? new Connection_1.Connection(connectionOrUrl, queryString) : connectionOrUrl;
            this.connection.onDataReceived = data => {
                this.onDataReceived(data);
            };
            this.connection.onClosed = (error) => {
                this.onConnectionClosed(error);
            };
            this.callbacks = new Map();
            this.methods = new Map();
            this.id = 0;
        }
        onDataReceived(data) {
            // TODO: separate JSON parsing
            // Can happen if a poll request was cancelled
            if (!data) {
                return;
            }
            var message = JSON.parse(data);
            switch (message.type) {
                case 1 /* Invocation */:
                    this.InvokeClientMethod(message);
                    break;
                case 2 /* Result */:
                // TODO: Streaming (MessageType.Result) currently not supported - callback will throw
                case 3 /* Completion */:
                    let callback = this.callbacks.get(message.invocationId);
                    if (callback != null) {
                        callback(message);
                        this.callbacks.delete(message.invocationId);
                    }
                    break;
                default:
                    console.log("Invalid message type: " + data);
                    break;
            }
        }
        InvokeClientMethod(invocationMessage) {
            let method = this.methods.get(invocationMessage.target);
            if (method) {
                method.apply(this, invocationMessage.arguments);
                if (!invocationMessage.nonblocking) {
                    // TODO: send result back to the server?
                }
            }
            else {
                console.log(`No client method with the name '${invocationMessage.target}' found.`);
            }
        }
        onConnectionClosed(error) {
            let errorCompletionMessage = {
                type: 3 /* Completion */,
                invocationId: "-1",
                error: error ? error.message : "Invocation cancelled due to connection being closed.",
            };
            this.callbacks.forEach(callback => {
                callback(errorCompletionMessage);
            });
            this.callbacks.clear();
            if (this.connectionClosedCallback) {
                this.connectionClosedCallback(error);
            }
        }
        start(transportType) {
            return this.connection.start(transportType);
        }
        stop() {
            return this.connection.stop();
        }
        invoke(methodName, ...args) {
            let id = this.id;
            this.id++;
            let invocationDescriptor = {
                type: 1 /* Invocation */,
                invocationId: id.toString(),
                target: methodName,
                arguments: args,
                nonblocking: false
            };
            let p = new Promise((resolve, reject) => {
                this.callbacks.set(invocationDescriptor.invocationId, (invocationEvent) => {
                    if (invocationEvent.type === 3 /* Completion */) {
                        let completionMessage = invocationEvent;
                        if (completionMessage.error) {
                            reject(new Error(completionMessage.error));
                        }
                        else {
                            resolve(completionMessage.result);
                        }
                    }
                    else {
                        reject(new Error("Streaming is not supported."));
                    }
                });
                //TODO: separate conversion to enable different data formats
                this.connection.send(JSON.stringify(invocationDescriptor))
                    .catch(e => {
                    reject(e);
                    this.callbacks.delete(invocationDescriptor.invocationId);
                });
            });
            return p;
        }
        on(methodName, method) {
            this.methods.set(methodName, method);
        }
        set onClosed(callback) {
            this.connectionClosedCallback = callback;
        }
    }
    exports.HubConnection = HubConnection;
});

},{"./Connection":1,"./Transports":6}],5:[function(require,module,exports){
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var MessageType;
    (function (MessageType) {
        MessageType[MessageType["Text"] = 0] = "Text";
        MessageType[MessageType["Binary"] = 1] = "Binary";
        MessageType[MessageType["Close"] = 2] = "Close";
        MessageType[MessageType["Error"] = 3] = "Error";
    })(MessageType = exports.MessageType || (exports.MessageType = {}));
    class Message {
        constructor(type, content) {
            this.type = type;
            this.content = content;
        }
    }
    exports.Message = Message;
});

},{}],6:[function(require,module,exports){
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./Formatters"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Formatters = require("./Formatters");
    var TransportType;
    (function (TransportType) {
        TransportType[TransportType["WebSockets"] = 0] = "WebSockets";
        TransportType[TransportType["ServerSentEvents"] = 1] = "ServerSentEvents";
        TransportType[TransportType["LongPolling"] = 2] = "LongPolling";
    })(TransportType = exports.TransportType || (exports.TransportType = {}));
    class WebSocketTransport {
        connect(url, queryString = "") {
            return new Promise((resolve, reject) => {
                url = url.replace(/^http/, "ws");
                let connectUrl = url + "/ws?" + queryString;
                let webSocket = new WebSocket(connectUrl);
                webSocket.onopen = (event) => {
                    console.log(`WebSocket connected to ${connectUrl}`);
                    this.webSocket = webSocket;
                    resolve();
                };
                webSocket.onerror = (event) => {
                    reject();
                };
                webSocket.onmessage = (message) => {
                    console.log(`(WebSockets transport) data received: ${message.data}`);
                    if (this.onDataReceived) {
                        this.onDataReceived(message.data);
                    }
                };
                webSocket.onclose = (event) => {
                    // webSocket will be null if the transport did not start successfully
                    if (this.onClosed && this.webSocket) {
                        if (event.wasClean === false || event.code !== 1000) {
                            this.onClosed(new Error(`Websocket closed with status code: ${event.code} (${event.reason})`));
                        }
                        else {
                            this.onClosed();
                        }
                    }
                };
            });
        }
        send(data) {
            if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
                this.webSocket.send(data);
                return Promise.resolve();
            }
            return Promise.reject("WebSocket is not in the OPEN state");
        }
        stop() {
            if (this.webSocket) {
                this.webSocket.close();
                this.webSocket = null;
            }
        }
    }
    exports.WebSocketTransport = WebSocketTransport;
    class ServerSentEventsTransport {
        constructor(httpClient) {
            this.httpClient = httpClient;
        }
        connect(url, queryString) {
            if (typeof (EventSource) === "undefined") {
                Promise.reject("EventSource not supported by the browser.");
            }
            this.queryString = queryString;
            this.url = url;
            let tmp = `${this.url}/sse?${this.queryString}`;
            return new Promise((resolve, reject) => {
                let eventSource = new EventSource(`${this.url}/sse?${this.queryString}`);
                try {
                    eventSource.onmessage = (e) => {
                        if (this.onDataReceived) {
                            // Parse the message
                            let message;
                            try {
                                message = Formatters.ServerSentEventsFormat.parse(e.data);
                            }
                            catch (error) {
                                if (this.onClosed) {
                                    this.onClosed(error);
                                }
                                return;
                            }
                            // TODO: pass the whole message object along
                            this.onDataReceived(message.content);
                        }
                    };
                    eventSource.onerror = (e) => {
                        reject();
                        // don't report an error if the transport did not start successfully
                        if (this.eventSource && this.onClosed) {
                            this.onClosed(new Error(e.message));
                        }
                    };
                    eventSource.onopen = () => {
                        this.eventSource = eventSource;
                        resolve();
                    };
                }
                catch (e) {
                    return Promise.reject(e);
                }
            });
        }
        send(data) {
            return __awaiter(this, void 0, void 0, function* () {
                return send(this.httpClient, `${this.url}/send?${this.queryString}`, data);
            });
        }
        stop() {
            if (this.eventSource) {
                this.eventSource.close();
                this.eventSource = null;
            }
        }
    }
    exports.ServerSentEventsTransport = ServerSentEventsTransport;
    class LongPollingTransport {
        constructor(httpClient) {
            this.httpClient = httpClient;
        }
        connect(url, queryString) {
            this.url = url;
            this.queryString = queryString;
            this.shouldPoll = true;
            this.poll(url + "/poll?" + this.queryString);
            return Promise.resolve();
        }
        poll(url) {
            if (!this.shouldPoll) {
                return;
            }
            let pollXhr = new XMLHttpRequest();
            pollXhr.onload = () => {
                if (pollXhr.status == 200) {
                    if (this.onDataReceived) {
                        // Parse the messages
                        let messages;
                        try {
                            messages = Formatters.TextMessageFormat.parse(pollXhr.response);
                        }
                        catch (error) {
                            if (this.onClosed) {
                                this.onClosed(error);
                            }
                            return;
                        }
                        messages.forEach((message) => {
                            // TODO: pass the whole message object along
                            this.onDataReceived(message.content);
                        });
                    }
                    this.poll(url);
                }
                else if (this.pollXhr.status == 204) {
                    if (this.onClosed) {
                        this.onClosed();
                    }
                }
                else {
                    if (this.onClosed) {
                        this.onClosed(new Error(`Status: ${pollXhr.status}, Message: ${pollXhr.responseText}`));
                    }
                }
            };
            pollXhr.onerror = () => {
                if (this.onClosed) {
                    // network related error or denied cross domain request
                    this.onClosed(new Error("Sending HTTP request failed."));
                }
            };
            pollXhr.ontimeout = () => {
                this.poll(url);
            };
            this.pollXhr = pollXhr;
            this.pollXhr.open("GET", url, true);
            // TODO: consider making timeout configurable
            this.pollXhr.timeout = 110000;
            this.pollXhr.send();
        }
        send(data) {
            return __awaiter(this, void 0, void 0, function* () {
                return send(this.httpClient, `${this.url}/send?${this.queryString}`, data);
            });
        }
        stop() {
            this.shouldPoll = false;
            if (this.pollXhr) {
                this.pollXhr.abort();
                this.pollXhr = null;
            }
        }
    }
    exports.LongPollingTransport = LongPollingTransport;
    const headers = new Map();
    headers.set("Content-Type", "application/vnd.microsoft.aspnetcore.endpoint-messages.v1+text");
    function send(httpClient, url, data) {
        return __awaiter(this, void 0, void 0, function* () {
            let message = `T${data.length.toString()}:T:${data};`;
            yield httpClient.post(url, message, headers);
        });
    }
});

},{"./Formatters":2}]},{},[4])(4)
});