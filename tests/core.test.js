import test from 'node:test';
import assert from 'node:assert/strict';
import {classify,safeName,planMission,DEMO,formatBytes} from '../dist/core.js';
test('classifies mixed case, unknown, and extensionless names',()=>{assert.equal(classify('REPORT.PDF').category,'Documents');assert.equal(classify('photo.jpeg').category,'Images');assert.equal(classify('noextension').category,'Other');assert.equal(classify('payload.exe').category,'Other');assert.equal(classify('archive.tar.gz').category,'Archives');});
test('rejects traversal and control characters',()=>{for(const n of ['..','.','../x','a/b','a\\b','a\u0000b',''])assert.throws(()=>safeName(n));assert.equal(safeName('résumé 2026.pdf'),'résumé 2026.pdf');});
test('director prioritizes largest remaining category and handles empty state',()=>{assert.equal(planMission(DEMO).category,'Documents');assert.equal(planMission([]).count,0);assert.match(planMission([]).text,/All clear/);});
test('formats sizes without network or dependencies',()=>{assert.equal(formatBytes(512),'512 B');assert.equal(formatBytes(2048),'2.0 KB');assert.equal(formatBytes(2097152),'2.0 MB');});
