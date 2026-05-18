"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorBoundary = void 0;
var react_1 = require("react");
var appRoutes_1 = require("@/config/appRoutes");
var ErrorBoundary = /** @class */ (function (_super) {
    __extends(ErrorBoundary, _super);
    function ErrorBoundary() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = { error: null };
        return _this;
    }
    ErrorBoundary.getDerivedStateFromError = function (error) {
        return { error: error };
    };
    ErrorBoundary.prototype.componentDidCatch = function (error, info) {
        console.error('[Sigflo]', error, info.componentStack);
    };
    ErrorBoundary.prototype.render = function () {
        if (this.state.error) {
            return (<div className="flex min-h-[100dvh] flex-col items-center justify-center bg-sigflo-bg px-6 py-10 text-center text-sigflo-text">
          <p className="text-sm font-semibold text-white">Something went wrong</p>
          <pre className="mt-4 max-w-lg whitespace-pre-wrap break-words text-left text-xs text-rose-200/90">
            {this.state.error.message}
          </pre>
          <button type="button" onClick={function () { return window.location.assign((0, appRoutes_1.feedBrowserPath)()); }} className="mt-8 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 text-sm font-bold text-sigflo-bg">
            Back to feed
          </button>
        </div>);
        }
        return this.props.children;
    };
    return ErrorBoundary;
}(react_1.Component));
exports.ErrorBoundary = ErrorBoundary;
