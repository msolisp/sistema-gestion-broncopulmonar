
const fs = require('fs');
const path = require('path');

const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-final.json');

if (!fs.existsSync(coveragePath)) {
    console.error('No coverage-final.json found. Run tests with --coverage first.');
    process.exit(1);
}

const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));

console.log('| File | Statements | Branches | Functions | Lines |');
console.log('|---|---|---|---|---|');

const rows = [];

Object.keys(coverage).forEach(filePath => {
    const fileCov = coverage[filePath];
    const relativePath = path.relative(process.cwd(), filePath);

    // Calculate simple percentages
    const calculatePct = (metrics) => {
        const total = Object.keys(metrics).length;
        if (total === 0) return 100;
        const covered = Object.values(metrics).filter(v => v > 0).length;
        return ((covered / total) * 100).toFixed(0);
    };

    // Jest returns slightly different structure, need to count hits
    // Actually, stats are: { "0": 1, "1": 0 ... }
    const getPct = (map) => {
        const keys = Object.keys(map);
        if (keys.length === 0) return 100;
        const hit = keys.filter(k => map[k] > 0).length;
        return ((hit / keys.length) * 100).toFixed(0);
    }

    const stmtPct = getPct(fileCov.s);
    const branchPct = getPct(fileCov.b);
    const funcPct = getPct(fileCov.f);
    // Lines often map 1:1 to statements in this JSON but usually simpler to just use S for this quick view or parse `l` if exists (it does not exist in coverage-final usually, it has statementMap)
    // Actually typically coverage-final has `s` (statement hit counts), `b` (branch), `f` (function).

    rows.push({
        file: relativePath,
        stmt: stmtPct,
        branch: branchPct,
        func: funcPct
    });
});

rows.sort((a, b) => a.file.localeCompare(b.file));

rows.forEach(r => {
    console.log(`| ${r.file} | ${r.stmt}% | ${r.branch}% | ${r.func}% | - |`);
});
