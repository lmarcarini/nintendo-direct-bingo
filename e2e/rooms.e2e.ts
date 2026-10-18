import { expect, test, type Browser, type Page } from "@playwright/test";

const SERVER = /localhost:8080/;

// A room name per test, so tests running in parallel don't meet
const roomName = () => `e2e-${Math.random().toString(36).slice(2, 10)}`;

const square = (page: Page, n: number) => page.locator(".bingo-input").nth(n - 1);

// A new player (own browser context) in `room`, by invitation link or by
// filling in the form on a fresh card
const player = async (browser: Browser, name: string, room: string, invited = false) => {
  const page = await (await browser.newContext()).newPage();
  await page.goto(invited ? `/?room=${room}` : "/");
  if (!invited) {
    await page.getByText("Play together").click();
    await page.getByLabel("Room name").fill(room);
  }
  await page.getByLabel("Your name").fill(name);
  await page.getByRole("button", { name: "Join room" }).click();
  await expect(page.getByText(`In room ${room}`)).toBeVisible();
  return page;
};

const type = async (page: Page, n: number, text: string) => {
  await square(page, n).click();
  await page.keyboard.press("Control+End");
  await page.keyboard.type(text);
};

test("players share the card, its text and its marks", async ({ browser }) => {
  const room = roomName();
  const ana = await player(browser, "Ana", room);
  await type(ana, 1, "Zelda");
  await ana.getByRole("heading").click(); // done editing square 1

  const leo = await player(browser, "Leo", room, true);
  await expect(square(leo, 1)).toHaveText("Zelda");
  await expect(leo.getByRole("listitem")).toHaveText(["Ana", "Leo (you)"]);

  await ana.getByRole("button", { name: "View" }).click();
  await square(ana, 1).click();
  await expect(square(leo, 1)).toHaveClass(/bingo-input--marked/);

  // Settings are shared; view mode isn't
  await leo.getByText("Card options").click();
  await leo.getByText("5 × 5").click();
  await expect(ana.locator(".bingo-input")).toHaveCount(25);
  await expect(leo.getByRole("textbox", { name: "Square 1", exact: true })).toBeVisible();
});

test("a square someone is editing is locked for everyone else", async ({ browser }) => {
  const room = roomName();
  const ana = await player(browser, "Ana", room);
  const leo = await player(browser, "Leo", room, true);

  await type(ana, 2, "Mario");
  await expect(square(leo, 2)).toHaveAttribute("data-editor", "Ana");
  await expect(square(leo, 2)).toHaveAttribute("contenteditable", "false");
  await expect(square(leo, 2)).toHaveText("Mario");

  await ana.getByRole("heading").click();
  await expect(square(leo, 2)).not.toHaveAttribute("data-editor");
  await type(leo, 2, " Kart");
  await expect(square(ana, 2)).toHaveText("Mario Kart");
});

test("a dropped connection reconnects and catches up", async ({ browser }) => {
  const room = roomName();
  const ana = await player(browser, "Ana", room);

  const leo = await (await browser.newContext()).newPage();
  const sockets: { close: () => Promise<void> }[] = [];
  await leo.routeWebSocket(SERVER, (ws) => {
    ws.connectToServer();
    sockets.push(ws);
  });
  await leo.goto(`/?room=${room}`);
  await leo.getByLabel("Your name").fill("Leo");
  await leo.getByRole("button", { name: "Join room" }).click();
  await expect(leo.getByText(`In room ${room}`)).toBeVisible();

  await sockets[0].close();
  await expect(leo.getByText(/reconnecting/)).toBeVisible();
  await expect(leo.getByText(`In room ${room}`)).toBeVisible();

  await ana.getByRole("button", { name: "View" }).click();
  await square(ana, 3).click();
  await expect(square(leo, 3)).toHaveClass(/bingo-input--marked/);
});

test("the card keeps working when the room server can't be reached", async ({ page }) => {
  await page.routeWebSocket(SERVER, (ws) => ws.close());
  await page.goto("/");
  await page.getByText("Play together").click();
  await page.getByLabel("Your name").fill("Ana");
  await page.getByRole("button", { name: "Join room" }).click();
  await expect(page.getByText(/Connecting/)).toBeVisible();

  await type(page, 1, "Zelda");
  await page.getByRole("button", { name: "View" }).click();
  await square(page, 1).click();
  await expect(square(page, 1)).toHaveClass(/bingo-input--marked/);
  // Still saved to the link
  await expect(page).toHaveURL(/[?&]c=/);
  await expect(page.getByText(/Connecting/)).toBeVisible();
});

test("Clear keeps the square someone else is typing in", async ({ browser }) => {
  const room = roomName();
  const ana = await player(browser, "Ana", room);
  const leo = await player(browser, "Leo", room, true);
  await type(ana, 1, "Zelda");
  await ana.getByRole("heading").click();
  await type(leo, 2, "Metroid"); // and still typing

  ana.once("dialog", (dialog) => dialog.accept());
  await expect(square(ana, 2)).toHaveText("Metroid");
  await ana.getByRole("button", { name: "Clear", exact: true }).click();
  for (const page of [ana, leo]) {
    await expect(square(page, 1)).toHaveText("");
    await expect(square(page, 2)).toHaveText("Metroid");
  }
});

test("an emptied title goes back to the default for everyone", async ({ browser }) => {
  const room = roomName();
  const ana = await player(browser, "Ana", room);
  const leo = await player(browser, "Leo", room, true);
  const title = (page: Page) => page.getByRole("heading");

  await title(ana).click();
  await ana.keyboard.press("Control+A");
  await ana.keyboard.type("Big Direct");
  await expect(title(leo)).toHaveText("Big Direct");
  await ana.keyboard.press("Control+A");
  await ana.keyboard.press("Backspace");
  await ana.keyboard.press("Enter"); // blurs
  for (const page of [ana, leo])
    await expect(title(page)).toHaveText("Nintendo Direct Bingo");
});
