"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var client_1 = require("react-dom/client");
var react_router_dom_1 = require("react-router-dom");
var AuthContext_1 = require("@/context/AuthContext");
var TradingControlModeContext_1 = require("@/context/TradingControlModeContext");
var AuthProvider_1 = require("@/providers/AuthProvider");
var SessionProvider_1 = require("@/providers/SessionProvider");
var AppErrorBoundary_1 = require("@/components/system/AppErrorBoundary");
var App_1 = require("./App");
require("./index.css");
(0, client_1.createRoot)(document.getElementById('root')).render(<react_1.StrictMode>
    <react_router_dom_1.BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppErrorBoundary_1.AppErrorBoundary>
        <AuthProvider_1.AuthProvider>
          <SessionProvider_1.SessionProvider>
            <AuthContext_1.AuthProvider>
              <TradingControlModeContext_1.TradingControlModeProvider>
                <App_1.default />
              </TradingControlModeContext_1.TradingControlModeProvider>
            </AuthContext_1.AuthProvider>
          </SessionProvider_1.SessionProvider>
        </AuthProvider_1.AuthProvider>
      </AppErrorBoundary_1.AppErrorBoundary>
    </react_router_dom_1.BrowserRouter>
  </react_1.StrictMode>);
