"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaceholderScreen = PlaceholderScreen;
var Card_1 = require("@/components/ui/Card");
function PlaceholderScreen(_a) {
    var title = _a.title, subtitle = _a.subtitle;
    return (<div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
        <p className="mt-1 text-sm text-sigflo-muted">{subtitle}</p>
      </header>
      <Card_1.Card className="p-6 text-center">
        <p className="text-sm text-sigflo-muted">Coming soon — layout shell only.</p>
      </Card_1.Card>
    </div>);
}
