const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

(async () => {
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  const waitUntilTargetTime = async (waitMs) => {
    const now = new Date();
    const target = new Date(now);
    target.setUTCHours(6);
    target.setUTCMinutes(0);
    target.setUTCSeconds(0);
    target.setUTCMilliseconds(0);

    const timeToWait = target.getTime() - now.getTime() - 60000; // قبل 60 ثانية
    if (timeToWait > 0) {
      console.log(`Waiting ${timeToWait / 1000} seconds until 5:59:00 UTC`);
      await sleep(timeToWait - waitMs);
    }
  };

  //await waitUntilTargetTime(20000); // الانتظار حتى قبل 20 ثانية من الوقت المستهدف
  const start = performance.now();

  const userDataDir = path.join(__dirname, "tmp_user_data");

  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  fs.mkdirSync(userDataDir);

  const browser = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
  });

  const page = await browser.newPage();

  const navigationStart = Date.now();
  await page.goto("https://egy.almaviva-visa.it/");
  console.log(`Navigation time: ${Date.now() - navigationStart} ms`);

  await page.waitForSelector(
    ".bg-visa-primary-500.text-white.flex.p-2.rounded-md",
    { visible: true }
  );
  await page.click(".bg-visa-primary-500.text-white.flex.p-2.rounded-md");

  await page.waitForSelector("input#kc-login");
  await page.getByLabel("Email").fill("Karim2001");
  await page.getByLabel("Password").fill("Ukt@1234");
  await page.click("input#kc-login");

  try {
    await page.waitForSelector('a:has-text("Book")', { timeout: 5000 });
    await page.click('a:has-text("Book")');
  } catch (error) {
    console.error("Failed to find or click 'Book', retrying...");
    await page.waitForSelector('a:has-text("Book")', { timeout: 5000 });
    await page.click('a:has-text("Book")');
  }

  await page.waitForSelector('mat-select[formcontrolname="officeId"]');
  await page.click('mat-select[formcontrolname="officeId"]');
  await page.waitForSelector("mat-option");
  await page.click("mat-option:nth-child(2)");

  await page.waitForSelector('mat-select[formcontrolname="idServiceLevel"]');
  await page.click('mat-select[formcontrolname="idServiceLevel"]');
  await page.waitForSelector("mat-option");
  await page.click("mat-option:nth-child(1)");

  await page.waitForSelector("mat-select#mat-select-2");
  await page.click("mat-select#mat-select-2");
  await page.waitForSelector("mat-option");
  await page.click("mat-option:nth-child(7)");

  await page.waitForSelector('input[formcontrolname="tripDate"]');
  await page.click('input[formcontrolname="tripDate"]');

  await page.waitForSelector(".cdk-overlay-connected-position-bounding-box");

  const nextButtons = await page.$$(
    "button.mat-calendar-next-button.mdc-icon-button.mat-mdc-icon-button.mat-unthemed.mat-mdc-button-base"
  );
  if (nextButtons.length > 0) {
    await nextButtons[1].click();
  } else {
    console.error("العنصر المطلوب غير موجود");
  }

  await page.waitForSelector(
    'button.mat-calendar-body-cell[aria-label="15 August 2024"]:not([aria-disabled="true"])'
  );
  await page.click(
    'button.mat-calendar-body-cell[aria-label="15 August 2024"]:not([aria-disabled="true"])'
  );

  await page.waitForSelector('input[formcontrolname="tripDestination"]');
  await page.fill('input[formcontrolname="tripDestination"]', "Italy");

  await page.waitForSelector(".mdc-checkbox__native-control");
  await page.check(".mdc-checkbox__native-control");

  await page.waitForSelector("#mat-mdc-checkbox-2-input");
  await page.check("#mat-mdc-checkbox-2-input");

  await page.waitForSelector('button:has-text("Check availability")');

  const formatTime = (date) => {
    const pad = (num, size = 2) => ("000" + num).slice(size * -1);
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
      date.getSeconds()
    )}.${pad(date.getMilliseconds(), 3)}`;
  };

  const logRequestTime = (label, time,data) => {
    console.log(`${label}: ${formatTime(time)}`,data);
  };

  const sendRequest = async (url, headers, params, label) => {
    const requestTime = new Date();
    logRequestTime(`${label} Sent`, requestTime);

    let response;
    try {
      response = await axios.get(url, { headers, params });
    } catch (error) {
      console.error(`Error in ${label}:`, error);
      return;
    }

    const responseTime = new Date();
    logRequestTime(
      `${label} Received`,
      responseTime,
      ` data : ${response.data}`
    );

    const elapsedTime = responseTime - requestTime;
    console.log(`${label} Time: ${elapsedTime} ms`);
  };

  const scheduleRequests = async (url, headers, params) => {
    const now = new Date();
    const target = new Date(now);
    target.setUTCHours(5);
    target.setUTCMinutes(22);
    target.setUTCSeconds(0);
    target.setUTCMilliseconds(0);

    const scheduleTimes = [
      target.getTime() - 500,
      target.getTime() - 300,
      target.getTime() - 200,
      target.getTime() - 100,
      target.getTime() - 50,
      target.getTime(),
    ];

    for (let i = 0; i < scheduleTimes.length; i++) {
      const delay = scheduleTimes[i] - now.getTime();
      if (delay > 0) {
        setTimeout(() => {
          sendRequest(url, headers, params, `Request ${i + 1}`);
        }, delay);
      } else {
        sendRequest(url, headers, params, `Request ${i + 1}`);
      }
    }
  };

  page.on("request", async (request) => {
    if (request.method() === "GET") {
      console.log("Request made:");
      console.log("URL:", request.url());
      console.log("Method:", request.method());
      console.log("Headers:", request.headers());
      console.log("Post Data:", request.postData());

      const url = request.url();
      const headers = request.headers();

      const params = {
        officeId: 1,
        visaId: 3,
        serviceLevelId: 1,
      };

      await scheduleRequests(url, headers, params);
    }
  });

  const now = new Date();
  const targetClickTime = new Date(now);
  targetClickTime.setUTCHours(5);
  targetClickTime.setUTCMinutes(22);
  targetClickTime.setUTCSeconds(0);
  targetClickTime.setUTCMilliseconds(0);

  const clickDelay = targetClickTime.getTime() - now.getTime() - 1000; // قبل ثانية واحدة
  if (clickDelay > 0) {
    setTimeout(async () => {
      const beforeClick = performance.now();
      await page.click('button:has-text("Check availability")');
      const duration = performance.now() - beforeClick;

      const [response] = await Promise.all([
        page.waitForResponse(
          (response) =>
            response
              .url()
              .includes("/reservation-manager/api/planning/v1/checks") &&
            response.status() === 200
        ),
      ]);
      const res = await response.json();
      const afterResponse = performance.now();
      const responseTime = afterResponse - beforeClick;
      console.log(
        `Response time: ${responseTime.toFixed(2)} ms`,
        duration,
        res
      );
    }, clickDelay);
  }
})();
