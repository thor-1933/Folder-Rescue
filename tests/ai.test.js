import test from 'node:test';
import assert from 'node:assert/strict';
import {inferFilename,tokenize} from '../dist/ai.js';
import {classify} from '../dist/core.js';
test('local model uses combined filename clues without an extension',()=>{for(const [name,category]of [['meeting agenda notes','Documents'],['portrait vacation photo','Images'],['server router config','Code'],['audio podcast episode','Media'],['compressed archive backup','Archives']]){const result=inferFilename(name);assert.equal(result.category,category);assert.equal(result.source,'local-ai');assert.ok(result.confidence>=.45&&result.confidence<=1);}});
test('unrecognized and ambiguous names use explicit Other fallback',()=>{for(const name of ['','x_12345','mystery-download','invoice photo']){const r=inferFilename(name);assert.equal(r.category,'Other');assert.equal(r.source,'fallback');}});
test('known extension takes precedence over filename semantics',()=>{const result=classify('server-router-config.jpg');assert.equal(result.category,'Images');assert.equal(result.source,'file-type');});
test('tokens handle separators, camel case and case consistently',()=>{assert.deepEqual(tokenize('meetingAgenda_NOTES-2026'),['meeting','agenda','notes']);assert.deepEqual(inferFilename('MEETING_AGENDA_NOTES'),inferFilename('meeting agenda notes'));});
