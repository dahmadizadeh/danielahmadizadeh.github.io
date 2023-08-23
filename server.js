const { default: SuperTokens, middleware, getSuperTokensAuth } = require("supertokens-node");
const express = require("express");

SuperTokens.init({
    appInfo: {
        appName: "calm-bayou-95036",
        apiDomain: "https://calm-bayou-95036.herokuapp.com",
        websiteDomain: "https://calm-bayou-95036.herokuapp.com",
    },
    supertokens: {
        connectionURI: "https://try.supertokens.io",
    },
    session: {
        cookieSecure: false
    }
});

const app = express();

// Use SuperTokens middleware
app.use(middleware());

// Your original express routes
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

