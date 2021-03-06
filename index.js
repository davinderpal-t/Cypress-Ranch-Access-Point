const playwright = require('playwright');
const Average = require('./modules/Average.js');
/**
 * @type {playwright.Browser}
 */
let browser;
/**
 * @type {playwright.BrowserContext}
 */
let context;
const Grade = require("./modules/Grade.js");

async function main(user, pass) {
    let page = await context.newPage();
    //Start signing in
    await page.goto('https://launchpad.classlink.com/cfisd/');
    await page.waitForLoadState('networkidle');
    await page.fill("#username", user);
    await page.fill("#password", pass);
    await page.click("#signin");
    await page.waitForTimeout(500);
    let a = page.locator("html body.login-bg.windows div#login_form_action.container.login div.container1 div.row div.col-xs-12 form div.form-group.username-container div.cl-alert.cl-alert-red");
    try {
        if (await a.isVisible()) {
            let text = await a.innerText();
            return { data: text.substring(2), status: 400 };
        }
    } catch (e) {
        //This happens because of navigation
        for (let i = 0; i < 8; i++) {
            if (page.url() == "https://launchpad.classlink.com/cfisd")
                await page.waitForTimeout(100);
        }
    }

    if (page.url() == "https://launchpad.classlink.com/cfisd" && await a.isVisible())
        return { data: "Something went wrong, your Username and/or Password are likely incorrect.", status: 400 };
    //Start finding the right button to click
    let elements;
    try {
        elements = await page.waitForSelector("app-apps-container", {
            timeout: 5000
        });
    } catch (e) {
        return { data: "Something went wrong, your Username and/or Password are likely incorrect.", status: 400 };
    }
    //await page.screenshot({ path: "./Stuff.png" });

    await elements.$$eval("application", elems => {
        elems.forEach(e => {
            if (e.getAttribute("aria-label") == "Student Home Access Center") {
                e.click();
            }
        });
    });

    //Wait for the new tab
    await page.waitForEvent('popup');
    page = context.pages()[2];
    await page.waitForLoadState("domcontentloaded");

    let nameSelect = await page.locator("li.sg-banner-menu-element:nth-child(1) > span:nth-child(1)");
    const name = await nameSelect.innerText();

    //Get Classes
    let classArr = await page.$$eval("#courseName", async elms => {
        let data = [];
        elms.forEach(async item => {
            if (item.innerText != "Lunch") {
                data.push(item.getAttribute("href").match(/\d+/)[0]);
                data.push(item.innerText);
            }
        });
        return data;
    });
    classArr = [...new Set(classArr)]; //Remove duplicates
    //Get IDs
    let idArr = await page.$$eval("#average", async elms => {
        let data = [];
        elms.forEach(async item => {
            if (item.innerText != '') {
                data.push(item.getAttribute("href").match(/\d+/)[0]);
            }
        });
        return data;
    });

    let term = await page.$$eval("#average", async elems => {
        let ret;
        elems.forEach(async item => {
            if (item.innerText != "") {
                ret = Number(item.getAttribute("href").match(/\d+/g)[3]);
            }
        });
        return ret;
    });

    //Get Grades From Every Pop-up Window
    let actualGrades = {};
    let grades = {}; //Object containing array of grades for every class by ID
    for (const id of idArr) {
        await page.evaluate(arr => { //Opening pages
            let f = "/HomeAccess/Content/Student/AssignmentsFromRCPopUp.aspx?section_key=" + arr[0] + "&course_session=1&RC_RUN=" + arr[1] + "&MARK_TITLE=9WK  .Trim()&MARK_TYPE=9WK  .Trim()&SLOT_INDEX=1";
            window.open(f, "_self", "status=no,menubar=no,toolbar=no,scrollbars=yes,resizable=yes,height=600,width=975");
        }, [id, term]);
        //Wait for table to load
        await page.waitForSelector("#plnMain_rptAssigmnetsByCourse_dgCourseAssignments_0 .sg-asp-table-data-row > td:nth-child(3)");

        //Select all grade rows and put data into array
        let gradeData = (await page.locator("#plnMain_rptAssigmnetsByCourse_dgCourseAssignments_0 .sg-asp-table-data-row > td:nth-child(3),#plnMain_rptAssigmnetsByCourse_dgCourseAssignments_0 .sg-asp-table-data-row > td:nth-child(4),#plnMain_rptAssigmnetsByCourse_dgCourseAssignments_0 .sg-asp-table-data-row > td:nth-child(5),#plnMain_rptAssigmnetsByCourse_dgCourseAssignments_0 .sg-asp-table-data-row > td:nth-child(6), #plnMain_rptAssigmnetsByCourse_dgCourseAssignments_0 .sg-asp-table-data-row > td:nth-child(8)").evaluateAll(elem => {
            let arr = [];
            for (let i = 0; i + 4 < elem.length; i += 5) {
                if (elem[i + 2].getAttribute("style") == null) {
                    arr.push(elem[i].innerText); //Name
                    arr.push(elem[i + 1].innerText); //Type
                    arr.push(elem[i + 2].innerText); //Grade
                    arr.push(elem[i + 4].innerText); //Weight
                    arr.push(elem[i + 3].innerText); //Max Score
                }
            }
            return arr;
        }));

        //Get Category Weights
        let dgWeight = Number(await page.locator("#plnMain_rptAssigmnetsByCourse_dgCourseCategories_0 > tbody:nth-child(1) > tr:nth-child(2) > td:nth-child(5)").innerText());
        if (dgWeight < 1)
            dgWeight *= 100;
        let raWeight = Number(await page.locator("#plnMain_rptAssigmnetsByCourse_dgCourseCategories_0 > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(5)").innerText());
        if (raWeight < 1)
            raWeight *= 100;
        let mgWeight = Number(await page.locator("#plnMain_rptAssigmnetsByCourse_dgCourseCategories_0 > tbody:nth-child(1) > tr:nth-child(4) > td:nth-child(5)").innerText());
        if (mgWeight < 1)
            mgWeight *= 100;

        grades[id] = [];
        //Form the array of grades
        for (let i = 0; i + 4 < gradeData.length; i += 5) {
            let weight = (gradeData[i + 1] == "Checking for Understanding") ? dgWeight : (gradeData[i + 1] == "Relevant Applications") ? raWeight : mgWeight;
            gradeData[i + 1] = gradeData[i + 1].split(" ").map(x => x.substring(0, 1)).join("");
            grades[id].push(new Grade(gradeData[i], Number(gradeData[i + 2]), gradeData[i + 1], weight, Number(gradeData[i + 3]), Number(gradeData[i + 4])));
        }
        actualGrades[classArr[classArr.indexOf(id) + 1]] = [new Average().getAverage(grades[id], dgWeight, raWeight, mgWeight), JSON.stringify(grades[id]), dgWeight, raWeight, mgWeight];
    }

    await page.goto("https://home-access.cfisd.net/HomeAccess/Grades/Transcript");
    await page.waitForLoadState("domcontentloaded");
    let GPA = (await page.$("plnMain_rpTranscriptGroup_lblGPACum1"));
    if (GPA)
        GPA = await GPA.innerText();
    let Rank = (await page.$("plnMain_rpTranscriptGroup_lblGPARank1"));
    if (Rank)
        Rank = await Rank.innerText();

    await browser.close();
    return { data: actualGrades, status: 200, name: name, gpa: GPA, rank: Rank };
}

async function runner(user, pass) {
    browser = await playwright.chromium.launch({
        headless: true, // setting this to true will not run the UI
        chromiumSandbox: false
    });
    context = await browser.newContext({ viewport: null });
    context.newPage();
    return await main(user, pass);
}

module.exports = async function(inp, callback) {
    let data = await runner(inp[0], inp[1]);
    callback(null, data);
};