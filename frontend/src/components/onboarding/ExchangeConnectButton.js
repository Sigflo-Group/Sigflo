"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeConnectButton = ExchangeConnectButton;
var framer_motion_1 = require("framer-motion");
function ChevronRightIcon(_a) {
    var className = _a.className;
    return (<svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>);
}
function ExchangeConnectButton(_a) {
    var provider = _a.provider, badge = _a.badge, label = _a.label, onPress = _a.onPress, _b = _a.disabled, disabled = _b === void 0 ? false : _b, _c = _a.motionIndex, motionIndex = _c === void 0 ? 0 : _c;
    return (<framer_motion_1.motion.button type="button" disabled={disabled} data-provider={provider} onClick={onPress} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05 * motionIndex, ease: [0.22, 1, 0.36, 1] }} className="flex h-14 w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.045] px-4 transition-all duration-200 hover:bg-white/[0.07] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50">
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/[0.08] text-[10px] font-semibold text-zinc-200" aria-hidden>
          {badge}
        </span>
        <span className="truncate text-left text-sm font-medium text-zinc-100">{label}</span>
      </span>
      <ChevronRightIcon className="shrink-0 text-zinc-500"/>
    </framer_motion_1.motion.button>);
}
