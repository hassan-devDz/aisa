// Access Server Web UIs are available here:
// Admin  UI: https://38.180.22.2:943/admin
// Client UI: https://38.180.22.2:943/
// To login please use the "openvpn" account with "zIoFlc2lZlCE" password.
// (password can be changed on Admin UI)
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { Telegraf } = require("telegraf");


(async () => {
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  // انتظار حتى الساعة 6:00:00 بتوقيت UTC (غرينتش)
  const waitUntilTargetTime = async (waitMs) => {
    const now = new Date();
    const target = new Date(now);
    target.setUTCHours(6);
    target.setUTCMinutes(0);
    target.setUTCSeconds(0);
    target.setUTCMilliseconds(0);

    const timeToWait = target.getTime() - now.getTime();
    if (timeToWait > 0) {
      console.log(`Waiting ${timeToWait / 1000} seconds until 6:00:00 UTC`);
      console.log(timeToWait);
      await sleep(timeToWait - waitMs); // الانتظار حتى 20 ثانية قبل 6:00:00
    }
  };

  await waitUntilTargetTime(20000);

  // انتظار حتى يتبقى 30 مللي ثانية
  const waitForLastMilliseconds = async () => {
    const targetTime = 30; // 30 مللي ثانية
    const now = new Date();
    const remainingMilliseconds =
      60000 - (now.getSeconds() * 1000 + now.getMilliseconds());
    const timeToWait = remainingMilliseconds - targetTime;
    if (timeToWait > 0) {
      await sleep(timeToWait);
    }
  };

  const start = performance.now();
  const userDataDir = path.join(__dirname, "tmp_user_data");

  // حذف جميع الملفات والمجلدات داخل userDataDir
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  // إعادة إنشاء المجلد المؤقت
  fs.mkdirSync(userDataDir);

  // تشغيل المتصفح مع بيانات المستخدم المؤقتة
  const browser = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
  });

  // إنشاء صفحة جديدة
  const page = await browser.newPage();

  // قياس وقت الانتقال إلى الصفحة
  const navigationStart = Date.now();
  await page.goto("https://egy.almaviva-visa.it/");
  console.log(`Navigation time: ${Date.now() - navigationStart} ms`);


  // انتظار ظهور الزر "المتابعة" والنقر عليه
  await page.waitForSelector(
    ".bg-visa-primary-500.text-white.flex.p-2.rounded-md",
    { visible: true }
  );
  await page.click(".bg-visa-primary-500.text-white.flex.p-2.rounded-md");

  // ملء حقول تسجيل الدخول والنقر على زر تسجيل الدخول
  await page.waitForSelector("input#kc-login");
  await page.getByLabel("Email").fill("Karim2001");
  await page.getByLabel("Password").fill("Ukt@1234");
  await page.click("input#kc-login");

  // انتظار حتى يظهر رابط "Book"
  try {
    await page.waitForSelector('a:has-text("Book")', { timeout: 5000 });
    await page.click('a:has-text("Book")');
  } catch (error) {
    console.error("Failed to find or click 'Book', retrying...");
    await page.waitForSelector('a:has-text("Book")', { timeout: 5000 });
    await page.click('a:has-text("Book")');
  }

  // التعامل مع عنصر <mat-select> لاختيار المكتب
  await page.waitForSelector('mat-select[formcontrolname="officeId"]');
  await page.click('mat-select[formcontrolname="officeId"]');
  await page.waitForSelector("mat-option");
  await page.click("mat-option:nth-child(2)"); //cairo

  // التعامل مع العنصر الثاني <mat-select>
  await page.waitForSelector('mat-select[formcontrolname="idServiceLevel"]');
  await page.click('mat-select[formcontrolname="idServiceLevel"]');
  await page.waitForSelector("mat-option");
  await page.click("mat-option:nth-child(1)");

  // التعامل مع عنصر <mat-select> لاختيار نوع الفيزا
  await page.waitForSelector("mat-select#mat-select-2");
  await page.click("mat-select#mat-select-2");
  await page.waitForSelector("mat-option");
  await page.click("mat-option:nth-child(17)");

  // التعامل مع عنصر إدخال التاريخ
  await page.waitForSelector('input[formcontrolname="tripDate"]');
  await page.click('input[formcontrolname="tripDate"]');

  // الانتظار حتى تظهر نافذة التقويم
  await page.waitForSelector(".cdk-overlay-connected-position-bounding-box");

  // النقر على زر "التالي" للتقويم
  const nextButtons = await page.$$(
    "button.mat-calendar-next-button.mdc-icon-button.mat-mdc-icon-button.mat-unthemed.mat-mdc-button-base"
  );
  if (nextButtons.length > 0) {
    await nextButtons[1].click();
  } else {
    console.error("العنصر المطلوب غير موجود");
  }

  // انتظار عنصر التاريخ المطلوب والنقر عليه
  await page.waitForSelector(
    'button.mat-calendar-body-cell[aria-label="15 July 2024"]:not([aria-disabled="true"])'
  );
  await page.click(
    'button.mat-calendar-body-cell[aria-label="15 July 2024"]:not([aria-disabled="true"])'
  );

  // ملء حقل الوجهة بكلمة "Italy"
  await page.waitForSelector('input[formcontrolname="tripDestination"]');
  await page.fill('input[formcontrolname="tripDestination"]', "Italy");

  // تحديد الـ checkbox
  await page.waitForSelector(".mdc-checkbox__native-control");
  await page.check(".mdc-checkbox__native-control");

  // انتظار ظهور زر "Check availability" والنقر عليه
  await page.waitForSelector('button:has-text("Check availability")');

  // // بدء الاستماع للطلبات بعد النقر على الزر
  // page.on("request", (request) => {
  //   console.log(
  //     "Request made:",
  //     request.url(),
  //     request.method(),
  //     request.postData()
  //   );
  // });

  // قياس الزمن قبل النقر على زر "Check availability"
  const beforeClick = performance.now();
  await waitUntilTargetTime(100);



  await page.click('button:has-text("Check availability")');
  const duration = performance.now() - start;

  // قياس الزمن بعد استلام الرد
  const afterResponse1 = performance.now();
  const responseTime1 = afterResponse1 - beforeClick;
  console.log(`Response time0: ${responseTime1.toFixed(2)} ms`);
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
  // قياس الزمن بعد استلام الرد
  const afterResponse = performance.now();
  const responseTime = afterResponse - beforeClick;
  console.log(`Response time: ${responseTime.toFixed(2)} ms`, duration, res);

  // // جمع الكوكيز بعد النقر على الزر
  // const cookies = await page.context().cookies();

  // // كتابة المعلومات الملتقطة إلى ملف JSON
  // fs.writeFileSync(
  //   "network-requests3.json",
  //   JSON.stringify({ requests, responses, cookies }, null, 2)
  // );

  // إغلاق المتصفح
  //await browser.close();
})();
// // توكن بوت تلغرام الخاص بك
// const token = "7280194518:AAHg1RbX7kNQRr5--Ktu1UsJEh3Hrqnz7Qs";

// // إنشاء بوت تلغرام
// const bot = new Telegraf(token);

// // حالات تتبع التفاعل مع المستخدم
// const states = {
//   IDLE: "IDLE",
//   WAITING_FOR_EMAIL: "WAITING_FOR_EMAIL",
//   WAITING_FOR_PASSWORD: "WAITING_FOR_PASSWORD",
// };

// // متغيرات لتخزين بيانات المستخدم
// let currentState = states.IDLE;
// let userEmail = "";
// let userPassword = "";

// const email="Karim2001";
// const password = "Ukt@1234"

// console.log(userEmail, userPassword);

// // الدالة الرئيسية التي تحتوي على الكود الأصلي
// async function runScript(email , password , ctx) {
//   const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
//   console.log(userEmail, userPassword);
//   // انتظار حتى الساعة 6:00:00 بتوقيت UTC (غرينتش)
//   const waitUntilTargetTime = async (waitMs) => {
//     const now = new Date();
//     const target = new Date(now);
//     target.setUTCHours(6);
//     target.setUTCMinutes(0);
//     target.setUTCSeconds(0);
//     target.setUTCMilliseconds(0);

//     const timeToWait = target.getTime() - now.getTime();
//     if (timeToWait > 0) {
//       console.log(`Waiting ${timeToWait / 1000} seconds until 6:00:00 UTC`);
//       console.log(timeToWait);
//       await sleep(timeToWait - waitMs); // الانتظار حتى 20 ثانية قبل 6:00:00
//     }
//   };

//   await waitUntilTargetTime(20000);

//   // انتظار حتى يتبقى 30 مللي ثانية
//   const waitForLastMilliseconds = async () => {
//     const targetTime = 30; // 30 مللي ثانية
//     const now = new Date();
//     const remainingMilliseconds =
//       60000 - (now.getSeconds() * 1000 + now.getMilliseconds());
//     const timeToWait = remainingMilliseconds - targetTime;
//     if (timeToWait > 0) {
//       await sleep(timeToWait);
//     }
//   };

//   const start = performance.now();
//   const userDataDir = path.join(__dirname, "tmp_user_data");

//   // حذف جميع الملفات والمجلدات داخل userDataDir
//   if (fs.existsSync(userDataDir)) {
//     fs.rmSync(userDataDir, { recursive: true, force: true });
//   }

//   // إعادة إنشاء المجلد المؤقت
//   fs.mkdirSync(userDataDir);

//   // تشغيل المتصفح مع بيانات المستخدم المؤقتة
//   const browser = await chromium.launchPersistentContext(userDataDir, {
//     headless: false,
//   });

//   // إنشاء صفحة جديدة
//   const page = await browser.newPage();

//   // قياس وقت الانتقال إلى الصفحة
//   const navigationStart = Date.now();
//   await page.goto("https://egy.almaviva-visa.it/");
//   console.log(`Navigation time: ${Date.now() - navigationStart} ms`);

//   // انتظار ظهور الزر "المتابعة" والنقر عليه
//   await page.waitForSelector(
//     ".bg-visa-primary-500.text-white.flex.p-2.rounded-md",
//     { visible: true }
//   );
//   await page.click(".bg-visa-primary-500.text-white.flex.p-2.rounded-md");

//   // ملء حقول تسجيل الدخول والنقر على زر تسجيل الدخول

//   await page.getByLabel("Email").fill(email);
//   await page.getByLabel("Password").fill(password);
//   await page.waitForSelector("input#kc-login");
//   await page.click("input#kc-login");
//   // بدء الاستماع للطلبات بعد النقر على الزر
//     page.on("request", (request) => {
//       console.log(
//         "Request made:",
//         request.url(),
//         request.status,
//         request.method(),
//         request.postData()
//       );
//     });

//   // انتظار حتى يظهر رابط "Book"
//   try {
//     await page.waitForSelector('a:has-text("Book")');
//     await page.click('a:has-text("Book")');
//   } catch (error) {
//     console.error("Failed to find or click 'Book', retrying...");
//     await page.waitForSelector('a:has-text("Book")');
//     await page.click('a:has-text("Book")');
//   }

//   // التعامل مع عنصر <mat-select> لاختيار المكتب
//   await page.waitForSelector('mat-select[formcontrolname="officeId"]');
//   await page.click('mat-select[formcontrolname="officeId"]');
//   await page.waitForSelector("mat-option");
//   await page.click("mat-option:nth-child(2)"); //cairo

//   // التعامل مع العنصر الثاني <mat-select>
//   await page.waitForSelector('mat-select[formcontrolname="idServiceLevel"]');
//   await page.click('mat-select[formcontrolname="idServiceLevel"]');
//   await page.waitForSelector("mat-option");
//   await page.click("mat-option:nth-child(1)");

//   // التعامل مع عنصر <mat-select> لاختيار نوع الفيزا
//   await page.waitForSelector("mat-select#mat-select-2");
//   await page.click("mat-select#mat-select-2");
//   await page.waitForSelector("mat-option");
//   await page.click("mat-option:nth-child(17)");

//   // التعامل مع عنصر إدخال التاريخ
//   await page.waitForSelector('input[formcontrolname="tripDate"]');
//   await page.click('input[formcontrolname="tripDate"]');

//   // الانتظار حتى تظهر نافذة التقويم
//   await page.waitForSelector(".cdk-overlay-connected-position-bounding-box");

//   // النقر على زر "التالي" للتقويم
//   const nextButtons = await page.$$(
//     "button.mat-calendar-next-button.mdc-icon-button.mat-mdc-icon-button.mat-unthemed.mat-mdc-button-base"
//   );
//   if (nextButtons.length > 0) {
//     await nextButtons[1].click();
//   } else {
//     console.error("العنصر المطلوب غير موجود");
//   }

//   // انتظار عنصر التاريخ المطلوب والنقر عليه
//   await page.waitForSelector(
//     'button.mat-calendar-body-cell[aria-label="15 July 2024"]:not([aria-disabled="true"])'
//   );
//   await page.click(
//     'button.mat-calendar-body-cell[aria-label="15 July 2024"]:not([aria-disabled="true"])'
//   );

//   // ملء حقل الوجهة بكلمة "Italy"
//   await page.waitForSelector('input[formcontrolname="tripDestination"]');
//   await page.fill('input[formcontrolname="tripDestination"]', "Italy");

//   // تحديد الـ checkbox
//   await page.waitForSelector(".mdc-checkbox__native-control");
//   await page.check(".mdc-checkbox__native-control");

//   // انتظار ظهور زر "Check availability" والنقر عليه
//   await page.waitForSelector('button:has-text("Check availability")');

//   // قياس الزمن قبل النقر على زر "Check availability"
//   const beforeClick = performance.now();
//   await waitUntilTargetTime(100);

//   await page.click('button:has-text("Check availability")');
//   const duration = performance.now() - start;

//   // قياس الزمن بعد استلام الرد
//   const afterResponse1 = performance.now();
//   const responseTime1 = afterResponse1 - beforeClick;
//   console.log(`Response time0: ${responseTime1.toFixed(2)} ms`);
//   const [response] = await Promise.all([
//     page.waitForResponse(
//       (response) =>
//         response
//           .url()
//           .includes("/reservation-manager/api/planning/v1/checks") &&
//         response.status() === 200
//     ),
//   ]);
//   const res = await response.json();
//   // قياس الزمن بعد استلام الرد
//   const afterResponse = performance.now();
//   const responseTime = afterResponse - beforeClick;
//   console.log(`Response time: ${responseTime.toFixed(2)} ms`, duration, res);
//   // إرسال رسالة النجاح أو الفشل
//   if (res) {
//     ctx.reply("تم الحجز بنجاح");
//   } else {
//     ctx.reply("فشل في الحجز");
//   }

//   await browser.close();
//   // // جمع الكوكيز بعد النقر على الزر
//   // const cookies = await page.context().cookies();

//   // // كتابة المعلومات الملتقطة إلى ملف JSON
//   // fs.writeFileSync(
//   //   "network-requests3.json",
//   //   JSON.stringify({ requests, responses, cookies }, null, 2)
//   // );

//   // إغلاق المتصفح
//   //await browser.close();
// }

// bot.start((ctx) => {
//   currentState = states.IDLE;
//   ctx.reply('مرحباً! اضغط على "بداية" للبدء', {
//     reply_markup: {
//       keyboard: [[{ text: "بداية" }]],
//       resize_keyboard: true,
//       one_time_keyboard: true,
//     },
//   });
// });

// bot.hears("بداية", (ctx) => {
//   if (currentState === states.IDLE) {
//     currentState = states.WAITING_FOR_EMAIL;
//     ctx.reply("الرجاء إدخال البريد الإلكتروني:");
//   }
// });

// bot.on("text", async (ctx) => {
//   if (currentState === states.WAITING_FOR_EMAIL) {
//     userEmail = ctx.message.text;
//     currentState = states.WAITING_FOR_PASSWORD;
//     ctx.reply("الرجاء إدخال كلمة المرور:");
//   } else if (currentState === states.WAITING_FOR_PASSWORD) {
//     userPassword = ctx.message.text;
//     ctx.reply("جاري تسجيل الدخول...");
//     await runScript(userEmail, userPassword, ctx);
//     console.log(userEmail,userPassword);
//     userEmail = "";
//     userPassword = "";
//     currentState = states.IDLE;
//   }
// });

// // تشغيل البوت
bot.launch();




////////////////////////////////////////////////////////////////////
// (async () => {
//   const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

//   // انتظار حتى الساعة 6:00:00 بتوقيت UTC (غرينتش)
//   const waitUntilTargetTime = async (waitMs) => {
//     const now = new Date();
//     const target = new Date(now);
//     target.setUTCHours(6);
//     target.setUTCMinutes(0);
//     target.setUTCSeconds(0);
//     target.setUTCMilliseconds(0);

//     const timeToWait = target.getTime() - now.getTime();
//     if (timeToWait > 0) {
//       console.log(`Waiting ${timeToWait / 1000} seconds until 6:00:00 UTC`);
//       console.log(timeToWait);
//       await sleep(timeToWait - waitMs); // الانتظار حتى 20 ثانية قبل 6:00:00
//     }
//   };

//   await waitUntilTargetTime(20000);

//   // انتظار حتى يتبقى 30 مللي ثانية
//   const waitForLastMilliseconds = async () => {
//     const targetTime = 30; // 30 مللي ثانية
//     const now = new Date();
//     const remainingMilliseconds =
//       60000 - (now.getSeconds() * 1000 + now.getMilliseconds());
//     const timeToWait = remainingMilliseconds - targetTime;
//     if (timeToWait > 0) {
//       await sleep(timeToWait);
//     }
//   };

//   const start = performance.now();
//   const userDataDir = path.join(__dirname, "tmp_user_data");

//   // حذف جميع الملفات والمجلدات داخل userDataDir
//   if (fs.existsSync(userDataDir)) {
//     fs.rmSync(userDataDir, { recursive: true, force: true });
//   }

//   // إعادة إنشاء المجلد المؤقت
//   fs.mkdirSync(userDataDir);

//   // تشغيل المتصفح مع بيانات المستخدم المؤقتة
//   const browser = await chromium.launchPersistentContext(userDataDir, {
//     headless: false,
//   });

//   // إنشاء صفحة جديدة
//   const page = await browser.newPage();

//   // قياس وقت الانتقال إلى الصفحة
//   const navigationStart = Date.now();
//   await page.goto("https://egy.almaviva-visa.it/");
//   console.log(`Navigation time: ${Date.now() - navigationStart} ms`);


//   // انتظار ظهور الزر "المتابعة" والنقر عليه
//   await page.waitForSelector(
//     ".bg-visa-primary-500.text-white.flex.p-2.rounded-md",
//     { visible: true }
//   );
//   await page.click(".bg-visa-primary-500.text-white.flex.p-2.rounded-md");

//   // ملء حقول تسجيل الدخول والنقر على زر تسجيل الدخول
//   await page.waitForSelector("input#kc-login");
//   await page.getByLabel("Email").fill("Karim2001");
//   await page.getByLabel("Password").fill("Ukt@1234");
//   await page.click("input#kc-login");

//   // انتظار حتى يظهر رابط "Book"
//   try {
//     await page.waitForSelector('a:has-text("Book")', { timeout: 5000 });
//     await page.click('a:has-text("Book")');
//   } catch (error) {
//     console.error("Failed to find or click 'Book', retrying...");
//     await page.waitForSelector('a:has-text("Book")', { timeout: 5000 });
//     await page.click('a:has-text("Book")');
//   }

//   // التعامل مع عنصر <mat-select> لاختيار المكتب
//   await page.waitForSelector('mat-select[formcontrolname="officeId"]');
//   await page.click('mat-select[formcontrolname="officeId"]');
//   await page.waitForSelector("mat-option");
//   await page.click("mat-option:nth-child(2)"); //cairo

//   // التعامل مع العنصر الثاني <mat-select>
//   await page.waitForSelector('mat-select[formcontrolname="idServiceLevel"]');
//   await page.click('mat-select[formcontrolname="idServiceLevel"]');
//   await page.waitForSelector("mat-option");
//   await page.click("mat-option:nth-child(1)");

//   // التعامل مع عنصر <mat-select> لاختيار نوع الفيزا
//   await page.waitForSelector("mat-select#mat-select-2");
//   await page.click("mat-select#mat-select-2");
//   await page.waitForSelector("mat-option");
//   await page.click("mat-option:nth-child(17)");

//   // التعامل مع عنصر إدخال التاريخ
//   await page.waitForSelector('input[formcontrolname="tripDate"]');
//   await page.click('input[formcontrolname="tripDate"]');

//   // الانتظار حتى تظهر نافذة التقويم
//   await page.waitForSelector(".cdk-overlay-connected-position-bounding-box");

//   // النقر على زر "التالي" للتقويم
//   const nextButtons = await page.$$(
//     "button.mat-calendar-next-button.mdc-icon-button.mat-mdc-icon-button.mat-unthemed.mat-mdc-button-base"
//   );
//   if (nextButtons.length > 0) {
//     await nextButtons[1].click();
//   } else {
//     console.error("العنصر المطلوب غير موجود");
//   }

//   // انتظار عنصر التاريخ المطلوب والنقر عليه
//   await page.waitForSelector(
//     'button.mat-calendar-body-cell[aria-label="15 July 2024"]:not([aria-disabled="true"])'
//   );
//   await page.click(
//     'button.mat-calendar-body-cell[aria-label="15 July 2024"]:not([aria-disabled="true"])'
//   );

//   // ملء حقل الوجهة بكلمة "Italy"
//   await page.waitForSelector('input[formcontrolname="tripDestination"]');
//   await page.fill('input[formcontrolname="tripDestination"]', "Italy");

//   // تحديد الـ checkbox
//   await page.waitForSelector(".mdc-checkbox__native-control");
//   await page.check(".mdc-checkbox__native-control");

//   // انتظار ظهور زر "Check availability" والنقر عليه
//   await page.waitForSelector('button:has-text("Check availability")');

//   // // بدء الاستماع للطلبات بعد النقر على الزر
//   // page.on("request", (request) => {
//   //   console.log(
//   //     "Request made:",
//   //     request.url(),
//   //     request.method(),
//   //     request.postData()
//   //   );
//   // });

//   // قياس الزمن قبل النقر على زر "Check availability"
//   const beforeClick = performance.now();
//   await waitUntilTargetTime(100);



//   await page.click('button:has-text("Check availability")');
//   const duration = performance.now() - start;

//   // قياس الزمن بعد استلام الرد
//   const afterResponse1 = performance.now();
//   const responseTime1 = afterResponse1 - beforeClick;
//   console.log(`Response time0: ${responseTime1.toFixed(2)} ms`);
//   const [response] = await Promise.all([
//     page.waitForResponse(
//       (response) =>
//         response
//           .url()
//           .includes("/reservation-manager/api/planning/v1/checks") &&
//         response.status() === 200
//     ),
//   ]);
//   const res = await response.json();
//   // قياس الزمن بعد استلام الرد
//   const afterResponse = performance.now();
//   const responseTime = afterResponse - beforeClick;
//   console.log(`Response time: ${responseTime.toFixed(2)} ms`, duration, res);

//   // // جمع الكوكيز بعد النقر على الزر
//   // const cookies = await page.context().cookies();

//   // // كتابة المعلومات الملتقطة إلى ملف JSON
//   // fs.writeFileSync(
//   //   "network-requests3.json",
//   //   JSON.stringify({ requests, responses, cookies }, null, 2)
//   // );

//   // إغلاق المتصفح
//   //await browser.close();
// })();

//////////////////////////////////////////////////////////////////////////////
// const { firefox } = require("playwright");
// const fs = require("fs");
// const path = require("path");

// (async () => {
//   const userDataDir = path.join(__dirname, "tmp_user_data");

//   // حذف جميع الملفات والمجلدات داخل userDataDir
//   if (fs.existsSync(userDataDir)) {
//     fs.rmSync(userDataDir, { recursive: true, force: true });
//   }

//   // إعادة إنشاء المجلد المؤقت
//   fs.mkdirSync(userDataDir);

//   // تشغيل المتصفح مع بيانات المستخدم المؤقتة
//   const browser = await firefox.launchPersistentContext(userDataDir, {
//     headless: false,
//   });

//   // إنشاء صفحة جديدة
//   const page = await browser.newPage();

//   // دالة مساعدة للتأخير
//   const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

//   // قياس وقت الانتقال إلى الصفحة
//   const navigationStart = Date.now();
//   await page.goto("https://egy.almaviva-visa.it/");
//   console.log(`Navigation time: ${Date.now() - navigationStart} ms`);

//   // انتظار ظهور الزر "المتابعة" والنقر عليه
//   await page.waitForSelector(
//     ".bg-visa-primary-500.text-white.flex.p-2.rounded-md",
//     { visible: true }
//   );
//   await page.click(".bg-visa-primary-500.text-white.flex.p-2.rounded-md");

//   // ملء حقول تسجيل الدخول والنقر على زر تسجيل الدخول
//   await page.getByLabel("Email").fill("benhanatamer@gmail.com");
//   await page.getByLabel("Password").fill("@S$QTEKduE9V$6H");
//   await page.waitForSelector("input#kc-login");
//   await page.click("input#kc-login");

//   // النقر على رابط "Book"
//   await page.getByRole("link", { name: "Book" }).click();

//   // التعامل مع عنصر <mat-select> لاختيار المكتب
//   await page.waitForSelector('mat-select[formcontrolname="officeId"]');
//   await page.click('mat-select[formcontrolname="officeId"]');
//   await page.waitForSelector("mat-option");
//   await page.click("mat-option:nth-child(1)");

//   // التعامل مع العنصر الثاني <mat-select>
//   await page.waitForSelector('mat-select[formcontrolname="idServiceLevel"]');
//   await page.click('mat-select[formcontrolname="idServiceLevel"]');
//   await page.waitForSelector("mat-option");
//   await page.click("mat-option:nth-child(1)");

//   // التعامل مع عنصر <mat-select> لاختيار نوع الفيزا
//   await page.waitForSelector("mat-select#mat-select-2");
//   await page.click("mat-select#mat-select-2");
//   await page.waitForSelector("mat-option");
//   await page.click("mat-option:nth-child(1)");

//   // التعامل مع عنصر إدخال التاريخ
//   await page.waitForSelector('input[formcontrolname="tripDate"]');
//   await page.click('input[formcontrolname="tripDate"]');

//   // الانتظار حتى تظهر نافذة التقويم
//   await page.waitForSelector(".cdk-overlay-connected-position-bounding-box");

//   // النقر على زر "التالي" للتقويم
//   const nextButtons = await page.$$(
//     "button.mat-calendar-next-button.mdc-icon-button.mat-mdc-icon-button.mat-unthemed.mat-mdc-button-base"
//   );
//   if (nextButtons.length > 0) {
//     await nextButtons[1].click();
//   } else {
//     console.error("العنصر المطلوب غير موجود");
//   }

//   // انتظار عنصر التاريخ المطلوب والنقر عليه
//   await page.waitForSelector(
//     'button.mat-calendar-body-cell[aria-label="15 July 2024"]:not([aria-disabled="true"])'
//   );
//   await page.click(
//     `button.mat-calendar-body-cell[aria-label="15 July 2024"]:not([aria-disabled="true"])`
//   );

//   // ملء حقل الوجهة بكلمة "Italy"
//   await page.waitForSelector('input[formcontrolname="tripDestination"]');
//   await page.fill('input[formcontrolname="tripDestination"]', "Italy");

//   // تحديد الـ checkbox
//   await page.waitForSelector(".mdc-checkbox__native-control");
//   await page.check(".mdc-checkbox__native-control");

//   // إعداد مستمع للطلبات والاستجابات
//   const requests = [];
//   const responses = [];

//   page.on("request", (request) => {
//     requests.push({
//       url: request.url(),
//       method: request.method(),
//       headers: request.headers(),
//       postData: request.postData(),
//     });
//     console.log(`Request: ${request.method()} ${request.url()}`);
//   });

//   page.on("response", async (response) => {
//     try {
//       const responseBody = await response.text();
//       responses.push({
//         url: response.url(),
//         status: response.status(),
//         headers: response.headers(),
//         body: responseBody,
//       });
//       console.log(`Response: ${response.status()} ${response.url()}`);
//     } catch (error) {
//       console.error(
//         `Failed to get response body for ${response.url()}:`,
//         error
//       );
//     }
//   });

//   // انتظار ظهور زر "Check availability" والنقر عليه
//   await page.waitForSelector('button:has-text("Check availability")');
//   await page.click('button:has-text("Check availability")');

//   // الانتظار لبضع ثوانٍ لرؤية النتائج
//   await sleep(5000);

//   // جمع الكوكيز بعد النقر على الزر
//   const cookies = await page.context().cookies();

//   // كتابة المعلومات الملتقطة إلى ملف JSON
//   fs.writeFileSync(
//     "network-requests2.json",
//     JSON.stringify({ requests, responses, cookies }, null, 2)
//   );

//   // إغلاق المتصفح
//   await browser.close();
// })();
/////////////////////////////////////////////////////////////////////////
// const { firefox } = require("playwright");
// const fs = require("fs");
// const path = require("path");

// (async () => {
//   const userDataDir = path.join(__dirname, "tmp_user_data");

//   // حذف جميع الملفات والمجلدات داخل userDataDir
//   if (fs.existsSync(userDataDir)) {
//     fs.rmSync(userDataDir, { recursive: true, force: true });
//   }

//   // إعادة إنشاء المجلد المؤقت
//   fs.mkdirSync(userDataDir);

//   const browser = await firefox.launchPersistentContext(userDataDir, {
//     headless: false,
//   });

//   const page = await browser.newPage();
//   const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

//   //await page.setViewportSize({ width: 360, height: 640 });

//   const navigationStart = Date.now();
//   await page.goto("https://egy.almaviva-visa.it/");
//   console.log(`Navigation time: ${Date.now() - navigationStart} ms`);

//   await page.waitForSelector(
//     ".bg-visa-primary-500.text-white.flex.p-2.rounded-md",
//     { visible: true }
//   );

//   await page.click(".bg-visa-primary-500.text-white.flex.p-2.rounded-md");
//   await page.getByLabel("Email").fill("benhanatamer@gmail.com");
//   await page.getByLabel("Password").fill("@S$QTEKduE9V$6H");
//   // العثور على عنصر الإدخال والنقر عليه
//   await page.waitForSelector("input#kc-login");
//   await page.click("input#kc-login");

//   await page.getByRole("link", { name: "Book" }).click();
//   // التعامل مع عنصر <mat-select>
//   await page.waitForSelector('mat-select[formcontrolname="officeId"]');
//   await page.click('mat-select[formcontrolname="officeId"]');

//   // الانتظار حتى تظهر القائمة المنسدلة
//   await page.waitForSelector("mat-option");

//   // اختيار عنصر من القائمة (مثال: الخيار الأول)
//   await page.click("mat-option:nth-child(1)");
//   // التعامل مع العنصر الثاني  <mat-select>
//   await page.waitForSelector('mat-select[formcontrolname="idServiceLevel"]');
//   await page.click('mat-select[formcontrolname="idServiceLevel"]');

//   // الانتظار حتى تظهر القائمة المنسدلة
//   await page.waitForSelector("mat-option");

//   // اختيار عنصر من القائمة (مثال: الخيار الأول)
//   await page.click("mat-option:nth-child(1)");
//   //////////////////////////////////////////////////////

//   // التعامل مع عنصر <mat-select> لاختيار نوع الفيزا
//   await page.waitForSelector("mat-select#mat-select-2");
//   await page.click("mat-select#mat-select-2");

//   // الانتظار حتى تظهر القائمة المنسدلة
//   await page.waitForSelector("mat-option");

//   // اختيار عنصر من القائمة (مثال: الخيار الأول)
//   await page.click("mat-option:nth-child(1)");

//   /////////////////////////////////////////////////////////////////////////////

//   // التعامل مع عنصر إدخال التاريخ
//   await page.waitForSelector('input[formcontrolname="tripDate"]');
//   await page.click('input[formcontrolname="tripDate"]');

//   // الانتظار حتى تظهر نافذة التقويم
//   await page.waitForSelector(".cdk-overlay-connected-position-bounding-box");

//   const nextButtons = await page.$$(
//     "button.mat-calendar-next-button.mdc-icon-button.mat-mdc-icon-button.mat-unthemed.mat-mdc-button-base"
//   );
//   // التأكد من وجود العناصر ثم النقر على الأول أو التفاعل مع العنصر المطلوب
//   if (nextButtons.length > 0) {
//     await nextButtons[1].click(); // انقر على أول عنصر
//   } else {
//     console.error("العنصر المطلوب غير موجود");
//   }
//   await page.waitForSelector(
//     'button.mat-calendar-body-cell[aria-label="15 July 2024"]:not([aria-disabled="true"])'
//   );
//  await page.click(
//     `button.mat-calendar-body-cell[aria-label="15 July 2024"]:not([aria-disabled="true"])`
//   );
//   await page.waitForSelector('input[formcontrolname="tripDestination"]');
//   // قم بتعبئة الحقل بكلمة "Italy"
//   await page.fill('input[formcontrolname="tripDestination"]', "Italy");
//   await page.waitForSelector(".mdc-checkbox__native-control");
//   // قم بتحديد (تشغيل) الـ checkbox
//   await page.check(".mdc-checkbox__native-control");
//   // انتظر حتى يظهر الزر
//   await page.waitForSelector('button:has-text("Check availability")');
//   // انقر على الزر
//   await page.click('button:has-text("Check availability")');  await sleep(5000);
//   await browser.close();

// })();

//   if (dateButtons.length > 0) {
//   await dateButtons[0].click(); // انقر على أول عنصر قابل للتفاعل
// }
// استخدام محدد صحيح للعناصر القابلة للنقر فقط
// const dateButtons = await page.$$(
//   `button.mat-calendar-body-cell[aria-label="3 June 2024"]:not([aria-disabled="true"])`
// );
// if (dateButtons.length > 0) {
//   await dateButtons[0].click(); // انقر على أول عنصر قابل للتفاعل
// } else {
//   console.error("العنصر المطلوب غير قابل للتفاعل أو غير موجود");
// }

// await page
//   .getByRole('button[aria-label="3 June 2024"]')
//   .click();

//  await page.hover('button.mat-calendar-body-cell[aria-label="3 June 2024"]');

//   await page.click(".pf-c-button.pf-m-primary.pf-m-block.btn-lg");

//   await page.waitForNavigation();

//   const cookies = await context.cookies();
//   const cookieString = cookies
//     .map((cookie) => `${cookie.name}=${cookie.value}`)
//     .join("; ");

//   const response = await page.goto(
//     "https://egyapi.almaviva-visa.it/reservation-manager/api/planning/v1/checks?officeId=2&visaId=10&serviceLevelId=1",
//     {
//       headers: {
//         Authorization: "Bearer <your_token_here>",
//         DeviceOperatingSystem: "web",
//         Cookie: cookieString,
//       },
//     }
//   );

//   const headers = response.headers();
//   console.log(headers);
// const puppeteer = require("puppeteer");
// const axios = require("axios");
// const fs = require("fs");
// const path = require("path");

// const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// (async () => {
//   const userDataDir = path.join(__dirname, "tmp_user_data");

//   // تأكد من أن الديركتوري فارغ أو احذفه إذا كان موجوداً
//   if (fs.existsSync(userDataDir)) {
//     fs.rmdirSync(userDataDir, { recursive: true });
//   }
//   fs.mkdirSync(userDataDir);

//   const browser = await puppeteer.launch({
//     headless: false,
//     userDataDir: userDataDir,
//   });

//   const context = await browser.createBrowserContext(); // بدء جلسة تخفي
//   const page = await context.newPage();

//   // تحديد حجم العرض
//   await page.setViewport({ width: 360, height: 640 });

//   // الانتقال إلى الموقع
//   const navigationStart = Date.now();
//   const response = await page.goto("https://egy.almaviva-visa.it/");
//   console.log(`Navigation time: ${Date.now() - navigationStart} ms`);
//   //const header = page.goto("https://egy.almaviva-visa.it/");
//   await page.waitForSelector(
//     ".bg-visa-primary-500.text-white.flex.p-2.rounded-md",
//     { visible: true }
//   );
//   await page.click(".bg-visa-primary-500.text-white.flex.p-2.rounded-md");

//   // ملء الحقول وتسجيل الدخول
//   await page.type("#username", "benhanatamer@gmail.com"); // إذا كان هناك خطوة تسجيل دخول
//   await page.type("#password", "@S$QTEKduE9V$6H"); // إذا كان هناك خطوة تسجيل دخول
//   await page.click(".pf-c-button.pf-m-primary.pf-m-block.btn-lg"); // إذا كان هناك زر لتسجيل الدخول

//   // الانتظار حتى يتم تحميل الصفحة بالكامل بعد تسجيل الدخول
//   await page.waitForNavigation();

//   // استخراج الكوكيز
//   const cookies = await page.cookies();
//   const cookieString = cookies
//     .map((cookie) => `${cookie.name}=${cookie.value}`)
//     .join("; ");

//   // استخراج الرؤوس من الطلبات الصادرة من صفحة Puppeteer
//   const puppeteerHeaders = await page.evaluate(() => {
//     const entries = performance.getEntriesByType("resource");
//     const headers = {};
//     for (const entry of entries) {
//       if (entry.name.includes("almaviva-visa.it")) {
//         headers[entry.initiatorType] = entry.responseStart;
//       }
//     }
//     return headers;
//   });
//   const respons1 =await page.goto(
//     "https://egyapi.almaviva-visa.it/reservation-manager/api/planning/v1/checks?officeId=2&visaId=10&serviceLevelId=1"
//   )
//   await page.on((v)=>console.log(v))
//   const headers = respons1.headers();
//   console.log(headers);

//   console.log(cookieString);
//   // إعداد axios باستخدام الكوكيز والرؤوس من Puppeteer
//   //   const axiosInstance = axios.create({
//   //     baseURL:
//   //       "https://egyapi.almaviva-visa.it/reservation-manager/api/planning/v1",
//   //     headers: {
//   //       ...puppeteerHeaders,
//   //       Cookie: cookieString,
//   //     },
//   //   });

//   //   // إرسال طلب OPTIONS
//   //   try {
//   //     const optionsResponse = await axiosInstance.options(
//   //       "/checks?officeId=1&visaId=10&serviceLevelId=1"
//   //     );
//   //     console.log(
//   //       "OPTIONS response:",
//   //       optionsResponse.status,
//   //       optionsResponse.headers
//   //     );
//   //   } catch (error) {
//   //     console.error("Error sending OPTIONS request:", error);
//   //   }

//   //   // إرسال طلب GET
//   //   try {
//   //     const getResponse = await axiosInstance.get(
//   //       "/checks?officeId=1&visaId=10&serviceLevelId=1"
//   //     );
//   //     console.log("GET response:", getResponse.data);
//   //   } catch (error) {
//   //     console.error("Error sending GET request:", error);
//   //   }

//   // إغلاق المتصفح
//   await browser.close();
// })();

// const puppeteer = require("puppeteer");
// const fs = require("fs");
// const path = require("path");
// const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
// (async () => {
//   const userDataDir = path.join(__dirname, "tmp_user_data");

//   // تأكد من أن الديركتوري فارغ أو احذفه إذا كان موجوداً
//   if (fs.existsSync(userDataDir)) {
//     fs.rmdirSync(userDataDir, { recursive: true });
//   }
//   fs.mkdirSync(userDataDir);

//   const browser = await puppeteer.launch({
//     headless: false,
//     userDataDir: userDataDir,
//   });
//   const context = await browser.createBrowserContext(); // بدء جلسة تخفي

//   const page = await context.newPage();
//   // تحديد حجم العرض
//   await page.setViewport({ width: 1024, height: 1240 });

//   // الانتقال إلى الموقع
//   const navigationStart = Date.now();
//   await page.goto("https://egy.almaviva-visa.it/");
//   console.log(`Navigation time: ${Date.now() - navigationStart} ms`);
//   await page.waitForSelector(
//     ".bg-visa-primary-500.text-white.flex.p-2.rounded-md",
//     { visible: true }
//   );

//   await page.click(".bg-visa-primary-500.text-white.flex.p-2.rounded-md");

//   //   //   //   // ملء الحقول وتسجيل الدخول
//   //   //   //   const loginStart = Date.now();
//   await page.type("#username", "benhanatamer@gmail.com"); // إذا كان هناك خطوة تسجيل دخول
//   await page.type("#password", "@S$QTEKduE9V$6H"); // إذا كان هناك خطوة تسجيل دخول
//   //await new Promise((resolve) => setTimeout(resolve, 5000)); // انتظر لمدة 5 ثوانٍ لرؤية النتيجة
//   //await page.waitForTimeout(1000); // انتظار لمدة 1 ثانية

//   await page.click(".pf-c-button.pf-m-primary.pf-m-block.btn-lg"); // إذا كان هناك زر لتسجيل الدخول
//   //   //   console.log(`Login time: ${Date.now() - loginStart} ms`);
//   await page.waitForNavigation();
//   // النزول في الصفحة تدريجياً حتى يصبح العنصر مرئيًا
//   // جعل العنصر مرئيًا عن طريق scrollIntoView
// //   await page.waitForSelector('a[title="Go to Take an appointment"]', {
// //     visible: true,
// //   });
// //   await page.evaluate(() => {
// //     const element = document.querySelector(
// //       'a[title="Go to Take an appointment"]'
// //     );
// //     if (element) {
// //       element.scrollIntoView({
// //         behavior: "smooth",
// //         block: "center",
// //         inline: "nearest",
// //       });
// //     }
// //   });
//   await sleep(3000);

// await page.goto("https://egy.almaviva-visa.it/appointment");
//   const cookies = await page.cookies();
// console.log(cookies);
//   //   // ملء الحقول المطلوبة
//   //   const fillStart = Date.now();
//   //   await page.type("#validationTooltip01", "القيمة");
//   //   await page.type("#validationTooltip02", "222القيمة");
//   //   await page.select("#validationTooltip03", "ذكر"); // اختيار "ذكر" من القائمة المنسدلة
//   //   await page.select("#validationTooltip04", "أستاذ التعليم الثانوي");
//   //   console.log(`Form fill time: ${Date.now() - fillStart} ms`);

//   //   //   // النقر على زر checkbox
//   //   //   const checkboxStart = Date.now();
//   //   //   await page.click('#checkbox');
//   //   //   console.log(`Checkbox click time: ${Date.now() - checkboxStart} ms`);

//   //   // النقر على زر الإرسال
//   //   const submitStart = Date.now();

//   //   console.log(`Submit button click time: ${Date.now() - submitStart} ms`);

//   // تأخير لرؤية النتيجة
//   await new Promise((resolve) => setTimeout(resolve, 15000)); // انتظر لمدة 5 ثوانٍ لرؤية النتيجة

//   // إغلاق المتصفح
//   await browser.close();
// })();

// const puppeteer = require('puppeteer');

// (async () => {
//   const browser = await puppeteer.launch({ headless: false }); // تعيين headless: false لرؤية التفاعلات
//   const page = await browser.newPage();

//   // الانتقال إلى الموقع
//   const navigationStart = Date.now();
//   await page.goto("https://youm-maalim.web.app/");
//   console.log(`Navigation time: ${Date.now() - navigationStart} ms`);

//   //   // ملء الحقول وتسجيل الدخول
//   //   const loginStart = Date.now();
//   //   await page.type('#username', 'اسم المستخدم'); // إذا كان هناك خطوة تسجيل دخول
//   //   await page.type('#password', 'كلمة المرور'); // إذا كان هناك خطوة تسجيل دخول
//   //   await page.click('#login-button'); // إذا كان هناك زر لتسجيل الدخول
//   //   await page.waitForNavigation(); // الانتظار حتى يتم الانتقال بعد تسجيل الدخول
//   //   console.log(`Login time: ${Date.now() - loginStart} ms`);

//   // ملء الحقول المطلوبة
//   const fillStart = Date.now();
//   await page.type("#validationTooltip01", "القيمة");
//   await page.type("#validationTooltip02", "222القيمة");
//   await page.select("#validationTooltip03", "ذكر"); // اختيار "ذكر" من القائمة المنسدلة
//   await page.select("#validationTooltip04", "أستاذ التعليم الثانوي");
//   console.log(`Form fill time: ${Date.now() - fillStart} ms`);

//   //   // النقر على زر checkbox
//   //   const checkboxStart = Date.now();
//   //   await page.click('#checkbox');
//   //   console.log(`Checkbox click time: ${Date.now() - checkboxStart} ms`);

//   // النقر على زر الإرسال
//   const submitStart = Date.now();
//   await page.click("#click");
//   console.log(`Submit button click time: ${Date.now() - submitStart} ms`);

//   // تأخير لرؤية النتيجة
//   await new Promise((resolve) => setTimeout(resolve, 15000)); // انتظر لمدة 5 ثوانٍ لرؤية النتيجة

//   // إغلاق المتصفح
//   await browser.close();
// })();

// const axios = require("axios");

// (async () => {
//   try {
//     // إرسال طلب OPTIONS
//     const optionsResponse = await axios.options(
//       "https://egyapi.almaviva-visa.it/reservation-manager/api/planning/v1/checks",
//       {
//         params: {
//           officeId: 1,
//           visaId: 3,
//           serviceLevelId: 1,
//         },
//         headers: {
//           "Access-Control-Request-Method": "GET",
//           "Access-Control-Request-Headers":
//             "authorization,deviceoperatingsystem",
//           Origin: "https://egy.almaviva-visa.it",
//           "User-Agent":
//             "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:126.0) Gecko/20100101 Firefox/126.0",
//           Accept: "*/*",
//           "Accept-Language": "en-US,en;q=0.5",
//           "Accept-Encoding": "gzip, deflate, br, zstd",
//           DNT: "1",
//           Connection: "keep-alive",
//           "Sec-Fetch-Dest": "empty",
//           "Sec-Fetch-Mode": "cors",
//           "Sec-Fetch-Site": "same-site",
//           Priority: "u=4",
//         },
//       }
//     );

//     console.log("OPTIONS response status:", optionsResponse.status);

//     // إذا كان طلب OPTIONS ناجحًا، أرسل طلب GET
//     if (optionsResponse.status === 200) {
//       const getResponse = await axios.get(
//         "https://egyapi.almaviva-visa.it/reservation-manager/api/planning/v1/checks",
//         {
//           params: {
//             officeId: 1,
//             visaId: 3,
//             serviceLevelId: 1,
//           },
//           headers: {
//             Authorization: "Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJBRjRRYzZibjc5c2NjczNkaUFoNllpMjRZY0JBcDlXVnR2YmNhVlMxRG00In0.eyJleHAiOjE3MTczMTEyNzYsImlhdCI6MTcxNzMxMDM3NiwiYXV0aF90aW1lIjoxNzE3MjE5MzUwLCJqdGkiOiI4N2RiNzRkNy00OGE5LTQzNDctODg4Ni1jMDhkMGY2YmRkNWQiLCJpc3MiOiJodHRwczovL2VneWlhbS5hbG1hdml2YS12aXNhLml0L3JlYWxtcy9vYXV0aDItdmlzYVN5c3RlbS1yZWFsbS1wa2NlIiwic3ViIjoiMDg1YmQ1MWYtZTczOC00ZGQ5LWE0NTYtNGIwNDk0MTg3NDk5IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiYWEtdmlzYXN5cy1wdWJsaWMiLCJub25jZSI6ImFXVk1hVmxsUnpFeVIxcFdNbTg0YVc1M2RGUlhhMUJYUjFndU1YbFVaa0ZFZmt4TFpGRldUUzAxVG5aVSIsInNlc3Npb25fc3RhdGUiOiJlZTVkZWFkNS00ZWJiLTQ5MDUtYmRjYi0zNGU3MDQ0YjkxMTIiLCJhY3IiOiIwIiwiYWxsb3dlZC1vcmlnaW5zIjpbImh0dHBzOi8vZWd5Y3JtLnZpc2FzeXMuYWxtYXZpdmEuaXQiLCJodHRwczovL2VneS5hbG1hdml2YS12aXNhLml0Il0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJkZWZhdWx0LXJvbGVzLW9hdXRoMi12aXNhc3lzdGVtLXJlYWxtLXBrY2UiLCJvZmZsaW5lX2FjY2VzcyIsInVtYV9hdXRob3JpemF0aW9uIl19LCJzY29wZSI6Im9wZW5pZCBlbWFpbCBwcm9maWxlIiwic2lkIjoiZWU1ZGVhZDUtNGViYi00OTA1LWJkY2ItMzRlNzA0NGI5MTEyIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJ0YW1lciBiZW5oYW5hIiwicGhvbmVfbnVtYmVyIjoiKzIwMjc5NzQxMjYzIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiYmVuaGFuYXRhbWVyQGdtYWlsLmNvbSIsImdpdmVuX25hbWUiOiJ0YW1lciIsImZhbWlseV9uYW1lIjoiYmVuaGFuYSIsImVtYWlsIjoiYmVuaGFuYXRhbWVyQGdtYWlsLmNvbSJ9.kh7eE34sWAPZFt5xEAS4SsFzsCDm4HM45MF-Bu3vCYV1FZw-BSKu0gaZFiMRalTqlu-cCVxS-WCRkalYAhPZE4h5OpUTeR5og1UYqfDfgxgErwwPxMLR9WXZi0xbbGwvex6LX6D2lsaqxTpUzOHJD4yr3n3yGVVTdOSXC_mz7MC2tHP86G5d0-scuIqKFepe331LLXRMBlx6KcXgExOtn2jhILmGIkjjJiiiXvXIyER6v-sN7DQe9aV2lxWzFiZJk4tH-aoUDgJLel0QXbOMCqJ7OtqdcX0b_uVwoUzdye4EZhb-OLis6xk_5zKkEIgcU3qByvWytj4PxOqADF1tPA",
//             DeviceOperatingSystem: "web",
//             Origin: "https://egy.almaviva-visa.it",
//             "User-Agent":
//               "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:126.0) Gecko/20100101 Firefox/126.0",
//             Accept: "application/json, text/plain, */*",
//             "Accept-Language": "en",
//             "Accept-Encoding": "gzip, deflate, br, zstd",
//             DNT: "1",
//             Connection: "keep-alive",
//             "Sec-Fetch-Dest": "empty",
//             "Sec-Fetch-Mode": "cors",
//             "Sec-Fetch-Site": "same-site",
//             Priority: "u=1",
//           },
//         }
//       );
//       console.log("GET response data:", getResponse.data);
//     }
//   } catch (error) {
//     console.error("Error:", error);
//   }
// })();

// const puppeteer = require("puppeteer");

// (async () => {
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();
//   await page.goto("https://youm-maalim.web.app/");

//   // تسجيل الدخول
//   // await page.type("#username", "اسم المستخدم");
//   // await page.type("#password", "كلمة المرور");
//   // await page.click("#login-button");

//   // ملء الحقول
//   await page.type("#validationTooltip01", "القيمة");
//   await page.type("#validationTooltip02", "222القيمة");
//   await page.select("#validationTooltip03", "blue");
//   await page.select("#validationTooltip04", "b1111lue");

//   // النقر على زر checkbox
//   // await page.click("#checkbox");
//   const startTime = performance.now();

//   // النقر على زر الإرسال
//   await page.click("#click");

//   const endTime = performance.now();
//   const totalTime = endTime - startTime;
//   console.log(`الوقت الكلي: ${totalTime} مللي ثانية`);

//   await browser.close();
// })();
