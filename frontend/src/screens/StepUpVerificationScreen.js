"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StepUpVerificationScreen;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var session_1 = require("@/lib/api/session");
var useSession_1 = require("@/hooks/useSession");
function StepUpVerificationScreen() {
    var searchParams = (0, react_router_dom_1.useSearchParams)()[0];
    var navigate = (0, react_router_dom_1.useNavigate)();
    var refreshSecurityState = (0, useSession_1.useSession)().refreshSecurityState;
    var _a = (0, react_1.useState)(false), pending = _a[0], setPending = _a[1];
    var _b = (0, react_1.useState)(null), error = _b[0], setError = _b[1];
    var redirectTarget = searchParams.get('redirect') || '/settings/security';
    function onVerify() {
        return __awaiter(this, void 0, void 0, function () {
            var e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setPending(true);
                        setError(null);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, (0, session_1.performStepUpCheck)()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, refreshSecurityState()];
                    case 3:
                        _a.sent();
                        navigate(redirectTarget, { replace: true });
                        return [3 /*break*/, 6];
                    case 4:
                        e_1 = _a.sent();
                        setError(e_1 instanceof Error ? e_1.message : 'Step-up verification failed.');
                        return [3 /*break*/, 6];
                    case 5:
                        setPending(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    return (<div className="mx-auto mt-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <h1 className="text-lg font-semibold text-white">Step-up verification required</h1>
      <p className="mt-2 text-sm text-zinc-300">
        This action is security-sensitive. Verify your session to continue.
      </p>
      {error ? <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-200">{error}</p> : null}
      <div className="mt-4 flex items-center gap-2">
        <button type="button" onClick={function () { return void onVerify(); }} disabled={pending} className="rounded-lg border border-sigflo-accent/40 bg-sigflo-accent/10 px-3 py-2 text-sm font-semibold text-sigflo-accent disabled:opacity-60">
          {pending ? 'Verifying...' : 'Verify and continue'}
        </button>
        <button type="button" onClick={function () { return navigate('/profile'); }} disabled={pending} className="rounded-lg border border-white/15 bg-white/[0.03] px-3 py-2 text-sm text-zinc-300 disabled:opacity-60">
          Cancel
        </button>
      </div>
    </div>);
}
