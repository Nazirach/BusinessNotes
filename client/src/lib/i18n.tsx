import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "en" | "id" | "zh-CN";

export const LOCALES: { code: Locale; label: string; nativeLabel: string }[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "id", label: "Indonesian", nativeLabel: "Bahasa Indonesia" },
  { code: "zh-CN", label: "Simplified Chinese", nativeLabel: "简体中文" },
];

const STORAGE_KEY = "businessnotes_locale";
const supportedLocales = new Set<Locale>(LOCALES.map(locale => locale.code));

const translations: Record<Locale, Record<string, string>> = {
  en: {},
  id: {
    "From information to opportunity": "Dari informasi menjadi peluang",
    "Home": "Beranda", "Discover": "Jelajahi", "News": "Berita", "Opportunity": "Peluang", "Companies": "Perusahaan", "People": "Orang", "Video": "Video", "Messages": "Pesan", "Notifications": "Notifikasi", "Profile": "Profil",
    "Sign in": "Masuk", "Your profile": "Profil Anda", "Search business, people, opportunity...": "Cari bisnis, orang, peluang...", "Language": "Bahasa", "Open menu": "Buka menu", "Toggle color theme": "Ganti tema warna",
    "Live business network": "Jaringan bisnis langsung", "Information that moves": "Informasi yang menggerakkan", "business forward.": "bisnis ke depan.", "Discover trusted insights, connect with the right people, and find opportunities built for your next move.": "Temukan wawasan tepercaya, terhubung dengan orang yang tepat, dan temukan peluang untuk langkah Anda berikutnya.", "Ask BusinessNotes AI": "Tanya AI BusinessNotes", "Create": "Buat",
    "Views": "Dilihat", "Reach": "Jangkauan", "Followers": "Pengikut", "Engagement": "Interaksi", "Interested": "Tertarik", "Leads": "Prospek", "Partners": "Mitra", "Your business pulse": "Denyut bisnis Anda", "new signals": "sinyal baru", "across topics you follow this week": "dari topik yang Anda ikuti minggu ini", "Explore signals": "Jelajahi sinyal", "Opportunity radar": "Radar peluang", "matches": "kecocokan", "with your professional interests": "dengan minat profesional Anda", "Network health": "Kesehatan jaringan", "Strong & growing": "Kuat & berkembang", "new connections this month": "koneksi baru bulan ini",
    "Live business feed": "Feed bisnis langsung", "Latest": "Terbaru", "All": "Semua", "Insight": "Wawasan", "Market": "Pasar", "Company": "Perusahaan", "Project": "Proyek", "Investment": "Investasi", "Trend": "Tren", "Follow": "Ikuti", "Following": "Mengikuti", "View opportunity": "Lihat peluang", "Source": "Sumber", "Verified": "Terverifikasi", "Report content": "Laporkan konten", "Load more signals": "Muat lebih banyak sinyal", "No signals found for": "Tidak ada sinyal untuk", "Try another topic, company, or opportunity type.": "Coba topik, perusahaan, atau jenis peluang lain.",
    "Name": "Nama", "Email": "Email", "Headline": "Judul", "Location": "Lokasi", "Bio": "Bio", "Topics": "Topik", "View all": "Lihat semua", "Dismiss onboarding": "Tutup onboarding", "Add your role and location.": "Tambahkan peran dan lokasi Anda.", "Tune your business signals.": "Sesuaikan sinyal bisnis Anda.", "See a relevant next move.": "Lihat langkah relevan berikutnya.", "Publish your first insight.": "Terbitkan wawasan pertama Anda.", "interested": "tertarik", "Create a post": "Buat postingan", "Create a article": "Buat artikel", "Create a opportunity": "Buat peluang", "Publish update": "Terbitkan pembaruan", "Add a thoughtful comment...": "Tambahkan komentar yang bermakna...", "Send": "Kirim", "Write something first": "Tulis sesuatu terlebih dahulu", "Articles need at least 40 characters": "Artikel membutuhkan sedikitnya 40 karakter", "Opportunity drafts need sector, location, partner, or capital context": "Draf peluang membutuhkan konteks sektor, lokasi, mitra, atau modal", "ready for review": "siap ditinjau",
    "Discover topics": "Jelajahi topik", "Follow a topic to make your network more relevant without closing you into a bubble.": "Ikuti topik agar jaringan Anda lebih relevan tanpa membatasi sudut pandang.", "Build your business profile": "Bangun profil bisnis Anda", "Help the right partners find you.": "Bantu mitra yang tepat menemukan Anda.", "Complete profile": "Lengkapi profil",
    "Welcome to BusinessNotes": "Selamat datang di BusinessNotes", "Make your first business move": "Buat langkah bisnis pertama Anda", "Complete a few quick steps so your feed, connections, and opportunity radar become more relevant.": "Selesaikan beberapa langkah singkat agar feed, koneksi, dan radar peluang Anda lebih relevan.", "Profile progress": "Kemajuan profil", "profile fields complete": "kolom profil selesai", "Complete your profile": "Lengkapi profil Anda", "Choose a topic": "Pilih topik", "Explore an opportunity": "Jelajahi peluang", "Share a signal": "Bagikan sinyal", "Open profile": "Buka profil", "Pick a topic": "Pilih topik", "View radar": "Lihat radar", "Create update": "Buat pembaruan",
    "Back to feed": "Kembali ke feed", "MVP module": "Modul MVP", "A focused view for finding context, connections, and next actions across the BusinessNotes network.": "Tampilan terfokus untuk menemukan konteks, koneksi, dan langkah berikutnya di jaringan BusinessNotes.", "Professional headline": "Judul profesional", "City or market": "Kota atau pasar", "Company or project": "Perusahaan atau proyek", "Short bio": "Bio singkat", "Profile completeness": "Kelengkapan profil", "Topics followed": "Topik diikuti", "Trust status": "Status kepercayaan", "Building": "Sedang dibangun", "Fresh signals": "Sinyal terbaru", "Relevant companies": "Perusahaan relevan", "Open opportunities": "Peluang terbuka", "Owner:": "Pemilik:", "Sector:": "Sektor:", "Value:": "Nilai:", "Stage:": "Tahap:", "Deadline:": "Batas waktu:", "Verification:": "Verifikasi:", "Evidence:": "Bukti:",
    "Trust & Safety": "Kepercayaan & Keamanan", "Privacy": "Privasi", "The Business Information Network": "Jaringan Informasi Bisnis", "Unified search": "Pencarian terpadu", "No entity matches yet. Try a company, person, sector, or opportunity name.": "Belum ada entitas yang cocok. Coba nama perusahaan, orang, sektor, atau peluang.",
    "Rewrite into a professional post": "Tulis ulang menjadi postingan profesional", "Create opportunity headlines": "Buat judul peluang", "Ask about content, market, or matching...": "Tanyakan tentang konten, pasar, atau pencocokan...", "Generate draft": "Buat draf", "Turn a business idea into a clearer story, a post, and a next action.": "Ubah ide bisnis menjadi cerita, postingan, dan langkah berikutnya yang lebih jelas.", "AI output separates facts, sources, analysis, and opinion. Always review before publishing.": "Output AI memisahkan fakta, sumber, analisis, dan opini. Selalu tinjau sebelum menerbitkan.",
  },
  "zh-CN": {
    "From information to opportunity": "从信息到机遇", "Home": "首页", "Discover": "探索", "News": "新闻", "Opportunity": "机会", "Companies": "企业", "People": "人物", "Video": "视频", "Messages": "消息", "Notifications": "通知", "Profile": "个人资料",
    "Sign in": "登录", "Your profile": "你的个人资料", "Search business, people, opportunity...": "搜索企业、人物或机会…", "Language": "语言", "Open menu": "打开菜单", "Toggle color theme": "切换主题", "Live business network": "实时商业网络", "Information that moves": "推动业务前进的", "business forward.": "信息。", "Discover trusted insights, connect with the right people, and find opportunities built for your next move.": "发现可信洞察，连接合适的人，寻找下一步机会。", "Ask BusinessNotes AI": "咨询 BusinessNotes AI", "Create": "创建",
    "Views": "浏览", "Reach": "触达", "Followers": "关注者", "Engagement": "互动", "Interested": "感兴趣", "Leads": "潜在客户", "Partners": "合作伙伴", "Your business pulse": "你的业务脉搏", "new signals": "条新信号", "Explore signals": "探索信号", "Opportunity radar": "机会雷达", "matches": "个匹配", "Network health": "网络健康", "Strong & growing": "强劲增长", "Live business feed": "实时商业动态", "Latest": "最新", "All": "全部", "Insight": "洞察", "Market": "市场", "Company": "企业", "Project": "项目", "Investment": "投资", "Trend": "趋势", "Follow": "关注", "Following": "已关注", "View opportunity": "查看机会", "Source": "来源", "Verified": "已验证", "Report content": "举报内容", "Load more signals": "加载更多动态", "No signals found for": "未找到相关动态", "Try another topic, company, or opportunity type.": "请尝试其他主题、企业或机会类型。",
    "Name": "姓名", "Email": "邮箱", "Headline": "头衔", "Location": "地点", "Bio": "简介", "Topics": "主题", "Complete your profile": "完善你的资料", "Choose a topic": "选择主题", "Explore an opportunity": "探索一个机会", "Share a signal": "分享一条动态", "Open profile": "打开资料", "View all": "查看全部", "Dismiss onboarding": "关闭引导", "Add your role and location.": "添加你的职位和地点。", "Tune your business signals.": "调整你的商业动态。", "See a relevant next move.": "查看相关的下一步行动。", "Publish your first insight.": "发布你的第一条洞察。", "interested": "感兴趣", "Create a post": "创建帖子", "Create a article": "创建文章", "Create a opportunity": "创建机会", "Publish update": "发布更新", "Add a thoughtful comment...": "添加有价值的评论…", "Send": "发送", "Write something first": "请先输入内容", "Articles need at least 40 characters": "文章至少需要 40 个字符", "Discover topics": "探索主题", "Build your business profile": "完善你的商业资料", "Help the right partners find you.": "让合适的合作伙伴找到你。", "Complete profile": "完善资料",
    "Welcome to BusinessNotes": "欢迎使用 BusinessNotes", "Make your first business move": "迈出你的第一步商业行动", "Complete a few quick steps so your feed, connections, and opportunity radar become more relevant.": "完成几个简单步骤，让动态、连接和机会雷达更贴合你的需求。", "Profile progress": "资料进度", "profile fields complete": "个资料字段已完成",  "Pick a topic": "选择主题", "View radar": "查看雷达", "Create update": "创建更新", "Back to feed": "返回动态", "MVP module": "MVP 模块", "Professional headline": "职业头衔", "City or market": "城市或市场", "Company or project": "企业或项目", "Short bio": "个人简介", "Profile completeness": "资料完整度", "Topics followed": "关注的主题", "Trust status": "信任状态", "Building": "建设中", "Fresh signals": "最新信号", "Relevant companies": "相关企业", "Open opportunities": "开放机会", "Trust & Safety": "信任与安全", "Privacy": "隐私", "The Business Information Network": "商业信息网络", "Unified search": "统一搜索", "No entity matches yet. Try a company, person, sector, or opportunity name.": "暂未找到匹配实体。请尝试企业、人物、行业或机会名称。", "Rewrite into a professional post": "改写为专业帖子", "Create opportunity headlines": "创建机会标题", "Ask about content, market, or matching...": "询问内容、市场或匹配…", "Generate draft": "生成草稿", "Turn a business idea into a clearer story, a post, and a next action.": "将商业想法转化为更清晰的故事、帖子和下一步行动。", "AI output separates facts, sources, analysis, and opinion. Always review before publishing.": "AI 输出会区分事实、来源、分析和观点。发布前请务必审核。",
  },
};

export const REQUIRED_TRANSLATION_KEYS = ["Home", "Discover", "Opportunity", "Profile", "Language", "Welcome to BusinessNotes", "Opportunity radar"] as const;

export function getStoredLocale(storage: Pick<Storage, "getItem"> | null | undefined): Locale | null {
  try {
    const stored = storage?.getItem(STORAGE_KEY);
    return stored ? normalizeLocale(stored) : null;
  } catch { return null; }
}

export function getMissingTranslationKeys(locale: Locale) {
  return REQUIRED_TRANSLATION_KEYS.filter(key => locale !== "en" && !translations[locale][key]);
}

export function normalizeLocale(value: string | null | undefined): Locale {
  if (value && supportedLocales.has(value as Locale)) return value as Locale;
  if (value?.toLowerCase().startsWith("zh")) return "zh-CN";
  if (value?.toLowerCase().startsWith("id")) return "id";
  return "en";
}

export function translateForLocale(locale: Locale, key: string, variables?: Record<string, string | number>) {
  return interpolate(translations[locale][key] ?? translations.en[key] ?? key, variables);
}

function detectLocale(): Locale {
  try {
    const requested = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("lang") : null;
    if (requested) return normalizeLocale(requested);

    const stored = getStoredLocale(localStorage);
    if (stored) return stored;
  } catch { /* localStorage may be unavailable */ }
  const candidates = typeof navigator !== "undefined" ? navigator.languages : [];
  if (candidates.some(language => language.toLowerCase().startsWith("zh"))) return "zh-CN";
  if (candidates.some(language => language.toLowerCase().startsWith("id"))) return "id";
  return "en";
}

function interpolate(value: string, variables?: Record<string, string | number>) {
  if (!variables) return value;
  return Object.entries(variables).reduce((result, [key, replacement]) => result.replaceAll(`{{${key}}}`, String(replacement)), value);
}

const LocaleContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void; t: (key: string, variables?: Record<string, string | number>) => string; formatNumber: (value: number) => string; formatDate: (value: Date | number) => string }>({
  locale: "en", setLocale: () => undefined, t: key => key, formatNumber: value => String(value), formatDate: value => new Date(value).toLocaleDateString("en-US"),
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);
  const setLocale = (next: Locale) => { setLocaleState(next); try { localStorage.setItem(STORAGE_KEY, next); } catch { /* best effort */ } };
  useEffect(() => { document.documentElement.lang = locale; document.title = locale === "en" ? "BusinessNotes" : `BusinessNotes · ${LOCALES.find(item => item.code === locale)?.nativeLabel}`; }, [locale]);
  const value = useMemo(() => ({ locale, setLocale, t: (key: string, variables?: Record<string, string | number>) => translateForLocale(locale, key, variables), formatNumber: (number: number) => new Intl.NumberFormat(locale).format(number), formatDate: (date: Date | number) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(new Date(date)) }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() { return useContext(LocaleContext); }
export function getTranslationKeys() { return Array.from(new Set(Object.values(translations).flatMap(resource => Object.keys(resource)))); }
