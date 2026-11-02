const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('src/app.js', 'utf8');
function section(start, end) {
  const first = source.indexOf(start), last = source.indexOf(end, first);
  assert.ok(first >= 0 && last > first);
  return source.slice(first, last);
}
const notices = [], requests = [];
const message = { value: '从 Obsidian 同步后，文字显示成了标签', focus() {} };
const contact = { value: 'visitor@example.com' };
let reply;
const ctx = {
  FormData, AbortController, crypto, Date,
  LOCAL_DEPLOYMENT_MODE: false, feedbackSending: false, feedbackSubmissionAccepted: false,
  feedbackCurrentId: '', feedbackAbortController: null, feedbackFiles: [],
  els: { feedbackMessage: message, feedbackContact: contact, feedbackEmail: {}, feedbackForm: { elements: { _honey: { value: '' } } } },
  window: { setTimeout, clearTimeout },
  setFeedbackNotice: (text, type) => notices.push({ text, type }),
  setFeedbackSending: value => { ctx.feedbackSending = value; },
  fetch: async (url, options) => {
    requests.push({ url, entries: Array.from(options.body.entries()) });
    if (reply instanceof Error) throw reply;
    return reply;
  },
};
vm.createContext(ctx);
vm.runInContext([
  section('const FEEDBACK_EMAIL =', 'const LOCAL_DEPLOYMENT_MODE ='),
  section('function feedbackFilesTotalBytes()', 'function clearFeedbackPreviewUrls()'),
  section('function feedbackEmailDraft()', 'async function copyFeedbackEmailDraft()'),
  section('function createFeedbackId()', 'function startAddingAccount()'),
].join('\n'), ctx);
const response = (status, body) => ({ ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body) });
(async () => {
  reply = response(200, { success: 'false', message: 'Please activate your form. Check your email.' });
  await ctx.submitFeedback({ preventDefault() {} });
  assert.equal(ctx.feedbackSubmissionAccepted, false);
  assert.equal(message.value, '从 Obsidian 同步后，文字显示成了标签');
  assert.match(notices.at(-1).text, /需要作者处理/);
  assert.match(notices.at(-1).text, /直接发邮件/);
  assert.doesNotMatch(notices.at(-1).text, /点击激活|检查收件箱/);
  const id = ctx.feedbackCurrentId;
  ctx.updateFeedbackEmailLink();
  const fallback = new URL(ctx.els.feedbackEmail.href);
  assert.equal(fallback.protocol, 'mailto:');
  assert.match(fallback.searchParams.get('body'), /从 Obsidian 同步后/);
  assert.match(fallback.searchParams.get('subject'), new RegExp(id));
  assert.equal(requests.length, 1, 'preparing a fallback must not send another message');
  assert.deepEqual(requests[0].entries.filter(([key]) => !['_subject', '_template', '_honey', '反馈编号', '问题描述', '联系方式', '页面版本', 'email'].includes(key)), [], 'only form fields are submitted');

  reply = response(503, { success: false, message: 'Service unavailable' });
  await ctx.submitFeedback({ preventDefault() {} });
  assert.equal(ctx.feedbackSubmissionAccepted, false);
  assert.match(notices.at(-1).text, /备用入口/);
  assert.equal(ctx.feedbackCurrentId, id, 'retry keeps the feedback ID');

  reply = new TypeError('Failed to fetch');
  await ctx.submitFeedback({ preventDefault() {} });
  assert.match(notices.at(-1).text, /未确认/);
  assert.doesNotMatch(notices.at(-1).text, /检查收件箱/);
  assert.equal(ctx.feedbackSending, false);

  reply = response(200, { success: 'true', message: 'The form was submitted successfully.' });
  await ctx.submitFeedback({ preventDefault() {} });
  assert.equal(ctx.feedbackSubmissionAccepted, true);
  assert.match(notices.at(-1).text, /已受理反馈/);
  assert.doesNotMatch(notices.at(-1).text, /已经送达/);
  assert.equal(message.value, '从 Obsidian 同步后，文字显示成了标签');
  console.log('OK: activation/network errors retain feedback and offer a mail fallback; acceptance is not claimed as delivery');
})().catch(error => { console.error(error); process.exitCode = 1; });
