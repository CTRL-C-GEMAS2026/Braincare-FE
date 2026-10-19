import assert from 'node:assert/strict';
import test from 'node:test';
import { readServerEvents } from '../lib/api/sse.ts';

const encoder = new TextEncoder();

test('SSE survives byte boundaries, UTF-8, CRLF, comments and multiline data', async () => {
  const input = ': heartbeat\r\nevent: narrative\r\ndata: {"text":"MRI 🧠"}\r\n\r\n'
    + 'event: complete\ndata: first\ndata: second\n\n';
  const events = [];
  const body = new ReadableStream({
    start(controller) {
      for (const byte of encoder.encode(input)) controller.enqueue(new Uint8Array([byte]));
      controller.close();
    },
  });
  await readServerEvents(body, (event, data) => events.push({ event, data }));
  assert.deepEqual(events, [
    { event: 'narrative', data: '{"text":"MRI 🧠"}' },
    { event: 'complete', data: 'first\nsecond' },
  ]);
});

test('preview is delivered before the connection finishes; final text replaces it', async () => {
  let controller;
  let firstEvent;
  const seen = new Promise((resolve) => { firstEvent = resolve; });
  const body = new ReadableStream({ start(streamController) { controller = streamController; } });
  let rendered = '';
  let finished = false;
  const reading = readServerEvents(body, (event, data) => {
    rendered = JSON.parse(data).text;
    if (event === 'narrative') firstEvent();
    else finished = true;
  });
  controller.enqueue(encoder.encode('event: narrative\ndata: {"text":"Provisional"}\n\n'));
  await seen;
  assert.equal(rendered, 'Provisional');
  assert.equal(finished, false);
  controller.enqueue(encoder.encode('event: complete\ndata: {"text":"Validated replacement"}\n\n'));
  controller.close();
  await reading;
  assert.equal(rendered, 'Validated replacement');
  assert.equal(finished, true);
});
