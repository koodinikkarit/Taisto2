import React from "react";
import { createRoot } from "react-dom/client";
import { ApolloProvider } from "@apollo/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";

import store from "./store";
import client from "./client";
import Routes from "./routes";
import AppNavigation from "./components/AppNavigation";
import { I18nProvider } from "./i18n";

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <ApolloProvider client={client}>
      <I18nProvider><BrowserRouter><AppNavigation /><Routes /></BrowserRouter></I18nProvider>
    </ApolloProvider>
  </Provider>
);
