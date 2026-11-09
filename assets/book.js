/* /book/: pick a day and a time for a free call. This is a request, not an instant booking:
   the chosen slot goes into the form, and a person confirms by phone or email. Times are Mountain time. */
(function () {
  'use strict';
  var cal = document.getElementById('bk-cal'), slots = document.getElementById('bk-slots');
  if (!cal || !slots) return;
  var fDate = document.getElementById('bk-date'), fTime = document.getElementById('bk-time'), fTz = document.getElementById('bk-tz');
  var pick = document.getElementById('bk-pick'), manual = document.getElementById('bk-manual');
  var TZ = 'America/Denver';
  var DAYS = 21;                    // how far ahead people can ask
  var START = 9, END = 17;          // 9:00 to 4:30 start times, Mountain
  var chosen = { d: null, t: null };
  manual.hidden = true;             // the plain text fields are the no-JavaScript fallback
  cal.hidden = false; slots.hidden = false; pick.hidden = false;
  try { fTz.value = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { fTz.value = ''; }

  function denverNow() {
    var p = new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    var o = {}; p.forEach(function (x) { o[x.type] = x.value; });
    return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour % 24, min: +o.minute };
  }
  function key(dt) { return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0'); }
  function nice(dt) { return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); }
  function label(h, m) { var ap = h < 12 ? 'am' : 'pm', hh = h % 12 || 12; return hh + ':' + String(m).padStart(2, '0') + ' ' + ap; }

  var now = denverNow(), today = new Date(now.y, now.m - 1, now.d), days = [];
  for (var i = 0; i <= DAYS; i++) {
    var dt = new Date(today); dt.setDate(today.getDate() + i);
    var wd = dt.getDay();
    if (wd === 0) continue;                               // closed Sundays
    if (i === 0 && now.h >= END - 2) continue;            // too late today
    days.push(dt);
  }
  function renderCal() {
    var html = '<div class="bk-dow" aria-hidden="true"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div><div class="bk-days" role="radiogroup" aria-label="Pick a day">';
    var first = days[0], pad = (first.getDay() + 6) % 7;   // Monday-first grid
    for (var p = 0; p < pad; p++) html += '<span class="bk-pad"></span>';
    var prevWeek = null;
    days.forEach(function (dt) {
      var k = key(dt), sel = chosen.d === k;
      if (prevWeek !== null && dt.getDay() === 1) { /* new week row continues naturally in the grid */ }
      prevWeek = dt.getDay();
      html += '<button type="button" role="radio" aria-checked="' + sel + '" class="bk-day' + (sel ? ' on' : '') + '" data-d="' + k + '" aria-label="' + nice(dt) + '"><small>' + dt.toLocaleDateString('en-US', { month: 'short' }) + '</small><b>' + dt.getDate() + '</b></button>';
    });
    cal.innerHTML = html + '</div>';
  }
  function renderSlots() {
    if (!chosen.d) { slots.innerHTML = '<p class="bk-hint">Pick a day to see times.</p>'; return; }
    var parts = chosen.d.split('-'), isToday = +parts[0] === now.y && +parts[1] === now.m && +parts[2] === now.d, sat = new Date(+parts[0], +parts[1] - 1, +parts[2]).getDay() === 6;
    var end = sat ? 13 : END, html = '<p class="bk-hint">Times in Mountain time (Denver)' + (fTz.value && fTz.value !== TZ ? '. You are on ' + fTz.value.replace(/_/g, ' ') : '') + '.</p><div class="bk-times" role="radiogroup" aria-label="Pick a time">';
    for (var h = START; h < end; h++) for (var m = 0; m < 60; m += 30) {
      if (isToday && (h < now.h + 2)) continue;          // need two hours' notice
      var v = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'), on = chosen.t === v;
      html += '<button type="button" role="radio" aria-checked="' + on + '" class="bk-time' + (on ? ' on' : '') + '" data-t="' + v + '">' + label(h, m) + '</button>';
    }
    slots.innerHTML = html + '</div>';
  }
  function sync() {
    if (chosen.d && chosen.t) {
      var p = chosen.d.split('-'), dt = new Date(+p[0], +p[1] - 1, +p[2]), hm = chosen.t.split(':');
      fDate.value = chosen.d; fTime.value = chosen.t + ' Mountain';
      pick.innerHTML = 'Your request: <b>' + nice(dt) + ' at ' + label(+hm[0], +hm[1]) + ' Mountain</b>. We confirm by phone or email.';
      pick.classList.add('ok');
    } else { fDate.value = ''; fTime.value = ''; pick.textContent = 'No time picked yet.'; pick.classList.remove('ok'); }
  }
  cal.addEventListener('click', function (e) { var b = e.target.closest('[data-d]'); if (!b) return; chosen.d = b.getAttribute('data-d'); chosen.t = null; renderCal(); renderSlots(); sync(); var f = slots.querySelector('button'); if (f) f.focus(); });
  slots.addEventListener('click', function (e) { var b = e.target.closest('[data-t]'); if (!b) return; chosen.t = b.getAttribute('data-t'); renderSlots(); sync(); });
  var form = cal.closest('form');
  form.addEventListener('submit', function (e) {
    if (!fDate.value || !fTime.value) { e.preventDefault(); pick.textContent = 'Please pick a day and a time first.'; pick.classList.remove('ok'); pick.focus(); }
  });
  renderCal(); renderSlots(); sync();
})();
