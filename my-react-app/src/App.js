import React from 'react';
import { SuperTokensProvider, getSuperTokensRoutesForReactRouterDom } from 'supertokens-auth-react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

function App() {
    const { wrapper: SuperTokensWrapper, routes } = getSuperTokensRoutesForReactRouterDom();

    return (
        <SuperTokensProvider>
            <Router>
                <Switch>
                    {routes.map((route, i) => (
                        <Route key={i} path={route.path}>
                            <SuperTokensWrapper>
                                <route.component />
                            </SuperTokensWrapper>
                        </Route>
                    ))}
                </Switch>
            </Router>
        </SuperTokensProvider>
    );
}

export default App;

