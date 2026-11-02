// momentum/practice.js — AP-style practice, one or two questions per page (keys are page indices, as in PAGES).
// Every number is computed here from the model or from the givens; checks.mjs recomputes each answer another way.
import * as M from './model.js';

const G = M.G;
const f = (x, n = 2) => (x < -1e-12 ? '−' : '') + Math.abs(x).toFixed(n);
const sg = (x, n = 2) => (x > 1e-12 ? '+' : '') + f(x, n);   // signed, for velocities on a track

// 0 · the ball and the cart; a ball bouncing back
const Bl = M.BALL, Ct = M.CART, vb = 3.0, dp0 = Bl.m * (Bl.v + vb);
// 1 · the wall pulse
const Wl = M.WALL;
// 2 · the egg on the floor
const Eg = M.EGG, Fhard = Eg.J / Eg.tauHard;
// 3–5 · the carts
const S = M.STICK, Bo = M.BOUNCE, X = M.BURST;
const K0s = M.ke(S.m1, S.u1) + M.ke(S.m2, S.u2), K1s = M.ke(S.m1 + S.m2, S.v1);
// 6 · the ballistic pendulum
const Pd = M.PEND, Kclay = M.ke(Pd.m, Pd.u), Kafter = M.ke(Pd.m + Pd.M, Pd.v);
// 7 · the crash
const Cr = M.CRASH;
// 8 · the shell
const Sh = M.SHELL;
// 9 · rods (Physics C): λ = λ0 x/L, and λ = λ0 x²/L²
const Rd = M.ROD, xq = 3 * Rd.L / 4, Mq = Rd.lam0 * Rd.L / 3;
// 10 · plates (Physics C)
const Tr = M.TRI, Se = M.SEMI;
// 11 · the L and the holed square (Physics C)
const Ll = M.ELL, Ho = M.HOLE;

export const PRACTICE = {
  0: [
    { q: `質量為${f(Bl.m,1)}公斤的球與質量為${f(Ct.m,1)}公斤的車具有相同的動量。球的動能與車的動能之比是多少？`,
      choices: [f(1, 1), f(Bl.m / Ct.m), f(Ct.m / Bl.m, 1), f(Math.sqrt(Ct.m / Bl.m), 1)], answer: 2,
      why: `<p>當<i>p</i>相同時，<i>K</i>=<i>p</i>²/2<i>m</i>，因此<i>K</i><sub>ball</sub>/<i>K</i><sub>cart</sub>=<i>m</i><sub>cart</sub>/<i>m</i><sub>ball</sub>=${f(Ct.m,1)}/${f(Bl.m,1)}=${f(Ct.m/Bl.m,1)}。核對：${f(M.ke(Bl.m,Bl.v),1)}焦耳對比${f(M.ke(Ct.m,Ct.v),1)}焦耳。動量相同並不代表能量相同。</p>` },
    { q: `質量為${f(Bl.m,1)}公斤的球以${f(Bl.v,1)}公尺/秒向東運動，反彈後以${f(vb,1)}公尺/秒向西運動。它的動量變化量大小是多少？`,
      choices: [f(Bl.m * (Bl.v - vb)) + ' kg·m/s', f(Bl.m * Bl.v) + ' kg·m/s', f(dp0) + ' kg·m/s', f(Bl.v + vb) + ' kg·m/s'], answer: 2,
      why: `<p>取向東為正。Δ<i>p</i>=<i>m</i>(<i>v</i><sub>f</sub>−<i>v</i><sub>0</sub>)=${f(Bl.m,1)}×(−${f(vb,1)}−${f(Bl.v,1)})=−${f(dp0)}公斤·公尺/秒，因此|Δ<i>p</i>|=${f(dp0)}公斤·公尺/秒。直接將速率相減（${f(Bl.m*(Bl.v-vb))}）忽略了速度方向已反轉。</p>` },
  ],
  1: [
    { q: `牆在${f(Wl.tau)}秒內將質量為${f(Wl.m,1)}公斤的球的速度由+${f(Wl.v,1)}公尺/秒變為−${f(Wl.v,1)}公尺/秒。球所受平均力的大小是多少？`,
      choices: [`${f(Wl.m * Wl.v / Wl.tau, 1)} N`, `${f(Wl.J / Wl.tau, 1)} N`, `${f(Wl.J * Wl.tau, 2)} N`, `${f(Wl.Fpk, 1)} N`], answer: 1,
      why: `<div class="eq"><i>F</i><sub>avg</sub>=|Δ<i>p</i>|/Δ<i>t</i>=2<i>mv</i>/Δ<i>t</i>=${f(Wl.J,1)}/${f(Wl.tau)}=${f(Wl.J/Wl.tau,1)}牛頓</div><p>${f(Wl.m*Wl.v/Wl.tau,1)}牛頓只能使球停下；它還必須返回。${f(Wl.Fpk,1)}牛頓是脈衝的峰值，而不是其平均值。</p>` },
    { q: `牆的作用力為<i>F</i>(<i>t</i>)=<i>F</i><sub>pk</sub>sin(π<i>t</i>/τ)，其中0≤<i>t</i>≤τ，且<i>F</i><sub>pk</sub>=${f(Wl.Fpk,1)}牛頓、τ=${f(Wl.tau)}秒。它給球的衝量是多少？`,
      choices: [`${f(Wl.Fpk * Wl.tau / 2)} N·s`, `${f(Wl.Fpk * Wl.tau)} N·s`, `${f(Wl.Fpk * Wl.tau / Math.PI)} N·s`, `${f(2 * Wl.Fpk * Wl.tau / Math.PI)} N·s`], answer: 3,
      why: `<div class="eq"><i>J</i>=∫<sub>0</sub><sup>τ</sup><i>F</i><sub>pk</sub>sin(π<i>t</i>/τ)d<i>t</i>=<i>F</i><sub>pk</sub>(τ/π)[−cos(π<i>t</i>/τ)]<sub>0</sub><sup>τ</sup>=2<i>F</i><sub>pk</sub>τ/π=${f(2*Wl.Fpk*Wl.tau/Math.PI)}牛頓·秒</div><p>它與2<i>mv</i>=${f(Wl.J)}牛頓·秒相符。<i>F</i><sub>pk</sub>τ把峰值視為持續了整段時間；<i>F</i><sub>pk</sub>τ/2是三角形的面積，而不是正弦曲線下的面積。</p>` },
  ],
  2: [
    { q: `一顆質量為${f(Eg.m,3)} kg 的雞蛋以${f(Eg.v0,1)} m/s 的速度落到地板上，並在${f(Eg.tauHard)} s 內停下，且沒有彈起。它所受的平均淨力大小為何？`,
      choices: [`${f(Fhard)} N`, `${f(2 * Fhard, 1)} N`, `${f(Eg.J, 3)} N`, `${f(M.ke(Eg.m, Eg.v0) / Eg.tauHard)} N`], answer: 0,
      why: `<div class="eq"><i>F</i><sub>net</sub>Δ<i>t</i> = Δ<i>p</i> &nbsp;⇒&nbsp; <i>F</i><sub>net</sub> = <i>mv</i>/Δ<i>t</i> = ${f(Eg.J, 3)} / ${f(Eg.tauHard)} = ${f(Fhard)} N</div><p>它停下且沒有反彈，因此 Δ<i>p</i> = <i>mv</i>，而不是 2<i>mv</i>。${f(M.ke(Eg.m, Eg.v0) / Eg.tauHard)} N 是把能量除以時間（那是功率）。</p>` },
    { q: '與落在地板上相比，落在枕頭上使雞蛋……',
      choices: ['較小的衝量與較小的平均力', '在較長時間內有較大的衝量', '相同平均力作用於較長時間', '相同衝量及較小平均力'], answer: 3,
      why: '<p>無論哪種情況，雞蛋的速度都由 <i>v</i> 變為 0，因此衝量 Δ<i>p</i> 相同。枕頭會使 Δ<i>t</i> 拉長，所以 <i>F</i>=Δ<i>p</i>/Δ<i>t</i> 較小。</p>' },
  ],
  3: [
    { q: `取 +t 方向向右。一輛質量為${f(S.m1,1)} kg、速度為${sg(S.u1,1)} m/s 的小車，與另一輛質量為${f(S.m2,1)} kg、速度為${sg(S.u2,1)} m/s 的小車相撞並黏在一起。它們碰撞後的速度為何？`,
      choices: [`${sg((S.m1 * S.u1 - S.m2 * S.u2) / (S.m1 + S.m2))} m/s`, `${sg((S.u1 + S.u2) / 2)} m/s`, `${sg(S.v1)} m/s`, `${sg(S.m1 * S.u1 + S.m2 * S.u2)} m/s`], answer: 2,
      why: `<div class="eq"><i>v</i>′=(<i>m</i>₁<i>v</i>₁+<i>m</i>₂<i>v</i>₂)/(<i>m</i>₁+<i>m</i>₂)=(${f(S.m1*S.u1,1)}−${f(-S.m2*S.u2,1)})/${f(S.m1+S.m2,1)}=${sg(S.v1)} m/s</div><p>第二輛小車向左運動，因此其動量為負：將它當作 +${f(-S.m2*S.u2,1)} 相加，得到${sg((S.m1*S.u1-S.m2*S.u2)/(S.m1+S.m2))} m/s。直接平均速度會忽略質量。</p>` },
    { q: '該次碰撞損失了多少動能？',
      choices: [`${f(K1s)} J`, `${f(K0s)} J`, '0 J', `${f(K0s - K1s)} J`], answer: 3,
      why: `<p>碰撞前：½(${f(S.m1,1)})(${f(S.u1,1)})² + ½(${f(S.m2,1)})(${f(S.u2,1)})² = ${f(K0s)} J。碰撞後：½(${f(S.m1+S.m2,1)})(${f(S.v1,1)})² = ${f(K1s)} J。損失：${f(K0s-K1s)} J，轉為熱、聲音和凹痕。動量守恆；動能不守恆。</p>` },
  ],
  4: [
    { q: `取 +t 方向向右。一輛質量為${f(Bo.m1,1)} kg、速度為${sg(Bo.u1,1)} m/s 的小車彈性撞上另一輛靜止、質量為${f(Bo.m2,1)} kg 的小車。質量為${f(Bo.m1,1)} kg 的小車碰撞後的速度為何？`,
      choices: [`${sg(-Bo.v1)} m/s`, `${sg(Bo.v1)} m/s`, `${f(0)} m/s`, `${sg(Bo.m1 * Bo.u1 / (Bo.m1 + Bo.m2))} m/s`], answer: 1,
      why: `<p>在彈性碰撞中，相對速度會反向：<i>v</i>₂′−<i>v</i>₁′=${f(Bo.u1,1)} m/s。配合動量，${f(Bo.m1,1)}×${f(Bo.u1,1)}=${f(Bo.m1,1)}<i>v</i>₁′+${f(Bo.m2,1)}<i>v</i>₂′：</p><div class="eq"><i>v</i>₁′=(<i>m</i>₁−<i>m</i>₂)<i>v</i>₁/(<i>m</i>₁+<i>m</i>₂)=${sg(Bo.v1)} m/s，<i>v</i>₂′=${sg(Bo.v2)} m/s</div><p>較輕的小車會反彈。${sg(Bo.m1*Bo.u1/(Bo.m1+Bo.m2))} m/s 是假設兩車黏在一起時所得的答案。</p>` },
    { q: '若一輛運動中的小車與一輛靜止的相同小車作彈性碰撞，則碰撞後',
      choices: ['兩者均以一半速度繼續移動', '第一個停止，第二個以第一個的速度離去', '第一個以原速度反彈', '兩者均停止'], answer: 1,
      why: '<p>當<i>m</i>₁=<i>m</i>₂時，<i>v</i>₁′=(<i>m</i>₁−<i>m</i>₂)<i>v</i>₁/(<i>m</i>₁+<i>m</i>₂)=0，<i>v</i>₂′=<i>v</i>₁。若兩車以一半速率一起運動，雖動量守恆，卻會損失一半動能，因此並非彈性碰撞。</p>' },
  ],
  5: [
    { q: `一根彈簧連接質量為${f(X.m1,1)}kg的小車與質量為${f(X.m2,1)}kg的小車，兩車均靜止，彈簧釋放${f(X.Q,1)}J的能量。質量為${f(X.m2,1)}kg的小車會以多快的速率分離？`,
      choices: [`${f(-X.v1)} m/s`, `${f(Math.sqrt(2 * X.Q / X.m2))} m/s`, `${f(Math.sqrt(2 * X.Q / (X.m1 + X.m2)))} m/s`, `${f(X.v2)} m/s`], answer: 3,
      why: `<p>動量保持為零：<i>m</i>₁<i>v</i>₁′=−<i>m</i>₂<i>v</i>₂′，因此質量為${f(X.m1,1)}kg的小車的速率為質量為${f(X.m2,1)}kg小車的${f(X.m2/X.m1,0)}倍。根據能量守恆：½<i>m</i>₁(${f(X.m2/X.m1,0)}<i>v</i>)²+½<i>m</i>₂<i>v</i>²=${f(X.Q,1)}J，可得<i>v</i>=${f(X.v2)}m/s（較輕的小車速率為${f(-X.v1)}m/s）。</p><p>若將全部能量賦予其中一輛小車，速率將達${f(Math.sqrt(2*X.Q/X.m2))}m/s，這將違反動量守恆定律。</p>` },
    { q: `在此次爆炸中，質量為${f(X.m1,1)}kg小車的動能與質量為${f(X.m2,1)}kg小車的動能之比為何？`,
      choices: [f(X.m1 / X.m2), f(1, 1), f(X.m2 / X.m1, 1), f((X.m2 / X.m1) ** 2, 1)], answer: 2,
      why: `<p>兩車動量大小相等、方向相反，且<i>K</i>=<i>p</i>²/2<i>m</i>，故動能比為<i>m</i>₂/<i>m</i>₁=${f(X.m2/X.m1,1)}（即${f(M.ke(X.m1,X.v1),1)}J對${f(M.ke(X.m2,X.v2),1)}J）。較輕的小車獲得了彈簧大部分的能量。</p>` },
  ],
  6: [
    { q: `質量為${f(Pd.m,1)}kg的黏土以${f(Pd.u,0)}m/s的速率黏附於質量為${f(Pd.M,1)}kg的木塊上，木塊會擺至多高？`,
      choices: [`${f(Pd.dy * 100, 1)} cm`, `${f(Kclay / ((Pd.m + Pd.M) * G) * 100, 1)} cm`, `${f(Pd.v ** 2 / G * 100, 1)} cm`, `${f(Pd.u ** 2 / (2 * G) * 100, 0)} cm`], answer: 0,
      why: `<p>碰撞時：根據動量守恆，<i>v</i>′=<i>mu</i>/(<i>m</i>+<i>M</i>)=${f(Pd.m*Pd.u,1)}/${f(Pd.m+Pd.M,1)}=${f(Pd.v,3)}m/s。擺動時：根據機械能守恆，Δ<i>y</i>=<i>v</i>′²/2<i>g</i>=${f(Pd.dy*100,1)}cm。</p><p>若假設碰撞過程中黏土的動能全數保留，則擺高為${f(Kclay/((Pd.m+Pd.M)*G)*100,1)}cm；但實際上，黏土黏附時大部分動能均已損失。</p>` },
    { q: '在這次撞擊中，黏土的動能損失了多少比例？',
      choices: [`${f(100 * Pd.m / (Pd.m + Pd.M), 1)}%`, '0%', `${f(100 * (1 - Kafter / Kclay), 1)}%`, '50.0%'], answer: 2,
      why: `<p>撞擊前：½(${f(Pd.m,1)})(${f(Pd.u,0)})²=${f(Kclay,1)}J。撞擊後：½(${f(Pd.m+Pd.M,1)})(${f(Pd.v,3)})²=${f(Kafter)}J。保留比例：<i>m</i>/(<i>m</i>+<i>M</i>)=${f(100*Pd.m/(Pd.m+Pd.M),1)}%，因此損失了${f(100*(1-Kafter/Kclay),1)}%。</p>` },
  ],
  7: [
    { q: `質量為${Cr.m1} kg的汽車（以${f(Cr.v1,0)} m/s向東行駛）與質量為${Cr.m2} kg的貨車（以${f(Cr.v2,0)} m/s向北行駛）相撞後連結在一起。碰撞後瞬間，殘骸以多快的速度移動？`,
      choices: [`${f((Cr.px + Cr.py) / (Cr.m1 + Cr.m2))} m/s`, `${f(Cr.v)} m/s`, `${f((Cr.v1 + Cr.v2) / 2, 1)} m/s`, `${f(Math.hypot(Cr.v1, Cr.v2), 1)} m/s`], answer: 1,
      why: `<p>分別考慮各方向：<i>v</i>′<sub>x</sub>=${Cr.px}/${Cr.m1+Cr.m2}=${f(Cr.vx)}m/s，<i>v</i>′<sub>y</sub>=${Cr.py}/${Cr.m1+Cr.m2}=${f(Cr.vy)}m/s。</p><div class="eq"><i>v</i>′=√(${f(Cr.vx)}²+${f(Cr.vy)}²)=${f(Cr.v)}m/s</div><p>${f((Cr.px+Cr.py)/(Cr.m1+Cr.m2))}m/s相當於把動量當成同向而相加。</p>` },
    { q: '殘骸朝哪個方向移動？',
      choices: [`${f(90-Cr.angle,1)}°東偏北`, `${f(Math.atan2(Cr.v2,Cr.v1)*180/Math.PI,1)}°東偏北`, `${f(Math.atan2(Cr.v1,Cr.v2)*180/Math.PI,1)}°東偏北`, `${f(Cr.angle,1)}°東偏北`], answer: 3,
      why: `<div class="eq">tanθ=<i>p</i><sub>y</sub>/<i>p</i><sub>x</sub>=${Cr.py}/${Cr.px}&nbsp;⇒&nbsp;θ=${f(Cr.angle,1)}°（東偏北）</div><p>應使用動量，而不是速率：速度較慢的貨車重八倍，因此由貨車主導方向。${f(Math.atan2(Cr.v2,Cr.v1)*180/Math.PI,1)}°則是以速率計算所得。</p>` },
  ],
  8: [
    { q: `砲彈（未爆時以${f(Sh.v0,0)} m/s、仰角${Sh.deg}°發射，射程<i>R</i>=${f(Sh.R)} m）在最高點分裂成質量相等的兩半；後半垂直落下。前半會落在何處？`,
      choices: [`${f(Sh.R / 2)} m`, `${f(Sh.R)} m`, `${f(1.5 * Sh.R)} m`, `${f(2 * Sh.R)} m`], answer: 2,
      why: `<p>質心仍落在<i>R</i>處，彷彿什麼都沒發生。後半落在<i>R</i>/2=${f(Sh.R/2)}m，且兩半質量相等，因此前半落在<i>R</i>之外，超出<i>R</i>的距離與後半距<i>R</i>的距離相同：<i>x</i>=2<i>R</i>−<i>R</i>/2=3<i>R</i>/2=${f(1.5*Sh.R)}m。</p><p>直接來看：它從最高點以2<i>v</i><sub>x</sub>離開，且下落的時間相同，所以它飛越的距離是剩餘<i>R</i>/2的兩倍。</p>` },
    { q: '在爆炸發生至第一塊碎片落地之間，系統質心的加速度為',
      choices: ['零', '<i>g</i>，向下', '2<i>g</i>，向下', '向前，自爆發點起'], answer: 1,
      why: '<p>爆炸力皆為內力，成對抵消。唯一的外力仍為總重量 <i>Mg</i>，因此 <i>a</i><sub>cm</sub> = <i>g</i> 向下，與爆炸前完全相同。</p>' },
  ],
  9: [
    { q: `一根長度由 <i>x</i>=0 至 <i>L</i>=${f(Rd.L,1)} m 的細桿，其線密度為 λ(<i>x</i>)=λ<sub>0</sub><i>x</i>/<i>L</i>。其質心位於何處？`,
      choices: [`<i>x</i> = ${f(Rd.L / 2)} m`, `<i>x</i> = ${f(Rd.L / 3, 3)} m`, `<i>x</i> = ${f(Rd.xN)} m`, `<i>x</i> = ${f(3 * Rd.L / 4)} m`], answer: 2,
      why: `<div class="eq"><i>M</i>=∫<sub>0</sub><sup><i>L</i></sup>λ<sub>0</sub><i>x</i>/<i>L</i>d<i>x</i>=λ<sub>0</sub><i>L</i>/2,&nbsp;∫<i>x</i>d<i>m</i>=∫<sub>0</sub><sup><i>L</i></sup>λ<sub>0</sub><i>x</i>²/<i>L</i>d<i>x</i>=λ<sub>0</sub><i>L</i>²/3</div><div class="eq"><i>x</i><sub>cm</sub>=(λ<sub>0</sub><i>L</i>²/3)/(λ<sub>0</sub><i>L</i>/2)=2<i>L</i>/3=${f(Rd.xN)}m</div><p>位於靠近密度較大的一端。若從錯誤的一端量起，距離將為 <i>L</i>/3；若假設密度均勻，則會得出 <i>L</i>/2。</p>` },
    { q: `自由作答：一根長度由 <i>x</i>=0 至 <i>L</i>=${f(Rd.L,1)} m 的細桿，其線密度為 λ(<i>x</i>)=λ<sub>0</sub><i>x</i>²/<i>L</i>²，λ<sub>0</sub>=${f(Rd.lam0,1)} kg/m。試求其質量及質心位置。`,
      solution: `<p>將細桿分割成微元 d<i>m</i>=λd<i>x</i>：</p><div class="eq"><i>M</i>=∫<sub>0</sub><sup><i>L</i></sup>λ<sub>0</sub><i>x</i>²/<i>L</i>²d<i>x</i>=λ<sub>0</sub><i>L</i>/3=${f(Rd.lam0,1)}×${f(Rd.L,1)}/3=${f(Mq)}kg</div><div class="eq">∫<i>x</i>d<i>m</i>=∫<sub>0</sub><sup><i>L</i></sup>λ<sub>0</sub><i>x</i>³/<i>L</i>²d<i>x</i>=λ<sub>0</sub><i>L</i>²/4</div><div class="eq"><i>x</i><sub>cm</sub>=(λ<sub>0</sub><i>L</i>²/4)/(λ<sub>0</sub><i>L</i>/3)=3<i>L</i>/4=${f(xq)}m</div><p>較線性密度細桿的 2<i>L</i>/3 更靠近密度較大的一端，這是符合預期的，因為大部分質量都集中在 <i>x</i>=<i>L</i> 附近。</p>` },
  ],
  10: [
    { q: `一塊均勻半圓形薄板，半徑 <i>R</i>=${f(Se.R,1)} m。其質心距離直徑邊緣有多遠？`,
      choices: [`${f(Se.R / 2, 3)} m`, `${f(2 * Se.R / Math.PI, 3)} m`, `${f(Se.R / 3, 3)} m`, `${f(Se.ucm, 3)} m`], answer: 3,
      why: `<p>以平行於直徑的細條分割，寬度為 2√(<i>R</i>²−<i>u</i>²)：</p><div class="eq"><i>u</i><sub>cm</sub>=∫<sub>0</sub><sup><i>R</i></sup>2<i>u</i>√(<i>R</i>²−<i>u</i>²)d<i>u</i>/(π<i>R</i>²/2)=(2<i>R</i>³/3)/(π<i>R</i>²/2)=4<i>R</i>/3π=${f(Se.ucm,3)}m</div><p>若誤以為距離為 <i>R</i>/2，則忽略了細條隨遠離直徑而變窄的事實；半圓形細線的質心距離直徑為 2<i>R</i>/π=${f(2*Se.R/Math.PI,3)} m，因其全部質量均分佈於圓弧上。</p>` },
    { q: `一塊均勻三角形薄板的高度為 <i>h</i> = ${f(Tr.h,1)} m，高度自其底邊量起。其質心在底邊上方多遠處？`,
      choices: [`${f(Tr.h / 2, 3)} m`, `${f(Tr.ucm, 3)} m`, `${f(2 * Tr.h / 3, 3)} m`, `${f(Tr.h / 4, 3)} m`], answer: 1,
      why: `<p>與底邊平行的條帶寬度為 <i>w</i> = <i>b</i>(1−<i>u</i>/<i>h</i>)：在底邊處較寬，在頂點處為零。</p><div class="eq"><i>u</i><sub>cm</sub>=∫<sub>0</sub><sup><i>h</i></sup><i>u</i>·<i>b</i>(1−<i>u</i>/<i>h</i>)d<i>u</i>/(<i>bh</i>/2)=(<i>bh</i>²/6)/(<i>bh</i>/2)=<i>h</i>/3=${f(Tr.ucm,3)}m</div><p>2<i>h</i>/3 是距頂點的距離。</p>` },
  ],
  11: [
    { q: `L：臂 A 的質量為 ${f(Ll.pA.m)} kg，質心位於 <i>x</i> = ${f(Ll.pA.c[0])} m；臂 B 的質量為 ${f(Ll.pB.m)} kg，質心位於 <i>x</i> = ${f(Ll.pB.c[0])} m。此 L 形的 <i>x</i><sub>cm</sub> 是多少？`,
      choices: [`${f((Ll.pA.c[0] + Ll.pB.c[0]) / 2, 3)} m`, `${f(Ll.pA.c[0], 3)} m`, `${f((Ll.pB.m * Ll.pA.c[0] + Ll.pA.m * Ll.pB.c[0]) / Ll.M, 3)} m`, `${f(Ll.cm[0], 3)} m`], answer: 3,
      why: `<div class="eq"><i>x</i><sub>cm</sub>=(${f(Ll.pA.m)}×${f(Ll.pA.c[0])}+${f(Ll.pB.m)}×${f(Ll.pB.c[0])})/${f(Ll.M)}=${f(Ll.cm[0],3)}m</div><p>將每個質心按其自身質量加權。${f((Ll.pA.c[0]+Ll.pB.c[0])/2,3)}m 是各質心的簡單平均，僅在質量相等時才正確。</p>` },
    { q: `自由作答。從 <i>x</i><sub>cm</sub>=(1/<i>M</i>)∫<i>x</i> d<i>m</i> 出發，論證可將孔洞視為負質量。然後求邊長為 ${f(Ho.s,1)} m 的正方形（σ = ${f(M.SIGMA,1)} kg/m²，以原點為中心）在挖去半徑為 ${f(Ho.r,1)} m、圓心位於 <i>x</i> = ${f(Ho.c[0])} m 的圓孔後的 <i>x</i><sub>cm</sub>。`,
      solution: `<p>對某一區域的積分可依其各部分拆分。此薄板即完整正方形減去圓盤，因此</p><div class="eq">∫<sub>plate</sub><i>x</i>d<i>m</i>=∫<sub>square</sub><i>x</i>d<i>m</i>−∫<sub>disc</sub><i>x</i>d<i>m</i>=<i>m</i><sub>full</sub><i>x</i><sub>full</sub>−<i>m</i><sub>plug</sub><i>x</i><sub>plug</sub></div><p>同樣地，<i>M</i>=<i>m</i><sub>full</sub>−<i>m</i><sub>plug</sub>：孔洞的作用恰如在其中心處有一個質量 −<i>m</i><sub>plug</sub>。</p><p><i>m</i><sub>full</sub>=σ<i>s</i>²=${f(Ho.mFull)}kg，位於 <i>x</i>=0；<i>m</i><sub>plug</sub>=σπ<i>r</i>²=${f(Ho.mPlug,3)}kg，位於 <i>x</i>=${f(Ho.c[0])}m；<i>M</i>=${f(Ho.M,3)}kg。</p><div class="eq"><i>x</i><sub>cm</sub>=(0−${f(Ho.mPlug,3)}×${f(Ho.c[0])})/${f(Ho.M,3)}=${f(Ho.cm[0]*100)}cm</div><p>結果為負：質心會遠離孔洞。</p>` },
  ],
};
