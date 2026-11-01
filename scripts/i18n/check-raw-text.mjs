#!/usr/bin/env node
/**
 * The raw-text check (NFR-I18N-001, FR-SET-005; Stage D plan §3.4, D3): fails on user-visible text
 * written into the app's source instead of the string files (`src/i18n/en.json` and `tr.json`), so
 * every string a person reads has its Turkish.
 *
 * It parses every .ts, .tsx, .js and .jsx file under `src/` and `app/` (tests, fixtures and mocks
 * skipped) with @babel/parser and reports, as file:line:
 *   - JSX text with two or more letters;
 *   - string and template literals in a JSX child expression (`{isGlobe ? 'Flat' : 'Globe'}`);
 *   - string and template literals in the props people read or hear: `accessibilityLabel`,
 *     `accessibilityHint`, `placeholder`, `title` and `label`;
 *   - literal first and second arguments to `Alert.alert`, and literal `text` in its buttons;
 *   - literal `title`, `subtitle` and `body` properties (notification content, screen titles).
 * A literal counts when it holds two or more letters. Calls aren't looked into, since `t('fly.start')`
 * passes a key, not text, and neither are comparisons (`phase === 'focus'`).
 *
 * Allowed, by file (`ALLOW`), each with its reason.
 *
 * Usage: node scripts/i18n/check-raw-text.mjs   → prints each hit, exits 1 if any.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ROOTS = ['src', 'app'];
const SKIP_DIRS = new Set(['node_modules', '__tests__', '__fixtures__', '__mocks__']);
const ALLOW = new Map([
    ['src/startup/StartupDiagnostics.tsx', "B7's hidden diagnostics panel: only the developer opens it, behind a hidden gesture"],
]);
const READ_PROPS = new Set(['accessibilityLabel', 'accessibilityHint', 'placeholder', 'title', 'label']);
const CONTENT_KEYS = new Set(['title', 'subtitle', 'body']);
const LETTERS = /\p{L}[^]*\p{L}/u;
// Expressions whose literals are never text a person reads: calls pass keys, comparisons test values,
// objects and functions are code, and nested JSX is visited on its own.
const OPAQUE = new Set([
    'CallExpression', 'NewExpression', 'OptionalCallExpression', 'ObjectExpression', 'ArrayExpression',
    'ArrowFunctionExpression', 'FunctionExpression', 'JSXElement', 'JSXFragment', 'MemberExpression',
    'OptionalMemberExpression', 'TaggedTemplateExpression',
]);

/** The text of a string or template literal, or null for anything else. */
function literalText(node) {
    if (node.type === 'StringLiteral') return node.value;
    if (node.type === 'TemplateLiteral') return node.quasis.map((q) => q.value.cooked ?? '').join(' ');
    return null;
}

/** Every literal a person could read in an expression: through `?:`, `&&`, `||`, `??` and `+`. */
function readableLiterals(node, out = []) {
    if (!node || OPAQUE.has(node.type)) return out;
    const text = literalText(node);
    if (text !== null) {
        if (LETTERS.test(text)) out.push({ node, text });
        return out;
    }
    switch (node.type) {
        case 'ConditionalExpression':
            readableLiterals(node.consequent, out);
            readableLiterals(node.alternate, out);
            break;
        case 'LogicalExpression':
            readableLiterals(node.left, out);
            readableLiterals(node.right, out);
            break;
        case 'BinaryExpression':
            if (node.operator === '+') {
                readableLiterals(node.left, out);
                readableLiterals(node.right, out);
            }
            break;
        case 'TSAsExpression':
        case 'TSSatisfiesExpression':
        case 'TSNonNullExpression':
        case 'ParenthesizedExpression':
            readableLiterals(node.expression, out);
            break;
        default:
            break;
    }
    return out;
}

function keyName(key) {
    if (!key) return null;
    if (key.type === 'Identifier') return key.name;
    if (key.type === 'StringLiteral') return key.value;
    return null;
}

function isAlertAlert(callee) {
    return (
        callee?.type === 'MemberExpression' &&
        callee.object.type === 'Identifier' &&
        callee.object.name === 'Alert' &&
        keyName(callee.property) === 'alert'
    );
}

function check(rel, source) {
    const ast = parse(source, { sourceType: 'module', plugins: ['typescript', 'jsx'], errorRecovery: true });
    const hits = [];
    const report = (node, kind, text) =>
        hits.push(`${rel}:${node.loc?.start.line ?? '?'}: ${kind}: ${JSON.stringify(text.trim().slice(0, 80))}`);
    const reportAll = (expr, kind) => readableLiterals(expr).forEach(({ node, text }) => report(node, kind, text));

    (function walk(node, parent) {
        if (!node || typeof node.type !== 'string') return;
        switch (node.type) {
            case 'JSXText':
                if (LETTERS.test(node.value)) report(node, 'JSX text', node.value);
                break;
            case 'JSXExpressionContainer':
                if (parent && (parent.type === 'JSXElement' || parent.type === 'JSXFragment')) reportAll(node.expression, 'JSX child');
                break;
            case 'JSXAttribute': {
                const name = node.name.type === 'JSXIdentifier' ? node.name.name : null;
                if (name && READ_PROPS.has(name) && node.value) {
                    if (node.value.type === 'StringLiteral') {
                        if (LETTERS.test(node.value.value)) report(node, `${name} prop`, node.value.value);
                    } else if (node.value.type === 'JSXExpressionContainer') {
                        reportAll(node.value.expression, `${name} prop`);
                    }
                }
                break;
            }
            case 'CallExpression':
                if (isAlertAlert(node.callee)) {
                    reportAll(node.arguments[0], 'Alert title');
                    reportAll(node.arguments[1], 'Alert message');
                    const buttons = node.arguments[2];
                    if (buttons?.type === 'ArrayExpression') {
                        for (const b of buttons.elements) {
                            if (b?.type !== 'ObjectExpression') continue;
                            for (const p of b.properties) if (p.type === 'ObjectProperty' && keyName(p.key) === 'text') reportAll(p.value, 'Alert button');
                        }
                    }
                }
                break;
            case 'ObjectProperty':
                if (CONTENT_KEYS.has(keyName(node.key))) reportAll(node.value, `${keyName(node.key)} property`);
                break;
            default:
                break;
        }
        for (const key of Object.keys(node)) {
            if (key === 'loc' || key === 'start' || key === 'end' || key === 'extra' || key === 'comments' || key.endsWith('Comments')) continue;
            const value = node[key];
            if (Array.isArray(value)) {
                for (const child of value) if (child && typeof child.type === 'string') walk(child, node);
            } else if (value && typeof value.type === 'string') {
                walk(value, node);
            }
        }
    })(ast.program, null);
    return hits;
}

function scan(dir, hits) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (!SKIP_DIRS.has(entry.name)) scan(full, hits);
            continue;
        }
        if (!/\.(tsx?|jsx?)$/.test(entry.name) || entry.name.endsWith('.d.ts')) continue;
        const rel = path.relative(root, full).split(path.sep).join('/');
        if (ALLOW.has(rel)) continue;
        hits.push(...check(rel, fs.readFileSync(full, 'utf8')));
    }
    return hits;
}

export function findRawText() {
    return ROOTS.flatMap((r) => scan(path.join(root, r), []));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const hits = findRawText();
    if (hits.length) {
        console.error(`✖ ${hits.length} raw strings in app source (NFR-I18N-001); move each into src/i18n/en.json and tr.json:`);
        for (const hit of hits) console.error(`  ${hit}`);
        process.exit(1);
    }
    console.log('✔ no raw text in app source');
}
