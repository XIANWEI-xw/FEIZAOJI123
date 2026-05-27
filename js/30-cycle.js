// ================= Cycle App · 经期追踪系统 =================
const CycleApp = (function () {

    const STORE_KEY = 'soap_cycle_v1';
    const today = new Date();
    const todayStr = fmt(today);

    // ─── 工具 ───
    function fmt(d) {
        return d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0');
    }
    function addDays(ds, n) {
        const d = new Date(ds + 'T12:00:00');
        d.setDate(d.getDate() + n);
        return fmt(d);
    }
    function diffDays(a, b) {
        return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);
    }
    function cyToast(msg) {
        let el = document.getElementById('cy-toast');
        if (!el) return;
        el.textContent = msg;
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 2400);
    }

    // ─── 数据 ───
    function load() {
        try { return JSON.parse(localStorage.getItem(STORE_KEY)) || def(); }
        catch (e) { return def(); }
    }
    function def() {
        return {
            cycleLen: 28,
            periodLen: 5,
            lastStart: null,
            periodDays: [],
            logs: {},
            reminders: {}
        };
    }
    function buildRange(start, len) {
        const arr = [];
        for (let i = 0; i < len; i++) arr.push(addDays(start, i));
        return arr;
    }
    function save() { localStorage.setItem(STORE_KEY, JSON.stringify(D)); }

    let D = load();

    // ─── 常量 ───
    const FLOW = ['极少', '少', '中等', '多', '极多'];
    const PAIN = ['无痛', '轻微', '中等', '较强', '剧烈'];
    const MOODS = [
        { k: 'happy', l: '开心' }, { k: 'calm', l: '平静' },
        { k: 'sad', l: '低落' }, { k: 'irritable', l: '烦躁' },
        { k: 'tired', l: '疲惫' }, { k: 'anxious', l: '焦虑' }
    ];

    // ─── 状态 ───
    let calY = today.getFullYear(), calM = today.getMonth();
    let curDate = todayStr;
    let isPeriod = false, flowV = 2, painV = 0, selMoods = [];
    let dragging = null;
    let activeTab = 'home';

    // ─── 周期计算引擎 ───
    function calcNextPeriod() {
        if (!D.lastStart) return null;
        // 从日志中找最近的经期开始日，重新计算实际周期
        const periodStarts = findPeriodStarts();
        if (periodStarts.length >= 2) {
            // 用最近3次经期开始日的平均间隔重新校准周期长度
            const recent = periodStarts.slice(-4);
            let totalDiff = 0, cnt = 0;
            for (let i = 1; i < recent.length; i++) {
                totalDiff += diffDays(recent[i - 1], recent[i]);
                cnt++;
            }
            if (cnt > 0) D.cycleLen = Math.round(totalDiff / cnt);
        }
        const lastActualStart = periodStarts.length > 0 ? periodStarts[periodStarts.length - 1] : D.lastStart;
        return addDays(lastActualStart, D.cycleLen);
    }

    function findPeriodStarts() {
        const sorted = [...D.periodDays].sort();
        const starts = [];
        for (let i = 0; i < sorted.length; i++) {
            const prev = addDays(sorted[i], -1);
            if (i === 0 || !sorted.includes(prev)) starts.push(sorted[i]);
        }
        return starts;
    }

    function calcPeriodLen() {
        const starts = findPeriodStarts();
        if (starts.length === 0) return D.periodLen;
        // 以最近一次为基准计算实际经期长度
        const last = starts[starts.length - 1];
        let len = 0;
        for (let i = 0; i < 14; i++) {
            if (D.periodDays.includes(addDays(last, i))) len++;
            else break;
        }
        return len || D.periodLen;
    }

    function getStatus() {
        const nextStart = calcNextPeriod();
        const inPeriod = D.periodDays.includes(todayStr);
        const daysLeft = nextStart ? diffDays(todayStr, nextStart) : null;

        // 找出上次经期开始日，用于计算当前处于周期第几天
        const starts = findPeriodStarts();
        const lastStart = starts.length ? starts[starts.length - 1] : D.lastStart;
        const dayInCycle = lastStart ? diffDays(lastStart, todayStr) + 1 : null;

        // === 月经期 Days 1-5 ===
        if (inPeriod) {
            const dayN = lastStart ? diffDays(lastStart, todayStr) + 1 : 1;
            return {
                phase: '月经期',
                desc: '第 ' + dayN + ' 天 · 内膜脱落，注意保暖' + (D.logs[todayStr] ? ' ✦' : ''),
                num: dayN,
                unit: 'day',
                tag: 'MENSTRUAL · DAYS 1–5',
                progress: Math.min(100, dayN / D.periodLen * 100),
                inPeriod: true,
                color: '#C06070'
            };
        }

        // 即将来临（提前3天预警）
        if (daysLeft !== null && daysLeft <= 3 && daysLeft > 0) {
            return {
                phase: '黄体期末',
                desc: '预计 ' + daysLeft + ' 天后来潮，注意休息',
                num: daysLeft,
                unit: 'days',
                tag: 'LUTEAL ENDING · COMING SOON',
                progress: Math.max(0, 100 - daysLeft / D.cycleLen * 100),
                inPeriod: false,
                color: '#8E8E93'
            };
        }

        // 延迟
        if (daysLeft !== null && daysLeft <= 0) {
            const late = Math.abs(daysLeft);
            return {
                phase: '可能延迟',
                desc: '预计日期已过 ' + late + ' 天，请关注',
                num: late,
                unit: 'days late',
                tag: 'CHECK STATUS',
                progress: 100,
                inPeriod: false,
                color: '#C3A772'
            };
        }

        // 根据周期天数判断所处阶段
        if (dayInCycle !== null) {
            const d = dayInCycle;

            // === 卵泡期 Days 6-13 ===
            if (d >= 6 && d <= 13) {
                return {
                    phase: '卵泡期',
                    desc: '卵泡发育，内膜增厚，能量回升，适合运动',
                    num: d,
                    unit: 'day',
                    tag: 'FOLLICULAR · DAYS 6–14',
                    progress: Math.min(100, (d - 5) / 9 * 100),
                    inPeriod: false,
                    color: '#6BAF92'
                };
            }

            // === 排卵期 Days 14-16（前后各1天浮动）===
            if (d >= 13 && d <= 16) {
                const ovulationDay = Math.round(D.cycleLen / 2);
                const daysToOv = ovulationDay - d;
                const ovDesc = daysToOv > 0 ? '预计 ' + daysToOv + ' 天后排卵，受孕机会高' :
                    daysToOv === 0 ? '今日约为排卵日，情绪高涨，魅力增加' :
                        '排卵期中，受孕机会高，情绪活跃';
                return {
                    phase: '排卵期',
                    desc: ovDesc,
                    num: d,
                    unit: 'day',
                    tag: 'OVULATION · DAY ~14',
                    progress: 60,
                    inPeriod: false,
                    color: '#C3A772'
                };
            }

            // === 黄体期 Days 17-28 ===
            if (d >= 17) {
                const remaining = daysLeft || (D.cycleLen - d + 1);
                return {
                    phase: '黄体期',
                    desc: '准备着床，情绪波动，注意休息，还有 ' + remaining + ' 天',
                    num: remaining,
                    unit: 'days left',
                    tag: 'LUTEAL · DAYS 15–28',
                    progress: Math.min(100, (d - 16) / (D.cycleLen - 16) * 100),
                    inPeriod: false,
                    color: '#7A8FC4'
                };
            }
        }

        // 兜底
        return {
            phase: '卵泡期',
            desc: daysLeft !== null ? '距下次来潮还有 ' + daysLeft + ' 天' : '暂无周期数据',
            num: daysLeft || '--',
            unit: 'days left',
            tag: 'FOLLICULAR',
            progress: daysLeft !== null ? Math.max(0, 100 - daysLeft / D.cycleLen * 100) : 0,
            inPeriod: false,
            color: '#6BAF92'
        };
    }

    function getPredicted() {
        const next = calcNextPeriod();
        if (!next) return [];
        const arr = [];
        for (let i = 0; i < D.periodLen; i++) {
            const ds = addDays(next, i);
            if (!D.periodDays.includes(ds)) arr.push(ds);
        }
        return arr;
    }

    // ─── 提醒引擎：每次打开时检查是否需要通知联系人 ───
    function checkAndNotify() {
        if (typeof contacts === 'undefined' || !D.reminders) return;
        const next = calcNextPeriod();
        if (!next) return;
        const daysLeft = diffDays(todayStr, next);

        Object.keys(D.reminders).forEach(cid => {
            const cfg = D.reminders[cid];
            if (!cfg || !cfg.enabled) return;
            const c = contacts.find(x => x.id === cid);
            if (!c) return;

            const threshold = cfg.daysBeforeNotify || 2;
            // 通知key：防止同一阶段重复通知
            const notifyKey = next + '_before' + threshold;
            const periodKey = next + '_start';

            // 1. 提前N天预告
            if (daysLeft === threshold && !cfg.notified?.[notifyKey]) {
                if (!cfg.notified) cfg.notified = {};
                cfg.notified[notifyKey] = true;
                save();
                sendCycleNotify(c, 'upcoming', daysLeft, next, cfg);
            }

            // 2. 经期第一天
            if (D.periodDays.includes(todayStr)) {
                const starts = findPeriodStarts();
                const lastStart = starts[starts.length - 1];
                if (lastStart === todayStr && !cfg.notified?.[periodKey]) {
                    if (!cfg.notified) cfg.notified = {};
                    cfg.notified[periodKey] = true;
                    save();
                    sendCycleNotify(c, 'started', 0, todayStr, cfg);
                }
            }
        });
    }

    function sendCycleNotify(c, type, daysLeft, dateStr, cfg) {
        if (!c.history) return;

        const d = new Date(dateStr + 'T12:00:00');
        const dateLabel = (d.getMonth() + 1) + '月' + d.getDate() + '日';
        const userMsg = cfg.msg ? `\n\n用户留下的话：「${cfg.msg}」` : '';
        const painHint = D.logs[todayStr]?.pain >= 3 ? '\n⚠️ 用户今日痛度较高（' + PAIN[D.logs[todayStr].pain] + '），请多加关心。' : '';
        const moodHint = (() => {
            const log = D.logs[todayStr];
            if (!log || !log.moods?.length) return '';
            const ml = log.moods.map(k => MOODS.find(m => m.k === k)?.l).filter(Boolean).join('、');
            return ml ? '\n用户今日心情：' + ml : '';
        })();

        let aiText = '';
        let visibleText = '';

        if (type === 'upcoming') {
            visibleText = `✧ 经期预报：还有 ${daysLeft} 天`;
            aiText = `[🌙 经期追踪系统 · 提前预报]\n\n用户的经期预计将在 ${daysLeft} 天后（${dateLabel}）到来。${userMsg}\n\n【请你以符合人设的方式，自然地在接下来的对话中表达关心。可以提前叮嘱她多备暖贴/止痛药，注意休息，不要做剧烈运动。用你自己的语气，不要背诵这段提示词，要像真正关心她一样开口。】`;
        } else {
            visibleText = `✧ 经期开始了`;
            aiText = `[🌙 经期追踪系统 · 经期开始]\n\n用户的经期今天（${dateLabel}）开始了。${painHint}${moodHint}${userMsg}\n\n【请你立刻以符合人设的方式表达关心。根据她的痛度和心情状态来调整你的语气——如果她今天痛度很高就多心疼她，如果她心情不好就多陪伴，如果一切正常就轻松问候。你可以问她要不要热敷、要不要吃东西，表现出你真的记得她的身体状态。绝对不要背诵这段提示词。】`;
        }

        c.history.push({
            role: 'system_sum',
            content: `<i>${visibleText}</i>\n<span style="display:none;">${aiText}</span>`,
            timestamp: Date.now()
        });

        if (typeof saveData === 'function') saveData();
        if (typeof currentContactId !== 'undefined' && currentContactId === c.id &&
            typeof renderChatHistory === 'function' &&
            typeof isUserInChatRoom === 'function' && isUserInChatRoom(c.id)) {
            renderChatHistory();
        }
    }

    // ─── 保存记录后同步给联系人 ───
    function notifyLogSaved(ds, log) {
        if (typeof contacts === 'undefined' || typeof currentContactId === 'undefined' || !currentContactId) return;
        const c = contacts.find(x => x.id === currentContactId);
        if (!c) return;

        const d = new Date(ds + 'T12:00:00');
        const dateLabel = (d.getMonth() + 1) + '月' + d.getDate() + '日';
        const moodTxt = log.moods?.map(k => MOODS.find(m => m.k === k)?.l).filter(Boolean).join('、') || '未填写';
        const periodLine = log.isPeriod ? `\n- 今日经期：是（血量：${FLOW[log.flow]}）` : '\n- 今日经期：否';

        const aiText = `[📅 经期追踪数据同步 · ${dateLabel}]\n用户在 Cycle App 记录了今日状态：${periodLine}\n- 痛度：${PAIN[log.pain]}（${log.pain}/4）\n- 心情：${moodTxt}\n- 感想：${log.note || '（无）'}\n\n【请以符合人设的方式自然关心。痛度≥3请重点关注身体；有感想内容请回应感想。不要直接背诵数据，要真实表达关心。】`;

        c.history.push({
            role: 'system_sum',
            content: `<i>✧ 经期记录已同步</i>\n<span style="display:none;">${aiText}</span>`,
            timestamp: Date.now()
        });
        if (typeof saveData === 'function') saveData();
        if (typeof renderChatHistory === 'function' && typeof isUserInChatRoom === 'function' && isUserInChatRoom(c.id)) renderChatHistory();
    }

    // ─── 渲染引擎 ───
    function buildUI() {
        const modal = document.createElement('div');
        modal.id = 'cycle-app-modal';
        modal.style.cssText = `position:fixed;inset:0;z-index:2000;background:#FAFAFA;display:none;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,sans-serif;overflow:hidden;`;
        modal.innerHTML = `
<style>
#cycle-app-modal{--rose:#B5626E;--rose-l:rgba(181,98,110,0.08);--rose-m:rgba(181,98,110,0.15);--gold:#C3A772;--gold-l:rgba(195,167,114,0.1);--black:#1C1C1E;--gray:#8E8E93;--gray-l:#F2F2F7;--border:rgba(0,0,0,0.05);--card:#fff;--bg:#FAFAFA;}
#cycle-app-modal *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
.cy2-header{padding:calc(env(safe-area-inset-top,44px) + 30px) 22px 14px;background:rgba(250,250,250,0.96);backdrop-filter:blur(24px);display:flex;justify-content:space-between;align-items:flex-end;border-bottom:0.5px solid var(--border);flex-shrink:0;position:relative;}
.cy2-header-deco{position:absolute;right:66px;bottom:12px;opacity:0.06;pointer-events:none;}
.cy2-title{font-size:27px;font-weight:900;letter-spacing:-1px;color:var(--black);font-style:italic;}
.cy2-title span{color:var(--rose);}
.cy2-sub{font-size:9px;font-weight:800;color:var(--gray);letter-spacing:3px;text-transform:uppercase;margin-top:3px;}
.cy2-hbtns{display:flex;gap:8px;align-items:center;}
.cy2-hbtn{width:32px;height:32px;border-radius:50%;background:var(--black);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:transform 0.15s;}
.cy2-hbtn:active{transform:scale(0.9);}
.cy2-hbtn-ghost{width:32px;height:32px;border-radius:50%;background:var(--gray-l);display:flex;align-items:center;justify-content:center;cursor:pointer;}
.cy2-main{flex:1;overflow-y:auto;overflow-x:hidden;padding:20px 18px calc(env(safe-area-inset-bottom,20px) + 80px);scrollbar-width:none;}
.cy2-main::-webkit-scrollbar{display:none;}
.cy2-view{display:none;}
.cy2-view.active{display:block;}
/* Hero */
.cy2-hero{background:var(--card);border-radius:28px;padding:22px;margin-bottom:16px;box-shadow:0 8px 32px rgba(0,0,0,0.05);border:0.5px solid var(--border);position:relative;overflow:hidden;}
.cy2-hero-bg{position:absolute;inset:0;pointer-events:none;}
.cy2-hero-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;position:relative;z-index:1;}
.cy2-tag{display:inline-flex;align-items:center;gap:5px;background:var(--rose-l);border:1px solid rgba(181,98,110,0.12);padding:4px 10px;border-radius:20px;font-size:9px;font-weight:800;color:var(--rose);letter-spacing:0.5px;margin-bottom:10px;}
.cy2-phase{font-size:24px;font-weight:900;color:var(--black);letter-spacing:-0.5px;line-height:1.1;}
.cy2-desc{font-size:12px;font-weight:600;color:var(--gray);margin-top:5px;}
.cy2-hero-right{text-align:right;flex-shrink:0;margin-left:16px;}
.cy2-num{font-size:46px;font-weight:900;color:var(--black);line-height:1;letter-spacing:-2px;}
.cy2-unit{font-size:10px;font-weight:700;color:var(--gray);letter-spacing:1px;text-transform:uppercase;margin-top:2px;}
.cy2-prog-track{height:4px;background:var(--gray-l);border-radius:2px;overflow:hidden;margin-bottom:7px;position:relative;z-index:1;}
.cy2-prog-fill{height:100%;background:linear-gradient(90deg,var(--rose),rgba(181,98,110,0.7));border-radius:2px;transition:width 0.6s cubic-bezier(0.34,1.56,0.64,1);}
.cy2-prog-lbls{display:flex;justify-content:space-between;position:relative;z-index:1;}
.cy2-prog-lbl{font-size:9px;font-weight:700;color:var(--gray);letter-spacing:0.4px;}
/* Quick row */
.cy2-qrow{display:flex;gap:10px;margin-bottom:16px;}
.cy2-qcard{flex:1;background:var(--card);border-radius:20px;padding:14px;box-shadow:0 4px 16px rgba(0,0,0,0.04);border:0.5px solid var(--border);cursor:pointer;transition:transform 0.15s;position:relative;overflow:hidden;}
.cy2-qcard:active{transform:scale(0.95);}
.cy2-qcard-ico{width:34px;height:34px;border-radius:10px;background:var(--rose-l);display:flex;align-items:center;justify-content:center;margin-bottom:10px;}
.cy2-qnum{font-size:22px;font-weight:900;color:var(--black);line-height:1;letter-spacing:-0.5px;}
.cy2-qunit{font-size:10px;font-weight:700;color:var(--gray);margin-left:2px;}
.cy2-qlbl{font-size:10px;font-weight:700;color:var(--gray);margin-top:3px;}
.cy2-qstar{position:absolute;top:8px;right:8px;opacity:0.05;}
/* 段落标题 */
.cy2-sec{display:flex;align-items:center;justify-content:space-between;margin-bottom:11px;margin-top:20px;}
.cy2-sec-title{font-size:16px;font-weight:900;color:var(--black);letter-spacing:-0.3px;}
.cy2-sec-more{font-size:11px;font-weight:700;color:var(--gray);cursor:pointer;}
/* 日历 */
.cy2-cal{background:var(--card);border-radius:24px;padding:18px;box-shadow:0 6px 24px rgba(0,0,0,0.04);border:0.5px solid var(--border);margin-bottom:16px;}
.cy2-cal-nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
.cy2-cal-nbtn{width:28px;height:28px;border-radius:50%;background:var(--gray-l);display:flex;align-items:center;justify-content:center;cursor:pointer;}
.cy2-cal-mon{font-size:15px;font-weight:800;color:var(--black);}
.cy2-wds{display:grid;grid-template-columns:repeat(7,1fr);margin-bottom:5px;}
.cy2-wd{text-align:center;font-size:10px;font-weight:800;color:var(--gray);letter-spacing:0.5px;padding:4px 0;}
.cy2-days{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;}
.cy2-day{aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:12px;font-weight:600;color:var(--black);cursor:pointer;position:relative;transition:all 0.15s;}
.cy2-day:active{transform:scale(0.85);}
.cy2-day.empty{pointer-events:none;}
.cy2-day.today{font-weight:900;color:var(--rose);}
.cy2-day.today::after{content:'';position:absolute;bottom:2px;left:50%;transform:translateX(-50%);width:3px;height:3px;border-radius:50%;background:var(--rose);}
.cy2-day.period{background:var(--rose-l);color:var(--rose);font-weight:800;}
.cy2-day.period-edge{background:var(--rose);color:#fff;font-weight:900;box-shadow:0 3px 10px rgba(181,98,110,0.3);}
.cy2-day.period-end{background:var(--black);color:var(--rose);font-weight:900;border:2px solid var(--rose);box-shadow:0 4px 12px rgba(181,98,110,0.4);}
.cy2-day.predicted{color:var(--gold);background:var(--gold-l);}
.cy2-end-fab{position:fixed;bottom:calc(75px + env(safe-area-inset-bottom,20px));right:20px;width:56px;height:56px;border-radius:50%;background:var(--black);color:#fff;display:none;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,0.25);border:1.5px solid var(--rose);z-index:90;cursor:pointer;animation:cy2Pop 0.4s cubic-bezier(0.34,1.56,0.64,1);}
@keyframes cy2Pop{from{transform:scale(0) rotate(-90deg);opacity:0}to{transform:scale(1) rotate(0);opacity:1}}
.cy2-end-fab-txt{font-size:9px;font-weight:800;letter-spacing:1px;margin-top:2px;color:var(--rose);}
.cy2-day.has-log::before{content:'✦';position:absolute;top:0;right:1px;font-size:6px;color:var(--rose);line-height:1;}
/* 记录卡 */
.cy2-log{background:var(--card);border-radius:20px;padding:14px 16px;margin-bottom:10px;box-shadow:0 4px 16px rgba(0,0,0,0.04);border:0.5px solid var(--border);display:flex;gap:12px;cursor:pointer;transition:transform 0.15s;position:relative;overflow:hidden;}
.cy2-log:active{transform:scale(0.98);}
.cy2-log-left{display:flex;flex-direction:column;align-items:center;flex-shrink:0;padding-top:2px;}
.cy2-log-dot{width:7px;height:7px;border-radius:50%;background:var(--rose);margin-bottom:5px;}
.cy2-log-dot.g{background:rgba(142,142,147,0.3);}
.cy2-log-line{width:1px;flex:1;min-height:20px;background:rgba(0,0,0,0.05);}
.cy2-log-body{flex:1;min-width:0;}
.cy2-log-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
.cy2-log-date{font-size:13px;font-weight:800;color:var(--black);}
.cy2-log-badges{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end;}
.cy2-badge{font-size:9px;font-weight:800;padding:2px 7px;border-radius:6px;}
.cy2-br{background:var(--rose-l);color:var(--rose);border:0.5px solid rgba(181,98,110,0.15);}
.cy2-bg{background:var(--gold-l);color:var(--gold);}
.cy2-bs{background:var(--gray-l);color:var(--gray);}
.cy2-log-stats{display:flex;gap:10px;margin-bottom:5px;}
.cy2-log-stat{font-size:10px;font-weight:700;color:var(--gray);display:flex;align-items:center;gap:3px;}
.cy2-log-note{font-size:12px;color:#5A5655;line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}
.cy2-log-star{position:absolute;bottom:8px;right:10px;opacity:0.04;pointer-events:none;}
/* 统计 */
.cy2-sGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;}
.cy2-sCard{background:var(--card);border-radius:20px;padding:16px;box-shadow:0 4px 16px rgba(0,0,0,0.04);border:0.5px solid var(--border);position:relative;overflow:hidden;}
.cy2-sLbl{font-size:9px;font-weight:800;color:var(--gray);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;}
.cy2-sVal{font-size:30px;font-weight:900;color:var(--black);line-height:1;letter-spacing:-1px;}
.cy2-sUnit{font-size:11px;font-weight:700;color:var(--gray);margin-left:2px;}
.cy2-sHint{font-size:10px;font-weight:600;color:var(--gray);margin-top:5px;}
.cy2-sstar{position:absolute;bottom:6px;right:8px;opacity:0.05;}
.cy2-chartCard{background:var(--card);border-radius:22px;padding:18px;box-shadow:0 6px 24px rgba(0,0,0,0.04);border:0.5px solid var(--border);margin-bottom:14px;}
.cy2-chartName{font-size:14px;font-weight:800;color:var(--black);margin-bottom:16px;}
.cy2-chartBars{display:flex;align-items:flex-end;gap:6px;height:80px;}
.cy2-chartCol{flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;height:100%;justify-content:flex-end;}
.cy2-chartBar{width:100%;border-radius:5px 5px 0 0;background:var(--rose-l);border:1px solid rgba(181,98,110,0.08);min-height:4px;transition:height 0.5s cubic-bezier(0.34,1.56,0.64,1);}
.cy2-chartBar.cur{background:var(--rose);border-color:transparent;}
.cy2-chartLbl{font-size:9px;font-weight:700;color:var(--gray);}
/* 底栏 */
.cy2-nav{position:absolute;bottom:0;left:0;right:0;height:calc(56px + env(safe-area-inset-bottom,20px));background:rgba(250,250,250,0.95);backdrop-filter:blur(24px);border-top:0.5px solid var(--border);display:flex;padding-bottom:env(safe-area-inset-bottom,20px);}
.cy2-ntab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;padding-top:6px;}
.cy2-ntab:active{opacity:0.5;}
.cy2-ntxt{font-size:10px;font-weight:700;color:var(--gray);}
.cy2-ntab.active .cy2-ntxt{color:var(--rose);}
.cy2-ndot{width:4px;height:4px;border-radius:50%;background:var(--rose);opacity:0;margin-top:1px;transition:opacity 0.2s;}
.cy2-ntab.active .cy2-ndot{opacity:1;}
/* 弹窗 */
.cy2-sheet-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.22);backdrop-filter:blur(12px);z-index:50;display:none;align-items:flex-end;}
.cy2-sheet-overlay.active{display:flex;}
.cy2-sheet{background:#FAFAFA;border-radius:32px 32px 0 0;width:100%;max-height:92vh;overflow-y:auto;scrollbar-width:none;animation:cy2Up 0.4s cubic-bezier(0.16,1,0.3,1);}
.cy2-sheet::-webkit-scrollbar{display:none;}
@keyframes cy2Up{from{transform:translateY(100%);opacity:0.5}to{transform:translateY(0);opacity:1}}
.cy2-sheet-sticky{position:sticky;top:0;background:rgba(250,250,250,0.95);backdrop-filter:blur(20px);padding:12px 20px 14px;border-bottom:0.5px solid var(--border);z-index:10;}
.cy2-sheet-handle{width:36px;height:4px;border-radius:2px;background:rgba(0,0,0,0.1);margin:0 auto 14px;}
.cy2-sheet-hd{display:flex;align-items:center;justify-content:space-between;}
.cy2-sheet-title{font-size:20px;font-weight:900;color:var(--black);letter-spacing:-0.5px;}
.cy2-sheet-sub{font-size:11px;font-weight:600;color:var(--gray);letter-spacing:0.5px;margin-top:2px;}
.cy2-sheet-close{width:28px;height:28px;border-radius:50%;background:var(--gray-l);display:flex;align-items:center;justify-content:center;cursor:pointer;}
.cy2-sheet-body{padding:18px 20px;}
/* Block */
.cy2-block{background:var(--card);border-radius:20px;padding:16px;margin-bottom:12px;border:0.5px solid var(--border);box-shadow:0 1px 4px rgba(0,0,0,0.03);}
.cy2-blbl{font-size:9px;font-weight:800;color:var(--gray);letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;display:flex;align-items:center;gap:6px;}
.cy2-bldot{width:4px;height:4px;border-radius:50%;background:var(--rose);}
/* Toggle */
.cy2-trow{display:flex;align-items:center;justify-content:space-between;}
.cy2-tname{font-size:15px;font-weight:800;color:var(--black);}
.cy2-thint{font-size:11px;font-weight:600;color:var(--gray);margin-top:2px;}
.cy2-ttrack{width:48px;height:28px;border-radius:14px;background:rgba(0,0,0,0.1);position:relative;cursor:pointer;transition:background 0.3s;flex-shrink:0;}
.cy2-ttrack.on{background:var(--rose);}
.cy2-tthumb{position:absolute;top:4px;left:4px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,0.2);transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1);}
.cy2-ttrack.on .cy2-tthumb{transform:translateX(20px);}
/* Slider */
.cy2-sld-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
.cy2-sld-name{font-size:14px;font-weight:800;color:var(--black);display:flex;align-items:center;gap:7px;}
.cy2-sld-badge{font-size:11px;font-weight:800;color:var(--rose);background:var(--rose-l);padding:3px 9px;border-radius:8px;border:0.5px solid rgba(181,98,110,0.15);}
.cy2-sld-track{position:relative;height:6px;background:var(--gray-l);border-radius:3px;cursor:pointer;margin-bottom:10px;}
.cy2-sld-fill{position:absolute;left:0;top:0;height:100%;border-radius:3px;background:linear-gradient(90deg,var(--rose-l) 0%,var(--rose) 100%);pointer-events:none;}
.cy2-sld-thumb{position:absolute;top:50%;transform:translate(-50%,-50%);width:22px;height:22px;border-radius:50%;background:#fff;border:2px solid var(--rose);box-shadow:0 2px 10px rgba(181,98,110,0.25);cursor:grab;z-index:2;}
.cy2-sld-steps{display:flex;justify-content:space-between;}
.cy2-sld-step{font-size:9px;font-weight:700;color:var(--gray);}
/* Mood */
.cy2-mgrid{display:flex;flex-wrap:wrap;gap:7px;}
.cy2-mchip{display:flex;align-items:center;gap:5px;padding:8px 13px;border-radius:22px;background:var(--gray-l);cursor:pointer;transition:all 0.2s;border:1.5px solid transparent;}
.cy2-mchip:active{transform:scale(0.93);}
.cy2-mchip.on{background:var(--rose-l);border-color:rgba(181,98,110,0.2);}
.cy2-mchip-txt{font-size:12px;font-weight:700;color:var(--gray);}
.cy2-mchip.on .cy2-mchip-txt{color:var(--rose);}
/* Textarea */
.cy2-ta{width:100%;min-height:90px;background:var(--gray-l);border:1.5px solid transparent;border-radius:16px;padding:13px 15px;font-size:13px;font-weight:500;color:var(--black);resize:none;outline:none;font-family:inherit;line-height:1.6;transition:all 0.2s;}
.cy2-ta:focus{border-color:rgba(181,98,110,0.3);background:#fff;box-shadow:0 0 0 3px rgba(181,98,110,0.06);}
.cy2-ta::placeholder{color:rgba(142,142,147,0.7);}
/* Save btn */
.cy2-savebtn{width:100%;height:54px;border-radius:18px;background:var(--black);color:#fff;font-size:13px;font-weight:800;letter-spacing:2px;text-transform:uppercase;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:transform 0.15s,box-shadow 0.15s;box-shadow:0 6px 20px rgba(0,0,0,0.15);margin-top:8px;}
.cy2-savebtn:active{transform:scale(0.97);}
/* Reminder block */
.cy2-rin{width:100%;background:var(--gray-l);border:1.5px solid transparent;border-radius:14px;padding:11px 14px;font-size:13px;font-weight:500;color:var(--black);outline:none;font-family:inherit;transition:all 0.2s;}
.cy2-rin:focus{border-color:rgba(181,98,110,0.3);background:#fff;}
/* Toast */
.cy2-toast{position:absolute;bottom:calc(70px + env(safe-area-inset-bottom,20px));left:50%;transform:translateX(-50%) translateY(16px);background:var(--black);color:#fff;font-size:12px;font-weight:700;padding:10px 22px;border-radius:22px;opacity:0;transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);z-index:999;white-space:nowrap;pointer-events:none;box-shadow:0 6px 20px rgba(0,0,0,0.15);}
.cy2-toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
/* Empty */
.cy2-empty{text-align:center;padding:48px 24px;color:var(--gray);}
.cy2-empty-icon{margin-bottom:14px;opacity:0.3;}
.cy2-empty-txt{font-size:14px;font-weight:700;}
.cy2-empty-sub{font-size:12px;font-weight:500;margin-top:4px;}
</style>

<!-- Header -->
<div class="cy2-header">
  <svg class="cy2-header-deco" width="60" height="60" viewBox="0 0 24 24" fill="#1C1C1E"><path d="M12 2 L13.8 9.2 L21 12 L13.8 14.8 L12 22 L10.2 14.8 L3 12 L10.2 9.2 Z"/></svg>
  <div>
    <div class="cy2-title">Cycle<span>.</span></div>
    <div class="cy2-sub">Period Tracker</div>
  </div>
  <div class="cy2-hbtns">
    <div class="cy2-hbtn-ghost" id="cy2-reminder-btn" onclick="CycleApp._openReminder()">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gray)" stroke-width="2" stroke-linecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
    </div>
    <div class="cy2-hbtn" id="cy2-add-btn" onclick="CycleApp._openLog()">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
    </div>
    <div class="cy2-hbtn-ghost" onclick="CycleApp.close()">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gray)" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </div>
  </div>
</div>

<!-- Main -->
<div class="cy2-main" id="cy2-main">
  <!-- Home -->
  <div class="cy2-view active" id="cy2-view-home">
    <div class="cy2-hero" id="cy2-hero">
      <svg class="cy2-hero-bg" viewBox="0 0 400 180" preserveAspectRatio="xMaxYMid slice">
        <path d="M320 20 L332 56 L370 56 L340 76 L352 112 L320 92 L288 112 L300 76 L270 56 L308 56 Z" fill="rgba(181,98,110,0.04)"/>
        <path d="M360 100 L366 118 L385 118 L370 128 L376 146 L360 136 L344 146 L350 128 L335 118 L354 118 Z" fill="rgba(195,167,114,0.05)"/>
        <path d="M290 130 L293 140 L304 140 L295 146 L298 156 L290 150 L282 156 L285 146 L276 140 L287 140 Z" fill="rgba(181,98,110,0.03)"/>
      </svg>
      <div class="cy2-hero-top">
        <div>
          <div class="cy2-tag"><svg width="8" height="8" viewBox="0 0 24 24" fill="var(--rose)"><path d="M12 2 L13.8 9.2 L21 12 L13.8 14.8 L12 22 L10.2 14.8 L3 12 L10.2 9.2 Z"/></svg><span id="cy2-tag"></span></div>
          <div class="cy2-phase" id="cy2-phase"></div>
          <div class="cy2-desc" id="cy2-desc"></div>
        </div>
        <div class="cy2-hero-right">
          <div class="cy2-num" id="cy2-num"></div>
          <div class="cy2-unit" id="cy2-unit"></div>
        </div>
      </div>
      <div class="cy2-prog-track"><div class="cy2-prog-fill" id="cy2-prog" style="width:0%"></div></div>
      <div class="cy2-prog-lbls"><span class="cy2-prog-lbl">经期开始</span><span class="cy2-prog-lbl" id="cy2-mid-lbl"></span><span class="cy2-prog-lbl">下次预计</span></div>
    </div>
    <div class="cy2-qrow">
      <div class="cy2-qcard" onclick="CycleApp._switchTab('stats')">
        <svg class="cy2-qstar" width="40" height="40" viewBox="0 0 24 24" fill="#1C1C1E"><path d="M12 2 L13.8 9.2 L21 12 L13.8 14.8 L12 22 L10.2 14.8 L3 12 L10.2 9.2 Z"/></svg>
        <div class="cy2-qcard-ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" stroke-width="2" stroke-linecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
        <div><span class="cy2-qnum" id="qc-cycle2">28</span><span class="cy2-qunit">天</span></div>
        <div class="cy2-qlbl">平均周期</div>
      </div>
      <div class="cy2-qcard" onclick="CycleApp._switchTab('stats')">
        <svg class="cy2-qstar" width="40" height="40" viewBox="0 0 24 24" fill="#1C1C1E"><path d="M12 2 L13.8 9.2 L21 12 L13.8 14.8 L12 22 L10.2 14.8 L3 12 L10.2 9.2 Z"/></svg>
        <div class="cy2-qcard-ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2C6 8 4 12 4 15a8 8 0 0 0 16 0c0-3-2-7-8-13z" fill="var(--rose-l)" stroke="var(--rose)" stroke-width="1.8" stroke-linecap="round"/></svg></div>
        <div><span class="cy2-qnum" id="qc-logs2">0</span><span class="cy2-qunit">条</span></div>
        <div class="cy2-qlbl">累计记录</div>
      </div>
      <div class="cy2-qcard" onclick="CycleApp._openLog()">
        <svg class="cy2-qstar" width="40" height="40" viewBox="0 0 24 24" fill="#1C1C1E"><path d="M12 2 L13.8 9.2 L21 12 L13.8 14.8 L12 22 L10.2 14.8 L3 12 L10.2 9.2 Z"/></svg>
        <div class="cy2-qcard-ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div>
        <div style="display:flex;align-items:center;gap:3px;"><span id="qc-today-dot2" style="width:6px;height:6px;border-radius:50%;background:rgba(142,142,147,0.4);display:inline-block;"></span><span class="cy2-qnum" style="font-size:14px;" id="qc-today2">未记录</span></div>
        <div class="cy2-qlbl">今日状态</div>
      </div>
    </div>
    <div class="cy2-sec"><div class="cy2-sec-title">本月日历</div><div class="cy2-sec-more" onclick="CycleApp._switchTab('history')">全部 ›</div></div>
    <div class="cy2-cal">
      <div class="cy2-cal-nav">
        <div class="cy2-cal-nbtn" onclick="CycleApp._prevMonth()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" stroke-width="2.5" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg></div>
        <div class="cy2-cal-mon" id="cy2-cal-mon"></div>
        <div class="cy2-cal-nbtn" onclick="CycleApp._nextMonth()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg></div>
      </div>
      <div class="cy2-wds"><div class="cy2-wd">日</div><div class="cy2-wd">一</div><div class="cy2-wd">二</div><div class="cy2-wd">三</div><div class="cy2-wd">四</div><div class="cy2-wd">五</div><div class="cy2-wd">六</div></div>
      <div class="cy2-days" id="cy2-days"></div>
    </div>
    <div class="cy2-sec"><div class="cy2-sec-title">最近记录</div></div>
    <div id="cy2-recent"></div>
  </div>
  <!-- Stats -->
  <div class="cy2-view" id="cy2-view-stats">
    <div style="height:10px;"></div>
    <div class="cy2-sGrid">
      <div class="cy2-sCard"><svg class="cy2-sstar" width="40" height="40" viewBox="0 0 24 24" fill="#1C1C1E"><path d="M12 2 L13.8 9.2 L21 12 L13.8 14.8 L12 22 L10.2 14.8 L3 12 L10.2 9.2 Z"/></svg><div class="cy2-sLbl">平均周期</div><div><span class="cy2-sVal" id="s2-cycle">28</span><span class="cy2-sUnit">天</span></div><div class="cy2-sHint">正常 21–35 天</div></div>
      <div class="cy2-sCard"><svg class="cy2-sstar" width="40" height="40" viewBox="0 0 24 24" fill="#1C1C1E"><path d="M12 2 L13.8 9.2 L21 12 L13.8 14.8 L12 22 L10.2 14.8 L3 12 L10.2 9.2 Z"/></svg><div class="cy2-sLbl">经期时长</div><div><span class="cy2-sVal" id="s2-dur">5</span><span class="cy2-sUnit">天</span></div><div class="cy2-sHint">正常 3–7 天</div></div>
      <div class="cy2-sCard"><svg class="cy2-sstar" width="40" height="40" viewBox="0 0 24 24" fill="#1C1C1E"><path d="M12 2 L13.8 9.2 L21 12 L13.8 14.8 L12 22 L10.2 14.8 L3 12 L10.2 9.2 Z"/></svg><div class="cy2-sLbl">累计记录</div><div><span class="cy2-sVal" id="s2-total">0</span><span class="cy2-sUnit">条</span></div><div class="cy2-sHint">坚持打卡中</div></div>
      <div class="cy2-sCard"><svg class="cy2-sstar" width="40" height="40" viewBox="0 0 24 24" fill="#1C1C1E"><path d="M12 2 L13.8 9.2 L21 12 L13.8 14.8 L12 22 L10.2 14.8 L3 12 L10.2 9.2 Z"/></svg><div class="cy2-sLbl">平均痛度</div><div><span class="cy2-sVal" id="s2-pain">--</span><span class="cy2-sUnit" id="s2-pain-u"></span></div><div class="cy2-sHint">近期均值</div></div>
    </div>
    <div class="cy2-chartCard"><div class="cy2-chartName">近 6 个月经期时长</div><div class="cy2-chartBars" id="cy2-bars"></div></div>
    <div class="cy2-chartCard"><div class="cy2-chartName">心情分布</div><div id="cy2-mood-dist" style="display:flex;flex-wrap:wrap;gap:7px;margin-top:4px;"></div></div>
  </div>
  <!-- History -->
  <div class="cy2-view" id="cy2-view-history">
    <div style="height:10px;"></div>
    <div id="cy2-all-logs"></div>
  </div>
</div>

<!-- Bottom Nav -->
<div class="cy2-nav">
  <div class="cy2-ntab active" id="cy2-tab-home" onclick="CycleApp._switchTab('home')">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" id="cy2-nav-icon-home"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    <div class="cy2-ntxt">首页</div><div class="cy2-ndot"></div>
  </div>
  <div class="cy2-ntab" id="cy2-tab-stats" onclick="CycleApp._switchTab('stats')">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gray)" stroke-width="1.8" stroke-linecap="round" id="cy2-nav-icon-stats"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
    <div class="cy2-ntxt">统计</div><div class="cy2-ndot"></div>
  </div>
  <div class="cy2-ntab" id="cy2-tab-history" onclick="CycleApp._switchTab('history')">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gray)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" id="cy2-nav-icon-history"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
    <div class="cy2-ntxt">历史</div><div class="cy2-ndot"></div>
  </div>
</div>

<!-- 记录弹窗 -->
<div class="cy2-sheet-overlay" id="cy2-log-sheet" onclick="if(event.target===this)CycleApp._closeLog()">
  <div class="cy2-sheet">
    <div class="cy2-sheet-sticky">
      <div class="cy2-sheet-handle"></div>
      <div class="cy2-sheet-hd">
        <div><div class="cy2-sheet-title" id="cy2-log-title">今日记录</div><div class="cy2-sheet-sub" id="cy2-log-sub"></div></div>
        <div class="cy2-sheet-close" onclick="CycleApp._closeLog()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gray)" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></div>
      </div>
    </div>
    <div class="cy2-sheet-body">
      <div class="cy2-block"><div class="cy2-blbl"><div class="cy2-bldot"></div>今日是否经期</div><div class="cy2-trow"><div><div class="cy2-tname">经期中</div><div class="cy2-thint">打开后解锁血量记录</div></div><div class="cy2-ttrack" id="cy2-period-toggle" onclick="CycleApp._togglePeriod()"><div class="cy2-tthumb"></div></div></div></div>
      <div class="cy2-block" id="cy2-flow-block" style="display:none;">
        <div class="cy2-blbl"><div class="cy2-bldot"></div>血量</div>
        <div class="cy2-sld-hd"><div class="cy2-sld-name"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C6 8 4 12 4 15a8 8 0 0 0 16 0c0-3-2-7-8-13z" fill="var(--rose-l)" stroke="var(--rose)" stroke-width="1.8" stroke-linecap="round"/></svg>血流量</div><div class="cy2-sld-badge" id="cy2-flow-val">中等</div></div>
        <div class="cy2-sld-track" id="cy2-flow-track" onmousedown="CycleApp._startDrag(event,'flow')" ontouchstart="CycleApp._startDrag(event,'flow')"><div class="cy2-sld-fill" id="cy2-flow-fill" style="width:50%"></div><div class="cy2-sld-thumb" id="cy2-flow-thumb" style="left:50%"></div></div>
        <div class="cy2-sld-steps"><span class="cy2-sld-step">极少</span><span class="cy2-sld-step">少</span><span class="cy2-sld-step">中等</span><span class="cy2-sld-step">多</span><span class="cy2-sld-step">极多</span></div>
      </div>
      <div class="cy2-block">
        <div class="cy2-blbl"><div class="cy2-bldot"></div>痛度</div>
        <div class="cy2-sld-hd"><div class="cy2-sld-name"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" stroke-width="1.8" stroke-linecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>疼痛程度</div><div class="cy2-sld-badge" id="cy2-pain-val">无痛</div></div>
        <div class="cy2-sld-track" id="cy2-pain-track" onmousedown="CycleApp._startDrag(event,'pain')" ontouchstart="CycleApp._startDrag(event,'pain')"><div class="cy2-sld-fill" id="cy2-pain-fill" style="width:0%"></div><div class="cy2-sld-thumb" id="cy2-pain-thumb" style="left:0%"></div></div>
        <div class="cy2-sld-steps"><span class="cy2-sld-step">无</span><span class="cy2-sld-step">轻微</span><span class="cy2-sld-step">中等</span><span class="cy2-sld-step">较强</span><span class="cy2-sld-step">剧烈</span></div>
      </div>
      <div class="cy2-block"><div class="cy2-blbl"><div class="cy2-bldot"></div>今日心情（可多选）</div><div class="cy2-mgrid" id="cy2-mood-grid"></div></div>
      <div class="cy2-block"><div class="cy2-blbl"><div class="cy2-bldot"></div>感想备注</div><textarea class="cy2-ta" id="cy2-note" placeholder="今天感觉怎么样？有什么想记录的..."></textarea></div>
      <button class="cy2-savebtn" onclick="CycleApp._saveLog()"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>SAVE · 保存记录</button>
    </div>
  </div>
</div>

<!-- 提醒设置弹窗 -->
<div class="cy2-sheet-overlay" id="cy2-reminder-sheet" onclick="if(event.target===this)CycleApp._closeReminder()">
  <div class="cy2-sheet">
    <div class="cy2-sheet-sticky">
      <div class="cy2-sheet-handle"></div>
      <div class="cy2-sheet-hd">
        <div><div class="cy2-sheet-title">提醒联系人</div><div class="cy2-sheet-sub">经期到来时自动通知 TA</div></div>
        <div class="cy2-sheet-close" onclick="CycleApp._closeReminder()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gray)" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></div>
      </div>
    </div>
    <div class="cy2-sheet-body">
      <div id="cy2-reminder-contacts"></div>
      <div class="cy2-block" style="margin-top:14px;">
        <div class="cy2-blbl"><div class="cy2-bldot"></div>提前提醒天数</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;" id="cy2-days-chips"></div>
      </div>
      <div class="cy2-block">
        <div class="cy2-blbl"><div class="cy2-bldot"></div>给 TA 留言（经期到来时一起发送）</div>
        <textarea class="cy2-ta" id="cy2-reminder-msg" placeholder="例如：记得帮我买热可乐和暖贴...我可能会有点烦躁，耐心哄我一下 🥹" style="min-height:70px;"></textarea>
        <div style="font-size:10px;font-weight:600;color:var(--gray);margin-top:8px;line-height:1.5;">这条留言会在经期预告时附带发送给 TA，让 TA 提前知道你的需求。</div>
      </div>
      <button class="cy2-savebtn" onclick="CycleApp._saveReminder()">保存提醒设置</button>
      <button onclick="CycleApp._immediateNotify()" style="width:100%;height:50px;border-radius:18px;background:var(--rose-l);color:var(--rose);font-size:13px;font-weight:800;letter-spacing:1px;border:1.5px solid rgba(181,98,110,0.2);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px;transition:transform 0.15s;" onmousedown="this.style.transform='scale(0.97)'" onmouseup="this.style.transform='scale(1)'">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" stroke-width="2.5" stroke-linecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        立即推送给 TA
      </button>
    </div>
  </div>
</div>

<!-- Toast -->
<div class="cy2-toast" id="cy2-toast"></div>
<div class="cy2-end-fab" id="cy2-end-fab" onclick="CycleApp._endPeriod()">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
  <div class="cy2-end-fab-txt">结束</div>
</div>
        `;
        document.body.appendChild(modal);
    }

    function getModal() { return document.getElementById('cycle-app-modal'); }

    // ─── 渲染核心 ───
    function renderHero() {
        const st = getStatus();
        document.getElementById('cy2-tag').textContent = st.tag;
        document.getElementById('cy2-phase').textContent = st.phase;
        document.getElementById('cy2-desc').textContent = st.desc;
        document.getElementById('cy2-num').textContent = st.num;
        document.getElementById('cy2-unit').textContent = st.unit;
        document.getElementById('cy2-prog').style.width = st.progress + '%';
        document.getElementById('cy2-mid-lbl').textContent = '第 ' + Math.floor(D.cycleLen / 2) + ' 天';
        document.getElementById('qc-cycle2').textContent = D.cycleLen;
        document.getElementById('qc-logs2').textContent = Object.keys(D.logs).length;
        const tl = D.logs[todayStr];
        const dot = document.getElementById('qc-today-dot2');
        const txt = document.getElementById('qc-today2');
        if (tl) { dot.style.background = 'var(--rose)'; txt.textContent = '已记录'; }
        else { dot.style.background = 'rgba(142,142,147,0.4)'; txt.textContent = '未记录'; }
    }

    function renderCal() {
        const ML = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        document.getElementById('cy2-cal-mon').textContent = calY + '年' + ML[calM];
        const first = new Date(calY, calM, 1).getDay();
        const total = new Date(calY, calM + 1, 0).getDate();
        const predicted = getPredicted();
        const wrap = document.getElementById('cy2-days');
        wrap.innerHTML = '';
        for (let i = 0; i < first; i++) { const el = document.createElement('div'); el.className = 'cy2-day empty'; wrap.appendChild(el); }
        for (let d = 1; d <= total; d++) {
            const ds = calY + '-' + String(calM + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
            const el = document.createElement('div');
            el.className = 'cy2-day';
            el.textContent = d;
            if (ds === todayStr) el.classList.add('today');
            if (D.periodDays.includes(ds)) {
                el.classList.add('period');
                const prev = addDays(ds, -1), next = addDays(ds, 1);
                // 结束日：这一天在经期内，但明天不在
                if (!D.periodDays.includes(next)) el.classList.add('period-end');
                else if (!D.periodDays.includes(prev)) el.classList.add('period-edge');
            }
            if (predicted.includes(ds)) el.classList.add('predicted');
            if (D.logs[ds]) el.classList.add('has-log');
            el.onclick = () => _openLog(ds);
            wrap.appendChild(el);
        }
    }

    function logCardHTML(ds, log, showLine) {
        const d = new Date(ds + 'T12:00:00');
        const WK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const dateLabel = (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + WK[d.getDay()];
        const badges = [];
        if (log.isPeriod) badges.push(`<span class="cy2-badge cy2-br">经期</span>`);
        if (log.pain >= 3) badges.push(`<span class="cy2-badge cy2-bg">${PAIN[log.pain]}</span>`);
        if (log.moods?.length) { const ml = MOODS.find(m => m.k === log.moods[0])?.l; if (ml) badges.push(`<span class="cy2-badge cy2-bs">${ml}</span>`); }
        const stats = [];
        if (log.isPeriod) stats.push(`<span class="cy2-log-stat"><svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M12 2C6 8 4 12 4 15a8 8 0 0 0 16 0c0-3-2-7-8-13z" fill="var(--rose-l)" stroke="var(--rose)" stroke-width="2"/></svg>${FLOW[log.flow]}</span>`);
        stats.push(`<span class="cy2-log-stat"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--gray)" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>${PAIN[log.pain]}</span>`);
        const wrapperId = 'cy2-wrap-' + ds;
        const innerId = 'cy2-inner-' + ds;
        return `<div id="${wrapperId}" style="position:relative;margin-bottom:10px;border-radius:20px;overflow:hidden;touch-action:pan-y;">
      <div style="position:absolute;top:0;right:0;bottom:0;width:80px;background:#FF3B30;border-radius:20px;display:flex;align-items:center;justify-content:center;cursor:pointer;" onclick="event.stopPropagation();CycleApp._deleteLog('${ds}')">
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;pointer-events:none;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          <span style="font-size:10px;font-weight:800;color:#fff;letter-spacing:0.5px;">删除</span>
        </div>
      </div>
      <div id="${innerId}" style="position:relative;transform:translateX(0);transition:transform 0.3s cubic-bezier(0.16,1,0.3,1);will-change:transform;background:var(--card);border-radius:20px;padding:14px 16px;border:0.5px solid var(--border);box-shadow:0 4px 16px rgba(0,0,0,0.04);display:flex;gap:12px;overflow:hidden;">
        <svg style="position:absolute;bottom:8px;right:10px;opacity:0.04;pointer-events:none;" width="50" height="50" viewBox="0 0 24 24" fill="#1C1C1E"><path d="M12 2 L13.8 9.2 L21 12 L13.8 14.8 L12 22 L10.2 14.8 L3 12 L10.2 9.2 Z"/></svg>
        <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;padding-top:2px;">
          <div class="cy2-log-dot${log.isPeriod ? '' : ' g'}"></div>
          ${showLine ? '<div class="cy2-log-line"></div>' : ''}
        </div>
        <div class="cy2-log-body" style="flex:1;min-width:0;">
          <div class="cy2-log-top">
            <div class="cy2-log-date">${dateLabel}</div>
            <div class="cy2-log-badges">${badges.join('')}</div>
          </div>
          <div class="cy2-log-stats">${stats.join('')}</div>
          ${log.note ? `<div class="cy2-log-note">${log.note}</div>` : ''}
        </div>
      </div>
    </div>`;
    }

    // ─── 滑动删除引擎 ───
    let _swipeOpened = {};
    const SWIPE_THRESHOLD = 40;
    const SWIPE_OPEN_X = -80;

    // 用 JS 事件绑定代替 HTML inline，彻底避免冒泡问题
    function _bindSwipe(wrapperId, innerId, ds) {
        const wrapper = document.getElementById(wrapperId);
        const inner = document.getElementById(innerId);
        if (!wrapper || !inner) return;

        let startX = 0, startY = 0, isDragging = false, isVertical = false;

        wrapper.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isDragging = false;
            isVertical = false;
        }, { passive: true });

        wrapper.addEventListener('touchmove', function(e) {
            const dx = e.touches[0].clientX - startX;
            const dy = e.touches[0].clientY - startY;

            if (!isDragging) {
                // 第一次移动时判断方向
                if (Math.abs(dy) > Math.abs(dx)) {
                    isVertical = true;
                    return;
                }
                isDragging = true;
            }
            if (isVertical) return;

            e.preventDefault();
            e.stopPropagation();

            const base = _swipeOpened[wrapperId] ? SWIPE_OPEN_X : 0;
            const clamped = Math.max(SWIPE_OPEN_X, Math.min(0, base + dx));
            inner.style.transition = 'none';
            inner.style.transform = `translateX(${clamped}px)`;
        }, { passive: false });

        wrapper.addEventListener('touchend', function(e) {
            if (isVertical || !isDragging) {
                // 垂直滑动或未移动 → 视为点击
                if (!isVertical && !isDragging) {
                    _cardTap(ds, wrapperId, innerId);
                }
                return;
            }

            const dx = e.changedTouches[0].clientX - startX;
            inner.style.transition = 'transform 0.3s cubic-bezier(0.16,1,0.3,1)';
            const isOpened = !!_swipeOpened[wrapperId];

            if (!isOpened && dx < -SWIPE_THRESHOLD) {
                inner.style.transform = `translateX(${SWIPE_OPEN_X}px)`;
                _swipeOpened[wrapperId] = innerId;
                // 关闭其他
                Object.keys(_swipeOpened).forEach(wid => {
                    if (wid !== wrapperId) {
                        const oel = document.getElementById(_swipeOpened[wid]);
                        if (oel) { oel.style.transition = 'transform 0.3s cubic-bezier(0.16,1,0.3,1)'; oel.style.transform = 'translateX(0)'; }
                        delete _swipeOpened[wid];
                    }
                });
            } else if (isOpened && dx > SWIPE_THRESHOLD / 2) {
                inner.style.transform = 'translateX(0)';
                delete _swipeOpened[wrapperId];
            } else {
                inner.style.transform = `translateX(${isOpened ? SWIPE_OPEN_X : 0}px)`;
            }
        }, { passive: true });
    }

    function _cardTap(ds, wrapperId, innerId) {
        if (_swipeOpened[wrapperId]) {
            const inner = document.getElementById(innerId);
            if (inner) { inner.style.transition = 'transform 0.3s cubic-bezier(0.16,1,0.3,1)'; inner.style.transform = 'translateX(0)'; }
            delete _swipeOpened[wrapperId];
            return;
        }
        _openLog(ds);
    }

    function _closeAllSwipe() {
        Object.keys(_swipeOpened).forEach(wid => {
            const oel = document.getElementById(_swipeOpened[wid]);
            if (oel) { oel.style.transition = 'transform 0.3s cubic-bezier(0.16,1,0.3,1)'; oel.style.transform = 'translateX(0)'; }
        });
        _swipeOpened = {};
    }

    function _deleteLog(ds) {
        delete D.logs[ds];
        D.periodDays = D.periodDays.filter(x => x !== ds);
        const starts = findPeriodStarts();
        if (starts.length) D.lastStart = starts[starts.length - 1];
        else if (!D.periodDays.length) D.lastStart = null;
        save();
        _swipeOpened = {};
        cyToast('✦ 记录已删除');
        renderAll();
        if (document.getElementById('cy2-view-history')?.classList.contains('active')) renderHistory();
    }

    function renderRecent() {
        const wrap = document.getElementById('cy2-recent');
        if (!wrap) return;
        const entries = Object.entries(D.logs).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 5);
        if (!entries.length) { wrap.innerHTML = `<div class="cy2-empty"><div class="cy2-empty-icon"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--gray)" stroke-width="1.2"><path d="M12 2 L13.8 9.2 L21 12 L13.8 14.8 L12 22 L10.2 14.8 L3 12 L10.2 9.2 Z"/></svg></div><div class="cy2-empty-txt">暂无记录</div><div class="cy2-empty-sub">点右上角「+」开始你的第一条记录</div></div>`; return; }
        wrap.innerHTML = entries.map(([ds, log], i) => logCardHTML(ds, log, i < entries.length - 1)).join('');
        setTimeout(() => {
            entries.forEach(([ds]) => {
                _bindSwipe('cy2-wrap-' + ds, 'cy2-inner-' + ds, ds);
            });
        }, 50);
    }

    function renderHistory() {
        const wrap = document.getElementById('cy2-all-logs');
        if (!wrap) return;
        const entries = Object.entries(D.logs).sort((a, b) => b[0].localeCompare(a[0]));
        if (!entries.length) { wrap.innerHTML = `<div class="cy2-empty"><div class="cy2-empty-icon"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--gray)" stroke-width="1.2"><path d="M12 2 L13.8 9.2 L21 12 L13.8 14.8 L12 22 L10.2 14.8 L3 12 L10.2 9.2 Z"/></svg></div><div class="cy2-empty-txt">暂无历史记录</div><div class="cy2-empty-sub">开始打卡后会出现在这里</div></div>`; return; }
        wrap.innerHTML = entries.map(([ds, log], i) => logCardHTML(ds, log, i < entries.length - 1)).join('');
        setTimeout(() => {
            entries.forEach(([ds]) => {
                _bindSwipe('cy2-wrap-' + ds, 'cy2-inner-' + ds, ds);
            });
        }, 50);
    }

    function renderHistory() {
        const wrap = document.getElementById('cy2-all-logs');
        if (!wrap) return;
        const entries = Object.entries(D.logs).sort((a, b) => b[0].localeCompare(a[0]));
        if (!entries.length) {
            wrap.innerHTML = `<div class="cy2-empty"><div class="cy2-empty-icon"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--gray)" stroke-width="1.2"><path d="M12 2 L13.8 9.2 L21 12 L13.8 14.8 L12 22 L10.2 14.8 L3 12 L10.2 9.2 Z"/></svg></div><div class="cy2-empty-txt">暂无历史记录</div><div class="cy2-empty-sub">开始打卡后会出现在这里</div></div>`;
            return;
        }
        wrap.innerHTML = entries.map(([ds, log], i) => logCardHTML(ds, log, i < entries.length - 1)).join('');
        setTimeout(() => {
            entries.forEach(([ds]) => {
                _bindSwipe('cy2-wrap-' + ds, 'cy2-inner-' + ds, ds);
            });
        }, 50);
    }

    function renderStats() {
        document.getElementById('s2-cycle').textContent = D.cycleLen;
        document.getElementById('s2-dur').textContent = calcPeriodLen();
        document.getElementById('s2-total').textContent = Object.keys(D.logs).length;
        const pains = Object.values(D.logs).map(l => l.pain).filter(p => p !== undefined);
        if (pains.length) { document.getElementById('s2-pain').textContent = (pains.reduce((a, b) => a + b, 0) / pains.length).toFixed(1); document.getElementById('s2-pain-u').textContent = '/4'; }
        const bars = document.getElementById('cy2-bars');
        if (!bars) return;
        bars.innerHTML = '';
        const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        for (let i = 5; i >= 0; i--) {
            const dd = new Date(today); dd.setMonth(dd.getMonth() - i);
            const prefix = dd.getFullYear() + '-' + String(dd.getMonth() + 1).padStart(2, '0');
            const cnt = D.periodDays.filter(x => x.startsWith(prefix)).length || (i > 0 ? Math.floor(Math.random() * 2) + 4 : 0);
            const h = Math.max(4, Math.min(70, cnt / 7 * 70));
            const col = document.createElement('div');
            col.className = 'cy2-chartCol';
            col.innerHTML = `<div class="cy2-chartBar${i === 0 ? ' cur' : ''}" style="height:${h}px;"></div><div class="cy2-chartLbl">${MN[dd.getMonth()]}</div>`;
            bars.appendChild(col);
        }
        const dist = document.getElementById('cy2-mood-dist');
        if (!dist) return;
        dist.innerHTML = '';
        const mc = {};
        Object.values(D.logs).forEach(l => (l.moods || []).forEach(k => mc[k] = (mc[k] || 0) + 1));
        if (!Object.keys(mc).length) { dist.innerHTML = '<div style="color:var(--gray);font-size:12px;font-weight:600;">暂无心情数据</div>'; return; }
        MOODS.forEach(m => {
            if (!mc[m.k]) return;
            const c = document.createElement('div');
            c.className = 'cy2-mchip on';
            c.style.pointerEvents = 'none';
            c.innerHTML = `<span class="cy2-mchip-txt">${m.l} ×${mc[m.k]}</span>`;
            dist.appendChild(c);
        });
    }

    function renderAll() {
        const st = getStatus();
        renderHero();
        renderCal();
        renderRecent();
        // 控制结束悬浮键
        const fab = document.getElementById('cy2-end-fab');
        if (fab) fab.style.display = st.inPeriod ? 'flex' : 'none';
    }

    function _endPeriod() {
        if (!D.periodDays.includes(todayStr)) return;
        if (!confirm('确认经期已于今日结束？系统将自动校准您的经期长度。')) return;

        // 1. 在今日日志中记录已结束
        if (!D.logs[todayStr]) {
            D.logs[todayStr] = { isPeriod: true, flow: 0, pain: 0, moods: [], note: '经期于今日手动点击结束', ts: Date.now() };
        } else {
            D.logs[todayStr].note = (D.logs[todayStr].note ? D.logs[todayStr].note + '\n' : '') + '经期于今日手动点击结束';
        }

        // 2. 计算本次经期长度并校准 D.periodLen
        const starts = findPeriodStarts();
        const lastStart = starts[starts.length - 1];
        const actualLen = diffDays(lastStart, todayStr) + 1;
        D.periodLen = actualLen;

        save();
        renderAll();
        cyToast('✦ 经期已结束，已为您更新预测模型');
        
        // 3. 通知联系人
        if (typeof contacts !== 'undefined' && typeof currentContactId !== 'undefined' && currentContactId) {
            const c = contacts.find(x => x.id === currentContactId);
            if (c) {
                const aiText = `[🌙 经期追踪系统 · 状态更新]\n\n用户刚刚手动确认：本次经期已于今日正式结束。本次持续时长为 ${actualLen} 天。\n\n【请以符合你人设的方式表达关心。可以表现出松了一口气，叮嘱她虽然结束了但也不要立刻吃冰或剧烈运动，或者问问她现在身体感觉有没有好一点。语气要自然。】`;
                c.history.push({
                    role: 'system_sum',
                    content: `<i>✧ 经期已结束（共 ${actualLen} 天）</i>\n<span style="display:none;">${aiText}</span>`,
                    timestamp: Date.now()
                });
                if (typeof saveData === 'function') saveData();
                if (typeof renderChatHistory === 'function' && typeof isUserInChatRoom === 'function' && isUserInChatRoom(c.id)) renderChatHistory();
            }
        }
    }

    // ─── 记录弹窗 ───
    function _openLog(ds) {
        curDate = ds || todayStr;
        const d = new Date(curDate + 'T12:00:00');
        const ML = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        document.getElementById('cy2-log-sub').textContent = d.getFullYear() + '年' + ML[d.getMonth()] + d.getDate() + '日';
        document.getElementById('cy2-log-title').textContent = curDate === todayStr ? '今日记录' : '补录记录';
        const ex = D.logs[curDate];
        isPeriod = ex ? ex.isPeriod : D.periodDays.includes(curDate);
        flowV = ex ? (ex.flow ?? 2) : 2;
        painV = ex ? (ex.pain ?? 0) : 0;
        selMoods = ex ? [...(ex.moods || [])] : [];
        const t = document.getElementById('cy2-period-toggle');
        t.classList.toggle('on', isPeriod);
        document.getElementById('cy2-flow-block').style.display = isPeriod ? 'block' : 'none';
        ['flow', 'pain'].forEach(tp => {
            const v = tp === 'flow' ? flowV : painV;
            const pct = v / 4 * 100;
            document.getElementById('cy2-' + tp + '-fill').style.width = pct + '%';
            document.getElementById('cy2-' + tp + '-thumb').style.left = pct + '%';
            document.getElementById('cy2-' + tp + '-val').textContent = (tp === 'flow' ? FLOW : PAIN)[v];
        });
        document.getElementById('cy2-note').value = ex?.note || '';
        _renderMoods();
        document.getElementById('cy2-log-sheet').classList.add('active');
    }

    function _closeLog() { document.getElementById('cy2-log-sheet').classList.remove('active'); }

    function _togglePeriod() {
        isPeriod = !isPeriod;
        document.getElementById('cy2-period-toggle').classList.toggle('on', isPeriod);
        document.getElementById('cy2-flow-block').style.display = isPeriod ? 'block' : 'none';
    }

    function _renderMoods() {
        const g = document.getElementById('cy2-mood-grid');
        if (!g) return;
        g.innerHTML = '';
        MOODS.forEach(m => {
            const el = document.createElement('div');
            el.className = 'cy2-mchip' + (selMoods.includes(m.k) ? ' on' : '');
            el.innerHTML = `<span class="cy2-mchip-txt">${m.l}</span>`;
            el.onclick = () => {
                const i = selMoods.indexOf(m.k);
                if (i >= 0) selMoods.splice(i, 1); else selMoods.push(m.k);
                _renderMoods();
            };
            g.appendChild(el);
        });
    }

    function _saveLog() {
        const note = document.getElementById('cy2-note').value.trim();
        D.logs[curDate] = { isPeriod, flow: flowV, pain: painV, moods: [...selMoods], note, ts: Date.now() };
        if (isPeriod && !D.periodDays.includes(curDate)) { D.periodDays.push(curDate); D.periodDays.sort(); }
        else if (!isPeriod) D.periodDays = D.periodDays.filter(x => x !== curDate);
        // 更新 lastStart
        const starts = findPeriodStarts();
        if (starts.length) D.lastStart = starts[starts.length - 1];
        save();
        _closeLog();
        cyToast('✦ 记录已保存');
        renderAll();
        notifyLogSaved(curDate, D.logs[curDate]);
    }

    // ─── 提醒设置 ───
    function _openReminder() {
        const wrap = document.getElementById('cy2-reminder-contacts');
        if (!wrap) return;
        wrap.innerHTML = '';
        if (typeof contacts !== 'undefined' && contacts.length) {
            contacts.filter(c => !c.isGroup).forEach(c => {
                const cid = c.id;
                const cfg = D.reminders[cid] || {};
                const name = c.chatRemark || c.name;
                const av = c.chatAvatar || c.avatar || '';
                const block = document.createElement('div');
                block.className = 'cy2-block';
                block.style.marginBottom = '10px';
                block.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:36px;height:36px;border-radius:10px;overflow:hidden;background:var(--gray-l);flex-shrink:0;display:flex;align-items:center;justify-content:center;">
                ${av ? `<img src="${av}" style="width:100%;height:100%;object-fit:cover;">` : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gray)" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>`}
              </div>
              <div>
                <div style="font-size:14px;font-weight:800;color:var(--black);">${name}</div>
                <div style="font-size:10px;font-weight:600;color:var(--gray);margin-top:1px;">经期到来时提醒 TA</div>
              </div>
            </div>
            <div class="cy2-ttrack${cfg.enabled ? ' on' : ''}" id="cy2-rem-toggle-${cid}" onclick="CycleApp._toggleReminder('${cid}')"><div class="cy2-tthumb"></div></div>
          </div>`;
                wrap.appendChild(block);
            });
        } else {
            wrap.innerHTML = '<div style="color:var(--gray);font-size:13px;font-weight:600;text-align:center;padding:16px 0;">暂无联系人</div>';
        }
        // 提前天数选择
        const daysWrap = document.getElementById('cy2-days-chips');
        if (daysWrap) {
            daysWrap.innerHTML = '';
            const opts = [1, 2, 3];
            // 用当前第一个开启提醒的联系人的设置
            let curDays = 2;
            const firstEnabled = Object.entries(D.reminders).find(([, v]) => v.enabled);
            if (firstEnabled) curDays = firstEnabled[1].daysBeforeNotify || 2;
            opts.forEach(n => {
                const chip = document.createElement('div');
                chip.className = 'cy2-mchip' + (curDays === n ? ' on' : '');
                chip.id = 'cy2-days-chip-' + n;
                chip.innerHTML = `<span class="cy2-mchip-txt">提前 ${n} 天</span>`;
                chip.onclick = () => {
                    document.querySelectorAll('[id^="cy2-days-chip-"]').forEach(el => el.classList.remove('on'));
                    chip.classList.add('on');
                };
                daysWrap.appendChild(chip);
            });
        }
        // 留言
        const msgInput = document.getElementById('cy2-reminder-msg');
        if (msgInput) {
            const firstEnabled2 = Object.entries(D.reminders).find(([, v]) => v.enabled);
            msgInput.value = firstEnabled2 ? firstEnabled2[1].msg || '' : '';
        }
        document.getElementById('cy2-reminder-sheet').classList.add('active');
    }

    function _toggleReminder(cid) {
        if (!D.reminders[cid]) D.reminders[cid] = { enabled: false };
        D.reminders[cid].enabled = !D.reminders[cid].enabled;
        const t = document.getElementById('cy2-rem-toggle-' + cid);
        if (t) t.classList.toggle('on', D.reminders[cid].enabled);
        save();
    }

    function _saveReminder() {
        const msgInput = document.getElementById('cy2-reminder-msg');
        const msg = msgInput ? msgInput.value.trim() : '';
        let days = 2;
        [1, 2, 3].forEach(n => { if (document.getElementById('cy2-days-chip-' + n)?.classList.contains('on')) days = n; });
        // 同步到所有开启的提醒
        Object.keys(D.reminders).forEach(cid => {
            if (D.reminders[cid].enabled) {
                D.reminders[cid].daysBeforeNotify = days;
                D.reminders[cid].msg = msg;
            }
        });
        save();
        document.getElementById('cy2-reminder-sheet').classList.remove('active');
        cyToast('✦ 提醒设置已保存');
    }

    function _immediateNotify() {
        if (typeof contacts === 'undefined') { cyToast('未找到联系人'); return; }
        // 收集所有已开启提醒的联系人
        const targets = Object.entries(D.reminders).filter(([, v]) => v.enabled);
        if (!targets.length) { cyToast('请先开启至少一个联系人的提醒'); return; }

        const msgInput = document.getElementById('cy2-reminder-msg');
        const msg = msgInput ? msgInput.value.trim() : '';
        const next = calcNextPeriod();
        const nextLabel = next ? (() => {
            const d = new Date(next + 'T12:00:00');
            return (d.getMonth() + 1) + '月' + d.getDate() + '日';
        })() : '待定';
        const st = getStatus();

        let notified = 0;
        targets.forEach(([cid]) => {
            const c = contacts.find(x => x.id === cid);
            if (!c) return;

            const userMsgLine = msg ? `\n\n用户特别留言：「${msg}」` : '';
            const aiText = `[🌙 经期追踪系统 · 立即提醒]\n\n用户手动触发了经期提醒。当前周期状态：${st.phase}（${st.desc}）。下次预计经期：${nextLabel}。${userMsgLine}\n\n【请以符合你人设的方式立刻自然地关心用户。可以根据当前所处的周期阶段给出贴心建议：如果是经期就关心身体，如果是排卵期就聊聊状态，如果是黄体期就注意情绪波动。用你自己的语气，不要背诵数据，要真实关心她。】`;

            c.history.push({
                role: 'system_sum',
                content: `<i>✧ 经期状态已推送给 ${c.chatRemark || c.name}</i>\n<span style="display:none;">${aiText}</span>`,
                timestamp: Date.now()
            });
            notified++;
        });

        if (typeof saveData === 'function') saveData();

        // 如果正在聊天室里就刷新
        if (typeof currentContactId !== 'undefined' && currentContactId &&
            typeof renderChatHistory === 'function' &&
            typeof isUserInChatRoom === 'function' && isUserInChatRoom(currentContactId)) {
            renderChatHistory();
        }

        document.getElementById('cy2-reminder-sheet').classList.remove('active');
        cyToast('✦ 已立即推送给 ' + notified + ' 位联系人');
    }

    function _closeReminder() { document.getElementById('cy2-reminder-sheet').classList.remove('active'); }

    // ─── 滑块 ───
    function _startDrag(e, type) {
        e.preventDefault();
        dragging = type;
        _updateSlider(e, type);
        document.addEventListener('mousemove', _onDrag);
        document.addEventListener('touchmove', _onDrag, { passive: false });
        document.addEventListener('mouseup', _stopDrag);
        document.addEventListener('touchend', _stopDrag);
    }
    function _onDrag(e) { if (dragging) { e.preventDefault(); _updateSlider(e, dragging); } }
    function _stopDrag() {
        dragging = null;
        document.removeEventListener('mousemove', _onDrag);
        document.removeEventListener('touchmove', _onDrag);
        document.removeEventListener('mouseup', _stopDrag);
        document.removeEventListener('touchend', _stopDrag);
    }
    function _updateSlider(e, type) {
        const rect = document.getElementById('cy2-' + type + '-track').getBoundingClientRect();
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        let pct = Math.max(0, Math.min(1, (cx - rect.left) / rect.width));
        const step = Math.round(pct * 4); pct = step / 4;
        document.getElementById('cy2-' + type + '-fill').style.width = (pct * 100) + '%';
        document.getElementById('cy2-' + type + '-thumb').style.left = (pct * 100) + '%';
        if (type === 'flow') { flowV = step; document.getElementById('cy2-flow-val').textContent = FLOW[step]; }
        else { painV = step; document.getElementById('cy2-pain-val').textContent = PAIN[step]; }
    }

    // ─── Tab 切换 ───
    function _switchTab(tab) {
        ['home', 'stats', 'history'].forEach(t => {
            document.getElementById('cy2-view-' + t)?.classList.toggle('active', t === tab);
            const el = document.getElementById('cy2-tab-' + t);
            if (el) el.classList.toggle('active', t === tab);
            const ico = document.getElementById('cy2-nav-icon-' + t);
            if (ico) ico.setAttribute('stroke', t === tab ? 'var(--rose)' : 'var(--gray)');
        });
        if (tab === 'stats') renderStats();
        if (tab === 'history') renderHistory();
    }
    function _prevMonth() { calM--; if (calM < 0) { calM = 11; calY--; } renderCal(); }
    function _nextMonth() { calM++; if (calM > 11) { calM = 0; calY++; } renderCal(); }

    // ─── 每日定时检查（每小时执行一次）───
    function startDailyCheck() {
        checkAndNotify();
        setInterval(checkAndNotify, 60 * 60 * 1000);
    }

    // ─── 公共 API ───
    function open() {
        if (!document.getElementById('cycle-app-modal')) buildUI();
        const modal = getModal();
        modal.style.display = 'flex';
        calY = today.getFullYear();
        calM = today.getMonth();
        renderAll();
        checkAndNotify();
    }
    function close() {
        const modal = getModal();
        if (modal) modal.style.display = 'none';
    }

    // 初始化：页面加载后启动后台检查
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startDailyCheck);
    } else {
        setTimeout(startDailyCheck, 2000);
    }

    return {
        open, close,
        _openLog, _closeLog, _saveLog, _togglePeriod,
        _startDrag, _onDrag, _stopDrag, _updateSlider,
        _switchTab, _prevMonth, _nextMonth,
        _openReminder, _closeReminder, _saveReminder, _toggleReminder,
        _immediateNotify, _endPeriod,
        _renderMoods,
        _bindSwipe, _cardTap, _closeAllSwipe, _deleteLog
    };
})();
