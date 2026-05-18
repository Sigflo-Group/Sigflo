"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDeepAnalysisSections = parseDeepAnalysisSections;
/**
 * Splits AI markdown body on `##` headings. Preamble before the first heading becomes section "Overview"
 * if non-empty; otherwise sections are only explicit ## blocks.
 */
function parseDeepAnalysisSections(markdown) {
    var raw = markdown.trim();
    if (!raw)
        return [];
    var lines = raw.split(/\r?\n/);
    var sections = [];
    var preamble = [];
    var current = null;
    var flushCurrent = function () {
        if (!current)
            return;
        var text = current.lines.join('\n').trim();
        if (text.length > 0 || current.heading.length > 0) {
            sections.push({ heading: current.heading, text: text });
        }
        current = null;
    };
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        var m = /^#{2,3}\s+(.+)$/.exec(line.trim());
        if (m) {
            if (!current && preamble.length > 0) {
                var p = preamble.join('\n').trim();
                if (p)
                    sections.push({ heading: 'Overview', text: p });
                preamble = [];
            }
            flushCurrent();
            current = { heading: m[1].trim(), lines: [] };
        }
        else if (current) {
            current.lines.push(line);
        }
        else {
            preamble.push(line);
        }
    }
    flushCurrent();
    if (sections.length === 0 && preamble.length > 0) {
        var p = preamble.join('\n').trim();
        if (p)
            return [{ heading: 'Analysis', text: p }];
    }
    return sections.length > 0 ? sections : [{ heading: 'Analysis', text: raw }];
}
