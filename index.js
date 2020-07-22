const bodyParser = require("body-parser");
const dotenv = require("dotenv")
const express = require("express");
const fs = require("fs");
const passport = require("passport");
const path = require("path");
const saml = require("passport-saml");
const session = require("express-session")

const SSO_DEMO_PAGE = "sso-demo.html"

const app = express();

dotenv.config()

const samlStrategy = new saml.Strategy(
    {
        callbackUrl: process.env.PUBLIC_HOST + "/login/callback",
        entryPoint: process.env.ENTRY_POINT,
        issuer: 'wc-ao-sso-demo',
        identifierFormat: undefined,
        cert: process.env.WELLESLEY_KEY,
        decryptionPvk: process.env.PVK,
        privateCert: process.env.PVK,
        validateInResponseTo: false,
        disableRequestedAuthnContext: true
    }, 
    function (profile, done) {
        return done(null, profile);
    }
);

passport.serializeUser(
    function (user, done) {
        console.log("Serializing user:");
        console.log(user);
        done(null, user);
    }
);

passport.deserializeUser(
    function (user, done) {
        console.log('Deserializing user:');
        console.log(user);
        done(null, user);
    }
);

passport.use('samlStrategy', samlStrategy);
    
// Express Instance Setup
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(
    session(
        {
            secret: 'secret',
            resave: false,
            saveUninitialized: true
        })
);

app.use(passport.initialize({}));


// RESTful API
app.get("/", 
    function (req, res) {
        res.sendFile(SSO_DEMO_PAGE, { root: path.join("src") });
    }
);

app.get("/metadata", function (req, res) {
    res.type("application/xml");
    res.status(200).send(
      samlStrategy.generateServiceProviderMetadata(
          process.env.PUBLIC_KEY, process.env.PUBLIC_KEY));
});

app.post('/login/callback',
    function (req, res, next) {
        console.log("Starting login callback...");
        next();
    },
    passport.authenticate("samlStrategy"),
    function (req, res) {
        console.log("Log in user info:");
        console.log(req.user);
        res.send("Logged in successfully!");
    }
);


// Server Setup
const server = app.listen(3000, 
    function () {
        console.log('Listening on port %d', server.address().port);
    }
);
