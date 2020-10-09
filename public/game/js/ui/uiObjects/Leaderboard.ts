import Dialog from "./bootstrapObjects/Dialog";
import CST from "../../CST";
import GameManager from "../../online/GameManager";
import { Users } from "../../../../common/MessageTypes";
import CommonCST from "../../../../common/CommonCST";

const LB = CST.LEADERBOARD;

// TODO: Pagination does not keep count of maximum pages
// i.e. if there are too many pages, the content will overflow the modal body
export default class Leaderboard {
  private static instance = null;

  private dialog: Dialog;
  private currentPage: number;

  private paginationNav: HTMLElement;
  private pagesList: HTMLUListElement;

  private usersTable: HTMLTableElement;
  private tableBody: HTMLTableSectionElement;

  private constructor() {
    this.dialog = Dialog.getInstance();
    this.translateTableHead();

    this.generatePaginationNav();
    this.generateTableElements();
  }

  public async show() {
    await this.changeLbPage(1);

    // Show the dialog holding the leaderboard
    this.dialog.show(GameManager.getInstance().langFile.leaderboard.title);

    this.dialog.contentElement.appendChild(this.usersTable);
    this.dialog.contentElement.appendChild(this.paginationNav);
  }

  private translateTableHead() {
    const lbLang = GameManager.getInstance().langFile.leaderboard;
    const REPLACE = LB.TABLE.REPLACE_TOKENS;

    LB.TABLE.INNER_HTML = LB.TABLE.INNER_HTML.replace(
      REPLACE.BUILDINGS_COUNT,
      lbLang.tableEntries.buildingsCount
    )
      .replace(REPLACE.NAME, lbLang.tableEntries.name)
      .replace(REPLACE.ISLE_COUNT, lbLang.tableEntries.islandsCount)
      .replace(REPLACE.CHARAS_COUNT, lbLang.tableEntries.charasCount);
  }

  // Change the page of the leaderboard
  private async changeLbPage(newPage: number) {
    if (this.currentPage === newPage || newPage < 1) {
      return;
    }

    let leaderboardCfg = await GameManager.getInstance().messengers.users.getLeaderboardPage(
      newPage
    );

    if (newPage > leaderboardCfg.pagesCount) {
      newPage = leaderboardCfg.pagesCount;
    }

    this.currentPage = newPage;

    // Regenerate the page and the pagination
    this.regenerateUsersTable(leaderboardCfg.page, newPage);
    this.regeneratePaginationList(this.currentPage, leaderboardCfg.pagesCount);
  }

  // Generate the table holding the users details for this table
  private regenerateUsersTable(
    tableRows: Users.LeaderboardPage,
    currPage: number
  ) {
    this.usersTable.innerHTML = LB.TABLE.INNER_HTML;
    this.tableBody.innerHTML = "";

    tableRows.forEach((tableEntry, idx) => {
      this.addTableRow(
        idx + (currPage - 1) * CommonCST.USERS_QUERY.LEADERBOARD_LIMIT + 1,
        tableEntry
      );
    });

    this.usersTable.appendChild(this.tableBody);
  }

  private addTableRow(entryNo: number, tableEntry: Users.LeaderboardEntry) {
    let trElement = document.createElement("tr");
    let thElement = document.createElement("th");

    trElement.appendChild(thElement);
    thElement.outerHTML = LB.TABLE.BODY.GET_ROW_HEAD(entryNo);

    [
      tableEntry.name,
      tableEntry.islandCount,
      tableEntry.buildingsCount,
      tableEntry.charasCount,
    ].forEach(value => {
      let td = document.createElement("td");
      td.innerText = value.toString();

      trElement.appendChild(td);
    });

    this.tableBody.appendChild(trElement);
  }

  // On showing, regenerate the pagination list
  private regeneratePaginationList(currPage: number, pageCount: number) {
    this.pagesList.innerHTML = "";
    this.createPrevListItem(currPage === 1);
    this.createNumberedPage(1, currPage);

    let pagLeft = Math.max(currPage - LB.PAGINATION.PAD, 2);
    let pagRight = Math.min(currPage + LB.PAGINATION.PAD, pageCount - 1);

    // Current page is 1 or current page is pageCount
    if (pagLeft === pagRight) {
      if (pagLeft === 2) {
        // 1 accounts for the lost left pad
        // 1 accounts for the lost dots element
        // 1 account for the lost first = "1" element which is currPage
        pagRight = Math.min(pagRight + 3, pageCount - 1);
      }
      // Symmetrical to the begining
      else if (pagRight === pageCount - 1) {
        pagLeft = Math.max(pagLeft - 3, 2);
      }
    }
    // Current page is 2 or 3 or pageCount - 1 or pageCount - 2
    else {
      let padR = 0,
        padL = 0;

      // 1 page element lost on the first = "1" element which is padLeft
      // 1 page element lost on the dots = "..." element
      if (currPage === 2) {
        padR = 2;
      }
      // 1 page element lost on the dots = "..." element
      else if (currPage === 3) {
        padR = 1;
      }

      // Symmetrical
      if (currPage === pageCount - 1) {
        padL = 2;
      }
      // 1 page lost on the dots
      else if (currPage === pageCount - 2) {
        padL = 1;
      }

      if (pagLeft === 2) {
        pagRight = Math.min(pagRight + padR, pageCount - 1);
      }
      // Symmetrical
      else if (pagRight === pageCount - 1) {
        pagLeft = Math.max(pagLeft - padL, 2);
      }
    }

    if (pagLeft > 2) {
      this.createDotsPage();
    }

    for (let i = pagLeft; i <= pagRight; i++) {
      this.createNumberedPage(i, currPage);
    }

    if (pagRight < pageCount - 1) {
      this.createDotsPage();
    }

    this.createNumberedPage(pageCount, currPage);
    this.createNextListItem(currPage === pageCount);
  }

  // i = the number to be displayed on the pagination element
  // currPage = the page the user is currently on
  private createNumberedPage(i: number, currPage: number) {
    let anchor = this.createPageListItem(i === currPage);
    anchor.innerText = i.toString();

    anchor.onclick = () => {
      this.changeLbPage(i);
    };
  }

  // Create a "..." pagination element
  private createDotsPage() {
    let aElement = this.createPageListItem(false, true);
    aElement.innerText = "...";
  }

  private generateTableElements() {
    this.usersTable = document.createElement("table");
    this.usersTable.classList.add(...LB.TABLE.TABLE_CLASSES);
    this.tableBody = document.createElement("tbody");
  }

  private generatePaginationNav() {
    this.paginationNav = document.createElement("nav");
    this.paginationNav.setAttribute("aria-label", LB.PAGE_NAV.ARIA_LABEL);

    this.pagesList = document.createElement("ul");
    LB.UL.CLASSES.forEach(className => this.pagesList.classList.add(className));
    this.paginationNav.appendChild(this.pagesList);
  }

  // Prev page button
  private createPrevListItem(disabled = false) {
    let prevA = this.createPageListItem(false, disabled);

    prevA.innerHTML = LB.UL.LI.ANCHOR.PREV.INNER_HTML;
    prevA.setAttribute("aria-label", LB.UL.LI.ANCHOR.PREV.ARIA_LABEL);

    prevA.onclick = () => {
      this.changeLbPage(this.currentPage - 1);
    };
  }

  // Next page button
  private createNextListItem(disabled = false) {
    let nextA = this.createPageListItem(false, disabled);

    nextA.innerHTML = LB.UL.LI.ANCHOR.NEXT.INNER_HTML;
    nextA.setAttribute("aria-label", LB.UL.LI.ANCHOR.NEXT.ARIA_LABEL);

    nextA.onclick = () => {
      this.changeLbPage(this.currentPage + 1);
    };
  }

  // Create and append an LI for the pagination and return the inner anchor element
  // Active should be true if this is the current page
  // Disabled should be true for disabled pages
  private createPageListItem(
    active = false,
    disabled = false
  ): HTMLAnchorElement {
    let li = document.createElement("li");
    let anchor = document.createElement("a");

    li.classList.add(LB.UL.LI.CLASS);
    anchor.classList.add(LB.UL.LI.ANCHOR.CLASS);
    anchor.setAttribute("href", LB.UL.LI.ANCHOR.HREF);
    li.appendChild(anchor);

    if (active) {
      li.classList.add(LB.UL.LI.ACTIVE);
    }

    if (disabled) {
      li.classList.add(LB.UL.LI.DISABLED);
    }

    this.pagesList.appendChild(li);
    return anchor;
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new Leaderboard();
    }

    return this.instance;
  }
}
