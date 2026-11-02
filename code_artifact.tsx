import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  Heart, 
  Sparkles, 
  Send, 
  User, 
  Search, 
  Trash2, 
  Download, 
  Maximize2, 
  Minimize2, 
  Snowflake, 
  Coffee, 
  Star, 
  TreePine, 
  Gift, 
  Bell, 
  Flame, 
  Shield, 
  Edit3, 
  Check, 
  X, 
  Filter,
  Clock,
  Award,
  Eye,
  EyeOff,
  PlusCircle,
  LayoutGrid,
  Grid,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Layers,
  ZoomIn
} from 'lucide-react';

// ==========================================
// Firebase 安全初始化設定 (支援雲端同步與離線展示雙模式)
// ==========================================
let auth = null;
let db = null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'winter-gratitude-wall';

try {
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    const firebaseConfig = JSON.parse(__firebase_config);
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (e) {
  console.warn('Firebase initialization skipped, using local demo mode:', e);
}

// ==========================================
// 視覺與卡片主題常數設定 (北歐靜謐冬日色系 - 投影高對比加粗優化)
// ==========================================
const CARD_THEMES = [
  {
    id: 'cream',
    name: '羊皮暖白',
    bg: 'bg-[#FAF7F2]',
    border: 'border-[#E6DFD3]',
    text: 'text-[#141C18]',
    subtext: 'text-[#3A443E]',
    accent: 'text-[#A67C2E]',
    badgeBg: 'bg-[#EDE5D8]',
    previewBg: '#FAF7F2',
    borderHex: '#D5CBB8',
    innerHex: '#E2D9C8'
  },
  {
    id: 'sage',
    name: '靜謐鼠尾草',
    bg: 'bg-[#F0F4F1]',
    border: 'border-[#D5E0D7]',
    text: 'text-[#112016]',
    subtext: 'text-[#2F4636]',
    accent: 'text-[#2D5237]',
    badgeBg: 'bg-[#DCE8DF]',
    previewBg: '#E2EBE4',
    borderHex: '#B8CCBD',
    innerHex: '#CFE0D3'
  },
  {
    id: 'berry',
    name: '微醺莓果粉',
    bg: 'bg-[#FBF5F5]',
    border: 'border-[#EAD8D8]',
    text: 'text-[#2B1414]',
    subtext: 'text-[#593636]',
    accent: 'text-[#8C2D2D]',
    badgeBg: 'bg-[#F2DFDF]',
    previewBg: '#F3E5E5',
    borderHex: '#DABABA',
    innerHex: '#EBD3D3'
  },
  {
    id: 'oat',
    name: '亞麻燕麥金',
    bg: 'bg-[#F7F3EB]',
    border: 'border-[#E5DEC9]',
    text: 'text-[#241E14]',
    subtext: 'text-[#4F4634]',
    accent: 'text-[#966F22]',
    badgeBg: 'bg-[#EAE0CA]',
    previewBg: '#EDE5D5',
    borderHex: '#CFC3A4',
    innerHex: '#E2D7BE'
  },
  {
    id: 'midnight',
    name: '深邃松林夜',
    bg: 'bg-[#192B20]',
    border: 'border-[#2C4736]',
    text: 'text-[#FFFFFF]',
    subtext: 'text-[#D0E0D5]',
    accent: 'text-[#EAC882]',
    badgeBg: 'bg-[#264231]',
    previewBg: '#192B20',
    borderHex: '#3D634B',
    innerHex: '#2B4A37'
  }
];

// ==========================================
// 6 款北歐冬日卡片造型設定
// ==========================================
const CARD_SHAPES = [
  { id: 'classic', name: '經典信箋', desc: '溫潤雙線內框與黃銅圖釘' },
  { id: 'tag', name: '禮物吊牌', desc: '斜切角造型與金色掛繩孔' },
  { id: 'arch', name: '古典拱窗', desc: '圓拱窗框與伯利恆之星' },
  { id: 'stamp', name: '冬日郵票', desc: '齒孔邊框與北歐復古郵戳' },
  { id: 'bauble', name: '聖誕圓球', desc: '圓潤吊飾輪廓與金屬掛環' },
  { id: 'plaque', name: '祈願木牌', desc: '北歐木屋斜頂與祈願繩結' }
];

const CARD_ICONS = [
  { id: 'tree', name: '冬日松樹', icon: TreePine },
  { id: 'star', name: '伯利恆星', icon: Star },
  { id: 'gift', name: '溫暖心意', icon: Gift },
  { id: 'snow', name: '靜謐初雪', icon: Snowflake },
  { id: 'coffee', name: '熱可可', icon: Coffee },
  { id: 'bell', name: '平安鐘聲', icon: Bell },
  { id: 'flame', name: '壁爐暖火', icon: Flame },
  { id: 'heart', name: '真摯感謝', icon: Heart }
];

const CATEGORIES = ['同儕祝福', '感謝師長', '歲末祈願', '給未來的自己'];

// 卡片造型迷你預覽 SVG 圖示
const ShapeMiniSvg = ({ shapeId, className = 'w-6 h-6' }) => {
  switch (shapeId) {
    case 'tag':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <path d="M7 3h10l4 5v13H3V8l4-5z" />
          <circle cx="12" cy="7" r="1.5" />
        </svg>
      );
    case 'arch':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <path d="M4 11a8 8 0 0 1 16 0v10H4V11z" />
        </svg>
      );
    case 'stamp':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <rect x="4" y="4" width="16" height="16" strokeDasharray="3 2" />
          <rect x="7" y="7" width="10" height="10" />
        </svg>
      );
    case 'bauble':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <rect x="9" y="2" width="6" height="3" rx="1" />
          <circle cx="12" cy="13" r="8" />
        </svg>
      );
    case 'plaque':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <path d="M12 3l9 6v12H3V9l9-6z" />
        </svg>
      );
    case 'classic':
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <circle cx="12" cy="7" r="1" fill="currentColor" />
        </svg>
      );
  }
};

// ==========================================
// 預設 35 張全班規模溫馨感恩與聖誕祝福卡片資料
// ==========================================
const FULL_CLASS_35_NOTES = [
  { id: 'n1', to: '班導師 林老師', message: '謝謝老師這學期每天早上陪我們早自習，在我們班際比賽失利時請全班喝熱可可鼓勵我們，祝老師聖誕平安快樂！', from: '01號 小宇', theme: 'cream', shape: 'classic', icon: 'tree', category: '感謝師長', likes: 18, likedBy: [] },
  { id: 'n2', to: '坐在隔壁的 子軒', message: '每次數學課我卡關的時候，你都很耐心地畫圖講解給我聽，謝謝你這個神隊友，祝我們期末考一起歐趴！', from: '02號 宥廷', theme: 'sage', shape: 'tag', icon: 'star', category: '同儕祝福', likes: 12, likedBy: [] },
  { id: 'n3', to: '英文科 陳老師', message: '老師準備的西方聖誕文化小故事超有趣，讓我不再害怕開口說英文了！Merry Christmas!', from: '03號 語彤', theme: 'berry', shape: 'arch', icon: 'bell', category: '感謝師長', likes: 15, likedBy: [] },
  { id: 'n4', to: '排球小隊的戰友們', message: '謝謝大家每天放學留下來練球，不管場上失誤幾次都會互相喊聲「沒事！下一球再來」，我們下學期一定能晉級！', from: '04號 冠宇', theme: 'oat', shape: 'stamp', icon: 'flame', category: '同儕祝福', likes: 21, likedBy: [] },
  { id: 'n5', to: '溫暖的 宜蓁', message: '那天下大雨我忘記帶傘，謝謝妳二話不說陪我一起撐傘走到車站，心裡一直覺得很暖，祝妳聖誕節收到最棒的禮物！', from: '05號 品妍', theme: 'midnight', shape: 'bauble', icon: 'snow', category: '同儕祝福', likes: 19, likedBy: [] },
  { id: 'n6', to: '國文科 張老師', message: '謝謝老師在週記本上總是寫下滿滿的溫暖回覆，在我迷惘的時候給我很多力量，祝老師冬日順心！', from: '06號 承恩', theme: 'cream', shape: 'plaque', icon: 'coffee', category: '感謝師長', likes: 14, likedBy: [] },
  { id: 'n7', to: '化學實驗室第四組', message: '雖然我們每次滴定實驗都緊張到手抖，但有你們一起分工合作、洗燒杯，實驗課變成每週最期待的時光！', from: '07號 柏翰', theme: 'sage', shape: 'classic', icon: 'gift', category: '同儕祝福', likes: 11, likedBy: [] },
  { id: 'n8', to: '默默付出衛生股長 采潔', message: '謝謝妳每天提醒大家做資源回收跟打掃，讓我們的教室永遠這麼乾淨舒服，辛苦妳了！', from: '溫暖的匿名同學', theme: 'berry', shape: 'tag', icon: 'heart', category: '同儕祝福', likes: 16, likedBy: [] },
  { id: 'n9', to: '熱血的體育老師', message: '謝謝老師在大隊接力前幫我們特訓傳接棒技巧，還陪我們一起在操場吶喊，有您真好！', from: '09號 俊傑', theme: 'oat', shape: 'arch', icon: 'flame', category: '感謝師長', likes: 13, likedBy: [] },
  { id: 'n10', to: '合唱比賽伴奏 詩涵', message: '謝謝妳為了班際合唱比賽每天中午留在音樂教室練琴，有妳穩定的琴聲，全班唱起歌來特別有安全感！', from: '10號 詠晴', theme: 'midnight', shape: 'stamp', icon: 'bell', category: '同儕祝福', likes: 22, likedBy: [] },
  { id: 'n11', to: '全班 35 位同學', message: '很幸運高中分班能跟大家在同一個教室相遇，願我們在歲末冬日都平平安安，明年繼續創造更多美好回憶！', from: '11號 班長 睿澤', theme: 'cream', shape: 'bauble', icon: 'tree', category: '歲末祈願', likes: 28, likedBy: [] },
  { id: 'n12', to: '歷史科 吳老師', message: '老師講歷史故事就像在看電影一樣精彩，謝謝老師總是鼓勵我們獨立思考！聖誕快樂！', from: '12號 芷瑜', theme: 'sage', shape: 'plaque', icon: 'star', category: '感謝師長', likes: 10, likedBy: [] },
  { id: 'n13', to: '園遊會擺攤美宣組', message: '謝謝美宣組同學熬夜畫出超好看的聖誕看板，讓我們的攤位成為全校最吸睛的焦點！', from: '13號 浩然', theme: 'berry', shape: 'classic', icon: 'gift', category: '同儕祝福', likes: 15, likedBy: [] },
  { id: 'n14', to: '借我立可帶的 宇軒', message: '謝謝你這學期大概借了我十次文具都笑笑的沒有生氣，下次換我請你喝熱奶茶！', from: '14號 哲瑋', theme: 'oat', shape: 'tag', icon: 'coffee', category: '同儕祝福', likes: 9, likedBy: [] },
  { id: 'n15', to: '給三個月後的自己', message: '謝謝這學期沒有放棄努力的自己，希望冬天的累積都能在明年春天開花結果，加油！', from: '15號 心怡', theme: 'midnight', shape: 'arch', icon: 'snow', category: '給未來的自己', likes: 17, likedBy: [] },
  { id: 'n16', to: '學藝股長 欣妤', message: '每次抬頭看到後面黑板溫馨的節慶插畫，心情就會瞬間變好，謝謝妳用畫筆溫暖了整間教室！', from: '16號 羽柔', theme: 'cream', shape: 'stamp', icon: 'heart', category: '同儕祝福', likes: 20, likedBy: [] },
  { id: 'n17', to: '物理科 趙老師', message: '謝謝老師下課時間總是很有耐心地留下來幫我們解題，祝老師聖誕佳節愉快、身體健康！', from: '17號 彥廷', theme: 'sage', shape: 'bauble', icon: 'tree', category: '感謝師長', likes: 12, likedBy: [] },
  { id: 'n18', to: '一起留晚自習的夥伴', message: '冬天的晚上雖然很冷，但抬頭看到身邊還有你們一起安靜讀書的身影，就覺得一點都不孤單了！', from: '18號 庭瑋', theme: 'berry', shape: 'plaque', icon: 'flame', category: '同儕祝福', likes: 18, likedBy: [] },
  { id: 'n19', to: '熱心助人的 宗翰', message: '那天我不小心在樓梯扭傷腳，謝謝你主動幫我揹書包還扶我去保健室，真的超級感謝你！', from: '溫暖的匿名同學', theme: 'oat', shape: 'classic', icon: 'star', category: '同儕祝福', likes: 24, likedBy: [] },
  { id: 'n20', to: '輔導室 雅筑老師', message: '謝謝老師總是溫柔地傾聽我的煩惱，每次走出輔導室都覺得心裡充滿暖陽，祝老師聖誕快樂！', from: '20號 姿妤', theme: 'midnight', shape: 'tag', icon: 'coffee', category: '感謝師長', likes: 16, likedBy: [] },
  { id: 'n21', to: '總務股長 威廷', message: '收班費、訂便當、買班服都靠你一手包辦，帳目永遠清清楚楚，謝謝你為班上做這麼多事！', from: '21號 凱文', theme: 'cream', shape: 'arch', icon: 'gift', category: '同儕祝福', likes: 13, likedBy: [] },
  { id: 'n22', to: '午餐抬餐桶的小天使們', message: '謝謝每天中午固定去抬熱湯跟飯菜的同學，不管天氣多冷都讓我們有熱騰騰的午餐吃！', from: '22號 佳穎', theme: 'sage', shape: 'stamp', icon: 'heart', category: '同儕祝福', likes: 25, likedBy: [] },
  { id: 'n23', to: '生物科 許老師', message: '謝謝老師帶我們去校園觀察植物生態，讓我們發現原來冬天的校園也充滿生機！', from: '23號 睿恩', theme: 'berry', shape: 'bauble', icon: 'tree', category: '感謝師長', likes: 11, likedBy: [] },
  { id: 'n24', to: '愛笑的 曼婷', message: '妳的笑聲真的很有感染力，每次班上氣氛緊繃的時候，只要聽到妳開朗的笑聲大家就放鬆下來了！', from: '24號 筱涵', theme: 'oat', shape: 'plaque', icon: 'bell', category: '同儕祝福', likes: 14, likedBy: [] },
  { id: 'n25', to: '資訊股長 秉澄', message: '每次教室投影機或電腦出問題，你三秒鐘就能修好，簡直是全班跟老師們的救星！', from: '25號 鈞宥', theme: 'midnight', shape: 'classic', icon: 'star', category: '同儕祝福', likes: 19, likedBy: [] },
  { id: 'n26', to: '地理科 鄭老師', message: '謝謝老師帶我們認識世界各地的北歐極光與冬日風景，希望有一天我也能親眼去看極光！', from: '26號 晨曦', theme: 'cream', shape: 'tag', icon: 'snow', category: '感謝師長', likes: 12, likedBy: [] },
  { id: 'n27', to: '英語話劇組的大家', message: '從寫劇本、做紙箱道具到上台演出，謝謝大家沒有人喊累，一起完成了最棒的聖誕短劇！', from: '27號 靖雯', theme: 'sage', shape: 'arch', icon: 'gift', category: '同儕祝福', likes: 17, likedBy: [] },
  { id: 'n28', to: '每天最早到校開門的 紹齊', message: '謝謝你每天早上六點五十分就來開教室門窗跟電燈，讓大家一進教室就有明亮溫暖的空間！', from: '28號 博鈞', theme: 'berry', shape: 'stamp', icon: 'coffee', category: '同儕祝福', likes: 23, likedBy: [] },
  { id: 'n29', to: '音樂科 蘇老師', message: '謝謝老師在12月教我們唱這麼多溫暖的聖誕歌曲，讓每週的音樂課都像一場小型音樂會！', from: '29號 樂樂', theme: 'oat', shape: 'bauble', icon: 'bell', category: '感謝師長', likes: 15, likedBy: [] },
  { id: 'n30', to: '熱舞社的同班夥伴 薇安', message: '看著妳兼顧社團成發跟課業還是這麼努力，真的激勵了我很多，聖誕成發一定大成功！', from: '30號 巧恩', theme: 'midnight', shape: 'plaque', icon: 'flame', category: '同儕祝福', likes: 16, likedBy: [] },
  { id: 'n31', to: '公民科 黃老師', message: '謝謝老師總是用溫和理性的方式帶我們討論時事，讓我們學會同理與尊重不同的聲音！', from: '31號 宥辰', theme: 'cream', shape: 'classic', icon: 'heart', category: '感謝師長', likes: 13, likedBy: [] },
  { id: 'n32', to: '幫我撿起掉落筆記的同學', message: '上週在走廊不小心散落一地講義，謝謝好幾位同學馬上蹲下來幫我撿，我們班真的超有愛！', from: '32號 雅婷', theme: 'sage', shape: 'tag', icon: 'star', category: '同儕祝福', likes: 18, likedBy: [] },
  { id: 'n33', to: '正在為夢想努力的每個人', message: '不管這學期過得順利或有些小挫折，都想跟大家說一聲辛苦了，願新的一年每個人都能心想事成！', from: '33號 翔宇', theme: 'berry', shape: 'arch', icon: 'tree', category: '歲末祈願', likes: 21, likedBy: [] },
  { id: 'n34', to: '親愛的未來自己', message: '保持善良、保持好奇心，就算遇到寒冬也要記得心裡那盞溫暖的小燈，聖誕快樂！', from: '34號 語嫣', theme: 'oat', shape: 'stamp', icon: 'snow', category: '給未來的自己', likes: 14, likedBy: [] },
  { id: 'n35', to: '我們最溫暖的班級與老師', message: '35個人、35顆真心，謝謝大家把這間教室變成第二個家。祝全班聖誕快樂、平安喜樂！', from: '35號 副班長 哲瀚', theme: 'midnight', shape: 'bauble', icon: 'gift', category: '歲末祈願', likes: 32, likedBy: [] }
];

const SAMPLE_NOTES = FULL_CLASS_35_NOTES.slice(0, 6);

// ==========================================
// 依卡片造型渲染專屬外觀與工藝細節元件 (全字體加粗投影強化版)
// ==========================================
const ShapedNoteCard = ({
  note,
  themeObj,
  hasLiked,
  isMine,
  isTeacherMode,
  isLargeStage = false,
  isCompactMatrix = false,
  isSpotlightActive = false,
  onSelectCard,
  onToggleLike,
  onDelete,
  formatTime,
  renderCardIcon,
  isPreview = false
}) => {
  const shape = note.shape || 'classic';
  const isCompact = isCompactMatrix && !isPreview && !isLargeStage;

  // 根據卡片 id 產生微幅自然傾斜角度，滑鼠移過時回正
  const tiltClass = useMemo(() => {
    if (isPreview || isLargeStage) return '';
    const sum = String(note.id || '0')
      .split('')
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const tilts = [
      'rotate-[-0.7deg]',
      'rotate-[0.6deg]',
      'rotate-[-0.4deg]',
      'rotate-[0.75deg]',
      'rotate-0'
    ];
    return `${tilts[sum % tilts.length]} hover:rotate-0`;
  }, [note.id, isPreview, isLargeStage]);

  // 依據不同造型與緊湊程度定義外框圓角、ClipPath 與內距
  const getShapeContainerStyles = () => {
    if (isCompact) {
      switch (shape) {
        case 'tag':
          return {
            className: 'pt-6 pb-3.5 px-3.5 rounded-b-xl shadow-md',
            style: {
              clipPath: 'polygon(14% 0%, 86% 0%, 100% 22px, 100% 100%, 0% 100%, 0% 22px)'
            }
          };
        case 'arch':
          return {
            className: 'pt-6 pb-3.5 px-3.5 rounded-t-[60px] rounded-b-xl border-2 shadow-md',
            style: {}
          };
        case 'stamp':
          return {
            className: 'p-3.5 rounded-sm shadow-md border-2 border-dashed',
            style: {}
          };
        case 'bauble':
          return {
            className: 'pt-6 pb-4 px-4 rounded-[32px] border-2 shadow-md',
            style: {}
          };
        case 'plaque':
          return {
            className: 'pt-6 pb-3.5 px-3.5 rounded-b-lg shadow-md',
            style: {
              clipPath: 'polygon(50% 0%, 100% 20px, 100% 100%, 0% 100%, 0% 20px)'
            }
          };
        case 'classic':
        default:
          return {
            className: 'p-3.5 rounded-xl border-2 shadow-md',
            style: {}
          };
      }
    }

    if (isLargeStage) {
      switch (shape) {
        case 'tag':
          return {
            className: 'pt-14 pb-9 px-9 sm:px-11 rounded-b-3xl shadow-2xl',
            style: {
              clipPath: 'polygon(14% 0%, 86% 0%, 100% 52px, 100% 100%, 0% 100%, 0% 52px)'
            }
          };
        case 'arch':
          return {
            className: 'pt-14 pb-9 px-9 sm:px-11 rounded-t-[150px] rounded-b-3xl border-2 shadow-2xl',
            style: {}
          };
        case 'stamp':
          return {
            className: 'p-9 sm:p-11 rounded-md shadow-2xl border-[3px] border-dashed',
            style: {
              backgroundImage: `radial-gradient(circle at 0 14px, transparent 6px, ${themeObj.previewBg} 6.5px)`
            }
          };
        case 'bauble':
          return {
            className: 'pt-14 pb-10 px-10 sm:px-12 rounded-[68px] border-2 shadow-2xl',
            style: {}
          };
        case 'plaque':
          return {
            className: 'pt-14 pb-9 px-9 sm:px-11 rounded-b-2xl shadow-2xl',
            style: {
              clipPath: 'polygon(50% 0%, 100% 48px, 100% 100%, 0% 100%, 0% 48px)'
            }
          };
        case 'classic':
        default:
          return {
            className: 'p-8 sm:p-10 rounded-3xl border-2 shadow-2xl',
            style: {}
          };
      }
    }

    switch (shape) {
      case 'tag':
        return {
          className: 'pt-10 pb-5 px-5 rounded-b-2xl shadow-md',
          style: {
            clipPath: 'polygon(15% 0%, 85% 0%, 100% 36px, 100% 100%, 0% 100%, 0% 36px)'
          }
        };
      case 'arch':
        return {
          className: 'pt-10 pb-5 px-5 rounded-t-[105px] rounded-b-2xl border-2 shadow-md',
          style: {}
        };
      case 'stamp':
        return {
          className: 'p-6 rounded-sm shadow-md border-2 border-dashed',
          style: {
            backgroundImage: `radial-gradient(circle at 0 12px, transparent 5px, ${themeObj.previewBg} 5.5px)`
          }
        };
      case 'bauble':
        return {
          className: 'pt-10 pb-6 px-6 rounded-[48px] border-2 shadow-md',
          style: {}
        };
      case 'plaque':
        return {
          className: 'pt-11 pb-5 px-5 rounded-b-xl shadow-md',
          style: {
            clipPath: 'polygon(50% 0%, 100% 34px, 100% 100%, 0% 100%, 0% 34px)'
          }
        };
      case 'classic':
      default:
        return {
          className: 'p-5 rounded-2xl border-2 shadow-md',
          style: {}
        };
    }
  };

  const shapeConfig = getShapeContainerStyles();
  const shapeMeta = CARD_SHAPES.find((s) => s.id === shape) || CARD_SHAPES[0];

  return (
    <div
      onClick={() => {
        if (!isPreview && onSelectCard) onSelectCard(note);
      }}
      className={`group relative transition-all duration-300 font-bold ${
        isPreview
          ? ''
          : `${tiltClass} hover:-translate-y-1.5 cursor-pointer ${
              isSpotlightActive
                ? 'ring-4 ring-[#D4B475] scale-[1.03] z-30 shadow-[0_0_35px_rgba(212,180,117,0.45)] rounded-2xl'
                : ''
            }`
      } flex flex-col ${isCompact ? 'pt-2' : 'pt-3'}`}
    >
      {/* ========================================== */}
      {/* 頂部立體吊飾/掛繩/圖釘裝飾 (依造型變化) */}
      {/* ========================================== */}
      {shape === 'classic' && (
        <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
          <div
            className={`${
              isCompact ? 'w-3 h-3' : isLargeStage ? 'w-5 h-5' : 'w-4 h-4'
            } rounded-full bg-gradient-to-br from-[#E5C88D] to-[#9E7B3B] shadow-md border border-[#FAF7F2]/80`}
          />
        </div>
      )}

      {shape === 'tag' && (
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
          <div
            className={`${
              isCompact ? 'w-3.5 h-3.5 -mb-1.5' : 'w-5 h-5 -mb-2.5'
            } rounded-full border-2 border-[#C5A059]`}
          />
          <div
            className={`${
              isCompact ? 'w-2.5 h-2.5 border-2' : 'w-4 h-4 border-[3px]'
            } rounded-full bg-[#16291F] border-[#C5A059] shadow-inner`}
          />
        </div>
      )}

      {shape === 'arch' && (
        <div className="absolute top-0.5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
          <div
            className={`${
              isCompact ? 'w-4 h-4' : isLargeStage ? 'w-7 h-7' : 'w-6 h-6'
            } rounded-full bg-[#1B3022] border-2 border-[#C5A059] flex items-center justify-center text-[#D4B475] shadow-sm`}
          >
            <Star className={`${isCompact ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} fill-current`} />
          </div>
        </div>
      )}

      {shape === 'stamp' && (
        <div className="absolute top-0.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <span
            className={`px-2 py-0.5 rounded-sm bg-[#8C3A3A] text-[#FAF7F2] ${
              isCompact ? 'text-[9px]' : 'text-[11px]'
            } tracking-widest uppercase font-extrabold shadow-sm`}
          >
            {isCompact ? 'DEC 25' : 'WINTER POST • 25'}
          </span>
        </div>
      )}

      {shape === 'bauble' && (
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
          <div
            className={`${
              isCompact ? 'w-3 h-3 -mb-0.5' : 'w-4 h-4 -mb-1'
            } rounded-full border-2 border-[#D4B475]`}
          />
          <div
            className={`${
              isCompact ? 'w-6 h-2.5' : 'w-9 h-3.5'
            } rounded-t-md bg-gradient-to-r from-[#A6823E] via-[#DFC184] to-[#9E7B3B] border border-[#7D5E26] shadow-sm`}
          />
        </div>
      )}

      {shape === 'plaque' && (
        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
          <div
            className={`${
              isCompact ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'
            } rotate-45 bg-[#8C3A3A] border border-[#D4B475] shadow-sm`}
          />
          <div
            className={`${
              isCompact ? 'w-1.5 h-1.5 -mt-0.5' : 'w-2.5 h-2.5 -mt-1'
            } rounded-full bg-[#D4B475] shadow`}
          />
        </div>
      )}

      {/* ========================================== */}
      {/* 卡片本體容器 (全面採用加粗字體與高對比色彩) */}
      {/* ========================================== */}
      <article
        style={shapeConfig.style}
        className={`relative flex-1 flex flex-col justify-between ${themeObj.bg} ${themeObj.border} ${themeObj.text} ${shapeConfig.className} group-hover:shadow-2xl transition-shadow font-bold`}
      >
        {/* 各造型專屬內框或浮水印細節 */}
        {!isCompact && shape === 'classic' && (
          <div
            className="inset-2.5 absolute rounded-xl border pointer-events-none opacity-65"
            style={{ borderColor: themeObj.borderHex }}
          />
        )}

        {!isCompact && shape === 'arch' && (
          <div
            className="inset-2.5 absolute rounded-t-[100px] rounded-b-xl border pointer-events-none opacity-65"
            style={{ borderColor: themeObj.borderHex }}
          />
        )}

        {!isCompact && shape === 'bauble' && (
          <div
            className="inset-2.5 absolute rounded-[44px] border border-dashed pointer-events-none opacity-60"
            style={{ borderColor: themeObj.borderHex }}
          />
        )}

        {!isCompact && shape === 'tag' && (
          <div
            className="inset-x-4 top-8 bottom-3 absolute border-t border-b pointer-events-none opacity-50"
            style={{ borderColor: themeObj.borderHex }}
          />
        )}

        {!isCompact && shape === 'plaque' && (
          <div
            className="inset-x-4 top-9 bottom-3 absolute border-t-2 pointer-events-none opacity-55"
            style={{ borderColor: themeObj.borderHex }}
          />
        )}

        {!isCompact && shape === 'stamp' && (
          <>
            <div
              className="inset-2.5 absolute border pointer-events-none"
              style={{ borderColor: themeObj.borderHex }}
            />
            <div className="absolute top-3.5 right-14 pointer-events-none opacity-25 rotate-[-10deg] flex items-center gap-1 border-2 border-current rounded-full px-2 py-0.5 text-[10px] font-extrabold">
              <span>DEC 25 ★ NORDIC</span>
            </div>
          </>
        )}

        {/* 卡片上段：To 收件人與節慶小圖示 (字體全面加粗) */}
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="min-w-0">
              <span
                className={`${
                  isCompact
                    ? 'text-[11px]'
                    : isLargeStage
                    ? 'text-sm'
                    : 'text-xs'
                } font-extrabold uppercase tracking-wider block ${themeObj.subtext}`}
              >
                To 致：
              </span>
              <h3
                className={`font-serif font-extrabold tracking-wide truncate ${
                  isCompact
                    ? 'text-sm'
                    : isLargeStage
                    ? 'text-2xl sm:text-3xl mt-0.5'
                    : 'text-lg sm:text-xl'
                }`}
              >
                {note.to || '全班同學與師長'}
              </h3>
            </div>

            <div
              className={`${
                isCompact
                  ? 'w-7 h-7 rounded-lg'
                  : isLargeStage
                  ? 'w-12 h-12 rounded-2xl'
                  : 'w-9 h-9 rounded-xl'
              } ${themeObj.badgeBg} flex items-center justify-center shrink-0 ${themeObj.accent} shadow-inner`}
              title={`${shapeMeta.name} • ${note.category || '冬日祝福'}`}
            >
              {renderCardIcon(
                note.icon,
                isCompact
                  ? 'w-4 h-4 stroke-[2.4]'
                  : isLargeStage
                  ? 'w-6 h-6 stroke-[2.4]'
                  : 'w-5 h-5 stroke-[2.25]'
              )}
            </div>
          </div>

          {/* 柔和分隔線 */}
          <div
            className={`border-t-2 border-dashed ${
              isCompact ? 'my-1.5' : isLargeStage ? 'my-4' : 'my-2.5'
            } opacity-80`}
            style={{ borderColor: themeObj.borderHex }}
          />

          {/* 感恩與祝福內文 (投影大螢幕專用粗體 font-bold) */}
          <p
            className={`leading-relaxed whitespace-pre-wrap break-words font-bold ${
              isCompact
                ? 'text-xs sm:text-[13px] line-clamp-4 my-1.5'
                : isLargeStage
                ? 'text-xl sm:text-2xl my-5 leading-relaxed'
                : 'text-base sm:text-[17px] my-3'
            }`}
          >
            {note.message || '在微涼的歲末冬日裡，寫下一份真摯的感謝與祝福...'}
          </p>
        </div>

        {/* 卡片下段：From 署名、分類標籤、共鳴愛心 (全部加粗) */}
        <div
          className={`relative z-10 ${
            isCompact ? 'mt-2 pt-2' : isLargeStage ? 'mt-6 pt-4' : 'mt-3.5 pt-3'
          } border-t-2 flex items-end justify-between gap-2`}
          style={{ borderColor: themeObj.innerHex }}
        >
          <div className="min-w-0">
            <span
              className={`${
                isCompact
                  ? 'text-xs'
                  : isLargeStage
                  ? 'text-base sm:text-lg'
                  : 'text-sm'
              } font-extrabold block truncate ${themeObj.text}`}
            >
              From：{note.from}
            </span>
            {!isCompact && (
              <div className="flex items-center flex-wrap gap-1.5 mt-1">
                <span className={`text-xs font-bold ${themeObj.subtext}`}>
                  {formatTime(note.createdAt)}
                </span>
                {note.category && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md font-extrabold ${themeObj.badgeBg} ${themeObj.subtext}`}
                  >
                    {note.category}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 互動按鈕區 */}
          {!isPreview && (
            <div
              className="flex items-center gap-1 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {!isCompact && (isMine || isTeacherMode) && (
                <button
                  onClick={() => onDelete(note.id)}
                  title="刪除這張卡片"
                  className={`p-1.5 rounded-lg opacity-75 hover:opacity-100 hover:bg-black/10 transition ${themeObj.subtext}`}
                >
                  <Trash2 className="w-4 h-4 stroke-[2.25]" />
                </button>
              )}

              <button
                onClick={() => onToggleLike(note)}
                className={`${
                  isCompact
                    ? 'px-2 py-0.5 text-xs'
                    : isLargeStage
                    ? 'px-4 py-1.5 text-base'
                    : 'px-2.5 py-1 text-xs'
                } rounded-full font-extrabold flex items-center gap-1 transition ${
                  hasLiked
                    ? 'bg-[#8C3A3A] text-white shadow-sm'
                    : `${themeObj.badgeBg} ${themeObj.text} hover:opacity-85`
                }`}
                title="送出溫暖共鳴"
              >
                <Heart
                  className={`${
                    isCompact ? 'w-3 h-3' : isLargeStage ? 'w-5 h-5' : 'w-3.5 h-3.5'
                  } stroke-[2.5] ${
                    hasLiked ? 'fill-current text-white' : 'text-[#8C3A3A]'
                  }`}
                />
                <span>{note.likes || 0}</span>
              </button>
            </div>
          )}
        </div>
      </article>
    </div>
  );
};

// ==========================================
// 極簡背景飄雪 Canvas 元件 (柔和不刺眼)
// ==========================================
const GentleSnowCanvas = ({ enabled }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 建立極少量的柔和微粒雪花，保持畫面乾淨內斂
    const particleCount = Math.min(45, Math.floor(window.innerWidth / 30));
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2.2 + 0.8,
      speedY: Math.random() * 0.4 + 0.15,
      speedX: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.35 + 0.1
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.y * 0.01) * 0.15;

        if (p.y > canvas.height) {
          p.y = -5;
          p.x = Math.random() * canvas.width;
        }
        if (p.x > canvas.width) p.x = 0;
        if (p.x < 0) p.x = canvas.width;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(250, 247, 242, ${p.opacity})`;
        ctx.fill();
      });
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
};

// ==========================================
// 主應用程式元件
// ==========================================
export default function App() {
  // Firebase 驗證與資料狀態
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [cloudNotes, setCloudNotes] = useState([]);
  const [localDemoNotes, setLocalDemoNotes] = useState(() =>
    FULL_CLASS_35_NOTES.map((item, idx) => ({
      ...item,
      createdAt: Date.now() - idx * 180000
    }))
  );
  // 預設開啟「35張全班展示模式」，立即在大螢幕呈現 35 張豐富卡片
  const [isDemo35Mode, setIsDemo35Mode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // 學生登入身分狀態
  const [studentProfile, setStudentProfile] = useState({
    name: '小宇',
    seatNumber: '01',
    hasLoggedIn: true
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempName, setTempName] = useState('小宇');
  const [tempSeat, setTempSeat] = useState('01');

  // 新增祝福表單狀態 (包含 6 款卡片造型選擇)
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [toField, setToField] = useState('');
  const [messageField, setMessageField] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('cream');
  const [selectedShape, setSelectedShape] = useState('classic');
  const [selectedIcon, setSelectedIcon] = useState('tree');
  const [selectedCategory, setSelectedCategory] = useState('同儕祝福');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 兩大核心大螢幕展示模式：'all' (全部畫面呈現) | 'spotlight' (聚焦輪播)
  const [viewMode, setViewMode] = useState('all');
  // 在「全部畫面呈現」下的欄位密度：true 為 6~7 欄單頁全班矩陣，false 為 4~5 欄大字距閱讀
  const [isCompactAllGrid, setIsCompactAllGrid] = useState(false);
  const [snowEnabled, setSnowEnabled] = useState(true);
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [isSpotlightPlaying, setIsSpotlightPlaying] = useState(true);
  const [activeLightboxNote, setActiveLightboxNote] = useState(null);

  // 教師管理模式與互動視窗狀態
  const [isTeacherMode, setIsTeacherMode] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teacherPasscode, setTeacherPasscode] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const hasAutoSeededRef = useRef(false);

  // 根據目前是否處於「35張全班展示模式」決定資料來源
  const notes = isDemo35Mode ? localDemoNotes : cloudNotes;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // 1. 初始化 Firebase Auth (遵循 RULE 3)
  useEffect(() => {
    if (!auth) {
      setAuthReady(true);
      return;
    }
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error('Authentication error:', err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // 2. 監聽 Firestore 公開留言集合
  useEffect(() => {
    if (!user || !db) return;

    const notesCollectionRef = collection(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'gratitude_notes'
    );

    const unsubscribe = onSnapshot(
      notesCollectionRef,
      async (snapshot) => {
        const fetchedNotes = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));

        if (fetchedNotes.length === 0 && !hasAutoSeededRef.current) {
          hasAutoSeededRef.current = true;
          try {
            const now = Date.now();
            for (let i = 0; i < SAMPLE_NOTES.length; i++) {
              await addDoc(notesCollectionRef, {
                ...SAMPLE_NOTES[i],
                authorUid: 'system-sample',
                createdAt: now - i * 120000
              });
            }
          } catch (seedErr) {
            console.error('Auto seed error:', seedErr);
          }
        } else {
          setCloudNotes(fetchedNotes);
        }
      },
      (err) => {
        console.error('Firestore onSnapshot error:', err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // 處理學生登入表單提交
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const trimmedName = tempName.trim();
    if (!trimmedName) {
      showToast('請輸入您的姓名或暱稱喔！');
      return;
    }
    setStudentProfile({
      name: trimmedName,
      seatNumber: tempSeat.trim(),
      hasLoggedIn: true
    });
    setIsEditingProfile(false);
    showToast(`歡迎進入冬日感恩牆，${trimmedName}！`);
  };

  // 張貼新祝福卡片 (同時支援 35張展示模式 與 雲端實況模式)
  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!messageField.trim()) {
      showToast('請寫下您的感恩或祝福話語！');
      return;
    }

    setIsSubmitting(true);
    try {
      const displayAuthor = studentProfile.seatNumber
        ? `${studentProfile.seatNumber}號 ${studentProfile.name}`
        : studentProfile.name || '班級同學';

      const newNote = {
        to: toField.trim() || '全班同學與師長',
        message: messageField.trim(),
        from: isAnonymous ? '溫暖的匿名同學' : displayAuthor,
        realAuthorName: displayAuthor,
        authorUid: user ? user.uid : 'local-student',
        isAnonymous,
        theme: selectedTheme,
        shape: selectedShape,
        icon: selectedIcon,
        category: selectedCategory,
        likes: 0,
        likedBy: [],
        createdAt: Date.now()
      };

      if (isDemo35Mode) {
        setLocalDemoNotes((prev) => [
          { id: `demo-custom-${Date.now()}`, ...newNote },
          ...prev
        ]);
      } else if (user) {
        const notesCollectionRef = collection(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'gratitude_notes'
        );
        await addDoc(notesCollectionRef, newNote);
      }

      setToField('');
      setMessageField('');
      setIsAnonymous(false);
      setIsComposerOpen(false);
      showToast('您的造型祝福卡已溫柔地釘上留言牆！');
    } catch (err) {
      console.error('Error adding note:', err);
      showToast('發布失敗，請檢查網路連線後重試。');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 重置或載入 35 張全班展示卡片
  const handleReset35Demo = () => {
    setLocalDemoNotes(
      FULL_CLASS_35_NOTES.map((item, idx) => ({
        ...item,
        createdAt: Date.now() - idx * 180000
      }))
    );
    setIsDemo35Mode(true);
    showToast('已載入全班 35 張溫馨感恩與聖誕祝福卡片！');
  };

  // 按讚 / 收回共鳴
  const handleToggleLike = async (note) => {
    const currentUid = user ? user.uid : 'local-student';

    if (isDemo35Mode) {
      setLocalDemoNotes((prev) =>
        prev.map((item) => {
          if (item.id !== note.id) return item;
          const likedBy = Array.isArray(item.likedBy) ? item.likedBy : [];
          const hasLiked = likedBy.includes(currentUid);
          const updatedLikedBy = hasLiked
            ? likedBy.filter((id) => id !== currentUid)
            : [...likedBy, currentUid];
          const baseLikes =
            (item.likes || 0) + (hasLiked ? -1 : 1);
          return {
            ...item,
            likedBy: updatedLikedBy,
            likes: Math.max(0, baseLikes)
          };
        })
      );
      return;
    }

    if (!user) return;
    try {
      const noteRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'gratitude_notes',
        note.id
      );
      const likedBy = Array.isArray(note.likedBy) ? note.likedBy : [];
      const hasLiked = likedBy.includes(user.uid);

      const updatedLikedBy = hasLiked
        ? likedBy.filter((id) => id !== user.uid)
        : [...likedBy, user.uid];

      await updateDoc(noteRef, {
        likedBy: updatedLikedBy,
        likes: updatedLikedBy.length
      });
    } catch (err) {
      console.error('Error toggling like:', err);
      showToast('操作失敗，請稍後再試。');
    }
  };

  // 刪除留言
  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;

    if (isDemo35Mode) {
      setLocalDemoNotes((prev) => prev.filter((item) => item.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      showToast('已從展示牆移除該張祝福卡片。');
      return;
    }

    if (!user) return;
    try {
      const noteRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'gratitude_notes',
        deleteConfirmId
      );
      await deleteDoc(noteRef);
      setDeleteConfirmId(null);
      showToast('已移除該張祝福卡片。');
    } catch (err) {
      console.error('Error deleting note:', err);
      showToast('刪除失敗，請稍後再試。');
    }
  };

  // 匯出全班祝福 CSV (方便老師留存紀念)
  const handleExportCSV = () => {
    if (notes.length === 0) {
      showToast('目前尚無留言可供匯出喔！');
      return;
    }
    const headers = ['張貼時間', '卡片造型', '分類', '給誰(To)', '感恩與祝福內容', '署名(From)', '共鳴愛心數'];
    const rows = notes
      .slice()
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .map((n) => {
        const dateStr = n.createdAt
          ? new Date(n.createdAt).toLocaleString('zh-TW')
          : '';
        const shapeName =
          (CARD_SHAPES.find((s) => s.id === n.shape) || CARD_SHAPES[0]).name;
        const escapeCSV = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
        return [
          escapeCSV(dateStr),
          escapeCSV(shapeName),
          escapeCSV(n.category || '同儕祝福'),
          escapeCSV(n.to),
          escapeCSV(n.message),
          escapeCSV(n.from),
          n.likes || 0
        ].join(',');
      });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `冬日感恩與祝福牆紀錄_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('已匯出全班祝福紀錄 CSV 檔案！');
  };

  // 切換教師管理模式
  const handleTeacherUnlock = (e) => {
    e.preventDefault();
    if (teacherPasscode.trim() === '1225' || teacherPasscode.trim().toLowerCase() === 'teacher') {
      setIsTeacherMode(true);
      setShowTeacherModal(false);
      setTeacherPasscode('');
      showToast('已開啟教師管理模式（可管理所有留言與匯出紀錄）');
    } else {
      showToast('通行碼不正確（預設提示：聖誕節日期 4 碼）');
    }
  };

  // 直接呈現全部卡片 (不設搜尋框與造型過濾器，最大化大螢幕投影空間)
  const displayedNotes = useMemo(() => {
    return notes.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [notes]);

  // 聚焦輪播自動巡覽計時器 (當處於 spotlight 模式時，每 4.5 秒溫柔切換焦點卡片)
  useEffect(() => {
    if (viewMode !== 'spotlight' || !isSpotlightPlaying || displayedNotes.length === 0) {
      return;
    }
    const timer = setInterval(() => {
      setSpotlightIndex((prev) => (prev + 1) % displayedNotes.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [viewMode, isSpotlightPlaying, displayedNotes.length]);

  // 確保 spotlightIndex 不超出陣列範圍
  useEffect(() => {
    if (spotlightIndex >= displayedNotes.length) {
      setSpotlightIndex(0);
    }
  }, [displayedNotes.length, spotlightIndex]);

  // 格式化時間顯示
  const formatTime = (timestamp) => {
    if (!timestamp) return '剛剛';
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return '剛剛';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} 分鐘前`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} 小時前`;
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // 取得對應圖示元件
  const renderCardIcon = (iconId, className = 'w-5 h-5') => {
    const found = CARD_ICONS.find((item) => item.id === iconId) || CARD_ICONS[0];
    const IconComponent = found.icon;
    return <IconComponent className={className} />;
  };

  // ==========================================
  // 畫面一：學生柔和登入歡迎畫面 (全字體加粗版)
  // ==========================================
  if (!studentProfile.hasLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0F1E16] via-[#16291F] to-[#1B3022] text-[#FAF7F2] flex flex-col justify-between relative overflow-hidden font-sans font-bold selection:bg-[#C5A059]/30">
        <GentleSnowCanvas enabled={snowEnabled} />

        {/* 頂部極簡裝飾線條與松枝氛圍 */}
        <header className="relative z-10 max-w-5xl w-full mx-auto px-6 pt-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-[#D4B475]">
            <TreePine className="w-6 h-6 stroke-[2.25]" />
            <span className="tracking-widest text-sm font-extrabold uppercase opacity-95">
              Winter Gratitude & Blessing
            </span>
          </div>
          <button
            onClick={() => setSnowEnabled(!snowEnabled)}
            className="flex items-center gap-1.5 text-xs font-extrabold text-[#D0E0D5] hover:text-[#FAF7F2] bg-[#1F3729]/80 px-3.5 py-1.5 rounded-full border border-[#385A46] transition"
          >
            <Snowflake className="w-3.5 h-3.5" />
            {snowEnabled ? '微雪飄落中' : '已暫停飄雪'}
          </button>
        </header>

        {/* 中央登入卡片 */}
        <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md bg-[#FAF7F2] text-[#141C18] rounded-2xl shadow-2xl border-2 border-[#E6DFD3] p-8 sm:p-10 relative overflow-hidden font-bold">
            {/* 頂部暖金飾條 */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#8C3A3A] via-[#C5A059] to-[#4A6B53]" />

            <div className="flex flex-col items-center text-center mb-7">
              <div className="w-14 h-14 rounded-full bg-[#EFECE6] border-2 border-[#DFD7C8] flex items-center justify-center text-[#8C3A3A] mb-4 shadow-inner">
                <Heart className="w-7 h-7 stroke-[2.2]" />
              </div>
              <span className="text-xs tracking-widest uppercase text-[#8C7A5B] font-extrabold mb-1">
                12月 歲末溫馨企劃
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif font-extrabold text-[#1B3022] tracking-wide">
                冬日感恩與祝福留言牆
              </h1>
              <p className="text-sm font-bold text-[#3A443E] mt-2.5 leading-relaxed">
                聖誕節的腳步近了。在這個微涼的季節裡，讓我們放慢腳步，寫下一句感謝或祝福，送給身邊陪伴你的同學與老師。
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-[#2C3531] uppercase tracking-wider mb-1.5">
                  座號 (選填)
                </label>
                <input
                  type="text"
                  value={tempSeat}
                  onChange={(e) => setTempSeat(e.target.value)}
                  placeholder="例如：12"
                  maxLength={10}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-[#D8D0C5] text-[#141C18] font-bold placeholder-[#8E887E] focus:outline-none focus:ring-2 focus:ring-[#C5A059] transition text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#2C3531] uppercase tracking-wider mb-1.5">
                  您的姓名或班級暱稱 <span className="text-[#8C3A3A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="例如：子軒、小太陽..."
                  maxLength={20}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-[#D8D0C5] text-[#141C18] font-bold placeholder-[#8E887E] focus:outline-none focus:ring-2 focus:ring-[#C5A059] transition text-sm"
                />
                <p className="text-xs font-bold text-[#525C56] mt-1.5">
                  ※ 進入後張貼卡片時，仍可自由選擇是否以「匿名」方式送出祝福。
                </p>
              </div>

              <button
                type="submit"
                disabled={!authReady}
                className="w-full mt-2 py-3 px-6 rounded-xl bg-[#1B3022] hover:bg-[#25412E] active:scale-[0.99] text-[#FAF7F2] font-extrabold text-sm tracking-wide shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-[#D4B475]" />
                {authReady ? '推開木門，進入留言牆' : '正在準備溫馨空間...'}
              </button>
            </form>

            {/* 直接進入大螢幕檢視按鈕 */}
            <div className="mt-6 pt-5 border-t-2 border-[#E6DFD3] flex items-center justify-between text-xs font-extrabold text-[#49534D]">
              <span>目前共有 {notes.length} 張溫馨卡片</span>
              <button
                type="button"
                onClick={() => {
                  setStudentProfile({
                    name: '大螢幕展示',
                    seatNumber: '',
                    hasLoggedIn: true
                  });
                }}
                className="text-[#8C3A3A] hover:underline font-extrabold flex items-center gap-1"
              >
                直接進入大螢幕展示 →
              </button>
            </div>
          </div>
        </main>

        {/* 底部極簡標語 */}
        <footer className="relative z-10 text-center pb-6 px-4 text-xs font-bold text-[#B4C6B9]">
          願每一句真摯的話語，都成為冬日裡的一道暖光
        </footer>
      </div>
    );
  }

  // ==========================================
  // 畫面二：主留言牆大螢幕互動介面 (無搜尋與分類雜訊、全字體自動加粗)
  // ==========================================
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F1E16] via-[#16291F] to-[#1B3022] text-[#FAF7F2] relative font-sans font-bold selection:bg-[#C5A059]/30 pb-20">
      {/* 柔和微雪背景 */}
      <GentleSnowCanvas enabled={snowEnabled} />

      {/* 頂部暖光暈點綴 */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-[#C5A059]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-10 right-1/4 w-80 h-80 bg-[#8C3A3A]/5 rounded-full blur-3xl pointer-events-none" />

      {/* 輕量提示 Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#FAF7F2] text-[#141C18] border-l-4 border-[#C5A059] px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce font-extrabold">
          <Sparkles className="w-4 h-4 text-[#C5A059] shrink-0" />
          <span className="text-sm font-extrabold">{toastMessage}</span>
        </div>
      )}

      {/* 頂部導覽與大螢幕模式切換列 */}
      <header className="relative z-20 border-b border-[#2A4434]/90 bg-[#122219]/90 backdrop-blur-md sticky top-0">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* 左側品牌與標題 */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#1F3729] border-2 border-[#385A46] flex items-center justify-center text-[#D4B475] shadow-inner">
              <TreePine className="w-6 h-6 stroke-[2.25]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-serif font-extrabold tracking-wide text-[#FAF7F2]">
                  冬日感恩與祝福留言牆
                </h1>
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-extrabold bg-[#253F30] text-[#EAC882] border border-[#3E634D]">
                  全班共 {displayedNotes.length} 張祝福卡
                </span>
              </div>
              <p className="text-xs font-bold text-[#C2D4C8] hidden sm:block mt-0.5">
                歲末溫馨聖誕季・點擊任一張卡片可放大檢視
              </p>
            </div>
          </div>

          {/* 中央核心模式切換：「全畫面呈現」 vs 「聚焦輪播」 */}
          <div className="flex items-center gap-2 bg-[#0D1A13] p-1.5 rounded-2xl border-2 border-[#2E4B3A] shadow-inner">
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition ${
                viewMode === 'all'
                  ? 'bg-[#C5A059] text-[#122219] shadow-md'
                  : 'text-[#C2D4C8] hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4 stroke-[2.5]" />
              <span>全部畫面呈現 ({displayedNotes.length}張)</span>
            </button>

            <button
              onClick={() => {
                setViewMode('spotlight');
                setIsSpotlightPlaying(true);
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition ${
                viewMode === 'spotlight'
                  ? 'bg-[#8C3A3A] text-[#FAF7F2] shadow-md'
                  : 'text-[#C2D4C8] hover:text-white'
              }`}
            >
              <Play className="w-4 h-4 stroke-[2.5]" />
              <span>聚焦輪播展示</span>
            </button>

            {/* 當在「全部畫面呈現」時，提供「舒適大卡(4~5欄)」與「單屏總覽(7欄)」快速切換 */}
            {viewMode === 'all' && (
              <button
                onClick={() => setIsCompactAllGrid(!isCompactAllGrid)}
                className={`hidden md:flex px-3 py-2 rounded-xl text-xs font-extrabold items-center gap-1.5 border transition ${
                  isCompactAllGrid
                    ? 'bg-[#264231] border-[#4A755B] text-[#EAC882]'
                    : 'bg-[#16291F] border-[#2C4736] text-[#B4C6B9] hover:text-white'
                }`}
                title="切換單一畫面7欄總覽或標準大卡片網格"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>{isCompactAllGrid ? '目前：7欄單頁總覽' : '切換 7欄單頁總覽'}</span>
              </button>
            )}
          </div>

          {/* 右側控制列與寫卡片主按鈕 */}
          <div className="flex items-center flex-wrap gap-2">
            {/* 使用者身分顯示與快速修改 */}
            <div className="flex items-center bg-[#1A2F23] border border-[#385A46] rounded-full px-3 py-1.5 text-xs font-extrabold text-[#FAF7F2]">
              <User className="w-3.5 h-3.5 text-[#D4B475] mr-1.5 stroke-[2.5]" />
              <span className="max-w-[110px] truncate">
                {studentProfile.seatNumber ? `${studentProfile.seatNumber}號 ` : ''}
                {studentProfile.name}
              </span>
              <button
                onClick={() => {
                  setTempName(studentProfile.name);
                  setTempSeat(studentProfile.seatNumber);
                  setIsEditingProfile(true);
                }}
                title="修改顯示名稱或切換登入畫面"
                className="ml-2 text-[#B4C6B9] hover:text-white transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 飄雪開關 */}
            <button
              onClick={() => setSnowEnabled(!snowEnabled)}
              title="切換背景微雪動畫"
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 border transition ${
                snowEnabled
                  ? 'bg-[#1F3729] border-[#385A46] text-[#FAF7F2]'
                  : 'bg-transparent border-[#2A4434] text-[#8FA395]'
              }`}
            >
              <Snowflake className="w-3.5 h-3.5 text-[#D4B475]" />
              <span className="hidden xl:inline">{snowEnabled ? '微雪' : '無雪'}</span>
            </button>

            {/* 教師管理與匯出 */}
            <button
              onClick={() => {
                if (isTeacherMode) {
                  setIsTeacherMode(false);
                  showToast('已退出教師管理模式');
                } else {
                  setShowTeacherModal(true);
                }
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 border transition ${
                isTeacherMode
                  ? 'bg-[#8C3A3A] border-[#B25959] text-white'
                  : 'bg-[#1A2F23] border-[#385A46] text-[#C2D4C8] hover:text-white'
              }`}
              title="教師管理與匯出 CSV"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">
                {isTeacherMode ? '教師管理中' : '教師'}
              </span>
            </button>

            {/* 寫下祝福主按鈕 */}
            <button
              onClick={() => setIsComposerOpen(true)}
              className="px-4 py-2 rounded-full bg-[#C5A059] hover:bg-[#D1AE68] text-[#122219] font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg transition flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>寫下感恩與祝福</span>
            </button>
          </div>
        </div>

        {/* 教師管理模式開啟時的簡易工具列 (提供匯出 CSV、切換 35 張展示或雲端實況) */}
        {isTeacherMode && (
          <div className="bg-[#1B3022] border-t border-[#385A46] px-4 py-2 flex flex-wrap items-center justify-center gap-3 text-xs font-extrabold">
            <span className="text-[#EAC882]">★ 教師管理模式已啟用：</span>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1 rounded-lg bg-[#264231] hover:bg-[#31543F] text-[#FAF7F2] border border-[#4A755B] flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-[#EAC882]" />
              匯出全班祝福 CSV
            </button>
            <button
              onClick={() => {
                if (isDemo35Mode) {
                  setIsDemo35Mode(false);
                  showToast('已切換至「雲端實況留言牆」模式');
                } else {
                  handleReset35Demo();
                }
              }}
              className="px-3 py-1 rounded-lg bg-[#264231] hover:bg-[#31543F] text-[#FAF7F2] border border-[#4A755B] flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-[#EAC882]" />
              {isDemo35Mode ? '目前：35張全班展示 (點此切換雲端實況)' : '切換回 35張全班展示卡片'}
            </button>
          </div>
        )}
      </header>

      {/* 主內容容器 (滿版寬度 1600px 適合大螢幕投影) */}
      <main className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* 錯誤訊息提示 */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-[#8C3A3A]/40 border-2 border-[#B25959] text-sm font-extrabold text-[#FAF7F2] flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-xs underline">
              關閉
            </button>
          </div>
        )}

        {/* ========================================== */}
        {/* 模式 A：「聚焦輪播」大螢幕舞台模式 */}
        {/* ========================================== */}
        {viewMode === 'spotlight' && displayedNotes.length > 0 && (
          <div className="space-y-8">
            <div className="bg-gradient-to-b from-[#1A3124]/95 to-[#122219]/95 border-2 border-[#385A46] rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
              {/* 舞台頂部控制列 */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="px-4 py-1.5 rounded-full bg-[#8C3A3A] text-[#FAF7F2] text-sm font-extrabold flex items-center gap-2 shadow-md">
                    <Sparkles className="w-4 h-4 text-[#EAC882]" />
                    聚焦輪播展示中（第 {spotlightIndex + 1} / {displayedNotes.length} 張）
                  </span>
                  <span className="text-sm font-extrabold text-[#C2D4C8] hidden md:inline">
                    自動為全班輪流放大展示每一張同學的溫暖心意
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() =>
                      setSpotlightIndex(
                        (prev) =>
                          (prev - 1 + displayedNotes.length) % displayedNotes.length
                      )
                    }
                    className="px-3.5 py-2 rounded-xl bg-[#1F3729] hover:bg-[#284534] border-2 border-[#385A46] text-[#FAF7F2] font-extrabold flex items-center gap-1 text-xs sm:text-sm"
                    title="上一張卡片"
                  >
                    <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                    <span>上一張</span>
                  </button>

                  <button
                    onClick={() => setIsSpotlightPlaying(!isSpotlightPlaying)}
                    className="px-4 py-2 rounded-xl bg-[#C5A059] hover:bg-[#D4B475] text-[#122219] text-xs sm:text-sm font-extrabold flex items-center gap-1.5 shadow-md"
                  >
                    {isSpotlightPlaying ? (
                      <>
                        <Pause className="w-4 h-4 stroke-[2.5]" />
                        <span>暫停輪播</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 stroke-[2.5]" />
                        <span>繼續輪播</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() =>
                      setSpotlightIndex((prev) => (prev + 1) % displayedNotes.length)
                    }
                    className="px-3.5 py-2 rounded-xl bg-[#1F3729] hover:bg-[#284534] border-2 border-[#385A46] text-[#FAF7F2] font-extrabold flex items-center gap-1 text-xs sm:text-sm"
                    title="下一張卡片"
                  >
                    <span>下一張</span>
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </button>

                  <button
                    onClick={() => setViewMode('all')}
                    className="ml-2 px-4 py-2 rounded-xl bg-[#264231] hover:bg-[#31543F] border border-[#4A755B] text-[#EAC882] text-xs sm:text-sm font-extrabold flex items-center gap-1.5"
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span>返回全畫面</span>
                  </button>
                </div>
              </div>

              {/* 中央超大型聚光燈卡片舞台 */}
              {(() => {
                const spotNote =
                  displayedNotes[spotlightIndex] || displayedNotes[0];
                const spotTheme =
                  CARD_THEMES.find((t) => t.id === spotNote.theme) || CARD_THEMES[0];
                const currentUid = user ? user.uid : 'local-student';
                const likedBy = Array.isArray(spotNote.likedBy) ? spotNote.likedBy : [];
                return (
                  <div className="max-w-2xl mx-auto my-4">
                    <ShapedNoteCard
                      note={spotNote}
                      themeObj={spotTheme}
                      hasLiked={likedBy.includes(currentUid)}
                      isMine={user && spotNote.authorUid === user.uid}
                      isTeacherMode={isTeacherMode}
                      isLargeStage={true}
                      onSelectCard={(n) => setActiveLightboxNote(n)}
                      onToggleLike={handleToggleLike}
                      onDelete={(id) => setDeleteConfirmId(id)}
                      formatTime={formatTime}
                      renderCardIcon={renderCardIcon}
                    />
                  </div>
                );
              })()}

              {/* 底部全班 35 張快速點選導覽列 */}
              <div className="mt-8 pt-5 border-t border-[#2E4B3A] flex flex-wrap items-center justify-center gap-1.5">
                {displayedNotes.map((n, i) => (
                  <button
                    key={n.id}
                    onClick={() => setSpotlightIndex(i)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition ${
                      i === spotlightIndex
                        ? 'bg-[#C5A059] text-[#122219] scale-110 shadow'
                        : 'bg-[#1F3729] text-[#B4C6B9] hover:bg-[#2A4836] hover:text-white'
                    }`}
                    title={`切換至：To ${n.to} (${n.from})`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* 輪播舞台下方同時展示全班卡片總覽，點擊任一張可直接聚焦 */}
            <div>
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-base sm:text-lg font-serif font-extrabold text-[#EAC882] flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  <span>全班祝福卡片總覽（點擊任一卡片可立即聚焦展示）</span>
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3.5 items-stretch">
                {displayedNotes.map((note, idx) => {
                  const themeObj =
                    CARD_THEMES.find((t) => t.id === note.theme) || CARD_THEMES[0];
                  const currentUid = user ? user.uid : 'local-student';
                  const likedBy = Array.isArray(note.likedBy) ? note.likedBy : [];
                  return (
                    <ShapedNoteCard
                      key={note.id}
                      note={note}
                      themeObj={themeObj}
                      hasLiked={likedBy.includes(currentUid)}
                      isMine={user && note.authorUid === user.uid}
                      isTeacherMode={isTeacherMode}
                      isCompactMatrix={true}
                      isSpotlightActive={idx === spotlightIndex}
                      onSelectCard={() => {
                        setSpotlightIndex(idx);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      onToggleLike={handleToggleLike}
                      onDelete={(id) => setDeleteConfirmId(id)}
                      formatTime={formatTime}
                      renderCardIcon={renderCardIcon}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 模式 B：「全部畫面呈現」直接展示全部 35+ 張卡片 */}
        {/* ========================================== */}
        {viewMode === 'all' && (
          <>
            {isLoading ? (
              <div className="py-24 flex flex-col items-center justify-center text-[#C2D4C8] font-extrabold">
                <Snowflake className="w-8 h-8 animate-spin text-[#C5A059] mb-3" />
                <p className="text-base tracking-wider">正在展開全班冬日祝福留言牆...</p>
              </div>
            ) : displayedNotes.length === 0 ? (
              <div className="my-12 max-w-lg mx-auto bg-[#16291F]/95 border-2 border-[#2E4B3A] rounded-2xl p-8 text-center shadow-xl font-bold">
                <div className="w-14 h-14 rounded-full bg-[#1F3729] border-2 border-[#385A46] flex items-center justify-center mx-auto mb-4 text-[#D4B475]">
                  <Gift className="w-7 h-7 stroke-[2]" />
                </div>
                <h3 className="text-xl font-serif font-extrabold text-[#FAF7F2] mb-2">
                  留言牆正等待第一張溫暖的祝福
                </h3>
                <p className="text-sm font-bold text-[#C2D4C8] leading-relaxed mb-6">
                  快來寫下第一張卡片，感謝這學期幫助過你的同學或老師，或是先載入全班 35 張溫馨範例卡片看看效果吧！
                </p>
                <button
                  onClick={handleReset35Demo}
                  className="px-5 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#D1AE68] text-[#122219] font-extrabold text-sm transition inline-flex items-center gap-2 shadow-md"
                >
                  <Layers className="w-4 h-4" />
                  載入 35 張全班範例祝福
                </button>
              </div>
            ) : (
              <div
                className={`grid items-stretch ${
                  isCompactAllGrid
                    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3.5'
                    : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 sm:gap-6'
                }`}
              >
                {displayedNotes.map((note) => {
                  const themeObj =
                    CARD_THEMES.find((t) => t.id === note.theme) || CARD_THEMES[0];
                  const currentUid = user ? user.uid : 'local-student';
                  const likedBy = Array.isArray(note.likedBy) ? note.likedBy : [];
                  const hasLiked = likedBy.includes(currentUid);
                  const isMine = user && note.authorUid === user.uid;

                  return (
                    <ShapedNoteCard
                      key={note.id}
                      note={note}
                      themeObj={themeObj}
                      hasLiked={hasLiked}
                      isMine={isMine}
                      isTeacherMode={isTeacherMode}
                      isCompactMatrix={isCompactAllGrid}
                      onSelectCard={(clickedNote) => setActiveLightboxNote(clickedNote)}
                      onToggleLike={handleToggleLike}
                      onDelete={(id) => setDeleteConfirmId(id)}
                      formatTime={formatTime}
                      renderCardIcon={renderCardIcon}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* ========================================== */}
      {/* 彈出視窗 0：點擊任一卡片放大檢視燈箱 (超大粗體投影燈箱) */}
      {/* ========================================== */}
      {activeLightboxNote && (
        <div
          onClick={() => setActiveLightboxNote(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-xl w-full relative animate-in fade-in zoom-in-95 duration-200 font-bold"
          >
            <button
              onClick={() => setActiveLightboxNote(null)}
              className="absolute -top-11 right-0 px-4 py-1.5 rounded-full bg-[#1F3729] border-2 border-[#385A46] text-xs sm:text-sm font-extrabold text-[#FAF7F2] hover:bg-[#284534] flex items-center gap-1.5 shadow-lg"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
              關閉放大檢視
            </button>
            <ShapedNoteCard
              note={activeLightboxNote}
              themeObj={
                CARD_THEMES.find((t) => t.id === activeLightboxNote.theme) ||
                CARD_THEMES[0]
              }
              hasLiked={
                Array.isArray(activeLightboxNote.likedBy) &&
                activeLightboxNote.likedBy.includes(user ? user.uid : 'local-student')
              }
              isMine={user && activeLightboxNote.authorUid === user.uid}
              isTeacherMode={isTeacherMode}
              isLargeStage={true}
              onToggleLike={(n) => {
                handleToggleLike(n);
                setActiveLightboxNote((prev) =>
                  prev ? { ...prev, likes: (prev.likes || 0) + 1 } : null
                );
              }}
              onDelete={(id) => {
                setActiveLightboxNote(null);
                setDeleteConfirmId(id);
              }}
              formatTime={formatTime}
              renderCardIcon={renderCardIcon}
            />
          </div>
        </div>
      )}

      {/* 右下角懸浮新增按鈕 */}
      <button
        onClick={() => setIsComposerOpen(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 z-30 px-5 py-3.5 rounded-full bg-[#C5A059] hover:bg-[#D1AE68] text-[#122219] font-extrabold text-sm shadow-2xl flex items-center gap-2 border-2 border-[#FAF7F2]/60 transition transform hover:scale-105"
      >
        <Sparkles className="w-4 h-4 stroke-[2.5]" />
        <span>寫一張祝福卡片</span>
      </button>

      {/* ========================================== */}
      {/* 彈出視窗 1：撰寫感恩與祝福卡片 */}
      {/* ========================================== */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-[#FAF7F2] text-[#2C3531] border border-[#E6DFD3] rounded-2xl max-w-4xl w-full p-5 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setIsComposerOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-[#6E7571] hover:bg-[#EFECE6] transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-[#1B3022] text-[#D4B475] flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-serif font-bold text-[#1B3022]">
                  挑選卡片造型・寫下冬日感恩與祝福
                </h2>
                <p className="text-xs text-[#6E7571]">
                  自由搭配喜歡的卡片輪廓、紙張色調與節慶印記，即時預覽您的專屬心意卡
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* 左欄：表單設定區 (佔 7 欄) */}
              <form onSubmit={handleCreateNote} className="lg:col-span-7 space-y-4">
                {/* 1. 選擇卡片形狀 (6 款北歐造型) */}
                <div>
                  <label className="block text-xs font-semibold text-[#49534D] mb-2">
                    1. 選擇卡片造型輪廓
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CARD_SHAPES.map((s) => {
                      const active = selectedShape === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedShape(s.id)}
                          className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 ${
                            active
                              ? 'bg-[#1B3022] text-[#FAF7F2] border-[#1B3022] shadow-sm'
                              : 'bg-white text-[#2C3531] border-[#DFD7C8] hover:bg-[#F3EFEA]'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              active ? 'bg-[#284533] text-[#D4B475]' : 'bg-[#F5F0E6] text-[#5E6862]'
                            }`}
                          >
                            <ShapeMiniSvg shapeId={s.id} className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate">{s.name}</div>
                            <div
                              className={`text-[10px] truncate ${
                                active ? 'text-[#B4C6B9]' : 'text-[#7A827D]'
                              }`}
                            >
                              {s.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. 給誰 與 分類 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#49534D] mb-1">
                      2. 給誰 (To)
                    </label>
                    <input
                      type="text"
                      value={toField}
                      onChange={(e) => setToField(e.target.value)}
                      placeholder="例如：全班同學、導師、坐在前面的小華..."
                      maxLength={30}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D8D0C5] text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#49534D] mb-1">
                      溫暖主題
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#D8D0C5] text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. 祝福內容 */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-[#49534D]">
                      3. 想說的話 (Message) <span className="text-[#8C3A3A]">*</span>
                    </label>
                    <span className="text-[11px] text-[#8C7A5B]">
                      {messageField.length} / 220 字
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    required
                    maxLength={220}
                    value={messageField}
                    onChange={(e) => setMessageField(e.target.value)}
                    placeholder="寫下這學期你想感謝他的事，或是溫暖的聖誕與歲末祝福..."
                    className="w-full p-3.5 rounded-xl bg-white border border-[#D8D0C5] text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                  />
                </div>

                {/* 4. 選擇卡片紙張色調 */}
                <div>
                  <label className="block text-xs font-semibold text-[#49534D] mb-2">
                    4. 選擇卡片紙張色調
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {CARD_THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setSelectedTheme(theme.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-2 transition ${
                          selectedTheme === theme.id
                            ? 'ring-2 ring-[#1B3022] border-[#1B3022] font-semibold'
                            : 'border-[#D8D0C5] opacity-75 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: theme.previewBg,
                          color: theme.id === 'midnight' ? '#FAF7F2' : '#2C3531'
                        }}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-current opacity-60" />
                        {theme.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. 選擇節慶小圖示 */}
                <div>
                  <label className="block text-xs font-semibold text-[#49534D] mb-2">
                    5. 點綴冬日小圖示
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {CARD_ICONS.map((item) => {
                      const IconComp = item.icon;
                      const active = selectedIcon === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedIcon(item.id)}
                          title={item.name}
                          className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition ${
                            active
                              ? 'bg-[#1B3022] text-[#D4B475] border-[#1B3022] shadow-sm'
                              : 'bg-white text-[#5E6862] border-[#E2DAD0] hover:bg-[#F3EFEA]'
                          }`}
                        >
                          <IconComp className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 署名與匿名開關 */}
                <div className="pt-2 border-t border-[#E6DFD3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-[#5E6862]">
                    署名將顯示為：
                    <strong className="text-[#1B3022] ml-1">
                      {isAnonymous
                        ? '溫暖的匿名同學'
                        : `${studentProfile.seatNumber ? studentProfile.seatNumber + '號 ' : ''}${
                            studentProfile.name
                          }`}
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition self-start sm:self-auto ${
                      isAnonymous
                        ? 'bg-[#8C3A3A]/10 border-[#8C3A3A] text-[#8C3A3A]'
                        : 'bg-white border-[#D8D0C5] text-[#5E6862]'
                    }`}
                  >
                    {isAnonymous ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        已設為匿名發佈
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        切換為匿名發佈
                      </>
                    )}
                  </button>
                </div>

                {/* 送出按鈕 */}
                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsComposerOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-medium text-[#5E6862] hover:bg-[#EFECE6] transition"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-[#1B3022] hover:bg-[#264231] text-[#FAF7F2] text-xs sm:text-sm font-medium shadow-md flex items-center gap-2 transition disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 text-[#D4B475]" />
                    {isSubmitting ? '正在釘上留言牆...' : '張貼造型祝福卡'}
                  </button>
                </div>
              </form>

              {/* 右欄：即時卡片造型預覽區 (佔 5 欄) */}
              <div className="lg:col-span-5 bg-[#16291F] rounded-2xl p-5 border border-[#2C4736] flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-[#A3B5A9] mb-3">
                  <span className="flex items-center gap-1.5 font-medium text-[#D4B475]">
                    <Sparkles className="w-3.5 h-3.5" />
                    卡片造型即時預覽
                  </span>
                  <span>
                    {(CARD_SHAPES.find((s) => s.id === selectedShape) || CARD_SHAPES[0]).name}
                  </span>
                </div>

                <div className="my-auto py-2">
                  <ShapedNoteCard
                    note={{
                      id: 'preview',
                      to: toField.trim() || '全班同學與師長',
                      message:
                        messageField.trim() ||
                        '在這個微涼的冬日季節裡，寫下一句真摯的感謝或祝福，送給身邊陪伴你的同學與老師...',
                      from: isAnonymous
                        ? '溫暖的匿名同學'
                        : `${studentProfile.seatNumber ? studentProfile.seatNumber + '號 ' : ''}${
                            studentProfile.name
                          }`,
                      shape: selectedShape,
                      theme: selectedTheme,
                      icon: selectedIcon,
                      category: selectedCategory,
                      createdAt: Date.now()
                    }}
                    themeObj={
                      CARD_THEMES.find((t) => t.id === selectedTheme) || CARD_THEMES[0]
                    }
                    hasLiked={false}
                    isMine={false}
                    isTeacherMode={false}
                    projectorMode={false}
                    onToggleLike={() => {}}
                    onDelete={() => {}}
                    formatTime={formatTime}
                    renderCardIcon={renderCardIcon}
                    isPreview={true}
                  />
                </div>

                <p className="text-[11px] text-[#8FA395] text-center mt-4">
                  ※ 實際張貼至留言牆後，卡片會帶有自然微幅手貼傾角效果
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 彈出視窗 2：修改學生姓名與座號 */}
      {/* ========================================== */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] text-[#2C3531] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#E6DFD3]">
            <h3 className="text-lg font-serif font-bold text-[#1B3022] mb-1">
              修改顯示名稱與座號
            </h3>
            <p className="text-xs text-[#6E7571] mb-4">
              修改後，您新張貼的卡片將會使用新的署名
            </p>
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#49534D] mb-1">
                  座號 (選填)
                </label>
                <input
                  type="text"
                  value={tempSeat}
                  onChange={(e) => setTempSeat(e.target.value)}
                  placeholder="例如：12"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#D8D0C5] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#49534D] mb-1">
                  姓名或暱稱
                </label>
                <input
                  type="text"
                  required
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#D8D0C5] text-sm"
                />
              </div>
              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingProfile(false);
                    setStudentProfile((prev) => ({ ...prev, hasLoggedIn: false }));
                  }}
                  className="text-xs text-[#8C3A3A] hover:underline"
                >
                  預覽學生登入迎賓頁
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 rounded-xl text-xs text-[#5E6862] hover:bg-[#EFECE6]"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs bg-[#1B3022] text-[#FAF7F2] flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    儲存更新
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 彈出視窗 3：教師管理模式解鎖 */}
      {/* ========================================== */}
      {showTeacherModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] text-[#2C3531] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#E6DFD3]">
            <div className="flex items-center gap-2 text-[#8C3A3A] mb-2">
              <Shield className="w-5 h-5" />
              <h3 className="text-lg font-serif font-bold text-[#1B3022]">
                開啟教師管理模式
              </h3>
            </div>
            <p className="text-xs text-[#5E6862] leading-relaxed mb-4">
              開啟後可協助管理或移除牆上不適當的留言。請輸入教師簡易通行碼（預設為聖誕節四碼數字 <code className="bg-[#EFECE6] px-1.5 py-0.5 rounded font-mono">1225</code>）：
            </p>
            <form onSubmit={handleTeacherUnlock} className="space-y-3">
              <input
                type="password"
                value={teacherPasscode}
                onChange={(e) => setTeacherPasscode(e.target.value)}
                placeholder="請輸入通行碼 (預設 1225)"
                autoFocus
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D8D0C5] text-sm focus:outline-none focus:ring-2 focus:ring-[#8C3A3A]"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowTeacherModal(false);
                    setTeacherPasscode('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs text-[#5E6862] hover:bg-[#EFECE6]"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs bg-[#8C3A3A] text-white font-medium"
                >
                  確認開啟
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 彈出視窗 4：刪除確認視窗 (不使用原生 confirm) */}
      {/* ========================================== */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] text-[#2C3531] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#E6DFD3]">
            <h3 className="text-base font-serif font-bold text-[#1B3022] mb-2">
              確定要移除這張祝福卡片嗎？
            </h3>
            <p className="text-xs text-[#5E6862] mb-5">
              移除後將無法復原，留言牆上的同學也將不再看到這則訊息。
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs text-[#5E6862] hover:bg-[#EFECE6]"
              >
                保留卡片
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs bg-[#8C3A3A] text-white font-medium"
              >
                確認移除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}