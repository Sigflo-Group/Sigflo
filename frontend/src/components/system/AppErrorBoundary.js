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
exports.AppErrorBoundary = void 0;
var react_1 = require("react");
var AppErrorBoundary = /** @class */ (function (_super) {
    __extends(AppErrorBoundary, _super);
    function AppErrorBoundary() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = { hasError: false };
        return _this;
    }
    AppErrorBoundary.getDerivedStateFromError = function () {
        return { hasError: true };
    };
    AppErrorBoundary.prototype.componentDidCatch = function (error) {
        // eslint-disable-next-line no-console
        console.error('[app-error-boundary]', error);
    };
    AppErrorBoundary.prototype.render = function () {
        if (this.state.hasError) {
            return (<div className="flex min-h-screen items-center justify-center bg-[#050505] p-6 text-center">
          <div className="max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-white">Something went wrong</h2>
            <p className="mt-2 text-sm text-zinc-400">Please refresh and try again.</p>
          </div>
        </div>);
        }
        return this.props.children;
    };
    return AppErrorBoundary;
}(react_1.default.Component));
exports.AppErrorBoundary = AppErrorBoundary;
exports.default = AppErrorBoundary;
