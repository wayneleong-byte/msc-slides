// AP-style practice, one or two questions per page (keys are page indices, as in PAGES).
// Every number is computed here from model.js; checks.mjs recomputes each answer another way.
import * as M from './model.js';

const p3 = x => (x < 0 ? '−' : '') + (Math.abs(x) >= 1000 ? Math.abs(x).toFixed(0) : Math.abs(x).toPrecision(3));   // 3 significant figures
const f = (x, n = 2) => (x < 0 ? '−' : '') + Math.abs(x).toFixed(n);
const G = M.G, RHO = M.RHO;
const AL = M.MATERIALS.find(m => m.key === 'al'), ICEM = M.MATERIALS.find(m => m.key === 'ice');
const BU = M.BUOY, PA = M.PASCAL, FL = M.FLOW, BE = M.BERN, TK = M.TANK;
const eq = s => `<div class="eq">${s}</div>`;

// 0 · a 5.0 cm ice cube
const S0 = 0.05, M0 = ICEM.rho * S0 ** 3;
// 1 · standing on one shoe
const A1 = M.SHOE.w * M.SHOE.l, P1 = M.PERSON.W / A1;
// 2 · the lake floor
const D2 = M.LAKE.depth, P2 = M.pAt(D2);
// 3 · a car lift: pistons of radius 2.0 cm and 10.0 cm, a 12 000 N car
const R3a = 0.020, R3b = 0.100, W3 = 12000, F3 = W3 * (R3a / R3b) ** 2;
const D3 = PA.stroke * PA.A1 / PA.A2;
// 4 · the cube all the way under
const T4 = BU.W - BU.Fb;
// 5 · wood in sea water; the steel ball on the floor
const FR5 = M.WOOD.rho / M.RHO_SEA, N5 = M.BALL.W - M.BALL.Fb;
// 6 · narrowing to 10 cm radius; filling a 1000 L tank from the wide part
const R6 = 0.10, V6 = FL.v1 * (FL.r1 / R6) ** 2, T6 = 1.0 / FL.Q;
// 7 · Bernoulli at the three points
const [B1, B2, B3] = BE.pts;
// 8 · the jet when the water is 0.60 m above the hole
const H8 = 0.60, X8 = 2 * Math.sqrt(H8 * TK.yh);
const kPa = (x, n = 1) => `${(x / 1000).toFixed(n)} kPa`;

export const PRACTICE = {
  0: [
    { q: `邊長 10 cm 的鋁立方體（ρ = ${AL.rho} kg/m³）被切成八個相等的小立方體。每個小立方體的密度為`,
      choices: [`${AL.rho / 8} kg/m³`, `${AL.rho / 2} kg/m³`, `${AL.rho} kg/m³`, `${AL.rho * 8} kg/m³`], answer: 2,
      why: `<p>每塊質量與體積皆為原來的 ⅛，故 ρ = m/V 不變。密度屬於材料，而非物體的大小。</p>` },
    { q: `邊長為 ${f(S0 * 100, 1)} cm 的冰塊質量是多少？（ρ<sub>ice</sub> = ${ICEM.rho} kg/m³）`,
      choices: [`${p3(ICEM.mass / 2)} kg`, `${p3(M0)} kg`, `${p3(ICEM.mass / 4)} kg`, `${p3(ICEM.rho * (S0 * 10) ** 3)} kg`], answer: 1,
      why: `<p>先換成公尺：V = (${f(S0, 2)} m)³ = ${f(S0 ** 3 * 1e4, 2)} × 10<sup>−4</sup> m³。</p>${eq(`m = ρV = ${ICEM.rho} × ${f(S0 ** 3 * 1e4, 2)} × 10<sup>−4</sup> = ${p3(M0)} kg`)}<p>邊長减半，體積變為 ⅛ 而非 ½：邊長 10 cm 冰塊的 ${f(ICEM.mass, 3)} kg 對應現在的 ${p3(M0)} kg。</p>` },
  ],
  1: [
    { q: `質量 ${M.PERSON.m} kg 的人站在<b>一隻</b>鞋上（鞋底 ${f(M.SHOE.w * 100, 0)} cm × ${f(M.SHOE.l * 100, 0)} cm）。對雪面的壓強為`,
      choices: [`${kPa(M.P_SHOE)}`, `${kPa(M.PERSON.m / A1, 2)}`, `${kPa(2 * P1)}`, `${kPa(P1)}`], answer: 3,
      why: `${eq(`P = F/A = mg / A = ${f(M.PERSON.W, 0)} N / ${f(A1, 3)} m² = ${kPa(P1)}`)}<p>面積為雙腳站立時的一半，故壓強為雙腳時 ${kPa(M.P_SHOE)} 的兩倍。${kPa(M.PERSON.m / A1, 2)} 是把質量而非重量除以面積。</p>` },
    { q: `你以 ${M.NAIL.F} N 推釘子 1 cm² 的釘帽釘入木頭，釘子並未加速。與拇指作用在釘帽相比，釘尖對木頭`,
      choices: ['力相同、壓強相同', '力較大、壓強較大', '力相同、壓強大得多', '力較小、壓強較大'], answer: 2,
      why: `<p>釘子處於平衡（且質量幾乎可忽略），故木頭以同樣的 ${M.NAIL.F} N 反推。釘尖面積約為釘帽的 1/200，壓強約大 200 倍：${f(M.NAIL.F / M.NAIL.tip / 1e6, 0)} MPa 對比 ${f(M.NAIL.F / M.NAIL.head / 1e3, 0)} kPa。</p>` },
  ],
  2: [
    { q: `湖底深度 ${D2} m 處的絕對壓強是多少？（<i>P</i><sub>0</sub> = ${kPa(M.P0)}）`,
      choices: [`${kPa(M.gauge(D2))}`, `${kPa(P2)}`, `${kPa(M.P0)}`, `${kPa(2 * M.P0)}`], answer: 1,
      why: `${eq(`<i>P</i> = <i>P</i><sub>0</sub> + ρ<i>gh</i> = ${kPa(M.P0)} + ${RHO} × ${f(G)} × ${D2} = ${kPa(M.P0)} + ${kPa(M.gauge(D2))} = ${kPa(P2)}`)}<p>${kPa(M.gauge(D2))} 是計示壓強：尚未計入液面大氣壓。</p>` },
    { q: '細高花瓶、寬口碗與向上收窄的錐形容器都裝水至相同深度。底部壓強',
      choices: ['以寬口碗最大，因其盛水最多', '以錐形容器最大，因水被擠壓', '以細高花瓶最大', '三者相同'], answer: 3,
      why: '<p><i>P</i> = <i>P</i><sub>0</sub> + ρ<i>gh</i> 只取決於自由液面下的深度，與容器形狀或水量無關。重量差由器壁承擔。</p>' },
  ],
  3: [
    { q: `汽車千斤頂活塞半徑分別為 ${f(R3a * 100, 1)} cm 與 ${f(R3b * 100, 1)} cm。要托住大活塞上 ${W3} N 的車，小活塞需施多大的力？`,
      choices: [`${p3(W3 * R3a / R3b)} N`, `${p3(F3)} N`, `${p3(W3)} N`, `${p3(W3 * (R3b / R3a) ** 2)} N`], answer: 1,
      why: `<p>兩活塞所受 Δ<i>P</i> 相同，故 <i>F</i><sub>1</sub>/<i>A</i><sub>1</sub> = <i>F</i><sub>2</sub>/<i>A</i><sub>2</sub>，且面積與 r² 成正比：</p>${eq(`<i>F</i><sub>1</sub> = ${W3} × (${f(R3a * 100, 1)} / ${f(R3b * 100, 1)})² = ${p3(F3)} N`)}<p>${p3(W3 * R3a / R3b)} N 誤用了半徑比而非面積比。</p>` },
    { q: `圖中壓機的小活塞（${f(PA.A1 * 1e4, 0)} cm²）下壓 ${f(PA.stroke * 100, 0)} cm。大活塞（${f(PA.A2 * 1e4, 0)} cm²）上升多少？`,
      choices: [`${p3(PA.stroke * 100 * PA.r1 / PA.r2)} cm`, `${p3(PA.stroke * 100)} cm`, `${p3(PA.stroke * 100 * PA.A2 / PA.A1)} cm`, `${p3(D3 * 100)} cm`], answer: 3,
      why: `<p>水幾乎不可壓縮，下壓的體積等於上升的體積：<i>A</i><sub>1</sub><i>d</i><sub>1</sub> = <i>A</i><sub>2</sub><i>d</i><sub>2</sub>。</p>${eq(`<i>d</i><sub>2</sub> = ${f(PA.stroke * 100, 0)} cm × ${f(PA.A1 * 1e4, 0)} / ${f(PA.A2 * 1e4, 0)} = ${p3(D3 * 100)} cm`)}<p>力約為 16 倍、位移約為 1/16：輸入功等於輸出功。</p>` },
  ],
  4: [
    { q: `邊長 ${f(BU.s * 100, 0)} cm 的鋁立方體（W = ${f(BU.W, 0)} N）懸於繩上並完全沒入水中。繩的張力為`,
      choices: [`${p3(BU.W)} N`, `${p3(BU.Fb)} N`, `${p3(BU.W + BU.Fb)} N`, `${p3(T4)} N`], answer: 3,
      why: `${eq(`<i>F</i><sub>b</sub> = ρ<sub>water</sub><i>Vg</i> = ${RHO} × ${f(BU.V, 3)} × ${f(G)} = ${f(BU.Fb, 0)} N`)}${eq(`<i>T</i> = <i>W</i> − <i>F</i><sub>b</sub> = ${f(BU.W, 0)} − ${f(BU.Fb, 0)} = ${p3(T4)} N`)}<p>浮力用的是<b>水</b>的密度而非鋁；${p3(BU.Fb)} N 是浮力，不是張力。</p>` },
    { q: '立方體完全沒入後再往下放。它所受浮力',
      choices: ['增大，因深處壓強更大', '减小，因上方水更多', '保持不變', '增大直到等於重力'], answer: 2,
      why: '<p>更深時，頂面與底面壓強都增加相同的 ρgΔh。二者之差 ρgs 不變，故 <i>F</i><sub>b</sub> = ρ<i>Vg</i> 不變。（水視為不可壓縮。）</p>' },
  ],
  5: [
    { q: `密度 ${M.WOOD.rho} kg/m³ 的木塊浮在海水（${M.RHO_SEA} kg/m³）而非淡水中。沒入水中的體積佔整體的多少？`,
      choices: [`${f(100 * M.WOOD.rho / RHO, 1)}%`, `${f(100 * (1 - FR5), 1)}%`, `${f(100 * FR5, 1)}%`, `${f(100 * (1 - M.WOOD.rho / RHO), 1)}%`], answer: 2,
      why: `<p>漂浮時 <i>F</i><sub>b</sub> = <i>W</i>：ρ<sub>sea</sub><i>V</i><sub>under</sub><i>g</i> = ρ<sub>wood</sub><i>Vg</i>。</p>${eq(`<i>V</i><sub>under</sub>/<i>V</i> = ${M.WOOD.rho} / ${M.RHO_SEA} = ${f(100 * FR5, 1)}%`)}<p>海水較密，以較小沒入體積即可平衡，故略小於淡水中的 ${f(100 * M.WOOD.rho / RHO, 1)}%。${f(100 * (1 - FR5), 1)}% 是露出水面的部分。</p>` },
    { q: `鋼球（半徑 ${f(M.BALL.r, 2)} m，ρ = ${M.BALL.rho} kg/m³）停在池底。池底對它的向上推力為`,
      choices: [`${p3(M.BALL.W)} N`, `${p3(N5)} N`, `${p3(M.BALL.Fb)} N`, `${p3(M.BALL.W + M.BALL.Fb)} N`], answer: 1,
      why: `${eq(`V = ⁴⁄₃πr³ = ${f(M.BALL.V, 4)} m³, W = ρ<sub>steel</sub>Vg = ${f(M.BALL.W, 0)} N, <i>F</i><sub>b</sub> = ρ<sub>water</sub>Vg = ${f(M.BALL.Fb, 0)} N`)}${eq(`<i>F</i><sub>N</sub> = W − <i>F</i><sub>b</sub> = ${p3(N5)} N`)}<p>沉底的球仍受水的向上浮力；池底只需補足其餘部分。</p>` },
  ],
  6: [
    { q: `水在半徑 ${f(FL.r1 * 100, 0)} cm 的管中以 ${f(FL.v1, 1)} m/s 流入半徑 ${f(R6 * 100, 0)} cm 的管段。該處流速為`,
      choices: [`${p3(FL.v1 * FL.r1 / R6)} m/s`, `${p3(V6)} m/s`, `${p3(FL.v1 * (R6 / FL.r1) ** 2)} m/s`, `${p3(FL.v1 * R6 / FL.r1)} m/s`], answer: 1,
      why: `${eq(`<i>A</i><sub>1</sub><i>v</i><sub>1</sub> = <i>A</i><sub>2</sub><i>v</i><sub>2</sub> → <i>v</i><sub>2</sub> = <i>v</i><sub>1</sub>(r<sub>1</sub>/r<sub>2</sub>)² = ${f(FL.v1, 1)} × 3² = ${p3(V6)} m/s`)}<p>面積與 r² 成正比，半徑為 1/3 則面積為 1/9。${p3(FL.v1 * FL.r1 / R6)} m/s 誤用了半徑比。</p>` },
    { q: `粗管（半徑 ${f(FL.r1 * 100, 0)} cm，流速 ${f(FL.v1, 1)} m/s）裝滿 1000 L 水箱需時多久？`,
      choices: [`${p3(1.0 / (Math.PI * (2 * FL.r1) ** 2 * FL.v1))} s`, `${p3(1.0 / (2 * Math.PI * FL.r1 * FL.v1))} s`, `${p3(T6)} s`, `${p3(1.0 / (FL.r1 ** 2 * FL.v1))} s`], answer: 2,
      why: `${eq(`<i>Q</i> = <i>Av</i> = π(${f(FL.r1, 2)})² × ${f(FL.v1, 1)} = ${f(FL.Q, 4)} m³/s`)}${eq(`t = V/Q = 1.000 m³ / ${f(FL.Q, 4)} m³/s = ${p3(T6)} s`)}<p>1000 L 即 1 m³。若把 60 cm 直徑誤當半徑，面積會大四倍。</p>` },
  ],
  7: [
    { q: `圖中管道：粗段流速 ${f(B1.v, 1)} m/s、計示壓強 ${kPa(B1.P, 0)}；同高度細段加速至 ${f(B2.v, 1)} m/s。該處計示壓強為`,
      choices: [`${kPa(B1.P + (B2.P - B1.P) * -1, 0)}`, `${kPa(B1.P, 0)}`, `${kPa(B1.P * B1.v / B2.v, 1)}`, `${kPa(B2.P, 0)}`], answer: 3,
      why: `${eq(`<i>P</i><sub>2</sub> = <i>P</i><sub>1</sub> + ½ρ(<i>v</i><sub>1</sub>² − <i>v</i><sub>2</sub>²) = ${kPa(B1.P, 0)} + ½ × ${RHO} × (${f(B1.v, 0)}² − ${f(B2.v, 0)}²) = ${kPa(B2.P, 0)}`)}<p>流速大則壓強小。${kPa(B1.P + (B2.P - B1.P) * -1, 0)} 符號反了：水能加速，是因為後方壓強較高。</p>` },
    { q: `流速回到 ${f(B3.v, 1)} m/s 後，管道再升高 ${f(BE.H, 1)} m。高處粗段的計示壓強為`,
      choices: [`${kPa(B1.P + RHO * G * BE.H)}`, `${kPa(B3.P)}`, `${kPa(B1.P)}`, `${kPa(B1.P - 2 * RHO * G * BE.H)}`], answer: 1,
      why: `<p>與點 1 速率相同，故 ½ρv² 項相消：</p>${eq(`<i>P</i><sub>3</sub> = <i>P</i><sub>1</sub> − ρ<i>g</i>Δy = ${kPa(B1.P, 0)} − ${RHO} × ${f(G)} × ${f(BE.H, 1)} = ${kPa(B3.P)}`)}<p>把水抬高要付出壓強代價，正如潜入更深會增加壓強。</p>` },
  ],
  8: [
    { q: '孔上方水位升至原來的四倍。自孔噴出的水流',
      choices: ['速率不變', `速率變為 √2 倍`, '速率變為兩倍', '速率變為四倍'], answer: 2,
      why: '<p><i>v</i> = √(2<i>gh</i>): 高度變為四倍時 √4 = 2，速率加倍，與自四倍高度自由落下的石頭相同。</p>' },
    { q: `孔高於地面 ${f(TK.yh, 2)} m。當水面高於孔 ${f(H8, 2)} m 時，噴流落點距水箱多遠？`,
      choices: [`${p3(Math.sqrt(H8 * TK.yh))} m`, `${p3(X8)} m`, `${p3(M.jetRange(TK.h0))} m`, `${p3(Math.sqrt(2 * H8 * TK.yh))} m`], answer: 1,
      why: `${eq(`<i>v</i> = √(2 × ${f(G)} × ${f(H8, 2)}) = ${f(M.torricelli(H8))} m/s, t = √(2 × ${f(TK.yh, 2)} / ${f(G)}) = ${f(M.jetFlight, 3)} s`)}${eq(`x = vt = 2√(h y<sub>hole</sub>) = ${p3(X8)} m`)}<p>${p3(M.jetRange(TK.h0))} m 是水箱加滿（水位 ${f(TK.h0, 1)} m）時的射程，不是現在的情況。</p>` },
  ],
};
