var express =             require('express');
var bodyParser =          require('body-parser');
var FlamebaseDatabase =   require("flamebase-database-node");
var log4js =              require('log4js');

var TAG                 = "SERVER CHAT";
var logger              = log4js.getLogger(TAG);

// JSON instances
var chats = new FlamebaseDatabase("chats", "/chats");
chats.syncFromDatabase();

var contacts = new FlamebaseDatabase("chats", "/contacts");
contacts.syncFromDatabase();

// express
var app = express();
var port = 3003;

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.route('/')
    .get(function (req, res) {
        parseRequest(req, res)
    })
    .post(function (req, res) {
        parseRequest(req, res)
    });

app.listen(port, function () {
    console.log("* chat server started on port " + port);
});

// request parsing
function parseRequest(req, res) {
    var response = res;

    try {
        var message = req.body.message;
        var connection = {};     // connection element

        logger.debug("* user-agent: " + req.headers['user-agent']);


        if (message === undefined || message === null) {
            logger.error("* there vas an error on the connection instance creation: no_params");
            var result = {status: "KO", data: null, error: "missing_params"};
            response.contentType('application/json');
            response.send(JSON.stringify(result));
            return null
        }

        var keys = Object.keys(message); // keys
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            switch (key) {
                case "method":
                    connection[key] = message[key];
                    logger.debug("* method: " + connection[key]);
                    break;

                case "id":
                    connection[key] = message[key];
                    logger.debug("* uid: " + connection[key]);
                    break;

                case "group_id":
                    connection[key] = message[key];
                    logger.debug("* group_id: " + connection[key]);
                    break;

                case "message":
                    connection[key] = message[key];
                    logger.debug("* message: " + connection[key]);
                    break;

                case "name":
                    connection[key] = message[key];
                    logger.debug("* name: " + connection[key]);
                    break;

                case "email":
                    connection[key] = message[key];
                    logger.debug("* email: " + connection[key]);
                    break;

                case "os":
                    connection[key] = message[key];
                    logger.debug("* os: " + connection[key]);

                    break;

                case "token":
                    connection[key] = message[key];
                    logger.debug("* token: " + connection[key]);

                    break;

                default:
                    //
                    break;
            }
        }

        // super important values
        connection.id = new Date().getTime();
        connection.request = req;
        connection.response = response;

        console.log("* connection: " + connection.id);

        switch (connection.method) {
            case "addContact":
                try {
                    addContact(connection);
                } catch (e) {
                    response(connection, null, "error_adding_contact");
                }
                break;

            case "addContactToGroup":
                try {
                    addContactToGroup(connection);
                } catch (e) {
                    response(connection, null, "error_adding_contact_to_group");
                }
                break;

            case "createGroup":
                try {
                    createGroup(connection);
                } catch (e) {
                    response(connection, null, "error_creating_group");
                }
                break;


            case "addMessage":
                try {
                    addMessage(connection);
                } catch (e) {
                    response(connection, null, "error_adding_message");
                }
                break;

            default:
                //
                break;

        }

    } catch (e) {
        logger.error("* there was an error on parse request: " + e.toString());
        var result = {status: "KO", data: null, error: "missing_params"};
        res.contentType('application/json');
        res.send(JSON.stringify(result));
    }
}

/**
 * adds new contact
 * @param connection
 */
function addContact(connection) {
    var contact = {};
    contact.token = connection.token;
    contact.os = connection.os;
    contact.name = connection.name;
    contacts.ref[connection.email] = contact;
    contacts.syncToDatabase();
    response(connection, "contact_added", null);
}

/**
 * adds new contact to group
 * @param connection
 */
function addContactToGroup(connection) {
    chats.ref[connection.group_id].members.push(connection.email);
    chats.syncToDatabase();
    response(connection, "contact_added_to_group", null);
}


/**
 * creates new group
 * @param connection
 */
function createGroup(connection) {
    var group = {};
    group.members = [];
    group.members.push(connection.email);
    group.messages = {};
    chats.ref[connection.group_id] = group;
    chats.syncToDatabase();
    response(connection, "group_created", null);
}

/**
 * adds new message
 * @param connection
 */
function addMessage(connection) {
    var message = {};
    message.author = connection.email;
    message.text = connection.message;

    var messageId = new Date().getTime().toString();

    chats.ref[connection.group_id].messages[messageId] = message;
    chats.syncToDatabase();
    response(connection, "message_added", null);
}


function response(connection, data, error) {
    var result = {status: (data === null || error !== null ? "KO" : "OK"), data: data, error: error};
    connection.response.contentType('application/json');
    connection.response.send(JSON.stringify(result));
}