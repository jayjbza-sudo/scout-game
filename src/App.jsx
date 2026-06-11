import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- ส่วนประกอบไอคอน SVG เพื่อให้รันได้ทุกที่โดยไม่ต้องพึ่งพาไลบรารีภายนอก ---
const Play = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="6 3 20 12 6 21 6 3" fill="currentColor" />
  </svg>
);

const ArrowRight = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const Clock = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const Target = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const Lock = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const MapIcon = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
    <line x1="9" y1="3" x2="9" y2="18" />
    <line x1="15" y1="6" x2="15" y2="21" />
  </svg>
);

// --- การตั้งค่าข้อมูลพื้นฐานของเกม ---
const BIN_TYPES = [
  { id: 'general', color: 'bg-blue-500', name: 'ทั่วไป', icon: '🗑️' },
  { id: 'recycle', color: 'bg-yellow-400', name: 'รีไซเคิล', icon: '♻️' },
  { id: 'wet', color: 'bg-emerald-500', name: 'ขยะเปียก', icon: '🍎' },
  { id: 'hazardous', color: 'bg-red-500', name: 'อันตราย', icon: '☠️' }
];

const TRASH_DICTIONARY = {
  // ขยะทั่วไป
  plastic_bag: { id: 'plastic_bag', icon: '🛍️', name: 'ถุงพลาสติก', bin: 'general' },
  snack: { id: 'snack', icon: '🍬', name: 'ห่อขนม', bin: 'general' },
  tissue: { id: 'tissue', icon: '🧻', name: 'ทิชชู่ใช้แล้ว', bin: 'general' },
  // รีไซเคิล
  bottle: { id: 'bottle', icon: '🍾', name: 'ขวดพลาสติก', bin: 'recycle' },
  paper: { id: 'paper', icon: '📰', name: 'กระดาษ', bin: 'recycle' },
  box: { id: 'box', icon: '📦', name: 'กล่องกระดาษ', bin: 'recycle' },
  // ขยะเปียก
  banana: { id: 'banana', icon: '🍌', name: 'เปลือกกล้วย', bin: 'wet' },
  apple: { id: 'apple', icon: '🍎', name: 'แกนแอปเปิ้ล', bin: 'wet' },
  bone: { id: 'bone', icon: '🦴', name: 'ก้างปลา', bin: 'wet' },
  // ขยะอันตราย
  battery: { id: 'battery', icon: '🔋', name: 'ถ่านไฟฉาย', bin: 'hazardous' },
  lightbulb: { id: 'lightbulb', icon: '💡', name: 'หลอดไฟ', bin: 'hazardous' },
  spray: { id: 'spray', icon: '🧴', name: 'สเปรย์', bin: 'hazardous' },
  
  // ขยะพิเศษ (ต้องคลิกเพื่อแยก)
  food_box: { 
    id: 'food_box', icon: '🍱', name: 'กล่องข้าว (มีเศษอาหาร)', bin: 'none', 
    isComplex: true, clicksNeeded: 1, 
    transformTo: 'clean_box', spawnItem: 'chicken_bone',
    actionText: 'แยกเศษอาหาร!'
  },
  clean_box: { id: 'clean_box', icon: '🥡', name: 'กล่องพลาสติกเปล่า', bin: 'recycle' },
  chicken_bone: { id: 'chicken_bone', icon: '🍗', name: 'เศษอาหาร', bin: 'wet' },
  
  uht: { 
    id: 'uht', icon: '🧃', name: 'กล่อง UHT', bin: 'none', 
    isComplex: true, clicksNeeded: 1, 
    transformTo: 'uht_flat',
    actionText: 'พับกล่อง!'
  },
  uht_flat: { id: 'uht_flat', icon: '📄', name: 'กล่อง UHT พับแล้ว', bin: 'recycle' },
  
  iced_cup: { 
    id: 'iced_cup', icon: '🥤', name: 'แก้วน้ำแข็ง', bin: 'none', 
    isComplex: true, clicksNeeded: 2, 
    transformSteps: ['cup_no_ice', 'empty_cup'],
    actionTexts: ['เทน้ำทิ้ง!', 'แกะฝา!']
  },
  cup_no_ice: { id: 'cup_no_ice', icon: '🥛', name: 'แก้วมีฝา', bin: 'none' }, 
  empty_cup: { id: 'empty_cup', icon: '🫙', name: 'แก้วพลาสติกเปล่า', bin: 'recycle' },

  // บอส: ถุงดำยักษ์
  giant_bag: { 
    id: 'giant_bag', icon: '🪨', name: 'ถุงดำปริศนา', bin: 'none', 
    isComplex: true, clicksNeeded: 3, 
    explodeInto: 3, 
    actionText: 'ฉีกถุง!'
  },
};

const STAGES = [
  {
    level: 1,
    title: 'ฐานที่ 1: วิชาพื้นฐานลูกเสือ',
    shortDesc: 'คัดแยกขยะทั่วไปและขยะรีไซเคิลรอบกองเกวียนแบบง่ายๆ',
    desc: 'ลูกเสือสำรอง! มาฝึกแยกขยะทั่วไปและรีไซเคิลรอบค่ายกัน ขยะจะตกลงมาช้าๆ ไม่มีเวลาจำกัด ลากขยะไปใส่ถังให้ถูกต้อง!',
    knowledge: [
      '🟦 ถังสีน้ำเงิน (ขยะทั่วไป): ขยะที่ย่อยสลายยาก หรือเปื้อนอาหาร เช่น ถุงพลาสติก ห่อขนม ทิชชู่',
      '🟨 ถังสีเหลือง (รีไซเคิล): ขยะที่นำกลับมาใช้ใหม่ได้ ควรทำให้สะอาดก่อนทิ้ง เช่น ขวดพลาสติก กระดาษ กล่องพัสดุ'
    ],
    bins: ['general', 'recycle'],
    availableTrash: ['plastic_bag', 'snack', 'bottle', 'paper'],
    fallSpeed: 1.5,
    spawnRate: 2000,
    timeLimit: null,
    targetScore: 10,
    badge: '🏕️'
  },
  {
    level: 2,
    title: 'ฐานที่ 2: โรงอาหารกลางค่าย',
    shortDesc: 'วิกฤตเศษอาหารล้นค่าย! ฝึกเทเศษอาหารและแยกภาชนะก่อนทิ้ง',
    desc: 'เพิ่มถังขยะเปียก! มีเวลาจำกัด ขยะตกเร็วขึ้น คุณต้องคลิกที่ "กล่องข้าว" เพื่อแยกเศษอาหารออกก่อนทิ้ง!',
    knowledge: [
      '🟩 ถังสีเขียว (ขยะเปียก): ขยะที่เน่าเสียและย่อยสลายได้ นำไปทำปุ๋ยหมัก เช่น เปลือกผลไม้ เศษอาหาร ก้างปลา',
      '💡 กฎเหล็กโรงอาหาร: หากมีเศษอาหารในกล่องหรือถุง ต้อง "แยกเศษอาหาร" ทิ้งถังเขียวก่อน แล้วจึงนำภาชนะไปทิ้งถังที่ถูกต้อง'
    ],
    bins: ['general', 'recycle', 'wet'],
    availableTrash: ['plastic_bag', 'bottle', 'banana', 'bone', 'food_box'],
    fallSpeed: 1.8,
    spawnRate: 1800,
    timeLimit: 45,
    targetScore: 15,
    badge: '🍲'
  },
  {
    level: 3,
    title: 'ฐานที่ 3: ระวังภัยในป่ากว้าง',
    shortDesc: 'ระวังสารเคมีตกค้าง! คัดแยกขยะอันตรายและสารพิษให้ถูกต้อง',
    desc: 'ระวัง! ขยะอันตรายมาแล้ว หากทิ้งขยะอันตรายผิดถัง จะถูกหักแต้มความดีหนักมาก และหน้าจอจะมืดไปชั่วขณะ!',
    knowledge: [
      '🟥 ถังสีแดง (ขยะอันตราย): ขยะที่มีสารเคมี มีพิษ ไวไฟ หรือระเบิดได้ เช่น ถ่านไฟฉาย หลอดไฟ กระป๋องสเปรย์',
      '⚠️ คำเตือน: ห้ามทิ้งปะปนกับขยะอื่นเด็ดขาด เพราะสารเคมีจะปนเปื้อนสู่ดินและแหล่งน้ำ ทำอันตรายต่อสิ่งมีชีวิต!'
    ],
    bins: ['general', 'recycle', 'wet', 'hazardous'],
    availableTrash: ['snack', 'paper', 'apple', 'battery', 'lightbulb', 'spray'],
    fallSpeed: 2.2,
    spawnRate: 1600,
    timeLimit: 45,
    targetScore: 15,
    badge: '🌲'
  },
  {
    level: 4,
    title: 'ฐานที่ 4: ภารกิจผู้กำกับลูกเสือ',
    shortDesc: 'บททดสอบใหญ่! รัวคลิกฉีกถุงดำยักษ์ และชำแหละขยะสุดหิน!',
    desc: 'ขยะแยกยากรวมตัว! รัวคลิก "ถุงดำปริศนา" ให้แตกกระจาย! กล่อง UHT ต้องคลิกพับ แก้วน้ำต้องแกะฝาก่อนทิ้ง มือต้องไว!',
    knowledge: [
      '♻️ การจัดการขยะซับซ้อน: ขยะบางชนิดต้องจัดการก่อนทิ้งเพื่อลดพื้นที่และให้รีไซเคิลได้ง่ายขึ้น',
      '🧃 กล่อง UHT: ดื่มหมดแล้วต้อง ล้าง แกะหลอด และ "พับให้แบน"',
      '🥤 แก้วน้ำแข็ง: ต้อง "เทน้ำและน้ำแข็งทิ้ง" ก่อน แล้วจึงแยกฝากับตัวแก้วนำไปทิ้งถังรีไซเคิล'
    ],
    bins: ['general', 'recycle', 'wet', 'hazardous'],
    availableTrash: ['snack', 'bottle', 'banana', 'battery', 'uht', 'iced_cup', 'food_box', 'giant_bag'],
    fallSpeed: 1.0,
    spawnRate: 2800, 
    timeLimit: 60,
    targetScore: 25, 
    badge: '🔥'
  }
];

export default function App() {
  const [gameState, setGameState] = useState('menu'); 
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [maxUnlockedIdx, setMaxUnlockedIdx] = useState(0); 
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [items, setItems] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [isDarkened, setIsDarkened] = useState(false);
  const [clickedItemId, setClickedItemId] = useState(null); 
  
  const draggingItemRef = useRef(null);
  const playAreaRef = useRef(null);

  const stageConfig = STAGES[currentStageIdx];

  const handleStartMission = () => setGameState('stage_select');
  const handleSelectStage = (idx) => { if (idx <= maxUnlockedIdx) { setCurrentStageIdx(idx); setGameState('stage_intro'); } };
  
  const startStage = () => {
    setItems([]);
    setFeedbacks([]);
    setScore(0);
    setTimeLeft(stageConfig.timeLimit || 0);
    setGameState('playing');
  };

  const handleBackToSelect = () => setGameState('stage_select');

  const nextStage = () => {
    const nextIdx = currentStageIdx + 1;
    if (nextIdx < STAGES.length) {
      if (nextIdx > maxUnlockedIdx) setMaxUnlockedIdx(nextIdx);
      setCurrentStageIdx(nextIdx);
      setGameState('stage_intro');
    } else {
      setGameState('game_over');
    }
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    let timerInterval;
    if (stageConfig.timeLimit) {
      timerInterval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            if (!stageConfig.targetScore || score >= stageConfig.targetScore) setGameState('stage_clear');
            else setGameState('game_over');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    const fallLoop = setInterval(() => {
      setItems(prevItems => {
        const newItems = [];
        for (let item of prevItems) {
          if (draggingItemRef.current?.id === item.instanceId) {
            newItems.push(item);
            continue;
          }

          const currentSpeed = item.id === 'giant_bag' ? stageConfig.fallSpeed * 1.5 : stageConfig.fallSpeed;
          const newY = item.y + currentSpeed;
          
          if (playAreaRef.current && newY > playAreaRef.current.clientHeight + 100) continue;
          
          newItems.push({ ...item, y: newY });
        }
        return newItems;
      });
    }, 1000 / 60);

    return () => {
      clearInterval(timerInterval);
      clearInterval(fallLoop);
    };
  }, [gameState, stageConfig, score]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const spawnInterval = setInterval(() => { spawnItem(); }, stageConfig.spawnRate);
    return () => clearInterval(spawnInterval);
  }, [gameState, stageConfig]);

  const spawnItem = (specificItemKey = null, xPos = null, yPos = null) => {
    let itemKey = specificItemKey || stageConfig.availableTrash[Math.floor(Math.random() * stageConfig.availableTrash.length)];
    if (!specificItemKey && itemKey === 'giant_bag' && Math.random() > 0.4) {
       itemKey = stageConfig.availableTrash.filter(k => k !== 'giant_bag')[Math.floor(Math.random() * (stageConfig.availableTrash.length - 1))];
    }

    const template = TRASH_DICTIONARY[itemKey];
    const containerWidth = playAreaRef.current ? playAreaRef.current.clientWidth : window.innerWidth;
    
    let spawnX = xPos !== null ? xPos : Math.random() * (containerWidth - 80) + 40;
    if (itemKey === 'giant_bag') spawnX = Math.max(80, Math.min(containerWidth - 80, spawnX));
    
    const spawnY = yPos !== null ? yPos : -80;

    const newItem = {
      ...template,
      instanceId: Math.random().toString(36).substr(2, 9),
      x: spawnX,
      y: spawnY,
      currentClicks: 0
    };

    setItems(prev => [...prev, newItem]);
  };

  const handlePointerDown = (e, item) => {
    if (gameState !== 'playing') return;
    
    if (item.isComplex && item.currentClicks < item.clicksNeeded) {
      e.stopPropagation();
      const nextClicks = item.currentClicks + 1;
      setClickedItemId(item.instanceId);
      setTimeout(() => setClickedItemId(null), 100);

      if (item.explodeInto && nextClicks >= item.clicksNeeded) {
        showFeedback(item.x, item.y, "💥 ระเบิดตู้ม!", "text-red-500 font-black text-3xl drop-shadow-lg");
        const standardTrash = stageConfig.availableTrash.filter(t => t !== 'giant_bag');
        for(let i=0; i<item.explodeInto; i++) {
            const randomTrash = standardTrash[Math.floor(Math.random() * standardTrash.length)];
            const spreadX = item.x + (Math.random() * 80 - 40); 
            const spreadY = item.y + (Math.random() * 40 - 20);
            spawnItem(randomTrash, spreadX, spreadY);
        }
        setItems(prev => prev.filter(i => i.instanceId !== item.instanceId));
        return;
      }

      let nextTemplateKey = item.transformTo;
      let feedbackText = item.actionText || "ชำแหละ!";

      if (item.transformSteps) {
        nextTemplateKey = item.transformSteps[nextClicks - 1];
        feedbackText = item.actionTexts?.[nextClicks - 1] || feedbackText;
      }

      setItems(prev => prev.map(i => {
        if (i.instanceId === item.instanceId) {
          const nextData = TRASH_DICTIONARY[nextTemplateKey] || {};
          return { ...i, ...nextData, currentClicks: nextClicks };
        }
        return i;
      }));

      if (item.spawnItem) {
        spawnItem(item.spawnItem, item.x + 40, item.y + 10);
      }
      showFeedback(item.x, item.y, feedbackText, "text-yellow-400 font-bold text-xl");
      return;
    }

    e.stopPropagation();
    const el = document.getElementById(`item-${item.instanceId}`);
    if (el && playAreaRef.current) {
        const rect = el.getBoundingClientRect();
        const centerViewportX = rect.left + rect.width / 2;
        const centerViewportY = rect.top + rect.height / 2;
        
        const pointerOffsetX = e.clientX - centerViewportX;
        const pointerOffsetY = e.clientY - centerViewportY;

        draggingItemRef.current = {
            id: item.instanceId,
            pointerOffsetX,
            pointerOffsetY
        };
    }
  };

  const handlePointerMove = useCallback((e) => {
    if (!draggingItemRef.current || !playAreaRef.current) return;
    e.preventDefault();

    const { id, pointerOffsetX, pointerOffsetY } = draggingItemRef.current;
    const playAreaRect = playAreaRef.current.getBoundingClientRect();

    const newX = (e.clientX - pointerOffsetX) - playAreaRect.left;
    const newY = (e.clientY - pointerOffsetY) - playAreaRect.top;

    setItems(prev => prev.map(item => {
      if (item.instanceId === id) {
        return { ...item, x: newX, y: newY };
      }
      return item;
    }));
  }, []);

  const handlePointerUp = useCallback((e) => {
    if (!draggingItemRef.current) return;

    const dragId = draggingItemRef.current.id;
    const draggedItem = items.find(i => i.instanceId === dragId);
    
    if (!draggedItem) {
        draggingItemRef.current = null;
        return;
    }

    const draggedEl = document.getElementById(`item-${dragId}`);
    if (draggedEl) draggedEl.style.visibility = 'hidden';

    const dropX = e.clientX !== undefined ? e.clientX : (e.changedTouches && e.changedTouches[0].clientX);
    const dropY = e.clientY !== undefined ? e.clientY : (e.changedTouches && e.changedTouches[0].clientY);

    const elementBelow = document.elementFromPoint(dropX, dropY);
    
    if (draggedEl) draggedEl.style.visibility = 'visible';

    const binContainer = elementBelow?.closest('[data-bin-type]');
    if (binContainer) {
      const binType = binContainer.getAttribute('data-bin-type');
      evaluateDrop(draggedItem, binType);
    }
    draggingItemRef.current = null;
  }, [items, currentStageIdx]);

  const evaluateDrop = (item, targetBin) => {
    if (item.bin === 'none') {
       showFeedback(item.x, item.y, "ต้องฉีก/แยกก่อนทิ้ง!", "text-orange-400 font-bold");
       return;
    }

    if (item.bin === targetBin) {
      const newScore = score + 1;
      setScore(newScore);
      showFeedback(item.x, item.y - 30, "+1 ทำดีมาก!", "text-green-400 font-bold");
      
      setItems(prev => prev.filter(i => i.instanceId !== item.instanceId));

      if (stageConfig.targetScore && !stageConfig.timeLimit && newScore >= stageConfig.targetScore) {
        const nextIdx = currentStageIdx + 1;
        if (nextIdx < STAGES.length && nextIdx > maxUnlockedIdx) setMaxUnlockedIdx(nextIdx);
        setGameState('stage_clear');
      }
    } else {
      if (currentStageIdx >= 2 && (item.bin === 'hazardous' || targetBin === 'hazardous')) {
        setScore(s => s - 5);
        showFeedback(item.x, item.y, "อันตราย!! -5", "text-red-500 font-black text-4xl drop-shadow-2xl !z-[200]");
        setIsDarkened(true);
        setTimeout(() => setIsDarkened(false), 2000);
      } else {
        setScore(s => s - 1);
        showFeedback(item.x, item.y - 30, "ผิดถังนะลูกเสือ!", "text-red-400 font-bold");
      }
      
      setItems(prev => prev.filter(i => i.instanceId !== item.instanceId));
    }
  };

  const showFeedback = (x, y, text, colorClass) => {
    const id = Math.random().toString();
    setFeedbacks(prev => [...prev, { id, x, y, text, colorClass }]);
    setTimeout(() => { setFeedbacks(prev => prev.filter(f => f.id !== id)); }, 1000);
  };

  const renderMenu = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-8 bg-gradient-to-b from-green-900 to-green-700 p-6 text-center">
      <div className="bg-[#fdf6e3] p-6 rounded-3xl shadow-xl border-4 border-[#8b5a2b] max-w-sm w-full">
        <div className="text-6xl mb-4">🏕️⚜️</div>
        <h1 className="font-heading text-4xl font-extrabold text-[#5c3a21] mb-2 tracking-wide">ค่ายลูกเสือรักษ์โลก</h1>
        <p className="font-body text-sm text-gray-500 mb-6 font-bold">สมาคมลูกเสือเกียรติยศแห่งประเทศไทย</p>
        <p className="font-body text-md text-[#8b5a2b] mb-6 font-medium leading-relaxed">
          "เสียชีพอย่าเสียเกียรติ และอย่าลืมคัดแยกขยะเพื่อรักษาสิ่งแวดล้อมรอบค่าย!"
        </p>
        <button 
          onClick={handleStartMission}
          className="font-heading flex items-center justify-center w-full space-x-2 bg-[#8b5a2b] hover:bg-[#6b4423] text-white font-bold py-4 px-8 rounded-full text-2xl transition transform hover:scale-105 shadow-lg border-b-4 border-[#4a2e17] tracking-wider"
        >
          <Play size={28} /> <span>เข้าสู่ฐานฝึก!</span>
        </button>
      </div>
    </div>
  );

  const renderStageSelect = () => (
    <div className="flex flex-col h-full bg-[#e8eedd] overflow-y-auto p-6 font-body custom-scrollbar">
      <div className="text-center mb-6">
        <span className="font-heading inline-flex items-center gap-1 bg-[#8b5a2b] text-[#fdf6e3] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
          <MapIcon size={14} /> แผนที่การเดินทาง
        </span>
        <h2 className="font-heading text-3xl font-black text-[#5c3a21] mt-2">เลือกฐานฝึกกองร้อย</h2>
        <p className="text-sm text-gray-600">เดินทางไกลผ่าน 4 ฐานฝึกเพื่อทำแต้มความดีสูงสุด</p>
      </div>

      <div className="grid grid-cols-1 gap-4 w-full flex-1">
        {STAGES.map((stage, idx) => {
          const isUnlocked = idx <= maxUnlockedIdx;
          return (
            <div
              key={stage.level}
              onClick={() => isUnlocked && handleSelectStage(idx)}
              className={`relative p-5 rounded-3xl border-4 transition-all duration-300 ${
                isUnlocked 
                  ? 'bg-[#fdf6e3] border-[#8b5a2b] cursor-pointer hover:shadow-xl hover:-translate-y-1' 
                  : 'bg-gray-200/70 border-gray-400 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-md shrink-0 ${
                  isUnlocked ? 'bg-green-100 border-2 border-green-600' : 'bg-gray-300 border-2 border-gray-400'
                }`}>
                  {isUnlocked ? stage.badge : <Lock className="text-gray-500" size={24} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">LEVEL {stage.level}</span>
                    {isUnlocked && (
                      <span className="text-[10px] bg-green-200 text-green-800 font-bold px-1.5 py-0.2 rounded-full">เปิดแล้ว</span>
                    )}
                  </div>
                  <h3 className="font-heading text-lg font-bold text-[#5c3a21] truncate mt-0.5">{stage.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{stage.shortDesc}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-dashed border-[#8b5a2b]/20 flex justify-between text-xs font-bold text-gray-600">
                <span className="flex items-center gap-1">🎯 ผ่านที่: {stage.targetScore} คะแนน</span>
                {stage.timeLimit ? (
                  <span className="flex items-center gap-1 text-red-600">⏱️ เวลา: {stage.timeLimit} วิ</span>
                ) : (
                  <span className="text-green-600">⏱️ ไม่จำกัดเวลา</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 mb-4 text-center">
        <button onClick={() => setGameState('menu')} className="font-heading text-xs font-bold text-[#8b5a2b] hover:underline bg-[#fdf6e3] border-2 border-[#8b5a2b] px-4 py-2 rounded-full shadow-sm">
          กลับหน้าหลัก ⛺
        </button>
      </div>
    </div>
  );

  const renderStageIntro = () => (
    <div className="flex flex-col items-center justify-center h-full p-4 bg-gradient-to-b from-[#4a2e17] to-green-900 text-white font-body overflow-y-auto custom-scrollbar">
      <div className="bg-[#fdf6e3]/10 backdrop-blur-md p-6 rounded-3xl shadow-2xl w-full text-center border-2 border-[#e6c280]/30 my-auto">
        <div className="text-5xl mb-3">{stageConfig.badge}</div>
        <h2 className="font-heading text-2xl font-bold mb-3 text-[#f0d58b]">{stageConfig.title}</h2>
        <p className="text-sm mb-5 leading-relaxed text-green-50">{stageConfig.desc}</p>
        
        {stageConfig.knowledge && (
          <div className="bg-[#fdf6e3] rounded-xl p-4 mb-6 text-left border-l-4 border-[#8b5a2b] shadow-inner">
            <h3 className="font-heading text-[#5c3a21] font-bold mb-2 flex items-center gap-2">
              <span className="text-xl">💡</span> คู่มือลูกเสือรักษ์โลก:
            </h3>
            <ul className="text-xs text-gray-700 space-y-2">
              {stageConfig.knowledge.map((k, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#8b5a2b] mt-0.5 font-bold">•</span>
                  <span className="leading-tight">{k}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-center space-x-3 mb-6">
          {stageConfig.bins.map(binId => {
            const bin = BIN_TYPES.find(b => b.id === binId);
            return (
              <div key={binId} className="flex flex-col items-center">
                <div className={`w-12 h-14 rounded-b-lg rounded-t-sm flex items-center justify-center text-xl shadow-inner ${bin.color}`}>{bin.icon}</div>
                <span className="text-[10px] mt-2 opacity-90 text-[#f0d58b] font-semibold">{bin.name}</span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2">
          <button onClick={handleBackToSelect} className="font-heading flex-1 bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-2 rounded-full text-sm transition">
            แผนที่ฐาน
          </button>
          <button onClick={startStage} className="font-heading flex-[2] flex items-center justify-center space-x-2 bg-[#e6c280] hover:bg-[#d4b06a] text-[#4a2e17] font-bold py-2 px-4 rounded-full text-base transition transform hover:scale-105 shadow-lg">
            <span>ลุยเลย ลูกเสือ!</span> <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderStageClear = () => {
    const nextIdx = currentStageIdx + 1;
    const hasNext = nextIdx < STAGES.length;

    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-green-800 text-white z-50 font-body">
        <div className="text-center animate-bounce mb-6 bg-white/20 p-6 rounded-full w-24 h-24 mx-auto flex justify-center items-center">
          <div className="text-5xl">🔥</div>
        </div>
        <h2 className="font-heading text-4xl font-bold mb-2 text-[#f0d58b]">ผ่านฐานสำเร็จ!</h2>
        <p className="text-2xl mb-8">แต้มความดีที่คุณทำได้: <span className="text-[#f0d58b] font-bold">{score}</span></p>
        
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <button onClick={nextStage} className="font-heading w-full flex items-center justify-center space-x-2 bg-[#fdf6e3] text-green-900 font-bold py-3 px-6 rounded-full text-lg transition transform hover:scale-105 shadow-xl border-b-4 border-[#c7ba9f]">
            <span>{hasNext ? 'ไปยังฐานต่อไป' : 'รอบกองไฟ (สรุปผล)'}</span> <ArrowRight size={24} />
          </button>
          <button onClick={handleBackToSelect} className="font-heading w-full bg-white/10 hover:bg-white/20 text-white border border-white/30 font-bold py-3 px-6 rounded-full text-lg transition">
            กลับหน้ารวมฐาน 🗺️
          </button>
        </div>
      </div>
    );
  };

  const renderGameOver = () => {
    const isFailed = stageConfig.targetScore && score < stageConfig.targetScore;

    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-b from-gray-900 to-[#4a2e17] text-white text-center font-body">
        <div className="text-7xl mb-4">{isFailed ? '😢❌' : '🏕️🌕'}</div>
        <h2 className="font-heading text-4xl font-extrabold mb-4 text-[#f0d58b]">
          {isFailed ? 'แต้มความดีไม่พอ!' : 'จบภารกิจฐานฝึก!'}
        </h2>
        
        {isFailed ? (
          <p className="text-base mb-6 text-gray-300 max-w-sm leading-relaxed">
            คุณคัดแยกขยะทำแต้มความดีได้ <span className="text-red-400 font-bold">{score}</span> คะแนน แต่เป้าหมายฐานนี้คือ <span className="text-green-400 font-bold">{stageConfig.targetScore}</span> คะแนน กลับไปฝึกฝนและแก้ตัวใหม่อีกครั้งนะลูกเสือ!
          </p>
        ) : (
          <p className="text-lg mb-6 text-gray-300">
            ค่ายของเราสะอาดเป็นระเบียบขึ้นมากเพราะความสามัคคีของคุณ!
          </p>
        )}

        <div className="flex flex-col gap-3 w-full max-w-sm justify-center">
          <button onClick={startStage} className="font-heading w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full text-lg transition transform hover:scale-105 shadow-xl border-b-4 border-green-800">
            ลองใหม่อีกครั้ง
          </button>
          <button onClick={handleBackToSelect} className="font-heading w-full bg-white/10 hover:bg-white/20 text-white border border-white/30 font-bold py-3 px-6 rounded-full text-lg transition">
            แผนที่ฐานฝึกฝน 🗺️
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;700&family=Kanit:wght@300;400;500;600;700&display=swap');
        
        body {
          margin: 0;
          background-color: #1a2e15; /* สีพื้นหลังเมื่อหน้าเว็บโหลด */
        }

        .font-heading { font-family: 'Chakra Petch', sans-serif; }
        .font-body { font-family: 'Kanit', sans-serif; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139, 90, 43, 0.5); border-radius: 10px; }
      `}</style>

      {/* Wrapper ตัวนอกสำหรับ Desktop จะแสดงพื้นหลังสวยงามและลวดลาย */}
      <div className="min-h-[100dvh] w-full bg-gradient-to-br from-[#3a522d] via-[#2a3b24] to-[#151f11] flex items-center justify-center sm:p-6 relative">
        
        {/* ลวดลายตกแต่งบนพื้นหลัง (แสดงเฉพาะบนคอมพิวเตอร์) */}
        <div className="absolute inset-0 opacity-10 pointer-events-none hidden sm:block" style={{ backgroundImage: 'radial-gradient(#a3b899 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>

        {/* กล่องเกมหลัก (จำลองกรอบโทรศัพท์มือถือบนคอม) */}
        <div 
          className="relative w-full h-[100dvh] sm:h-[800px] sm:max-h-[90vh] max-w-md mx-auto bg-[#e8eedd] overflow-hidden select-none touch-none sm:rounded-[2.5rem] sm:shadow-[0_0_40px_rgba(0,0,0,0.5)] sm:border-[8px] border-[#4a2e17] flex flex-col"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <div className={`absolute inset-0 bg-black pointer-events-none transition-opacity duration-300 z-40 ${isDarkened ? 'opacity-90' : 'opacity-0'}`} />

          {gameState === 'menu' && renderMenu()}
          {gameState === 'stage_select' && renderStageSelect()}
          {gameState === 'stage_intro' && renderStageIntro()}
          {gameState === 'stage_clear' && renderStageClear()}
          {gameState === 'game_over' && renderGameOver()}

          {gameState === 'playing' && (
            <div className="absolute inset-0 flex flex-col font-body">
              <div className="bg-[#5c3a21] px-4 py-3 shadow-[0_4px_10px_rgba(0,0,0,0.3)] flex justify-between items-center z-10 mx-2 mt-2 rounded-2xl border-2 border-[#8b5a2b]">
                <div className="flex flex-col">
                  <span className="font-heading text-xs font-bold text-[#e6c280] uppercase tracking-wider">ฐานที่ {stageConfig.level}</span>
                  <span className="font-heading text-lg font-extrabold text-white leading-tight">{stageConfig.title}</span>
                </div>
                <div className="flex space-x-2 items-center">
                  <div className="flex items-center space-x-1 bg-[#8b5a2b] px-2 py-1 rounded-full shadow-inner">
                    <Target size={16} className="text-[#fdf6e3]"/>
                    <span className="font-heading font-bold text-[#fdf6e3] text-sm">{score} {stageConfig.targetScore ? `/ ${stageConfig.targetScore}` : ''}</span>
                  </div>
                  {stageConfig.timeLimit && (
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full shadow-inner ${timeLeft <= 10 ? 'bg-red-500 text-white animate-pulse' : 'bg-[#e6c280] text-[#5c3a21]'}`}>
                      <Clock size={16} />
                      <span className="font-heading font-bold text-sm">{timeLeft}s</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 relative w-full" ref={playAreaRef}>
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4b6b3e 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
                
                {items.map(item => {
                  const isGiantBag = item.id === 'giant_bag';
                  const isDragging = draggingItemRef.current?.id === item.instanceId; 
                  
                  const scaleClass = isGiantBag ? 'scale-125 hover:scale-150' : 'scale-100'; 
                  const shakeClass = clickedItemId === item.instanceId ? 'scale-90 opacity-80' : ''; 
                  const alertClass = item.isComplex && item.currentClicks < item.clicksNeeded && !isGiantBag ? 'animate-bounce' : '';
                  
                  return (
                    <div
                      key={item.instanceId}
                      id={`item-${item.instanceId}`}
                      onPointerDown={(e) => handlePointerDown(e, item)}
                      className={`absolute flex flex-col items-center justify-center cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-150 ${scaleClass} ${shakeClass} ${alertClass} ${isDragging ? 'z-50' : 'z-20'}`}
                      style={{ left: item.x, top: item.y, width: '90px', height: '100px' }}
                    >
                      <div className={`rounded-full p-2.5 shadow-lg border-2 pointer-events-none text-4xl flex items-center justify-center w-14 h-14 ${isGiantBag ? 'bg-gray-800 border-gray-900 animate-pulse' : 'bg-white/95 border-gray-200'}`}>
                        {item.icon}
                      </div>
                      
                      <span className={`text-[10px] font-bold border px-1.5 py-0.5 rounded-md mt-1 shadow-sm whitespace-nowrap pointer-events-none max-w-[85px] truncate text-center ${isGiantBag ? 'bg-black text-red-400 border-red-500 font-heading' : 'bg-[#fdf6e3]/95 text-[#5c3a21] border-[#8b5a2b]'}`}>
                        {item.name}
                        {isGiantBag && ` (${item.clicksNeeded - item.currentClicks})`}
                      </span>

                      {item.isComplex && item.currentClicks < item.clicksNeeded && (
                        <div className={`absolute top-0 right-2 rounded-full p-0.5 border-2 shadow-sm pointer-events-none animate-pulse ${isGiantBag ? 'bg-red-500 border-white text-white' : 'bg-yellow-400 border-[#5c3a21]'}`}>
                          <span className="text-[10px]">{isGiantBag ? '⚔️' : '👆'}</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {feedbacks.map(f => (
                  <div
                    key={f.id}
                    className={`absolute font-heading font-bold text-xl pointer-events-none drop-shadow-md animate-[ping_1s_ease-out_forwards] ${f.colorClass}`}
                    style={{ left: f.x, top: f.y, transform: 'translate(-50%, -50%)', zIndex: 40, textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                  >
                    {f.text}
                  </div>
                ))}
              </div>

              <button onClick={handleBackToSelect} className="font-heading absolute bottom-32 right-4 bg-[#fdf6e3]/90 hover:bg-[#fdf6e3] text-[#5c3a21] border border-[#8b5a2b] font-bold text-xs px-3 py-1.5 rounded-full shadow-lg transition z-10 tracking-wider">
                🏳️ ยอมแพ้
              </button>

              <div className="h-28 bg-[#a3805c] flex justify-around items-end pb-3 border-t-8 border-[#5c3a21] shadow-[0_-10px_20px_rgba(0,0,0,0.2)] z-10 px-1 relative">
                {stageConfig.bins.map(binId => {
                  const bin = BIN_TYPES.find(b => b.id === binId);
                  return (
                    <div key={binId} data-bin-type={binId} className="flex flex-col items-center w-1/4 max-w-[75px] z-10">
                      <div className={`w-full aspect-[3/4] rounded-b-xl rounded-t-sm shadow-inner flex items-center justify-center text-3xl border-t-8 border-black/30 ${bin.color} transition-transform transform hover:scale-110`}>
                        <span className="pointer-events-none drop-shadow-md">{bin.icon}</span>
                      </div>
                      <span className="font-heading text-[10px] sm:text-xs font-bold mt-1.5 text-[#4a2e17] bg-[#fdf6e3] px-1.5 py-0.5 rounded-md shadow-sm border border-[#8b5a2b] tracking-wide whitespace-nowrap">{bin.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}