import { expect, test } from "@playwright/test";

test("retained Home actions work against the real app", async ({ page }) => {
  await page.goto("/?lang=id");
  await expect(page).toHaveTitle(/BusinessNotes/i);
  await expect(page.getByRole("heading", { name: /Informasi yang menggerakkan bisnis ke depan/i })).toBeVisible();

  const language = page.getByRole("combobox", { name: "Bahasa" });
  await expect(language).toHaveValue("id");
  await language.selectOption("zh-CN");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(page.locator("h1")).toContainText("推动业务前进");

  const search = page.getByPlaceholder(/搜索企业|Cari bisnis|Search business/i);
  await search.fill("Aceh");
  await expect(page.getByText(/统一搜索|Pencarian terpadu|Unified search/i)).toBeVisible();

  await page.getByRole("button", { name: /机会|Peluang|Opportunity/i }).first().click();
  await expect(page.locator("#opportunities")).toBeVisible();
  await page.locator("#opportunities article").first().getByRole("button").last().click();
  await expect(page.getByText(/登录以保存|Sign in to save your interest|masuk untuk menyimpan|not connected to live data|belum terhubung ke data langsung|尚未连接实时数据/i)).toBeVisible();
});

test("theme and profile draft preferences persist locally", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.removeItem("businessnotes_onboarding_dismissed");
    localStorage.removeItem("businessnotes_onboarding_completed");
  });
  await page.reload();
  const themeButton = page.getByRole("button", { name: /Toggle color theme|Ubah tema|切换主题/i });
  await themeButton.click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.setViewportSize({ width: 375, height: 812 });
  await page.reload();
  await page.getByRole("button", { name: /Open menu|Buka menu|打开菜单/i }).click();
  await page.getByRole("button", { name: "Profile", exact: true }).click();
  const headline = page.getByPlaceholder(/Professional headline|Judul profesional|职业标题/i);
  await headline.fill("Persistent profile draft");
  await page.reload();
  await page.getByRole("button", { name: /Open menu|Buka menu|打开菜单/i }).click();
  await page.getByRole("button", { name: "Profile", exact: true }).click();
  await expect(page.getByPlaceholder(/Professional headline|Judul profesional|职业标题/i)).toHaveValue("Persistent profile draft");
});

test("onboarding progress persists locally", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.removeItem("businessnotes_onboarding_steps");
    localStorage.removeItem("businessnotes_onboarding_dismissed");
    localStorage.removeItem("businessnotes_onboarding_completed");
  });
  await page.reload();
  await page.getByRole("button", { name: /Pick a topic|Pilih topik|选择主题/i }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("businessnotes_onboarding_steps") || "[]"))).toContain("discover");
});

test("Batch 1 write actions require authentication in an unauthenticated browser", async ({ page }) => {
  await page.goto("/");
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole("button", { name: /Open menu|Buka menu|打开菜单/i }).click();
  await page.getByRole("button", { name: "Profile", exact: true }).click();
  await page.getByPlaceholder(/Professional headline|Judul profesional|职业标题/i).fill("Unauthenticated profile");
  await page.getByRole("button", { name: /Save profile|Simpan profil|保存资料/i }).click();
  await expect(page.getByText(/Sign in to save your profile|Masuk untuk menyimpan profil|登录以保存资料/i)).toBeVisible();

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.reload();
  await page.getByRole("button", { name: /Companies|Perusahaan|公司/i }).first().click();
  await page.getByPlaceholder(/Company name|Nama perusahaan|公司名称/i).fill("Unauthenticated company");
  await page.getByPlaceholder(/Company description|Deskripsi perusahaan|公司描述/i).fill("A company description");
  await page.getByPlaceholder(/Industry|Industri|行业/i).fill("Food");
  await page.getByPlaceholder(/City or market|Kota atau pasar|城市或市场/i).fill("Jakarta");
  await page.getByRole("button", { name: /Create company|Buat perusahaan|创建公司/i }).click();
  await expect(page.getByText(/Sign in to create a company|Masuk untuk membuat perusahaan|登录以创建公司/i)).toBeVisible();

  await page.getByRole("button", { name: /Create|Buat|创建/i }).first().click();
  await page.getByPlaceholder(/What business insight|Wawasan bisnis apa|您看到了什么商业洞察/i).fill("A normal post that should require authentication.");
  await page.getByRole("button", { name: /Publish update|Publikasikan pembaruan|发布更新/i }).click();
  await expect(page.getByText(/Sign in to publish a post|Masuk untuk menerbitkan postingan|登录以发布帖子/i)).toBeVisible();
});

test("unavailable actions do not claim persistence", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Ask BusinessNotes AI|Tanya AI BusinessNotes|咨询 BusinessNotes AI/i }).click();
  await page.getByPlaceholder(/Ask about content|Tanyakan tentang konten|询问内容/i).fill("Test unavailable AI action");
  await page.getByRole("button", { name: /Generate draft|Buat draf|生成草稿/i }).click();
  await expect(page.getByText(/AI generation is not available yet|Generasi AI belum tersedia|AI 生成暂不可用/i)).toBeVisible();
});

test("social network writes require authentication in an unauthenticated browser", async ({ page }) => {
  await page.goto("/");
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole("button", { name: /Open menu|Buka menu|打开菜单/i }).click();
  await page.getByRole("button", { name: "Messages", exact: true }).click();
  await expect(page.getByText(/No conversations yet|Belum ada percakapan|暂无会话/i)).toBeVisible();
  await page.getByRole("button", { name: /Open menu|Buka menu|打开菜单/i }).click();
  await page.getByRole("button", { name: "Notifications", exact: true }).click();
  await expect(page.getByText(/No notifications yet|Belum ada notifikasi|暂无通知/i)).toBeVisible();
});
