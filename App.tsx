import { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// ── Types ──────────────────────────────────────────────────────────────────
interface Game {
  id: string; title: string; age: string; badge: string; stars: number;
  img: string; desc: string; skills: string[]; bg: string;
  qs: [number, number, string][];
}
interface Post {
  id: number; av: string; avClass: string; name: string; role: string;
  time: string; cat: string; text: string; imgs: string[];
  tags: string[]; likes: number; comments: number;
  resource: { icon: string; title: string; desc: string } | null;
}
interface FathiQuestion {
  id: number; type: 'visual' | 'memory' | 'attention' | 'processing';
  question: string; options: string[]; correct: number; image?: string;
}
interface RavenQuestion {
  id: number; question: string; image: string;
  options: string[]; correct: number; pattern: string;
}
interface DiagnosticReport {
  type: 'fathi' | 'raven';
  score: number;
  percentage: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  testDate: string;
}

// ── Data ───────────────────────────────────────────────────────────────────
const GAMES: Game[] = [
  { id:'numbers', title:'مملكة الأعداد', age:'٦–٩ سنوات', badge:'جديد', stars:5,
    img:'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&q=80',
    desc:'رحلة ممتعة في عالم الأعداد! يتعلم الطفل ترتيب الأعداد وتمييزها بصرياً من خلال تحديات تفاعلية.',
    skills:['الأعداد','الترتيب','التمييز البصري'], bg:'linear-gradient(135deg,#1a0800,#3d1800)',
    qs:[[3,5,'+'],[7,2,'-'],[4,4,'+'],[9,3,'-'],[6,1,'+']] },
  { id:'shapes', title:'مغامرة الأشكال', age:'٥–٨ سنوات', badge:'', stars:4,
    img:'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80',
    desc:'استكشاف عالم الأشكال الهندسية بألوان زاهية.',
    skills:['الأشكال الهندسية','الألوان','التصنيف'], bg:'linear-gradient(135deg,#001a1a,#003333)',
    qs:[[2,6,'+'],[8,4,'-'],[3,3,'+'],[7,5,'-'],[5,2,'+']] },
  { id:'addition', title:'بطل الجمع', age:'٦–١٠ سنوات', badge:'الأكثر لعباً', stars:5,
    img:'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=400&q=80',
    desc:'أصبح بطل الجمع! تحديات متدرجة الصعوبة لتعلم عملية الجمع بطريقة مثيرة.',
    skills:['الجمع','السرعة الحسابية','الذاكرة'], bg:'linear-gradient(135deg,#1a0014,#38002a)',
    qs:[[5,3,'+'],[7,4,'+'],[6,6,'+'],[8,2,'+'],[9,5,'+']] },
  { id:'subtraction', title:'سحر الطرح', age:'٧–١١ سنوات', badge:'', stars:4,
    img:'https://images.unsplash.com/photo-1632571401005-458e9d244591?w=400&q=80',
    desc:'اكتشف سحر الطرح من خلال قصص وتحديات مصممة لجعل الطرح أمراً ممتعاً وسهلاً.',
    skills:['الطرح','التفكير المنطقي','حل المسائل'], bg:'linear-gradient(135deg,#001414,#002828)',
    qs:[[9,4,'-'],[8,3,'-'],[7,2,'-'],[6,1,'-'],[10,5,'-']] },
  { id:'counting', title:'حدائق العدّ', age:'٤–٧ سنوات', badge:'للمبتدئين', stars:5,
    img:'https://images.unsplash.com/photo-1553481187-be93c21490a9?w=400&q=80',
    desc:'حديقة ملونة مليئة بالفاكهة والحيوانات! يتعلم الطفل العدّ بطريقة بصرية ممتعة.',
    skills:['العدّ','التناظر','الإدراك البصري'], bg:'linear-gradient(135deg,#1a1000,#2d1c00)',
    qs:[[2,3,'+'],[4,1,'+'],[3,2,'+'],[5,4,'+'],[6,3,'+']] },
  { id:'pattern', title:'لعبة الأنماط', age:'٨–١٢ سنوات', badge:'تحدٍّ', stars:3,
    img:'https://images.unsplash.com/photo-1561622539-50afde2e09b5?w=400&q=80',
    desc:'تحدٍّ عقلي! اكتشاف الأنماط الرقمية وتكملة المتسلسلات.',
    skills:['الأنماط','المنطق','التسلسل'], bg:'linear-gradient(135deg,#140014,#280028)',
    qs:[[4,4,'+'],[6,3,'-'],[5,5,'+'],[8,4,'-'],[7,7,'+']] },
  { id:'multiplication', title:'مضاعفات النجوم', age:'٨–١٢ سنوات', badge:'جديد', stars:5,
    img:'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=400&q=80',
    desc:'تعلّم جدول الضرب عبر رحلة في الفضاء! كل إجابة صحيحة تُضيء نجمة.',
    skills:['الضرب','جدول المضاعفات','الذاكرة'], bg:'linear-gradient(135deg,#050014,#100030)',
    qs:[[2,3,'+'],[3,4,'+'],[2,5,'+'],[4,3,'+'],[5,4,'+']] },
  { id:'comparison', title:'من الأكبر؟', age:'٥–٨ سنوات', badge:'', stars:4,
    img:'https://images.unsplash.com/photo-1596495577886-d920f1fb7238?w=400&q=80',
    desc:'مقارنة الأعداد بطريقة مبتكرة! يتعلم الطفل مفهوم أكبر وأصغر.',
    skills:['المقارنة','ترتيب الأعداد','المنطق'], bg:'linear-gradient(135deg,#001a0a,#00331a)',
    qs:[[5,3,'+'],[9,2,'-'],[7,4,'+'],[8,6,'-'],[6,3,'+']] },
];

// ── Fathi Al-Zayat Math Assessment ─────────────────────────────────────────
const FATHI_QUESTIONS: FathiQuestion[] = [
  // Visual Processing - التمييز البصري والترتيب
  { id:1, type:'visual', question:'رتب الأعداد من الأصغر للأكبر: 5، 2، 8، 1، 9',
    options:['1، 2، 5، 8، 9', '9، 8، 5، 2، 1', '2، 1، 5، 8، 9', '5، 2، 8، 1، 9'], correct:0 },
  { id:2, type:'visual', question:'ما العدد الناقص: 2، 4، 6، __، 10',
    options:['7', '8', '5', '9'], correct:1 },
  { id:3, type:'visual', question:'قارن بين الأعداد: أيهما أكبر: 63 أم 47؟',
    options:['47', '63', 'متساويان', 'لا يمكن تحديده'], correct:1 },
  { id:4, type:'visual', question:'ما العدد الناقص: 3، 6، 9، __، 15',
    options:['11', '12', '13', '10'], correct:1 },
  { id:5, type:'visual', question:'استكمل السلسلة: 2، 4، 8، __، 32',
    options:['12', '16', '20', '24'], correct:1 },

  // Memory - الذاكرة العددية والعاملة
  { id:6, type:'memory', question:'تذكر هذه الأعداد: 3، 7، 2 — رتبها من الأصغر للأكبر',
    options:['2، 3، 7', '3، 7، 2', '7، 3، 2', '2، 7، 3'], correct:0 },
  { id:7, type:'memory', question:'احسب: 5 + 3 = __',
    options:['7', '8', '9', '10'], correct:1 },
  { id:8, type:'memory', question:'احسب: 10 - 4 = __',
    options:['6', '7', '5', '8'], correct:0 },
  { id:9, type:'memory', question:'تذكر: 1، 5، 3 — أي العددين أكبر بينها؟',
    options:['1', '5', '3', 'لا يمكن تحديده'], correct:1 },
  { id:10, type:'memory', question:'احسب: 7 + 6 = __',
    options:['12', '13', '14', '15'], correct:1 },

  // Attention - الانتباه والتركيز والإدراك
  { id:11, type:'attention', question:'ركز: كم مرة يظهر الرقم 2 في هذه السلسلة: 2، 5، 2، 3، 2، 1؟',
    options:['مرة واحدة', 'مرتين', 'ثلاث مرات', 'أربع مرات'], correct:2 },
  { id:12, type:'attention', question:'انتبه: أي الأرقام لا ينتمي للمجموعة: 2، 4، 6، 7، 8؟',
    options:['2', '4', '7', '8'], correct:2 },
  { id:13, type:'attention', question:'قارن: 54 و 45 — هل هما متساويان؟',
    options:['نعم متساويان', 'لا، هما مختلفان', 'لا يمكن التحديد', '54 أصغر'], correct:1 },
  { id:14, type:'attention', question:'أي هو أصغر عدد: 32، 41، 18، 29؟',
    options:['32', '41', '18', '29'], correct:2 },
  { id:15, type:'attention', question:'استكمل: 10، 9، __, 7، 6',
    options:['5', '8', '9', '4'], correct:1 },

  // Processing Speed - سرعة المعالجة والعمليات الحسابية
  { id:16, type:'processing', question:'احسب بسرعة: 10 + 5 + 3 = __',
    options:['18', '17', '19', '16'], correct:0 },
];

// ── Raven's Progressive Matrices ────────────────────────────────────────────
// Create colorful SVG patterns for Raven matrices
function generateRavenMatrix(type: string): string {
  const templates: Record<string, string> = {
    pattern1: `<svg width="280" height="280" xmlns="http://www.w3.org/2000/svg" style="background:#f8f9fa;border-radius:8px">
      <defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#3498db;stop-opacity:1" /><stop offset="100%" style="stop-color:#2980b9;stop-opacity:1" /></linearGradient></defs>
      <rect x="20" y="20" width="60" height="60" fill="url(#g1)" rx="8"/><rect x="110" y="20" width="60" height="60" fill="#e74c3c" rx="8"/><rect x="200" y="20" width="60" height="60" fill="url(#g1)" rx="8"/>
      <rect x="20" y="110" width="60" height="60" fill="#e74c3c" rx="8"/><rect x="110" y="110" width="60" height="60" fill="url(#g1)" rx="8"/><rect x="200" y="110" width="60" height="60" fill="#e74c3c" rx="8"/>
      <rect x="20" y="200" width="60" height="60" fill="url(#g1)" rx="8"/><rect x="110" y="200" width="60" height="60" fill="#e74c3c" rx="8"/><text x="230" y="245" font-size="36" font-weight="bold" fill="#2c3e50">?</text>
    </svg>`,
    pattern2: `<svg width="280" height="280" xmlns="http://www.w3.org/2000/svg" style="background:#f8f9fa;border-radius:8px">
      <defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#f39c12;stop-opacity:1" /><stop offset="100%" style="stop-color:#d68910;stop-opacity:1" /></linearGradient></defs>
      <circle cx="50" cy="50" r="28" fill="url(#g2)"/><circle cx="140" cy="50" r="28" fill="#27ae60"/><circle cx="230" cy="50" r="28" fill="url(#g2)"/>
      <circle cx="50" cy="140" r="28" fill="#27ae60"/><circle cx="140" cy="140" r="28" fill="url(#g2)"/><circle cx="230" cy="140" r="28" fill="#27ae60"/>
      <circle cx="50" cy="230" r="28" fill="url(#g2)"/><circle cx="140" cy="230" r="28" fill="#27ae60"/><text x="210" y="245" font-size="36" font-weight="bold" fill="#2c3e50">?</text>
    </svg>`,
    pattern3: `<svg width="280" height="280" xmlns="http://www.w3.org/2000/svg" style="background:#f8f9fa;border-radius:8px">
      <defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#9b59b6;stop-opacity:1" /><stop offset="100%" style="stop-color:#8e44ad;stop-opacity:1" /></linearGradient></defs>
      <polygon points="50,20 90,50 80,100 20,100 10,50" fill="url(#g3)"/><polygon points="140,20 180,50 170,100 110,100 100,50" fill="#1abc9c"/><polygon points="230,20 270,50 260,100 200,100 190,50" fill="url(#g3)"/>
      <polygon points="50,130 90,160 80,210 20,210 10,160" fill="#1abc9c"/><polygon points="140,130 180,160 170,210 110,210 100,160" fill="url(#g3)"/><polygon points="230,130 270,160 260,210 200,210 190,160" fill="#1abc9c"/>
      <polygon points="50,240 90,270 80,320 20,320 10,270" fill="url(#g3)"/><polygon points="140,240 180,270 170,320 110,320 100,270" fill="#1abc9c"/><text x="210" y="255" font-size="36" font-weight="bold" fill="#2c3e50">?</text>
    </svg>`,
    pattern4: `<svg width="280" height="280" xmlns="http://www.w3.org/2000/svg" style="background:#f8f9fa;border-radius:8px">
      <defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#e67e22;stop-opacity:1" /><stop offset="100%" style="stop-color:#d35400;stop-opacity:1" /></linearGradient></defs>
      <line x1="20" y1="20" x2="80" y2="80" stroke="url(#g4)" stroke-width="6" stroke-linecap="round"/><line x1="110" y1="20" x2="170" y2="80" stroke="#3498db" stroke-width="6" stroke-linecap="round"/>
      <line x1="200" y1="20" x2="260" y2="80" stroke="url(#g4)" stroke-width="6" stroke-linecap="round"/><line x1="20" y1="130" x2="80" y2="190" stroke="#3498db" stroke-width="6" stroke-linecap="round"/>
      <line x1="110" y1="130" x2="170" y2="190" stroke="url(#g4)" stroke-width="6" stroke-linecap="round"/><line x1="200" y1="130" x2="260" y2="190" stroke="#3498db" stroke-width="6" stroke-linecap="round"/>
      <line x1="20" y1="240" x2="80" y2="300" stroke="url(#g4)" stroke-width="6" stroke-linecap="round"/><line x1="110" y1="240" x2="170" y2="300" stroke="#3498db" stroke-width="6" stroke-linecap="round"/>
      <text x="210" y="255" font-size="36" font-weight="bold" fill="#2c3e50">?</text>
    </svg>`,
    pattern5: `<svg width="280" height="280" xmlns="http://www.w3.org/2000/svg" style="background:#f8f9fa;border-radius:8px">
      <defs><linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#16a085;stop-opacity:1" /><stop offset="100%" style="stop-color:#138d75;stop-opacity:1" /></linearGradient></defs>
      <rect x="20" y="20" width="45" height="45" fill="url(#g5)"/><rect x="80" y="20" width="45" height="45" fill="url(#g5)"/><rect x="140" y="20" width="45" height="45" fill="url(#g5)"/>
      <rect x="200" y="20" width="45" height="45" fill="url(#g5)"/><rect x="20" y="80" width="45" height="45" fill="url(#g5)"/><rect x="80" y="80" width="45" height="45" fill="none" stroke="url(#g5)" stroke-width="3"/>
      <rect x="140" y="80" width="45" height="45" fill="url(#g5)"/><rect x="200" y="80" width="45" height="45" fill="none" stroke="url(#g5)" stroke-width="3"/><rect x="20" y="140" width="45" height="45" fill="url(#g5)"/>
      <rect x="80" y="140" width="45" height="45" fill="url(#g5)"/><rect x="140" y="140" width="45" height="45" fill="none" stroke="url(#g5)" stroke-width="3"/>
      <rect x="200" y="140" width="45" height="45" fill="none" stroke="url(#g5)" stroke-width="3"/><text x="230" y="175" font-size="36" font-weight="bold" fill="#2c3e50">?</text>
    </svg>`,
  };
  return `data:image/svg+xml;utf8,${encodeURIComponent(templates[type] || templates.pattern1)}`;
}

const RAVEN_QUESTIONS: RavenQuestion[] = [
  { id:1, question:'انظر للمصفوفة — أي الخيارات التالية يكمل النمط بشكل صحيح؟',
    image: generateRavenMatrix('pattern1'),
    options:['مربع أزرق', 'مربع أحمر', 'مربع أخضر', 'مربع برتقالي'], correct:0, pattern:'alternating' },
  { id:2, question:'ما الشكل الذي ينقص في هذه المصفوفة؟',
    image: generateRavenMatrix('pattern2'),
    options:['دائرة خضراء', 'دائرة برتقالية', 'دائرة زرقاء', 'دائرة حمراء'], correct:1, pattern:'sequence' },
  { id:3, question:'استكمل النمط — أي من هذه الخيارات هو الصحيح؟',
    image: generateRavenMatrix('pattern3'),
    options:['مضلع أرجواني', 'مضلع أخضر', 'مضلع ورديّ', 'مضلع أزرق'], correct:1, pattern:'rotation' },
  { id:4, question:'تتبع القاعدة المنطقية — ما الخيار المفقود؟',
    image: generateRavenMatrix('pattern4'),
    options:['خط برتقالي', 'خط أزرق', 'خط أخضر', 'خط أرجواني'], correct:0, pattern:'progression' },
  { id:5, question:'لاحظ الشبكة بعناية — أي الخيارات يكمل النمط؟',
    image: generateRavenMatrix('pattern5'),
    options:['مربع مليء أخضر', 'مربع فارغ أخضر', 'مربع بني', 'لا شيء'], correct:1, pattern:'logic' },
  { id:6, question:'حلل النمط المنطقي — ما هو الحل الصحيح؟',
    image: generateRavenMatrix('pattern1'),
    options:['مربع أحمر', 'مربع أزرق', 'مربع أخضر', 'دائرة برتقالية'], correct:1, pattern:'matrix' },
  { id:7, question:'ابحث عن القاعدة — أكمل المصفوفة بالخيار الصحيح',
    image: generateRavenMatrix('pattern2'),
    options:['دائرة برتقالية', 'دائرة خضراء', 'مربع أزرق', 'مثلث أرجواني'], correct:0, pattern:'rule' },
  { id:8, question:'أكمل الشكل الناقص في هذه المصفوفة المنطقية',
    image: generateRavenMatrix('pattern3'),
    options:['مضلع أخضر', 'مضلع أرجواني', 'دائرة زرقاء', 'مربع أحمر'], correct:0, pattern:'missing' },
];

const INIT_POSTS: Post[] = [
  { id:1, av:'س', avClass:'o', name:'د. سارة بن علي', role:'أرطفونية معتمدة — الجزائر', time:'منذ ساعتين', cat:'research',
    text:'دراسة حديثة 2024: الأطفال الذين يستخدمون الألعاب التعليمية التكيّفية 20 دقيقة يومياً يُظهرون تحسناً بنسبة 67% في مهارات الحساب خلال 3 أشهر.',
    imgs:['https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&q=80'],
    tags:['#ديسكالكوليا','#أبحاث','#علاج'], likes:34, comments:12, resource:null },
  { id:2, av:'ك', avClass:'c', name:'أ. كريم بوزيد', role:'معلم تعليم خاص — متخصص الرياضيات', time:'منذ 5 ساعات', cat:'games',
    text:'جربت اليوم لعبة "مملكة الأعداد" مع مجموعة من 6 أطفال يعانون صعوبات الحساب. النتيجة مذهلة — 5 منهم أكملوا التحدي بنجاح!',
    imgs:['https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=500&q=80','https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&q=80'],
    tags:['#ألعاب_تعليمية','#تجربة_ميدانية'], likes:28, comments:9, resource:null },
  { id:3, av:'أ', avClass:'g', name:'د. أمينة حداد', role:'طبيبة نفسية أطفال', time:'أمس', cat:'cases',
    text:'نصيحة للأهل: عندما يرفض طفلكم الجلوس لحل تمارين الرياضيات، لا تُجبروه. ابدأوا بـ5 دقائق لعب تعليمي يومياً وزيدوا تدريجياً.',
    imgs:['https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=500&q=80'],
    tags:['#نصائح','#أهل','#علم_الأعصاب'], likes:67, comments:23,
    resource:{ icon:'📄', title:'دليل التعامل مع رفض الرياضيات', desc:'PDF — 12 صفحة' } },
  { id:4, av:'و', avClass:'p', name:'د. وليد منصوري', role:'أرطفوني — عسر القراءة والحساب', time:'منذ يومين', cat:'news',
    text:'تحديث مهم: صدر توجيه وزاري جديد يُلزم المدارس الجزائرية بتوفير برنامج دعم خاص للأطفال المشخّصين بصعوبات التعلم.',
    imgs:[], tags:['#أخبار','#سياسات_تعليمية','#الجزائر'], likes:89, comments:31, resource:null },
];

function shuffle<T>(a: T[]): T[] { return [...a].sort(() => Math.random() - 0.5); }

// ── Algerian Flag SVG ─────────────────────────────────────────────────────
function AlgerianFlag({ size = 32 }: { size?: number }) {
  const h = size * 0.67;
  return (
    <svg width={size} height={h} viewBox="0 0 900 600" style={{ borderRadius: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.4)', display: 'block' }}>
      <rect width="450" height="600" fill="#006233" />
      <rect x="450" width="450" height="600" fill="#ffffff" />
      <circle cx="420" cy="300" r="160" fill="#D21034" />
      <circle cx="470" cy="300" r="130" fill="#006233" />
      <circle cx="470" cy="300" r="130" fill="none" stroke="#ffffff" strokeWidth="0" />
      {/* Adjust white fill for the right-side overlap */}
      <circle cx="470" cy="300" r="130" fill="white" opacity="0" />
      {/* Fix: crescent should be red on both sides */}
      <circle cx="420" cy="300" r="160" fill="#D21034" />
      <circle cx="465" cy="300" r="128" fill="white" />
      {/* Star */}
      <polygon
        points="540,220 557,272 610,272 566,303 583,355 540,324 497,355 514,303 470,272 523,272"
        fill="#D21034"
      />
    </svg>
  );
}

// ── Platform Logo SVG ─────────────────────────────────────────────────────
function HopeLineLogo({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 170 170" fill="none">
      <defs>
        <linearGradient id="logo-og" x1="0" y1="0" x2="170" y2="170" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF6B00" /><stop offset="100%" stopColor="#FFB800" />
        </linearGradient>
        <linearGradient id="logo-cg" x1="0" y1="170" x2="170" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00D4FF" /><stop offset="100%" stopColor="#00FFCC" />
        </linearGradient>
      </defs>
      <rect width="170" height="170" rx="38" fill="#03080F" />
      <path d="M16 132 Q36 108 60 112 Q84 116 106 98 Q128 80 152 58"
        stroke="url(#logo-cg)" strokeWidth="7" strokeLinecap="round" fill="none" strokeDasharray="6 4" opacity="0.85" />
      <circle cx="16" cy="132" r="9" fill="url(#logo-cg)" opacity="0.9" />
      <circle cx="16" cy="132" r="4.5" fill="#03080F" />
      <path d="M152 34 C143 34 136 41 136 50 C136 63 152 78 152 78 C152 78 168 63 168 50 C168 41 161 34 152 34Z"
        fill="url(#logo-og)" />
      <circle cx="152" cy="50" r="7.5" fill="#03080F" />
      <circle cx="152" cy="50" r="3.5" fill="url(#logo-og)" />
      <text x="34" y="26" fontFamily="Arial" fontSize="22" fontWeight="900" fill="#FF6B00" opacity="0.85">+</text>
      <text x="10" y="78" fontFamily="Arial" fontSize="20" fontWeight="900" fill="#00D4FF" opacity="0.80">−</text>
      <text x="128" y="22" fontFamily="Arial" fontSize="20" fontWeight="900" fill="#FFB800" opacity="0.78">×</text>
    </svg>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('home');
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [modalGame, setModalGame] = useState<Game | null>(null);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<{ val: number; correct: number } | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [posts, setPosts] = useState<Post[]>(INIT_POSTS);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [feedFilter, setFeedFilter] = useState('all');
  const [gameFinished, setGameFinished] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [regForm, setRegForm] = useState({ name: '', email: '', phone: '', role: 'parent', password: '', confirm: '' });
  const [regSubmitted, setRegSubmitted] = useState(false);
  const [fathiTest, setFathiTest] = useState<{ active: boolean; qIdx: number; score: number; answers: number[] }>({ active: false, qIdx: 0, score: 0, answers: [] });
  const [ravenTest, setRavenTest] = useState<{ active: boolean; qIdx: number; score: number; answers: number[] }>({ active: false, qIdx: 0, score: 0, answers: [] });
  const [testFinished, setTestFinished] = useState<{ type: 'fathi' | 'raven' | null; score: number }>({ type: null, score: 0 });
  const [diagnosticReport, setDiagnosticReport] = useState<DiagnosticReport | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2800);
  };

  const navigate = (p: string) => { setPage(p); window.scrollTo(0, 0); };

  // ── Generate Diagnostic Report ────────────────────────────────────────
  const generateDiagnosticReport = (testType: 'fathi' | 'raven', score: number): DiagnosticReport => {
    if (testType === 'fathi') {
      const totalPoints = FATHI_QUESTIONS.length * 10;
      const percentage = Math.round((score / totalPoints) * 100);

      let strengths: string[] = [];
      let weaknesses: string[] = [];
      let recommendations: string[] = [];

      if (percentage >= 80) {
        strengths = ['مهارات حسابية متقدمة', 'قدرة عالية على التركيز', 'ذاكرة عددية قوية', 'معالجة بصرية ممتازة'];
        weaknesses = [];
        recommendations = ['الاستمرار في التدريب لتعزيز المهارات', 'تحديات أكثر صعوبة'];
      } else if (percentage >= 60) {
        strengths = ['قدرات حسابية معقولة', 'فهم جيد للأعداد', 'تركيز متوسط'];
        weaknesses = ['بعض الضعف في الذاكرة العددية', 'سرعة معالجة متوسطة'];
        recommendations = ['ممارسة منتظمة للعمليات الحسابية', 'تمارين تعزيز الذاكرة', 'ألعاب تركيز بصري'];
      } else if (percentage >= 40) {
        strengths = ['محاولة جيدة', 'بعض المهارات الأساسية متوفرة'];
        weaknesses = ['صعوبة واضحة في المعالجة العددية', 'ضعف في الذاكرة', 'انخفاض سرعة المعالجة', 'صعوبة التركيز'];
        recommendations = ['تدريب مكثف على الأساسيات', 'جلسات فردية مع متخصص', 'ألعاب تعليمية تدريجية', 'تقييم متخصص'];
      } else {
        strengths = ['رغبة في التعلم'];
        weaknesses = ['صعوبات كبيرة في الحساب', 'ضعف شديد في الذاكرة', 'مشاكل في التركيز', 'سرعة معالجة منخفضة جداً'];
        recommendations = ['استشارة أخصائي فوراً', 'برنامج تدريبي متخصص', 'دعم أسري مكثف', 'متابعة دورية'];
      }

      return {
        type: 'fathi',
        score,
        percentage,
        strengths,
        weaknesses,
        recommendations,
        testDate: new Date().toLocaleDateString('ar-SA'),
      };
    } else {
      const totalPoints = RAVEN_QUESTIONS.length * 15;
      const percentage = Math.round((score / totalPoints) * 100);

      let strengths: string[] = [];
      let weaknesses: string[] = [];
      let recommendations: string[] = [];

      if (percentage >= 75) {
        strengths = ['ذكاء منطقي عالي', 'قدرة ممتازة على التفكير البصري', 'حل مشاكل متقدم', 'إدراك أنماط ممتاز'];
        weaknesses = [];
        recommendations = ['تحديات منطقية أعقد', 'مشاريع تفكير خلاق'];
      } else if (percentage >= 55) {
        strengths = ['ذكاء منطقي جيد', 'قدرة معقولة على التفكير المرئي', 'مهارات حل المشاكل'];
        weaknesses = ['بعض الصعوبة في الأنماط المعقدة', 'سرعة معالجة متوسطة'];
        recommendations = ['تمارين منطقية منتظمة', 'ألعاب تفكير استراتيجية'];
      } else if (percentage >= 35) {
        strengths = ['محاولة حقيقية في حل المشاكل'];
        weaknesses = ['صعوبة في التفكير البصري', 'ضعف في تحديد الأنماط', 'مشاكل في الإدراك المكاني'];
        recommendations = ['تدريب منتظم على الأنماط', 'ألعاب تفاعلية بصرية', 'متابعة متخصص'];
      } else {
        strengths = ['المثابرة في محاولة الحل'];
        weaknesses = ['صعوبات شديدة في التفكير المنطقي', 'ضعف واضح في الذكاء البصري', 'مشاكل في إدراك العلاقات'];
        recommendations = ['تقييم متخصص فوري', 'برنامج دعم كثيف', 'تمارين معرفية مركزة'];
      }

      return {
        type: 'raven',
        score,
        percentage,
        strengths,
        weaknesses,
        recommendations,
        testDate: new Date().toLocaleDateString('ar-SA'),
      };
    }
  };

  // ── Fathi Test ────────────────────────────────────────────────────────
  const startFathiTest = () => {
    setFathiTest({ active: true, qIdx: 0, score: 0, answers: [] });
    setTestFinished({ type: null, score: 0 });
  };

  const answerFathi = (idx: number) => {
    const q = FATHI_QUESTIONS[fathiTest.qIdx];
    const isCorrect = idx === q.correct;
    const newAnswers = [...fathiTest.answers, idx];
    const newScore = fathiTest.score + (isCorrect ? 10 : 0);

    if (fathiTest.qIdx + 1 >= FATHI_QUESTIONS.length) {
      setFathiTest({ ...fathiTest, score: newScore, answers: newAnswers });
      const report = generateDiagnosticReport('fathi', newScore);
      setDiagnosticReport(report);
      setTestFinished({ type: 'fathi', score: newScore });
    } else {
      setFathiTest({ ...fathiTest, qIdx: fathiTest.qIdx + 1, score: newScore, answers: newAnswers });
    }
  };

  // ── Raven Test ────────────────────────────────────────────────────────
  const startRavenTest = () => {
    setRavenTest({ active: true, qIdx: 0, score: 0, answers: [] });
    setTestFinished({ type: null, score: 0 });
  };

  const answerRaven = (idx: number) => {
    const q = RAVEN_QUESTIONS[ravenTest.qIdx];
    const isCorrect = idx === q.correct;
    const newAnswers = [...ravenTest.answers, idx];
    const newScore = ravenTest.score + (isCorrect ? 15 : 0);

    if (ravenTest.qIdx + 1 >= RAVEN_QUESTIONS.length) {
      setRavenTest({ ...ravenTest, score: newScore, answers: newAnswers });
      const report = generateDiagnosticReport('raven', newScore);
      setDiagnosticReport(report);
      setTestFinished({ type: 'raven', score: newScore });
    } else {
      setRavenTest({ ...ravenTest, qIdx: ravenTest.qIdx + 1, score: newScore, answers: newAnswers });
    }
  };

  // ── Download Report as PDF ────────────────────────────────────────────
  const downloadReportPDF = async () => {
    if (!reportRef.current || !diagnosticReport) return;

    showToast('جاري تحميل التقرير...');

    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const fileName = `تقرير_تشخيصي_${diagnosticReport.type === 'fathi' ? 'فتحي_الزيات' : 'رافن'}_${new Date().toLocaleDateString('ar-SA')}.pdf`;
      pdf.save(fileName);
      showToast('تم تحميل التقرير بنجاح!');
    } catch (error) {
      showToast('حدث خطأ في تحميل التقرير');
      console.error(error);
    }
  };
  const openGame = (id: string) => {
    const g = GAMES.find(x => x.id === id);
    if (!g) return;
    setModalGame(g);
    setQIdx(0);
    setScore(0);
    setAnswered(null);
    setGameFinished(false);
  };

  const handleAnswer = (val: number, correct: number) => {
    if (answered) return;
    setAnswered({ val, correct });
    if (val === correct) setScore(s => s + 20);
    setTimeout(() => {
      setAnswered(null);
      if (qIdx + 1 >= 5) { setGameFinished(true); }
      else { setQIdx(i => i + 1); }
    }, 900);
  };

  const restartGame = () => {
    setQIdx(0); setScore(0); setAnswered(null); setGameFinished(false);
  };

  // ── Feed ──────────────────────────────────────────────────────────────
  const filteredPosts = feedFilter === 'all' ? [...posts].reverse() : [...posts].reverse().filter(p => p.cat === feedFilter);

  const toggleLike = (id: number) => {
    setLikedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: likedIds.has(id) ? p.likes - 1 : p.likes + 1 } : p));
  };

  const submitPost = () => {
    if (!newPostText.trim()) { showToast('اكتب شيئاً قبل النشر'); return; }
    const np: Post = {
      id: Date.now(), av:'أ', avClass:'o', name:'أنت (أخصائي)', role:'عضو جديد',
      time:'الآن', cat:'cases', text: newPostText.trim(), imgs:[],
      tags:['#منشور_جديد'], likes:0, comments:0, resource:null
    };
    setPosts(prev => [...prev, np]);
    setNewPostText('');
    setShowNewPost(false);
    showToast('تم نشر منشورك بنجاح ✓');
  };

  // ── Registration ──────────────────────────────────────────────────────
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (regForm.password !== regForm.confirm) { showToast('كلمتا المرور غير متطابقتين'); return; }
    if (!regForm.name || !regForm.email || !regForm.password) { showToast('يرجى ملء جميع الحقول المطلوبة'); return; }
    setRegSubmitted(true);
    showToast('تم إنشاء حسابك بنجاح! مرحباً بك في HopeLine ✓');
    setTimeout(() => { setShowRegister(false); setRegSubmitted(false); navigate('home'); }, 2000);
  };

  // ── Render helpers ────────────────────────────────────────────────────
  const avColors: Record<string, string> = {
    o: 'rgba(255,107,0,0.15)',
    c: 'rgba(0,212,255,0.12)',
    g: 'rgba(0,255,100,0.10)',
    p: 'rgba(180,80,255,0.10)',
  };
  const avBorders: Record<string, string> = {
    o: 'rgba(255,107,0,0.45)',
    c: 'rgba(0,212,255,0.38)',
    g: 'rgba(0,255,100,0.32)',
    p: 'rgba(180,80,255,0.32)',
  };
  const avTextColors: Record<string, string> = {
    o: '#FF6B00', c: '#00D4FF', g: '#00ff64', p: '#b44fff'
  };

  const PostCard = ({ p }: { p: Post }) => {
    const liked = likedIds.has(p.id);
    const likesCount = liked !== likedIds.has(p.id) ? p.likes + (liked ? 1 : -1) : p.likes + (likedIds.has(p.id) ? 1 : 0);
    const displayLikes = likedIds.has(p.id) ? p.likes + 1 : p.likes;
    return (
      <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, overflow:'hidden', transition:'border-color .2s', marginBottom:16 }}>
        <div style={{ padding:'16px 16px 0', display:'flex', gap:12, alignItems:'flex-start' }}>
          <div style={{ width:44, height:44, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, background:avColors[p.avClass], border:`2px solid ${avBorders[p.avClass]}`, color:avTextColors[p.avClass] }}>{p.av}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700 }}>{p.name}</div>
            <div style={{ fontSize:11, color:'#7A8FA6' }}>{p.role}</div>
          </div>
          <div style={{ fontSize:11, color:'#7A8FA6' }}>{p.time}</div>
        </div>
        <div style={{ padding:'12px 16px' }}>
          <div style={{ fontSize:13, lineHeight:1.7, color:'rgba(255,255,255,0.88)' }}>{p.text}</div>
          {p.imgs.length === 1 && <img src={p.imgs[0]} alt="" style={{ width:'100%', maxHeight:280, objectFit:'cover', borderRadius:12, marginTop:10, display:'block' }} />}
          {p.imgs.length > 1 && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, marginTop:10, borderRadius:12, overflow:'hidden' }}>
              {p.imgs.map((img, i) => <img key={i} src={img} alt="" style={{ width:'100%', height:130, objectFit:'cover', display:'block' }} />)}
            </div>
          )}
          {p.resource && (
            <div onClick={() => showToast(`جاري تحميل ${p.resource!.title}`)} style={{ background:'rgba(0,212,255,0.06)', border:'1px solid rgba(0,212,255,0.2)', borderRadius:12, padding:14, display:'flex', gap:12, alignItems:'center', marginTop:10, cursor:'pointer' }}>
              <div style={{ width:42, height:42, borderRadius:10, background:'rgba(0,212,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{p.resource.icon}</div>
              <div><div style={{ fontSize:13, fontWeight:700, color:'#00D4FF' }}>{p.resource.title}</div><div style={{ fontSize:11, color:'#7A8FA6' }}>{p.resource.desc}</div></div>
            </div>
          )}
          <div style={{ marginTop:8 }}>
            {p.tags.map(t => <span key={t} style={{ display:'inline-block', background:'rgba(255,107,0,0.12)', border:'1px solid rgba(255,107,0,0.25)', color:'#FFB800', fontSize:11, padding:'3px 10px', borderRadius:100, margin:'0 0 0 6px' }}>{t}</span>)}
          </div>
        </div>
        <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,0.08)', display:'flex', gap:16 }}>
          <button onClick={() => toggleLike(p.id)} style={{ background:'none', border:'none', color: liked ? '#FF6B00' : '#7A8FA6', fontFamily:"'Cairo',sans-serif", fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
            <span>{liked ? '❤️' : '🤍'}</span> {displayLikes} إعجاب
          </button>
          <button onClick={() => showToast('ميزة التعليقات قريباً')} style={{ background:'none', border:'none', color:'#7A8FA6', fontFamily:"'Cairo',sans-serif", fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
            💬 {p.comments} تعليق
          </button>
          <button onClick={() => showToast('تمت مشاركة المنشور')} style={{ background:'none', border:'none', color:'#7A8FA6', fontFamily:"'Cairo',sans-serif", fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
            ↗️ مشاركة
          </button>
        </div>
      </div>
    );
  };

  // current game question
  const currentQ = modalGame ? modalGame.qs[qIdx] : null;
  const [qa, qb, qop] = currentQ || [0, 0, '+'];
  const correctAns = qop === '+' ? qa + qb : qa - qb;
  const opts = modalGame && currentQ ? shuffle([correctAns, Math.abs(correctAns + (Math.random() > 0.5 ? 1 : -1)), Math.abs(correctAns + 2), Math.abs(correctAns - 3)]).slice(0, 4) : [];

  const btnStyle = (base: object, extra?: object) => ({ ...base, ...extra });

  const s = {
    // colors
    dark: '#03080F', d2: '#060D18', orange: '#FF6B00', o2: '#FFB800', cyan: '#00D4FF', c2: '#00FFCC',
    gray: '#7A8FA6', card: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)',
    // common
    bbtnO: { padding:'13px 28px', borderRadius:12, fontFamily:"'Cairo',sans-serif", fontSize:15, fontWeight:700, cursor:'pointer', border:'none', background:'linear-gradient(135deg,#FF6B00,#FFB800)', color:'#fff', display:'inline-flex', alignItems:'center', gap:8 } as React.CSSProperties,
    bbtnL: { padding:'13px 28px', borderRadius:12, fontFamily:"'Cairo',sans-serif", fontSize:15, fontWeight:700, cursor:'pointer', border:'1px solid rgba(255,255,255,0.08)', background:'transparent', color:'#fff', display:'inline-flex', alignItems:'center', gap:8 } as React.CSSProperties,
    nbtnO: { padding:'8px 16px', borderRadius:9, fontFamily:"'Cairo',sans-serif", fontSize:13, cursor:'pointer', border:'none', background:'linear-gradient(135deg,#FF6B00,#FFB800)', color:'#fff', fontWeight:700 } as React.CSSProperties,
    nbtnG: { padding:'8px 16px', borderRadius:9, fontFamily:"'Cairo',sans-serif", fontSize:13, cursor:'pointer', border:'1px solid transparent', background:'transparent', color:'#7A8FA6' } as React.CSSProperties,
  };

  return (
    <div dir="rtl" style={{ background:'#03080F', color:'#fff', fontFamily:"'Cairo',sans-serif", minHeight:'100vh', overflowX:'hidden', position:'relative' }}>
      {/* Background blobs */}
      <div style={{ position:'fixed', top:-300, right:-300, width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,107,0,.1) 0%,transparent 70%)', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', bottom:-300, left:-300, width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle,rgba(0,212,255,.08) 0%,transparent 70%)', pointerEvents:'none', zIndex:0 }} />

      {/* ── NAV ───────────────────────────────────────────────────────── */}
      <nav style={{ position:'sticky', top:0, zIndex:100, backdropFilter:'blur(24px)', background:'rgba(3,8,15,0.92)', borderBottom:'1px solid rgba(255,255,255,0.08)', padding:'0 1.2rem', display:'flex', alignItems:'center', justifyContent:'space-between', height:62, gap:12 }}>
        {/* Logo */}
        <div onClick={() => navigate('home')} style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', flexShrink:0 }}>
          <HopeLineLogo size={40} />
          <div style={{ fontSize:19, fontWeight:900, lineHeight:1 }}>Hope<span style={{ color:'#FF6B00' }}>Line</span></div>
        </div>

        {/* Algerian flag + nav links */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* Algerian Flag */}
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'5px 10px' }}>
            <AlgerianFlag size={28} />
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.55)', fontWeight:600, letterSpacing:0.3 }}>الجزائر</span>
          </div>
          <button style={s.nbtnG} onClick={() => navigate('community')}>المجتمع</button>
          <button style={s.nbtnG} onClick={() => navigate('games')}>الألعاب</button>
          <button style={{ ...s.nbtnO, display:'none' as unknown as undefined }} className="nav-diag-btn" onClick={() => navigate('diagnostic')}>ابدأ التشخيص</button>
          <button
            onClick={() => setShowRegister(true)}
            style={{ padding:'8px 16px', borderRadius:9, fontFamily:"'Cairo',sans-serif", fontSize:13, cursor:'pointer', border:'1px solid rgba(0,212,255,0.4)', background:'rgba(0,212,255,0.08)', color:'#00D4FF', fontWeight:700 }}
          >
            إنشاء حساب
          </button>
          <div onClick={() => navigate('profile')} style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#00D4FF,#00FFCC)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#03080F', cursor:'pointer', flexShrink:0 }}>أح</div>
        </div>
      </nav>

      {/* ── PAGES ──────────────────────────────────────────────────────── */}
      <div style={{ paddingBottom:80 }}>

        {/* HOME */}
        {page === 'home' && (
          <div>
            {/* Hero */}
            <div style={{ position:'relative', zIndex:1, textAlign:'center', padding:'70px 1.5rem 50px' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,107,0,.1)', border:'1px solid rgba(255,107,0,.3)', borderRadius:100, padding:'6px 16px', marginBottom:22, fontSize:13, color:'#FFB800' }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:'#FF6B00', display:'inline-block' }} />
                منصة تعليمية مبتكرة لصعوبات التعلم
              </div>
              <h1 style={{ fontSize:'clamp(1.8rem,4.5vw,3.2rem)', fontWeight:900, lineHeight:1.15, marginBottom:14 }}>
                طفلك يستطيع —<br />
                <em style={{ fontStyle:'normal', color:'#FF6B00' }}>نحن نُريه</em>{' '}
                <strong style={{ fontStyle:'normal', color:'#00D4FF' }}>الطريق</strong>
              </h1>
              <p style={{ fontSize:'1rem', color:'#7A8FA6', maxWidth:540, margin:'0 auto 32px', lineHeight:1.7 }}>
                منصة HopeLine تجمع التشخيص الذكي، الألعاب التعليمية التكيّفية، ومجتمع المختصين في مكان واحد لأول مرة.
              </p>
              <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
                <button style={s.bbtnO} onClick={() => navigate('diagnostic')}>🧩 ابدأ التشخيص المجاني</button>
                <button style={s.bbtnL} onClick={() => navigate('games')}>🎮 استكشف الألعاب</button>
                <button style={{ ...s.bbtnL, borderColor:'rgba(0,212,255,0.35)', color:'#00D4FF' }} onClick={() => setShowRegister(true)}>✨ سجّل الآن مجاناً</button>
              </div>
            </div>

            {/* Stats */}
            <div style={{ position:'relative', zIndex:1, display:'flex', justifyContent:'center', background:'rgba(255,255,255,.025)', borderTop:'1px solid rgba(255,255,255,0.08)', borderBottom:'1px solid rgba(255,255,255,0.08)', marginBottom:50 }}>
              {[{v:'+1200',l:'طفل مسجّل',c:'#FF6B00'},{v:'18',l:'لعبة تعليمية',c:'#00D4FF'},{v:'85',l:'أخصائي معتمد',c:'#FF6B00'},{v:'92%',l:'نسبة التحسن',c:'#00D4FF'}].map((s2, i) => (
                <div key={i} style={{ flex:1, maxWidth:180, textAlign:'center', padding:'18px 12px', borderLeft: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                  <div style={{ fontSize:'1.7rem', fontWeight:900, color:s2.c }}>{s2.v}</div>
                  <div style={{ fontSize:11, color:'#7A8FA6', marginTop:2 }}>{s2.l}</div>
                </div>
              ))}
            </div>

            {/* Services */}
            <div style={{ position:'relative', zIndex:1, padding:'10px 1.5rem 50px', maxWidth:1100, margin:'0 auto' }}>
              <div style={{ fontSize:'1.5rem', fontWeight:900, marginBottom:6 }}>الخدمات <span style={{ color:'#FF6B00' }}>الأساسية</span></div>
              <div style={{ color:'#7A8FA6', fontSize:13, marginBottom:28 }}>كل ما يحتاجه طفلك في رحلة التعلم</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:14 }}>
                {[
                  { icon:'🧠', title:'التشخيص الذكي', desc:'اختبارات تفاعلية ذكية لرصد صعوبات الرياضيات وتقديم تقرير مفصّل.', arr:'ابدأ التشخيص ←', ac:'#FF6B00', bg:'rgba(255,107,0,.14)', onClick:()=>navigate('diagnostic') },
                  { icon:'🎮', title:'الألعاب التعليمية', desc:'18 لعبة تكيّفية مصممة علمياً لمساعدة الأطفال.', arr:'استكشف الألعاب ←', ac:'#FF6B00', bg:'rgba(255,107,0,.14)', onClick:()=>navigate('games') },
                  { icon:'💬', title:'مجتمع الأخصائيين', desc:'منتدى حصري يتشارك فيه الأرطفونيون والمعلمون خبراتهم.', arr:'انضم للمجتمع ←', ac:'#00D4FF', bg:'rgba(0,212,255,.1)', onClick:()=>navigate('community') },
                  { icon:'📍', title:'ابحث عن أخصائي', desc:'GPS يربطك بأقرب أرطفوني أو معلم متخصص في منطقتك.', arr:'ابحث الآن ←', ac:'#00D4FF', bg:'rgba(0,212,255,.1)', onClick:()=>navigate('gps') },
                  { icon:'📊', title:'تتبع التقدم', desc:'لوحة متابعة تفصيلية لمسيرة طفلك ونقاط قوته.', arr:'عرض الملف ←', ac:'#FF6B00', bg:'rgba(255,107,0,.14)', onClick:()=>navigate('profile') },
                  { icon:'👨‍👩‍👧', title:'بوابة الأهل', desc:'تقارير أسبوعية وجلسات مباشرة مع المختصين.', arr:'بوابة الأهل ←', ac:'#b44fff', bg:'rgba(180,80,255,.1)', onClick:()=>showToast('قريباً — بوابة الأهل') },
                ].map((c, i) => (
                  <div key={i} onClick={c.onClick} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:22, cursor:'pointer', transition:'all .25s' }}>
                    <div style={{ width:50, height:50, borderRadius:13, marginBottom:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, background:c.bg }}>{c.icon}</div>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:6 }}>{c.title}</div>
                    <div style={{ fontSize:12, color:'#7A8FA6', lineHeight:1.6 }}>{c.desc}</div>
                    <div style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, color:c.ac, marginTop:14, fontWeight:600 }}>{c.arr}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Latest posts preview */}
            <div style={{ position:'relative', zIndex:1, padding:'10px 1.5rem 50px', maxWidth:1100, margin:'0 auto' }}>
              <div style={{ fontSize:'1.5rem', fontWeight:900, marginBottom:6 }}>آخر منشورات <span style={{ color:'#FF6B00' }}>المجتمع</span></div>
              <div style={{ color:'#7A8FA6', fontSize:13, marginBottom:28 }}>ما يشاركه الأخصائيون اليوم</div>
              {[...posts].reverse().slice(0, 2).map(p => <PostCard key={p.id} p={p} />)}
              <button onClick={() => navigate('community')} style={{ ...s.bbtnL, width:'100%', justifyContent:'center' }}>عرض كل المنشورات ←</button>
            </div>
          </div>
        )}

        {/* GAMES */}
        {page === 'games' && (
          <div style={{ position:'relative', zIndex:1, padding:'10px 1.5rem 50px', maxWidth:1100, margin:'0 auto' }}>
            <div style={{ fontSize:'1.5rem', fontWeight:900, marginBottom:6 }}>🎮 الألعاب <span style={{ color:'#FF6B00' }}>التعليمية</span></div>
            <div style={{ color:'#7A8FA6', fontSize:13, marginBottom:28 }}>اضغط على أي لعبة لرؤية تفاصيلها والبدء باللعب</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:18 }}>
              {GAMES.map(g => (
                <div key={g.id} onClick={() => openGame(g.id)} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20, overflow:'hidden', cursor:'pointer', transition:'all .3s' }}>
                  <div style={{ height:140, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden', background:g.bg }}>
                    <img src={g.img} alt={g.title} style={{ width:'100%', height:'100%', objectFit:'cover', opacity:.85 }} />
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(3,8,15,.85) 0%,transparent 60%)' }} />
                    {g.badge && <div style={{ position:'absolute', top:8, right:8, background:'rgba(255,107,0,.95)', color:'#fff', fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:100 }}>{g.badge}</div>}
                  </div>
                  <div style={{ padding:14 }}>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:3 }}>{g.title}</div>
                    <div style={{ fontSize:11, color:'#7A8FA6' }}>العمر: {g.age}</div>
                    <div style={{ color:'#FFB800', fontSize:12, marginTop:7 }}>{'★'.repeat(g.stars)}{'☆'.repeat(5 - g.stars)}</div>
                  </div>
                  <button style={{ display:'block', margin:'0 14px 14px', padding:9, background:'linear-gradient(135deg,#FF6B00,#FFB800)', border:'none', borderRadius:10, color:'#fff', fontFamily:"'Cairo',sans-serif", fontSize:13, fontWeight:700, cursor:'pointer', width:'calc(100% - 28px)' }}>
                    ▶ العب الآن
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COMMUNITY */}
        {page === 'community' && (
          <div style={{ position:'relative', zIndex:1, padding:'10px 1.5rem 50px', maxWidth:1100, margin:'0 auto' }}>
            <div style={{ fontSize:'1.5rem', fontWeight:900, marginBottom:6 }}>💬 مجتمع <span style={{ color:'#FF6B00' }}>الأخصائيين</span></div>
            <div style={{ color:'#7A8FA6', fontSize:13, marginBottom:20 }}>تبادل الخبرات، الأبحاث، وأفضل الممارسات مع زملائك</div>
            {/* Filter tabs */}
            <div style={{ display:'flex', gap:8, marginBottom:24, overflowX:'auto', paddingBottom:4 }}>
              {[{k:'all',l:'الكل'},{k:'research',l:'أبحاث'},{k:'games',l:'ألعاب'},{k:'cases',l:'حالات'},{k:'news',l:'أخبار'}].map(f => (
                <button key={f.k} onClick={() => setFeedFilter(f.k)}
                  style={{ padding:'7px 16px', borderRadius:100, border:'1px solid', borderColor: feedFilter===f.k ? 'rgba(255,107,0,.35)' : 'rgba(255,255,255,0.08)', background: feedFilter===f.k ? 'rgba(255,107,0,.12)' : 'transparent', color: feedFilter===f.k ? '#FFB800' : '#7A8FA6', fontFamily:"'Cairo',sans-serif", fontSize:12, cursor:'pointer', whiteSpace:'nowrap' }}
                >{f.l}</button>
              ))}
            </div>
            {/* New post form */}
            {showNewPost && (
              <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,107,0,.3)', borderRadius:18, padding:20, marginBottom:20 }}>
                <textarea value={newPostText} onChange={e => setNewPostText(e.target.value)} rows={3} placeholder="شارك تجربتك، بحثاً، أو نصيحة مع المجتمع..."
                  style={{ width:'100%', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:11, padding:'12px 14px', color:'#fff', fontFamily:"'Cairo',sans-serif", fontSize:13, resize:'none', outline:'none', marginBottom:12 }} />
                <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                  <button onClick={() => setShowNewPost(false)} style={s.nbtnG}>إلغاء</button>
                  <button onClick={submitPost} style={s.nbtnO}>نشر المنشور</button>
                </div>
              </div>
            )}
            {filteredPosts.map(p => <PostCard key={p.id} p={p} />)}
          </div>
        )}

        {/* DIAGNOSTIC */}
        {page === 'diagnostic' && !fathiTest.active && !ravenTest.active && !testFinished.type && (
          <div style={{ position:'relative', zIndex:1, padding:'10px 1.5rem 50px', maxWidth:1100, margin:'0 auto' }}>
            <div style={{ fontSize:'1.5rem', fontWeight:900, marginBottom:6 }}>🧠 التشخيص <span style={{ color:'#FF6B00' }}>الذكي</span></div>
            <div style={{ color:'#7A8FA6', fontSize:13, marginBottom:28 }}>اختبر ذكاء وقدرات طفلك الرياضية مع مقياسين معتمدين</div>

            {/* مقياس فتحي الزيات */}
            <div style={{ background:'linear-gradient(135deg,rgba(255,107,0,.12),rgba(255,107,0,.04))', border:'1px solid rgba(255,107,0,.25)', borderRadius:24, padding:28, marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:16, marginBottom:16 }}>
                <div style={{ fontSize:40 }}>📊</div>
                <div style={{ flex:1 }}>
                  <h3 style={{ fontSize:'1.1rem', fontWeight:900, marginBottom:6 }}>مقياس فتحي الزيات</h3>
                  <p style={{ fontSize:13, color:'#7A8FA6', lineHeight:1.6, marginBottom:12 }}>تقييم شامل لصعوبات تعلم الرياضيات يركز على الذاكرة، الانتباه، المعالجة البصرية والسمعية. 16 سؤال متقدم يغطي مختلف جوانب القدرات الحسابية.</p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {['الذاكرة', 'الانتباه', 'المعالجة البصرية', 'سرعة المعالجة'].map((sk, i) => (
                      <span key={i} style={{ fontSize:11, background:'rgba(255,107,0,.2)', border:'1px solid rgba(255,107,0,.4)', color:'#FFB800', padding:'4px 12px', borderRadius:100 }}>{sk}</span>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={startFathiTest} style={{ ...s.bbtnO, width:'100%', justifyContent:'center', fontSize:15 }}>🎯 ابدأ المقياس — 16 سؤال</button>
            </div>

            {/* مصفوفات رافن */}
            <div style={{ background:'linear-gradient(135deg,rgba(0,212,255,.12),rgba(0,212,255,.04))', border:'1px solid rgba(0,212,255,.25)', borderRadius:24, padding:28, marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:16, marginBottom:16 }}>
                <div style={{ fontSize:40 }}>🧩</div>
                <div style={{ flex:1 }}>
                  <h3 style={{ fontSize:'1.1rem', fontWeight:900, marginBottom:6 }}>مصفوفات رافن للذكاء</h3>
                  <p style={{ fontSize:13, color:'#7A8FA6', lineHeight:1.6, marginBottom:12 }}>اختبار ذكاء غير لفظي معالم يقيس القدرة على التفكير المنطقي وحل المشاكل من خلال أنماط هندسية وبصرية. 8 مصفوفات تصاعدية الصعوبة.</p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {['التفكير المنطقي', 'الأنماط', 'الذكاء البصري', 'حل المشاكل'].map((sk, i) => (
                      <span key={i} style={{ fontSize:11, background:'rgba(0,212,255,.2)', border:'1px solid rgba(0,212,255,.4)', color:'#00D4FF', padding:'4px 12px', borderRadius:100 }}>{sk}</span>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={startRavenTest} style={{ ...s.bbtnO, width:'100%', justifyContent:'center', fontSize:15, background:'linear-gradient(135deg,#00D4FF,#00FFCC)', color:'#03080F' }}>🎯 ابدأ المصفوفات — 8 أسئلة</button>
            </div>

            <div style={{ background:'rgba(0,212,255,.06)', border:'1px solid rgba(0,212,255,.2)', borderRadius:16, padding:16 }}>
              <div style={{ fontSize:12, color:'#7A8FA6', display:'flex', gap:8 }}>
                <span>ℹ️</span>
                <div>كل اختبار يأخذ 5-10 دقائق. ستحصل على تقرير مفصل يشمل نقاط القوة والضعف مع توصيات تطويرية.</div>
              </div>
            </div>
          </div>
        )}

        {/* FATHI TEST IN PROGRESS */}
        {fathiTest.active && !testFinished.type && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.92)', zIndex:250, display:'flex', alignItems:'center', justifyContent:'center', padding:16, overflowY:'auto' }}>
            <div style={{ background:'#060D18', border:'1px solid rgba(255,255,255,0.1)', borderRadius:28, width:'100%', maxWidth:600, overflow:'hidden' }}>
              {/* Header */}
              <div style={{ background:'linear-gradient(135deg,rgba(255,107,0,.15),rgba(255,107,0,.08))', padding:24, borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <h2 style={{ fontSize:'1.2rem', fontWeight:900 }}>📊 مقياس فتحي الزيات</h2>
                  <div style={{ fontSize:12, color:'#FFB800', fontWeight:700 }}>السؤال {fathiTest.qIdx + 1}/{FATHI_QUESTIONS.length}</div>
                </div>
                <div style={{ background:'rgba(255,255,255,.07)', borderRadius:100, height:6, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${((fathiTest.qIdx + 1) / FATHI_QUESTIONS.length) * 100}%`, borderRadius:100, background:'linear-gradient(90deg,#FF6B00,#FFB800)', transition:'width 0.3s' }} />
                </div>
              </div>

              {/* Question */}
              <div style={{ padding:32 }}>
                <div style={{ fontSize:'1.1rem', fontWeight:700, marginBottom:24, lineHeight:1.6 }}>{FATHI_QUESTIONS[fathiTest.qIdx].question}</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:12, marginBottom:24 }}>
                  {FATHI_QUESTIONS[fathiTest.qIdx].options.map((opt, i) => (
                    <button key={i} onClick={() => answerFathi(i)}
                      style={{ padding:16, borderRadius:14, border:'2px solid rgba(255,107,0,.35)', background:'rgba(255,107,0,.08)', color:'#fff', fontFamily:"'Cairo',sans-serif", fontSize:14, fontWeight:600, cursor:'pointer', transition:'all .2s', textAlign:'right' }}
                      onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor='rgba(255,107,0,.7)'; (e.target as HTMLButtonElement).style.background='rgba(255,107,0,.15)'; }}
                      onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor='rgba(255,107,0,.35)'; (e.target as HTMLButtonElement).style.background='rgba(255,107,0,.08)'; }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:16, background:'rgba(0,212,255,.06)', borderRadius:12 }}>
                  <div style={{ fontSize:12, color:'#00D4FF' }}>النقاط: <strong>{fathiTest.score}/{FATHI_QUESTIONS.length * 10}</strong></div>
                  <div style={{ fontSize:12, color:'#7A8FA6' }}>{Math.round(((fathiTest.qIdx + 1) / FATHI_QUESTIONS.length) * 100)}% مكتمل</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RAVEN TEST IN PROGRESS */}
        {ravenTest.active && !testFinished.type && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.92)', zIndex:250, display:'flex', alignItems:'center', justifyContent:'center', padding:16, overflowY:'auto' }}>
            <div style={{ background:'#060D18', border:'1px solid rgba(255,255,255,0.1)', borderRadius:28, width:'100%', maxWidth:700, overflow:'hidden' }}>
              {/* Header */}
              <div style={{ background:'linear-gradient(135deg,rgba(0,212,255,.15),rgba(0,212,255,.08))', padding:24, borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <h2 style={{ fontSize:'1.2rem', fontWeight:900 }}>🧩 مصفوفات رافن</h2>
                  <div style={{ fontSize:12, color:'#00D4FF', fontWeight:700 }}>السؤال {ravenTest.qIdx + 1}/{RAVEN_QUESTIONS.length}</div>
                </div>
                <div style={{ background:'rgba(255,255,255,.07)', borderRadius:100, height:6, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${((ravenTest.qIdx + 1) / RAVEN_QUESTIONS.length) * 100}%`, borderRadius:100, background:'linear-gradient(90deg,#00D4FF,#00FFCC)', transition:'width 0.3s' }} />
                </div>
              </div>

              {/* Question */}
              <div style={{ padding:32 }}>
                <div style={{ fontSize:14, fontWeight:700, marginBottom:20 }}>{RAVEN_QUESTIONS[ravenTest.qIdx].question}</div>
                <img src={RAVEN_QUESTIONS[ravenTest.qIdx].image} alt="matrix" style={{ width:'100%', maxHeight:240, marginBottom:24, borderRadius:12 }} />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:24 }}>
                  {RAVEN_QUESTIONS[ravenTest.qIdx].options.map((opt, i) => (
                    <button key={i} onClick={() => answerRaven(i)}
                      style={{ padding:14, borderRadius:12, border:'2px solid rgba(0,212,255,.35)', background:'rgba(0,212,255,.08)', color:'#fff', fontFamily:"'Cairo',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer', transition:'all .2s' }}
                      onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor='rgba(0,212,255,.7)'; (e.target as HTMLButtonElement).style.background='rgba(0,212,255,.15)'; }}
                      onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor='rgba(0,212,255,.35)'; (e.target as HTMLButtonElement).style.background='rgba(0,212,255,.08)'; }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:16, background:'rgba(0,212,255,.06)', borderRadius:12 }}>
                  <div style={{ fontSize:12, color:'#00D4FF' }}>النقاط: <strong>{ravenTest.score}/{RAVEN_QUESTIONS.length * 15}</strong></div>
                  <div style={{ fontSize:12, color:'#7A8FA6' }}>{Math.round(((ravenTest.qIdx + 1) / RAVEN_QUESTIONS.length) * 100)}% مكتمل</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TEST FINISHED RESULTS */}
        {testFinished.type && diagnosticReport && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.95)', zIndex:250, display:'flex', alignItems:'center', justifyContent:'center', padding:16, overflowY:'auto' }}>
            <div ref={reportRef} style={{ background:'#060D18', border:'1px solid rgba(255,255,255,0.1)', borderRadius:28, width:'100%', maxWidth:700, overflow:'hidden', padding:40, minHeight:'90vh' }}>
              {/* Header */}
              <div style={{ textAlign:'center', marginBottom:32 }}>
                <h1 style={{ fontSize:'2rem', fontWeight:900, marginBottom:8 }}>
                  📋 التقرير التشخيصي الشامل
                </h1>
                <div style={{ fontSize:13, color:'#00D4FF', marginBottom:20 }}>
                  {diagnosticReport.type === 'fathi' ? 'مقياس فتحي الزيات لصعوبات الرياضيات' : 'مصفوفات رافن للذكاء'}
                </div>
                <div style={{ fontSize:11, color:'#7A8FA6' }}>التاريخ: {diagnosticReport.testDate}</div>
              </div>

              {/* Score Section */}
              <div style={{ background:'linear-gradient(135deg,rgba(255,107,0,.15),rgba(255,107,0,.08))', borderRadius:16, padding:24, marginBottom:24, textAlign:'center' }}>
                <div style={{ fontSize:48, fontWeight:900, color:'#FF6B00', marginBottom:8 }}>
                  {diagnosticReport.percentage}%
                </div>
                <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>
                  النتيجة: {diagnosticReport.score} من {diagnosticReport.type === 'fathi' ? 160 : 120} نقطة
                </div>
                <div style={{ fontSize:13, color:'#7A8FA6' }}>
                  {diagnosticReport.percentage >= 80 ? '✅ أداء ممتاز' : diagnosticReport.percentage >= 60 ? '✅ أداء جيد' : diagnosticReport.percentage >= 40 ? '⚠️ أداء متوسط' : '⚠️ يحتاج دعماً'}
                </div>
              </div>

              {/* Strengths */}
              <div style={{ marginBottom:24 }}>
                <h3 style={{ fontSize:'1.1rem', fontWeight:900, color:'#00D4FF', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
                  💪 نقاط القوة
                </h3>
                <div style={{ display:'grid', gap:10 }}>
                  {diagnosticReport.strengths.map((s, i) => (
                    <div key={i} style={{ background:'rgba(0,212,255,.1)', border:'1px solid rgba(0,212,255,.3)', borderRadius:12, padding:12 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:18 }}>✓</span>
                        <span style={{ fontSize:13, color:'#00D4FF' }}>{s}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weaknesses */}
              {diagnosticReport.weaknesses.length > 0 && (
                <div style={{ marginBottom:24 }}>
                  <h3 style={{ fontSize:'1.1rem', fontWeight:900, color:'#FFB800', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
                    ⚠️ مجالات التحسين
                  </h3>
                  <div style={{ display:'grid', gap:10 }}>
                    {diagnosticReport.weaknesses.map((w, i) => (
                      <div key={i} style={{ background:'rgba(255,179,0,.1)', border:'1px solid rgba(255,179,0,.3)', borderRadius:12, padding:12 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <span style={{ fontSize:18 }}>→</span>
                          <span style={{ fontSize:13, color:'#FFB800' }}>{w}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div style={{ marginBottom:32 }}>
                <h3 style={{ fontSize:'1.1rem', fontWeight:900, color:'#27ae60', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
                  🎯 التوصيات والخطوات القادمة
                </h3>
                <div style={{ display:'grid', gap:10 }}>
                  {diagnosticReport.recommendations.map((r, i) => (
                    <div key={i} style={{ background:'rgba(39,174,96,.1)', border:'1px solid rgba(39,174,96,.3)', borderRadius:12, padding:12 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:16, fontWeight:900 }}>{i + 1}</span>
                        <span style={{ fontSize:13, color:'#27ae60' }}>{r}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div style={{ background:'rgba(255,255,255,.05)', borderRadius:12, padding:16, textAlign:'center', marginBottom:24 }}>
                <div style={{ fontSize:12, color:'#7A8FA6' }}>
                  هذا التقرير مخصص للاستخدام التعليمي والتشخيصي فقط. يُنصح باستشارة متخصص للحصول على تقييم شامل.
                </div>
              </div>

              {/* Action Buttons - Outside report for better printing */}
            </div>

            {/* Buttons Container */}
            <div style={{ position:'fixed', bottom:20, left:20, right:20, display:'flex', gap:12, justifyContent:'center', zIndex:251 }}>
              <button onClick={downloadReportPDF}
                style={{ ...s.bbtnO, justifyContent:'center', fontSize:14, padding:14 }}>
                📥 تحميل التقرير PDF
              </button>
              <button onClick={() => { setTestFinished({ type: null, score: 0 }); setDiagnosticReport(null); setFathiTest({ active: false, qIdx: 0, score: 0, answers: [] }); setRavenTest({ active: false, qIdx: 0, score: 0, answers: [] }); navigate('diagnostic'); }}
                style={{ ...s.bbtnL, justifyContent:'center', fontSize:14, padding:14 }}>
                📊 اختبار آخر
              </button>
              <button onClick={() => { setTestFinished({ type: null, score: 0 }); setDiagnosticReport(null); setFathiTest({ active: false, qIdx: 0, score: 0, answers: [] }); setRavenTest({ active: false, qIdx: 0, score: 0, answers: [] }); navigate('home'); }}
                style={{ ...s.bbtnL, justifyContent:'center', fontSize:14, padding:14 }}>
                🏠 الرئيسية
              </button>
            </div>
          </div>
        )}

        {/* OLD DIAGNOSTIC — Keep it as reference but hidden */}
        {false && (
          <></>
        )}

        {/* GPS */}
        {page === 'gps' && (
          <div style={{ position:'relative', zIndex:1, padding:'10px 1.5rem 50px', maxWidth:1100, margin:'0 auto' }}>
            <div style={{ fontSize:'1.5rem', fontWeight:900, marginBottom:6 }}>📍 ابحث عن <span style={{ color:'#00D4FF' }}>أخصائي</span></div>
            <div style={{ color:'#7A8FA6', fontSize:13, marginBottom:22 }}>GPS يحدد موقعك ويعرض أقرب المتخصصين في منطقتك</div>
            {/* Map + flag combo */}
            <div style={{ background:'rgba(0,212,255,.04)', border:'1px solid rgba(0,212,255,.18)', borderRadius:20, height:240, position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:22 }}>
              <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(0,212,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,.05) 1px,transparent 1px)', backgroundSize:'38px 38px' }} />
              <div style={{ position:'relative', zIndex:2, textAlign:'center' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, marginBottom:10 }}>
                  <AlgerianFlag size={44} />
                  <span style={{ fontSize:48 }}>📍</span>
                </div>
                <div style={{ fontSize:14, color:'#00D4FF', fontWeight:600, marginTop:4 }}>تم تحديد موقعك — الجزائر العاصمة</div>
                <div style={{ fontSize:11, color:'#7A8FA6', marginTop:4 }}>36.7372° N, 3.0865° E</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, marginBottom:18 }}>
              {['🎙️ أرطفوني','📚 معلم متخصص','🧑‍⚕️ طبيب نفسي'].map((lbl, i) => (
                <button key={i} onClick={() => showToast(`جاري البحث...`)} style={{ ...s.bbtnL, flex:1, justifyContent:'center', fontSize:12, padding:9 }}>{lbl}</button>
              ))}
            </div>
            {[
              { av:'👩‍⚕️', name:'د. سارة بن علي', stars:'★★★★★', role:'أرطفونية — ديسلكسيا وديسكالكوليا', dist:'1.2 كم — حي باب الزوار' },
              { av:'👨‍🏫', name:'أ. كريم بوزيد', stars:'★★★★☆', role:'معلم تعليم خاص — صعوبات الرياضيات', dist:'2.7 كم — حيدرة' },
              { av:'👩‍🔬', name:'د. أمينة حداد', stars:'★★★★★', role:'طبيبة نفسية أطفال — تقييم وتأهيل', dist:'3.5 كم — بن عكنون' },
              { av:'👨‍⚕️', name:'د. وليد منصوري', stars:'★★★★☆', role:'أرطفوني — عسر القراءة والحساب', dist:'4.1 كم — الأبيار' },
            ].map((sp, i) => (
              <div key={i} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:15, padding:14, display:'flex', gap:12, alignItems:'center', marginBottom:11, cursor:'pointer' }}>
                <div style={{ width:48, height:48, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, background:'rgba(0,212,255,.09)', border:'2px solid rgba(0,212,255,.28)' }}>{sp.av}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>{sp.name}</div>
                  <div style={{ color:'#FFB800', fontSize:11 }}>{sp.stars}</div>
                  <div style={{ fontSize:11, color:'#7A8FA6', margin:'1px 0' }}>{sp.role}</div>
                  <div style={{ fontSize:10, color:'#00D4FF', fontWeight:700 }}>📍 {sp.dist}</div>
                </div>
                <button onClick={() => showToast(`جاري حجز موعد مع ${sp.name}`)} style={{ padding:'7px 14px', borderRadius:8, background:'rgba(0,212,255,.1)', border:'1px solid rgba(0,212,255,.28)', color:'#00D4FF', fontFamily:"'Cairo',sans-serif", fontSize:11, cursor:'pointer', whiteSpace:'nowrap' }}>احجز ←</button>
              </div>
            ))}
          </div>
        )}

        {/* PROFILE */}
        {page === 'profile' && (
          <div style={{ position:'relative', zIndex:1, padding:'10px 1.5rem 50px', maxWidth:1100, margin:'0 auto' }}>
            <div style={{ fontSize:'1.5rem', fontWeight:900, marginBottom:6 }}>👤 ملف <span style={{ color:'#FF6B00' }}>الطفل</span></div>
            <div style={{ color:'#7A8FA6', fontSize:13, marginBottom:22 }}>متابعة رحلة التعلم والإنجازات</div>
            <div style={{ background:'linear-gradient(135deg,rgba(255,107,0,.1),rgba(0,212,255,.07))', border:'1px solid rgba(255,255,255,0.08)', borderRadius:22, padding:28, textAlign:'center', marginBottom:20 }}>
              <div style={{ width:74, height:74, borderRadius:'50%', margin:'0 auto 14px', background:'linear-gradient(135deg,#FF6B00,#FFB800)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, fontWeight:900, color:'#fff', border:'3px solid rgba(255,107,0,.4)' }}>أح</div>
              <div style={{ fontSize:'1.2rem', fontWeight:900, marginBottom:3 }}>أحمد بن يوسف</div>
              <div style={{ color:'#7A8FA6', fontSize:13 }}>الصف الثالث ابتدائي · عمره ٨ سنوات</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginTop:18 }}>
                {[{i:'⭐',v:'١٢٤',l:'نقطة'},{i:'🎮',v:'٣٨',l:'لعبة'},{i:'🏅',v:'٧',l:'شارة'}].map((a,i)=>(
                  <div key={i} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:11, padding:14, textAlign:'center' }}>
                    <span style={{ fontSize:26, display:'block', marginBottom:5 }}>{a.i}</span>
                    <div style={{ fontSize:'1.3rem', fontWeight:900, color:'#FF6B00' }}>{a.v}</div>
                    <div style={{ fontSize:10, color:'#7A8FA6' }}>{a.l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, padding:24, marginBottom:18 }}>
              <div style={{ fontSize:14, fontWeight:900, marginBottom:14 }}>نتائج التشخيص الأخير</div>
              {[{l:'الأعداد والترتيب',v:78,c:'#00D4FF'},{l:'الجمع والطرح',v:55,c:'#FF6B00'},{l:'الذاكرة العددية',v:42,c:'#FFB800'}].map((bar,i)=>(
                <div key={i} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:12 }}>
                    <span>{bar.l}</span><span style={{ color:bar.c }}>{bar.v}%</span>
                  </div>
                  <div style={{ background:'rgba(255,255,255,.07)', borderRadius:100, height:7, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${bar.v}%`, borderRadius:100, background:`linear-gradient(90deg,${bar.c},${bar.c === '#00D4FF' ? '#00FFCC' : bar.c === '#FF6B00' ? '#FFB800' : '#FF6B00'})` }} />
                  </div>
                </div>
              ))}
            </div>
            <button style={{ ...s.bbtnO, width:'100%', justifyContent:'center' }} onClick={() => navigate('gps')}>📍 احجز جلسة مع أخصائي</button>
          </div>
        )}
      </div>

      {/* ── BOTTOM NAV ─────────────────────────────────────────────────── */}
      <nav style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:100, background:'rgba(3,8,15,.97)', backdropFilter:'blur(20px)', borderTop:'1px solid rgba(255,255,255,0.08)', display:'flex', padding:'6px 0 8px' }}>
        {[{id:'home',icon:'🏠',label:'الرئيسية'},{id:'games',icon:'🎮',label:'الألعاب'},{id:'community',icon:'💬',label:'المجتمع'},{id:'diagnostic',icon:'🧠',label:'التشخيص'},{id:'gps',icon:'📍',label:'أخصائي'},{id:'profile',icon:'👤',label:'الملف'}].map(n => (
          <button key={n.id} onClick={() => navigate(n.id)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'5px 4px', cursor:'pointer', background:'none', border:'none', color: page===n.id ? '#FF6B00' : '#7A8FA6', fontFamily:"'Cairo',sans-serif" }}>
            <span style={{ fontSize:20, lineHeight:1 }}>{n.icon}</span>
            <span style={{ fontSize:10, fontWeight:600 }}>{n.label}</span>
          </button>
        ))}
      </nav>

      {/* FAB — community new post */}
      {page === 'community' && (
        <button onClick={() => setShowNewPost(v => !v)} style={{ position:'fixed', bottom:76, left:20, width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#FF6B00,#FFB800)', border:'none', color:'#fff', fontSize:24, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(255,107,0,.4)', zIndex:99 }}>+</button>
      )}

      {/* ── TOAST ──────────────────────────────────────────────────────── */}
      <div style={{ position:'fixed', bottom:82, left:'50%', transform:`translateX(-50%) translateY(${toastVisible ? 0 : 16}px)`, background:'rgba(255,107,0,.95)', color:'#fff', padding:'9px 22px', borderRadius:100, fontSize:13, fontWeight:700, opacity: toastVisible ? 1 : 0, transition:'all .3s', zIndex:999, whiteSpace:'nowrap', pointerEvents:'none' }}>
        {toastMsg}
      </div>

      {/* ── GAME MODAL ─────────────────────────────────────────────────── */}
      {modalGame && (
        <div onClick={e => { if (e.target === e.currentTarget) setModalGame(null); }} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.85)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#060D18', border:'1px solid rgba(255,255,255,0.08)', borderRadius:24, width:'100%', maxWidth:500, overflow:'hidden', animation:'none' }}>
            <div style={{ padding:'20px 20px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:17, fontWeight:900 }}>{modalGame.title} 🎮</div>
              <button onClick={() => setModalGame(null)} style={{ width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#7A8FA6', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, fontFamily:"'Cairo',sans-serif" }}>×</button>
            </div>
            <img src={modalGame.img} alt={modalGame.title} style={{ width:'100%', height:200, objectFit:'cover' }} />
            <div style={{ padding:20 }}>
              <div style={{ fontSize:13, color:'#7A8FA6', lineHeight:1.7, marginBottom:16 }}>{modalGame.desc}</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:18 }}>
                {modalGame.skills.map(sk => <span key={sk} style={{ background:'rgba(0,212,255,.1)', border:'1px solid rgba(0,212,255,.25)', color:'#00D4FF', fontSize:11, padding:'4px 12px', borderRadius:100 }}>{sk}</span>)}
              </div>
              {/* Game area */}
              <div style={{ background:'rgba(255,255,255,.025)', borderRadius:14, padding:20, marginBottom:16, minHeight:180 }}>
                {gameFinished ? (
                  <div style={{ textAlign:'center', padding:16 }}>
                    <div style={{ fontSize:52, marginBottom:12 }}>{score >= 80 ? '🏆' : score >= 60 ? '⭐' : '💪'}</div>
                    <div style={{ fontSize:'1.3rem', fontWeight:900, marginBottom:6 }}>{score >= 80 ? 'رائع جداً!' : score >= 60 ? 'أداء جيد!' : 'استمر!'}</div>
                    <div style={{ color:'#FF6B00', fontSize:'1.1rem', fontWeight:700 }}>النتيجة: {score}/100</div>
                    <button style={{ ...s.bbtnO, marginTop:16 }} onClick={restartGame}>العب مجدداً</button>
                  </div>
                ) : currentQ ? (
                  <>
                    <div style={{ fontSize:'1.4rem', fontWeight:700, textAlign:'center', marginBottom:20 }}>{qa} {qop} {qb} = ?</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                      {opts.map((opt, i) => {
                        let bg = 'rgba(255,255,255,0.04)';
                        let borderColor = 'rgba(255,255,255,0.08)';
                        if (answered) {
                          if (opt === correctAns) { bg = 'rgba(0,212,255,.15)'; borderColor = '#00D4FF'; }
                          else if (opt === answered.val) { bg = 'rgba(255,68,68,.15)'; borderColor = '#ff4444'; }
                        }
                        return (
                          <button key={i} onClick={() => handleAnswer(opt, correctAns)} disabled={!!answered}
                            style={{ padding:14, borderRadius:11, fontSize:'1.1rem', fontWeight:700, border:`2px solid ${borderColor}`, background:bg, color:'#fff', cursor: answered ? 'not-allowed' : 'pointer', fontFamily:"'Cairo',sans-serif", transition:'all .2s' }}>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : null}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#7A8FA6' }}>
                <span>النقاط: <strong style={{ color:'#FF6B00' }}>{score}</strong></span>
                <span>السؤال: <strong style={{ color:'#00D4FF' }}>{qIdx + 1}/5</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── REGISTRATION MODAL ─────────────────────────────────────────── */}
      {showRegister && (
        <div onClick={e => { if (e.target === e.currentTarget) setShowRegister(false); }}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.88)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:16, overflowY:'auto' }}>
          <div style={{ background:'#060D18', border:'1px solid rgba(255,255,255,0.1)', borderRadius:28, width:'100%', maxWidth:480, overflow:'hidden', position:'relative' }}>
            {/* Header */}
            <div style={{ background:'linear-gradient(135deg,rgba(255,107,0,.12),rgba(0,212,255,.08))', padding:'28px 28px 20px', textAlign:'center', borderBottom:'1px solid rgba(255,255,255,0.07)', position:'relative' }}>
              <button onClick={() => setShowRegister(false)} style={{ position:'absolute', top:14, left:14, width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#7A8FA6', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, fontFamily:"'Cairo',sans-serif" }}>×</button>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:12, gap:12, alignItems:'center' }}>
                <HopeLineLogo size={48} />
                <AlgerianFlag size={40} />
              </div>
              <h2 style={{ fontSize:'1.3rem', fontWeight:900, marginBottom:4 }}>إنشاء حساب جديد</h2>
              <p style={{ fontSize:12, color:'#7A8FA6' }}>انضم إلى مجتمع HopeLine الجزائري للتعلم التكيّفي</p>
            </div>

            {regSubmitted ? (
              <div style={{ padding:40, textAlign:'center' }}>
                <div style={{ fontSize:56, marginBottom:16 }}>🎉</div>
                <div style={{ fontSize:'1.2rem', fontWeight:900, marginBottom:8, color:'#00D4FF' }}>مرحباً بك في HopeLine!</div>
                <div style={{ fontSize:13, color:'#7A8FA6' }}>تم إنشاء حسابك بنجاح. جاري التوجيه...</div>
              </div>
            ) : (
              <form onSubmit={handleRegister} style={{ padding:28, display:'flex', flexDirection:'column', gap:16 }}>
                {/* Role selector */}
                <div>
                  <label style={{ fontSize:12, color:'#7A8FA6', display:'block', marginBottom:8, fontWeight:600 }}>نوع الحساب *</label>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                    {[{v:'parent',l:'ولي أمر',i:'👨‍👩‍👧'},{v:'specialist',l:'أخصائي',i:'🧑‍⚕️'},{v:'teacher',l:'معلم',i:'📚'}].map(r => (
                      <button type="button" key={r.v} onClick={() => setRegForm(f => ({ ...f, role: r.v }))}
                        style={{ padding:'12px 8px', borderRadius:12, border:`2px solid ${regForm.role === r.v ? '#FF6B00' : 'rgba(255,255,255,0.08)'}`, background: regForm.role === r.v ? 'rgba(255,107,0,.12)' : 'rgba(255,255,255,0.04)', color: regForm.role === r.v ? '#FFB800' : '#7A8FA6', cursor:'pointer', fontFamily:"'Cairo',sans-serif", fontSize:12, fontWeight:700, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                        <span style={{ fontSize:20 }}>{r.i}</span>{r.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fields */}
                {[
                  { key:'name', label:'الاسم الكامل *', type:'text', placeholder:'أحمد بن يوسف' },
                  { key:'email', label:'البريد الإلكتروني *', type:'email', placeholder:'email@example.com', dir:'ltr' },
                  { key:'phone', label:'رقم الهاتف', type:'tel', placeholder:'0555 000 000', dir:'ltr' },
                  { key:'password', label:'كلمة المرور *', type:'password', placeholder:'••••••••', dir:'ltr' },
                  { key:'confirm', label:'تأكيد كلمة المرور *', type:'password', placeholder:'••••••••', dir:'ltr' },
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ fontSize:12, color:'#7A8FA6', display:'block', marginBottom:6, fontWeight:600 }}>{field.label}</label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      dir={field.dir}
                      value={(regForm as Record<string, string>)[field.key]}
                      onChange={e => setRegForm(f => ({ ...f, [field.key]: e.target.value }))}
                      style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:11, padding:'12px 14px', color:'#fff', fontFamily:"'Cairo',sans-serif", fontSize:13, outline:'none', transition:'border-color .2s' }}
                    />
                  </div>
                ))}

                {/* Wilaya selector */}
                <div>
                  <label style={{ fontSize:12, color:'#7A8FA6', display:'block', marginBottom:6, fontWeight:600 }}>الولاية</label>
                  <div style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:11, padding:'10px 14px' }}>
                    <AlgerianFlag size={26} />
                    <select style={{ flex:1, background:'transparent', border:'none', color:'#fff', fontFamily:"'Cairo',sans-serif", fontSize:13, outline:'none', cursor:'pointer' }}>
                      {['الجزائر العاصمة','وهران','قسنطينة','عنابة','سطيف','بجاية','تلمسان','بليدة','المدية','تيزي وزو'].map(w => <option key={w} style={{ background:'#060D18' }}>{w}</option>)}
                    </select>
                  </div>
                </div>

                {/* Terms */}
                <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                  <input type="checkbox" id="terms" required style={{ marginTop:2, flexShrink:0, accentColor:'#FF6B00', cursor:'pointer' }} />
                  <label htmlFor="terms" style={{ fontSize:12, color:'#7A8FA6', lineHeight:1.6, cursor:'pointer' }}>
                    أوافق على <span style={{ color:'#FF6B00', cursor:'pointer' }}>شروط الاستخدام</span> و<span style={{ color:'#FF6B00', cursor:'pointer' }}>سياسة الخصوصية</span> لمنصة HopeLine الجزائر
                  </label>
                </div>

                <button type="submit" style={{ ...s.bbtnO, width:'100%', justifyContent:'center', fontSize:15, padding:'14px 28px', borderRadius:14 }}>
                  ✨ إنشاء الحساب مجاناً
                </button>

                <div style={{ textAlign:'center', fontSize:12, color:'#7A8FA6' }}>
                  لديك حساب بالفعل؟{' '}
                  <span style={{ color:'#FF6B00', cursor:'pointer', fontWeight:700 }} onClick={() => showToast('سيتوفر تسجيل الدخول قريباً')}>تسجيل الدخول</span>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
